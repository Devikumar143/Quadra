import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Crosshair as Target, Award, Users, TrendingUp, Medal, Star } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import api from '../services/api';
import { IconButton } from '../components/Shared';

const LeaderboardScreen = ({ styles }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rankBy, setRankBy] = useState('kd'); // 'kd' or 'win_rate'
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('current');

    const fetchSeasons = async () => {
        try {
            const res = await api.get('/seasons/history');
            setSeasons(res.data);
        } catch (err) { console.log(err.message); }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            let res;
            if (selectedSeason === 'current') {
                res = await api.get('/users/leaderboard');
            } else {
                res = await api.get(`/seasons/${encodeURIComponent(selectedSeason)}`);
            }
            // Normalize data structure if needed
            const data = res.data.map(p => ({
                ...p,
                kd: p.final_stats?.kd_ratio || p.kd,
                win_rate: p.final_stats?.win_rate || p.win_rate
            }));
            setLeaderboard(data);
        } catch (err) {
            console.error('Fetch leaderboard error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [selectedSeason]);

    const myRank = leaderboard.find(p => p.is_me); // Assuming backend might provide this or we find it
    const topThree = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    const Podium = ({ player, rank, color, height }) => (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ position: 'relative', alignItems: 'center' }}>
                <LinearGradient
                    colors={[color, 'transparent']}
                    style={{ width: rank === 1 ? 96 : 80, height: rank === 1 ? 96 : 80, borderRadius: 48, padding: 3, marginBottom: 15 }}
                >
                    <View style={{ flex: 1, backgroundColor: '#0f0f11', borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                        <Text style={{ color: '#fff', fontSize: rank === 1 ? 32 : 24, fontWeight: '900', fontFamily: 'Outfit_700Bold' }}>
                            {player.ff_ign?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Holographic Halo */}
                <View style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: 10, borderRadius: 50, borderWidth: 1, borderColor: `${color}33`, opacity: 0.5 }} />

                <View style={{
                    position: 'absolute', top: -15, zIndex: 10,
                    transform: [{ rotate: '-10deg' }]
                }}>
                    <Trophy color={color} size={rank === 1 ? 28 : 20} fill={rank === 1 ? color : 'transparent'} />
                </View>
            </View>

            <Text style={{ color: '#fff', fontSize: rank === 1 ? 14 : 12, fontFamily: 'Outfit_700Bold', textAlign: 'center', width: '100%' }} numberOfLines={1}>
                {player.ff_ign?.toUpperCase()}
            </Text>

            <LinearGradient
                colors={[`${color}44`, 'transparent']}
                style={{
                    width: '100%', height: height, marginTop: 12,
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    borderWidth: 1, borderBottomWidth: 0, borderColor: `${color}22`,
                    alignItems: 'center', paddingTop: 12,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Grid Overlay */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }}>
                    {[...Array(5)].map((_, i) => (
                        <View key={i} style={{ height: 1, backgroundColor: '#fff', marginBottom: 20 }} />
                    ))}
                </View>

                <Text style={{ color: color, fontSize: 22, fontFamily: 'Outfit_700Bold' }}>#{rank}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Target size={10} color={color} />
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Outfit_600SemiBold', opacity: 0.8 }}>{rankBy === 'kd' ? player.kd : player.win_rate}</Text>
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>GLOBAL PRESTIGE</Text>
                        {selectedSeason !== 'current' && (
                            <View style={{ backgroundColor: '#D4AF37', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>ARCHIVE VIEW</Text>
                            </View>
                        )}
                    </View>

                    {/* Season Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        <TouchableOpacity
                            onPress={() => setSelectedSeason('current')}
                            style={{
                                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                                backgroundColor: selectedSeason === 'current' ? COLORS.primary : 'rgba(255,255,255,0.05)',
                                borderWidth: 1, borderColor: selectedSeason === 'current' ? COLORS.primary : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <Text style={{ color: selectedSeason === 'current' ? '#000' : COLORS.textDim, fontWeight: '800', fontSize: 12 }}>CURRENT SEASON</Text>
                        </TouchableOpacity>
                        {seasons.map((s) => (
                            <TouchableOpacity
                                key={s.season_label}
                                onPress={() => setSelectedSeason(s.season_label)}
                                style={{
                                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                                    backgroundColor: selectedSeason === s.season_label ? '#997B2A' : 'rgba(255,255,255,0.05)',
                                    borderWidth: 1, borderColor: selectedSeason === s.season_label ? '#997B2A' : 'rgba(255,255,255,0.1)'
                                }}
                            >
                                <Text style={{ color: selectedSeason === s.season_label ? '#000' : COLORS.textDim, fontWeight: '800', fontSize: 12 }}>{s.season_label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Rank Switcher */}
                    <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 6, marginBottom: 32 }}>
                        <TouchableOpacity
                            style={{ flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: rankBy === 'kd' ? 'rgba(212,175,55,0.15)' : 'transparent' }}
                            onPress={() => setRankBy('kd')}
                        >
                            <Text style={{ color: rankBy === 'kd' ? COLORS.primary : COLORS.textDim, fontWeight: '800', fontSize: 12 }}>DESTRUCTION (K/D)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: rankBy === 'win_rate' ? 'rgba(212,175,55,0.15)' : 'transparent' }}
                            onPress={() => setRankBy('win_rate')}
                        >
                            <Text style={{ color: rankBy === 'win_rate' ? COLORS.primary : COLORS.textDim, fontWeight: '800', fontSize: 12 }}>TACTICAL (WIN%)</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 100 }} />
                    ) : (
                        <>
                            {/* Podium Section */}
                            <LinearGradient
                                colors={['rgba(212, 175, 55, 0.05)', 'transparent']}
                                style={{
                                    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15,
                                    marginBottom: 32, height: 300, alignItems: 'flex-end',
                                    borderRadius: 32,
                                    paddingTop: 30, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)',
                                    position: 'relative', overflow: 'hidden'
                                }}
                            >
                                {/* HUD Background Accent */}
                                <View style={{ position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center', opacity: 0.1 }}>
                                    <View style={{ width: 150, height: 1, backgroundColor: COLORS.primary }} />
                                    <View style={{ width: 200, height: 1, backgroundColor: COLORS.primary, marginTop: 4 }} />
                                </View>

                                {topThree[1] && <Podium player={topThree[1]} rank={2} color="#E5E4E2" height={120} />}
                                {topThree[0] && <Podium player={topThree[0]} rank={1} color="#D4AF37" height={170} />}
                                {topThree[2] && <Podium player={topThree[2]} rank={3} color="#CD7F32" height={100} />}
                            </LinearGradient>

                            {/* Rankings List */}
                            <View style={[styles.glassCard, { padding: 0, overflow: 'hidden', marginBottom: 200 }]}>
                                {others.map((player, idx) => (
                                    <View key={player.id} style={{
                                        flexDirection: 'row', alignItems: 'center', padding: 16,
                                        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
                                        backgroundColor: player.is_me ? 'rgba(212, 175, 55, 0.05)' : 'transparent'
                                    }}>
                                        <View style={{ width: 35, alignItems: 'center' }}>
                                            <Text style={{ color: idx + 4 <= 10 ? COLORS.primary : COLORS.textDim, fontSize: 14, fontWeight: '900' }}>{idx + 4}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{player.ff_ign}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                <Text style={{ color: COLORS.textDim, fontSize: 10, textTransform: 'uppercase' }}>{player.university_id}</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', backgroundColor: 'rgba(212, 175, 55, 0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                            <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 14 }}>{rankBy === 'kd' ? player.kd : player.win_rate}</Text>
                                            <Text style={{ color: COLORS.textDim, fontSize: 8, fontWeight: '800' }}>{rankBy === 'kd' ? 'K/D' : 'WIN %'}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Sticky My Rank - Positioned above Nav Bar */}
                {!loading && (
                    <LinearGradient
                        colors={['#141416', '#0f0f11']}
                        style={{
                            position: 'absolute', bottom: 100, left: 20, right: 20,
                            borderRadius: 24, padding: 20,
                            flexDirection: 'row', alignItems: 'center',
                            borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
                            shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3, shadowRadius: 20, elevation: 15
                        }}
                    >
                        {/* HUD Decoration */}
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: COLORS.primary, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }} />

                        <View style={{
                            width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(212, 175, 55, 0.15)',
                            justifyContent: 'center', alignItems: 'center', marginRight: 16,
                            borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
                        }}>
                            <Text style={{ color: COLORS.primary, fontSize: 20, fontFamily: 'Outfit_700Bold' }}>#{leaderboard.findIndex(p => p.is_me) + 1 || '?'}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 2 }}>OPERATIONAL STANDING</Text>
                            <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' }}>{myRank?.ff_ign?.toUpperCase() || 'AGENT DATA ENCRYPTED'}</Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Star color={COLORS.primary} size={12} fill={COLORS.primary} />
                                <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold' }}>ELITE</Text>
                            </View>
                            <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_500Medium' }}>TIER I</Text>
                        </View>
                    </LinearGradient>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default LeaderboardScreen;
