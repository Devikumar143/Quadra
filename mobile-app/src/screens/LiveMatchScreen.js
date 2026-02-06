import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Easing, Vibration, ImageBackground, ActivityIndicator, Platform, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy, Activity, Target, TrendingUp, Users, ShieldAlert } from 'lucide-react-native';
import io from 'socket.io-client';
import { refreshAuthToken } from '../services/api';
import { COLORS } from '../constants/theme';
import api, { SOCKET_URL } from '../services/api';

const LiveMatchScreen = ({ navigation }) => {
    const [matches, setMatches] = useState([]);
    const [activeMatchIndex, setActiveMatchIndex] = useState(0);
    const [matchStates, setMatchStates] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState('leaderboard'); // 'leaderboard' | 'intel'

    const tickerAnim = useRef(new Animated.Value(300)).current;
    const socketRef = useRef(null);

    useEffect(() => {
        fetchAllLiveMatches();
        startTickerAnimation();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const fetchAllLiveMatches = async () => {
        try {
            const res = await api.get('/live/active');
            const liveMatches = res.data;

            if (liveMatches.length === 0) {
                setLoading(false);
                return;
            }

            setMatches(liveMatches);

            // Initialize state for each match
            const initialStates = {};
            liveMatches.forEach((matchData) => {
                const mergedScores = matchData.teams.map(t => {
                    const scoreData = matchData.current_scores.find(s => s.team === t.team_name);
                    return {
                        team: t.team_name,
                        points: scoreData?.points || 0,
                        kills: scoreData?.kills || 0,
                        status: scoreData?.status || 'alive',
                        roster: t.roster || [],
                        playerStats: scoreData?.players || {}
                    };
                });

                initialStates[matchData.match.id] = {
                    scores: mergedScores.sort((a, b) => b.points - a.points),
                    ticker: "WAITING FOR MATCH FEED...",
                    analytics: matchData.analytics || { winProbability: {}, mvpPrediction: null }
                };
            });

            setMatchStates(initialStates);
            setLoading(false);

            // Connect to Socket.IO and join all match rooms
            connectToSocket(liveMatches);

        } catch (err) {
            console.error("Fetch Live Matches Error:", err);
            setLoading(false);
        }
    };

    const connectToSocket = async (matchData) => {
        const token = await AsyncStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token },
            extraHeaders: {
                'x-auth-token': token
            }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to Live Match Server');
            setIsConnected(true);
            // Join all match rooms AND their parent tournament rooms
            matchData.forEach(m => {
                socket.emit('join_match', m.match.id);
                if (m.match.tournament_id) {
                    socket.emit('join_tournament', m.match.tournament_id);
                }
            });
        });

        socket.on('notification', (notif) => {
            handleTacticalAlert(notif);
        });

        socket.on('connect_error', async (err) => {
            console.error('Socket Connection Error:', err.message);
            setIsConnected(false);

            if (err.message.includes('Authentication') || err.message.includes('Token') || err.message.includes('jwt')) {
                console.log('Attempting token refresh for Live Match...');
                try {
                    const newToken = await refreshAuthToken();
                    if (socketRef.current) {
                        socketRef.current.auth.token = newToken;
                        if (socketRef.current.io && socketRef.current.io.opts) {
                            socketRef.current.io.opts.extraHeaders = { 'x-auth-token': newToken };
                        }
                        socketRef.current.connect();
                    }
                } catch (refreshErr) {
                    console.error('Refresh failed:', refreshErr);
                }
            }
        });

        socket.on('live_update', (update) => {
            handleLiveUpdate(update);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Live Server');
            setIsConnected(false);
        });
    };

    const handleTacticalAlert = (notif) => {
        Vibration.vibrate([0, 100, 50, 100]);
        setMatchStates(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(matchId => {
                newState[matchId] = {
                    ...newState[matchId],
                    ticker: `[TACTICAL ALERT] ${notif.message}`
                };
            });
            return newState;
        });
    };

    const handleLiveUpdate = (update) => {
        const { type, data, matchId } = update;

        setMatchStates(prev => {
            // If matchId is missing but it's a ticker, broadcast to all active matches on this screen
            if (!matchId && type === 'ticker') {
                const newState = { ...prev };
                Object.keys(newState).forEach(id => {
                    newState[id] = { ...newState[id], ticker: data.text };
                });
                return newState;
            }

            const matchState = prev[matchId];
            if (!matchState) return prev;

            if (type === 'ticker') {
                Vibration.vibrate(50);
                return {
                    ...prev,
                    [matchId]: { ...matchState, ticker: data.text }
                };
            } else if (type === 'score') {
                const newScores = matchState.scores.map(s =>
                    s.team === data.team ? { ...s, points: s.points + (data.points || 0) } : s
                );
                return {
                    ...prev,
                    [matchId]: { ...matchState, scores: newScores.sort((a, b) => b.points - a.points) }
                };
            } else if (type === 'player_kill') {
                const newScores = matchState.scores.map(s => {
                    if (s.team === data.team) {
                        const updatedPlayerStats = { ...s.playerStats };
                        if (updatedPlayerStats[data.player]) {
                            updatedPlayerStats[data.player] = {
                                ...updatedPlayerStats[data.player],
                                kills: (updatedPlayerStats[data.player].kills || 0) + 1
                            };
                        } else {
                            updatedPlayerStats[data.player] = { kills: 1 };
                        }

                        return {
                            ...s,
                            points: s.points + (data.points || 1),
                            kills: (s.kills || 0) + 1,
                            playerStats: updatedPlayerStats
                        };
                    }
                    return s;
                });
                return {
                    ...prev,
                    [matchId]: { ...matchState, scores: newScores.sort((a, b) => b.points - a.points) }
                };
            } else if (type === 'status') {
                const newScores = matchState.scores.map(s =>
                    s.team === data.team ? { ...s, status: data.status } : s
                );
                return {
                    ...prev,
                    [matchId]: { ...matchState, scores: newScores }
                };
            }

            return prev;
        });
    };

    const startTickerAnimation = () => {
        tickerAnim.setValue(300);
        Animated.loop(
            Animated.timing(tickerAnim, {
                toValue: -300,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();
    };

    const getStatusColor = (status) => {
        if (status === 'alive') return '#4CAF50';
        if (status === 'eliminated') return '#FF4444';
        return '#888';
    };

    if (loading) {
        return (
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>Loading Live Matches...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (matches.length === 0) {
        return (
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft color="#fff" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.tournamentTitle}>LIVE MATCHES</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                        <Text style={{ color: '#aaa', fontSize: 16, textAlign: 'center' }}>
                            No live matches at the moment.{'\n'}Check back soon!
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const activeMatch = matches[activeMatchIndex];
    const activeMatchState = matchStates[activeMatch.match.id] || { scores: [], ticker: "" };

    // Derived state for the modal to ensure it's always fresh
    const selectedTeamData = selectedTeamId ? activeMatchState.scores.find(s => s.team === selectedTeamId) : null;

    return (
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20, height: 'auto', paddingBottom: 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.tournamentTitle}>{activeMatch.match.tournament_title}</Text>
                        {isConnected ?
                            <View style={styles.liveTag}>
                                <View style={styles.dot} />
                                <Text style={styles.liveText}>LIVE BROADCAST</Text>
                            </View>
                            :
                            <Text style={[styles.liveText, { color: '#888' }]}>CONNECTING...</Text>
                        }
                    </View>
                    <TouchableOpacity style={styles.backButton}>
                        <Activity color={COLORS.primary} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Match Tabs */}
                {matches.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                        {matches.map((matchData, index) => (
                            <TouchableOpacity
                                key={matchData.match.id}
                                style={[styles.tab, activeMatchIndex === index && styles.activeTab]}
                                onPress={() => setActiveMatchIndex(index)}
                            >
                                <Text style={[styles.tabText, activeMatchIndex === index && styles.activeTabText]}>
                                    RD {matchData.match.round_number} - {matchData.match.map_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Match Info Card */}
                <View style={styles.matchCard}>
                    <ImageBackground
                        source={{ uri: 'https://i.imgur.com/3Z6Q1qQ.png' }}
                        style={styles.mapImage}
                        imageStyle={{ borderRadius: 16, opacity: 0.4 }}
                    >
                        <View style={styles.matchOverlay}>
                            <View>
                                <Text style={styles.mapLabel}>CURRENT MAP</Text>
                                <Text style={styles.mapName}>{activeMatch.match.map_name}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.mapLabel}>ROOM ID</Text>
                                <Text style={styles.roomCode}>{activeMatch.match.room_id}</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* Sponsorship Banner */}
                {activeMatch.match.sponsor_name && (
                    <View style={styles.sponsorBanner}>
                        <LinearGradient
                            colors={['rgba(212,175,55,0.05)', 'rgba(212,175,55,0.1)']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.sponsorInner}
                        >
                            <View style={styles.sponsorTextGroup}>
                                <Text style={styles.poweredBy}>POWERED BY</Text>
                                <Text style={styles.sponsorName}>{activeMatch.match.sponsor_name.toUpperCase()}</Text>
                            </View>
                            {activeMatch.match.sponsor_logo ? (
                                <ImageBackground
                                    source={{ uri: activeMatch.match.sponsor_logo }}
                                    style={styles.sponsorLogo}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Activity color={COLORS.primary} size={20} />
                            )}
                            {activeMatch.match.sponsor_message && (
                                <View style={styles.sponsorMessageTag}>
                                    <Text style={styles.sponsorMessageText}>{activeMatch.match.sponsor_message}</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </View>
                )}

                {/* Ticker Tape */}
                <View style={styles.tickerContainer}>
                    <View style={styles.tickerLabel}>
                        <Text style={styles.tickerLabelText}>BREAKING</Text>
                    </View>
                    <View style={{ flex: 1, overflow: 'hidden', justifyContent: 'center' }}>
                        <Animated.Text
                            style={[
                                styles.tickerText,
                                { transform: [{ translateX: tickerAnim }] }
                            ]}
                            numberOfLines={1}
                        >
                            {activeMatchState.ticker.toUpperCase()} {activeMatch.match.sponsor_name ? ` /// POWERED BY ${activeMatch.match.sponsor_name.toUpperCase()} /// ` : ' /// '} {activeMatchState.ticker.toUpperCase()}
                        </Animated.Text>
                    </View>
                </View>

                {/* Scoreboard */}
                {/* View Mode Switcher */}
                <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity
                        onPress={() => setViewMode('leaderboard')}
                        style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: viewMode === 'leaderboard' ? COLORS.primary : 'transparent' }}
                    >
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, color: viewMode === 'leaderboard' ? '#000' : '#888' }}>LEADERBOARD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('intel')}
                        style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: viewMode === 'intel' ? COLORS.primary : 'transparent' }}
                    >
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, color: viewMode === 'intel' ? '#000' : '#888' }}>INTELLIGENCE</Text>
                    </TouchableOpacity>
                </View>

                {viewMode === 'leaderboard' ? (
                    <View style={{ flex: 1, paddingHorizontal: 20 }}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {activeMatchState.scores.map((team, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.scoreRow}
                                    onPress={() => {
                                        setSelectedTeamId(team.team);
                                        setModalVisible(true);
                                    }}
                                >
                                    <View style={[styles.rankBadge, { backgroundColor: index === 0 ? COLORS.primary : 'rgba(255,255,255,0.1)' }]}>
                                        <Text style={[styles.rankText, { color: index === 0 ? '#000' : '#fff' }]}>#{index + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={styles.teamName}>{team.team}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(team.status) }]} />
                                            <Text style={styles.statusText}>{team.status.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.pointsText}>{team.points}</Text>
                                        <Text style={styles.ptsLabel}>PTS</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={{ flex: 1, paddingHorizontal: 20 }}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {/* MVP Card */}
                            <View style={styles.intelCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                                    <Trophy color={COLORS.primary} size={20} />
                                    <Text style={styles.intelTitle}>MVP PREDICTION</Text>
                                </View>
                                {activeMatchState.analytics?.mvpPrediction ? (
                                    <View>
                                        <Text style={styles.mvpName}>{activeMatchState.analytics.mvpPrediction.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
                                            <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                                                <Text style={{ fontSize: 10, fontFamily: 'Outfit_800ExtraBold' }}>{activeMatchState.analytics.mvpPrediction.team}</Text>
                                            </View>
                                            <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>{activeMatchState.analytics.mvpPrediction.kills} KILLS</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={{ color: '#888', fontStyle: 'italic' }}>Analyzing combat data...</Text>
                                )}
                            </View>

                            {/* Arena Status */}
                            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                                <View style={[styles.intelCard, { flex: 1, alignItems: 'center' }]}>
                                    <ShieldAlert color="#4CAF50" size={24} style={{ marginBottom: 8 }} />
                                    <Text style={{ color: '#888', fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>ALIVE</Text>
                                    <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Outfit_800ExtraBold' }}>
                                        {activeMatchState.scores.filter(s => s.status !== 'eliminated').length}
                                    </Text>
                                </View>
                                <View style={[styles.intelCard, { flex: 1, alignItems: 'center' }]}>
                                    <Target color="#FF4444" size={24} style={{ marginBottom: 8 }} />
                                    <Text style={{ color: '#888', fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>ELIMS</Text>
                                    <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Outfit_800ExtraBold' }}>
                                        {activeMatchState.scores.reduce((sum, s) => sum + (s.kills || 0), 0)}
                                    </Text>
                                </View>
                            </View>

                            {/* Win Probability */}
                            <View style={styles.intelCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <TrendingUp color={COLORS.primary} size={20} />
                                    <Text style={styles.intelTitle}>WIN PROBABILITY</Text>
                                </View>
                                {Object.entries(activeMatchState.analytics?.winProbability || {}).slice(0, 5).map(([team, prob], index) => (
                                    <View key={index} style={{ marginBottom: 15 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Outfit_600SemiBold' }}>{team}</Text>
                                            <Text style={{ color: COLORS.primary, fontSize: 12, fontFamily: 'Outfit_700Bold' }}>{prob}</Text>
                                        </View>
                                        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                                            <View style={{ width: prob, height: '100%', backgroundColor: index === 0 ? COLORS.primary : '#888' }} />
                                        </View>
                                    </View>
                                ))}
                                {Object.keys(activeMatchState.analytics?.winProbability || {}).length === 0 && (
                                    <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Insufficient data for prediction.</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}

            </SafeAreaView>

            {/* Roster Modal */}
            < Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedTeamData?.team} // SQUAD</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Text style={{ color: '#fff', fontSize: 20 }}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {selectedTeamData?.roster && selectedTeamData.roster.length > 0 ? (
                                selectedTeamData.roster.map((member, idx) => (
                                    <View key={idx} style={styles.rosterRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={styles.roleBadge}>
                                                <Text style={styles.roleText}>{member.role === 'leader' ? 'IGL' : 'PLY'}</Text>
                                            </View>
                                            <Text style={styles.ignText}>{member.ff_ign}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginRight: 4 }}>{selectedTeamData?.playerStats?.[member.ff_ign]?.kills || 0}</Text>
                                            <Text style={{ color: '#aaa', fontSize: 10 }}>KILLS</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#888', textAlign: 'center' }}>Roster intel unavailable.</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal >
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20
    },
    backButton: {
        width: 40, height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        justifyContent: 'center', alignItems: 'center'
    },
    tournamentTitle: {
        color: '#fff',
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        letterSpacing: 1
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4
    },
    dot: {
        width: 6, height: 6,
        borderRadius: 3,
        backgroundColor: '#FF4444',
        marginRight: 6
    },
    liveText: {
        color: '#FF4444',
        fontSize: 10,
        fontFamily: 'Outfit_700Bold'
    },
    tabsContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
        maxHeight: 50
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    activeTab: {
        backgroundColor: 'rgba(212,175,55,0.2)',
        borderColor: COLORS.primary
    },
    tabText: {
        color: '#aaa',
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1
    },
    activeTabText: {
        color: COLORS.primary
    },
    matchCard: {
        marginHorizontal: 20,
        height: 160,
        borderRadius: 16,
        backgroundColor: '#000',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    mapImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end'
    },
    matchOverlay: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16
    },
    mapLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 4,
        letterSpacing: 1
    },
    mapName: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'Outfit_800ExtraBold',
        letterSpacing: 2
    },
    roomCode: {
        color: COLORS.primary,
        fontSize: 20,
        fontFamily: 'Outfit_800ExtraBold',
        letterSpacing: 2
    },
    tickerContainer: {
        height: 40,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        overflow: 'hidden'
    },
    tickerLabel: {
        backgroundColor: COLORS.primary,
        height: '100%',
        paddingHorizontal: 10,
        justifyContent: 'center'
    },
    tickerLabelText: {
        color: '#000',
        fontSize: 10,
        fontFamily: 'Outfit_800ExtraBold',
        letterSpacing: 1
    },
    tickerText: {
        color: COLORS.primary,
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        letterSpacing: 1,
        marginLeft: 20
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 1
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    rankBadge: {
        width: 30, height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rankText: {
        fontFamily: 'Outfit_800ExtraBold',
        fontSize: 14
    },
    teamName: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 4
    },
    statusDot: {
        width: 6, height: 6, borderRadius: 3, marginRight: 6
    },
    statusText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold'
    },
    pointsText: {
        color: COLORS.primary,
        fontSize: 20,
        fontFamily: 'Outfit_800ExtraBold'
    },
    ptsLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold'
    },
    sponsorBanner: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.1)'
    },
    sponsorInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        justifyContent: 'space-between'
    },
    sponsorTextGroup: {
        flex: 1
    },
    poweredBy: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 8,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 2,
        marginBottom: 2
    },
    sponsorName: {
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: 'Outfit_800ExtraBold',
        letterSpacing: 1
    },
    sponsorLogo: {
        width: 40,
        height: 40,
        marginLeft: 15
    },
    sponsorMessageTag: {
        position: 'absolute',
        right: 0,
        top: -10,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        transform: [{ rotate: '5deg' }]
    },
    sponsorMessageText: {
        color: '#000',
        fontSize: 8,
        fontFamily: 'Outfit_800ExtraBold'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        overflow: 'hidden'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(212,175,55,0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    modalTitle: {
        color: COLORS.primary,
        fontFamily: 'Outfit_800ExtraBold',
        fontSize: 16,
        letterSpacing: 2
    },
    closeButton: {
        width: 30, height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rosterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 12,
        width: 40,
        alignItems: 'center'
    },
    roleText: {
        color: COLORS.primary,
        fontSize: 10,
        fontFamily: 'Outfit_800ExtraBold'
    },
    ignText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1
    },
    intelCard: {
        backgroundColor: 'rgba(20,20,22,0.6)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    intelTitle: {
        color: '#fff',
        fontFamily: 'Outfit_800ExtraBold',
        fontSize: 14,
        letterSpacing: 1
    },
    mvpName: {
        color: COLORS.primary, // Gold
        fontSize: 28,
        fontFamily: 'Outfit_800ExtraBold',
        fontStyle: 'italic',
        letterSpacing: 1
    }
});

export default LiveMatchScreen;
