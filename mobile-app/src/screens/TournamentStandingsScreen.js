import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy, Target, Zap } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import api from '../services/api';

const TournamentStandingsScreen = ({ navigation, route }) => {
    const { tournamentId, tournamentTitle } = route.params;
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            const res = await api.get(`/results/tournament/${tournamentId}/standings`);
            setStandings(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Standings Error:", err);
            setLoading(false);
        }
    };

    const getRankColor = (index) => {
        if (index === 0) return COLORS.primary; // Gold
        if (index === 1) return '#C0C0C0'; // Silver
        if (index === 2) return '#CD7F32'; // Bronze
        return '#666';
    };

    const getRankIcon = (index) => {
        if (index < 3) return <Trophy size={20} color={getRankColor(index)} />;
        return null;
    };

    if (loading) {
        return (
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: '#fff', marginTop: 16 }}>Loading Standings...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20, height: 'auto', paddingBottom: 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={styles.tournamentTitle}>{tournamentTitle}</Text>
                        <Text style={styles.subtitle}>TOURNAMENT STANDINGS</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Podium Section (Top 3) */}
                {standings.length >= 3 && (
                    <View style={styles.podiumContainer}>
                        {/* 2nd Place */}
                        <View style={[styles.podiumCard, { marginTop: 40 }]}>
                            <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                                <Text style={styles.rankText}>2</Text>
                            </View>
                            <Text style={styles.podiumTeamName}>{standings[1].team_name}</Text>
                            <Text style={styles.podiumPoints}>{standings[1].total_points || 0}</Text>
                            <Text style={styles.podiumLabel}>PTS</Text>
                        </View>

                        {/* 1st Place */}
                        <View style={[styles.podiumCard, styles.firstPlace]}>
                            <Trophy size={32} color={COLORS.primary} style={{ marginBottom: 8 }} />
                            <View style={[styles.rankBadge, { backgroundColor: COLORS.primary }]}>
                                <Text style={[styles.rankText, { color: '#000' }]}>1</Text>
                            </View>
                            <Text style={[styles.podiumTeamName, { fontSize: 18 }]}>{standings[0].team_name}</Text>
                            <Text style={[styles.podiumPoints, { fontSize: 32, color: COLORS.primary }]}>{standings[0].total_points || 0}</Text>
                            <Text style={styles.podiumLabel}>PTS</Text>
                        </View>

                        {/* 3rd Place */}
                        <View style={[styles.podiumCard, { marginTop: 40 }]}>
                            <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                                <Text style={styles.rankText}>3</Text>
                            </View>
                            <Text style={styles.podiumTeamName}>{standings[2].team_name}</Text>
                            <Text style={styles.podiumPoints}>{standings[2].total_points || 0}</Text>
                            <Text style={styles.podiumLabel}>PTS</Text>
                        </View>
                    </View>
                )}

                {/* Full Standings List */}
                <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
                    <Text style={styles.sectionTitle}>FULL LEADERBOARD</Text>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
                        {standings.map((team, index) => (
                            <View key={team.team_id} style={styles.standingRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={[styles.rankCircle, { borderColor: getRankColor(index) }]}>
                                        {getRankIcon(index) || <Text style={styles.rankNumber}>{index + 1}</Text>}
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.teamName}>{team.team_name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Target size={12} color="#888" />
                                            <Text style={styles.statText}>{team.total_kills || 0} Kills</Text>
                                            <Text style={[styles.statText, { marginLeft: 12 }]}>• {team.matches_played || 0} Matches</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.pointsText, index < 3 && { color: getRankColor(index) }]}>
                                        {team.total_points || 0}
                                    </Text>
                                    <Text style={styles.ptsLabel}>PTS</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
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
        fontSize: 16,
        letterSpacing: 1
    },
    subtitle: {
        color: COLORS.primary,
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 10,
        letterSpacing: 2,
        marginTop: 4
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 32,
        gap: 12
    },
    podiumCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    firstPlace: {
        marginTop: 0,
        borderColor: COLORS.primary,
        borderWidth: 2,
        backgroundColor: 'rgba(212,175,55,0.05)'
    },
    rankBadge: {
        width: 32, height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    rankText: {
        color: '#fff',
        fontFamily: 'Outfit_800ExtraBold',
        fontSize: 16
    },
    podiumTeamName: {
        color: '#fff',
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8
    },
    podiumPoints: {
        color: '#fff',
        fontFamily: 'Outfit_800ExtraBold',
        fontSize: 24
    },
    podiumLabel: {
        color: '#888',
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 10,
        letterSpacing: 1
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 2
    },
    standingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    rankCircle: {
        width: 40, height: 40,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rankNumber: {
        color: '#888',
        fontFamily: 'Outfit_700Bold',
        fontSize: 16
    },
    teamName: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold'
    },
    statText: {
        color: '#888',
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        marginLeft: 4
    },
    pointsText: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Outfit_800ExtraBold'
    },
    ptsLabel: {
        color: '#666',
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold',
        marginTop: 2
    }
});

export default TournamentStandingsScreen;
