import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert, StatusBar, Animated, Easing, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, Star, Calendar, MapPin, ChevronRight, Bell, Zap, HelpCircle, X, ShieldAlert, Award, Target } from 'lucide-react-native';
import { Modal } from 'react-native';
import { COLORS } from '../constants/theme';
import { GlassCircle } from '../components/Shared';
import api from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ user, onSelectTournament, onSelectNotifications, onWatchLive, styles }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [news, setNews] = useState([]);
    const scrollX = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [contentWidth, setContentWidth] = useState(0);

    const fetchTournaments = async () => {
        try {
            const [tRes, aRes] = await Promise.all([
                api.get('/tournaments'),
                api.get('/announcements')
            ]);
            setTournaments(tRes.data);
            setNews(aRes.data.map(a => a.content));
        } catch (err) {
            console.error('Fetch data error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchTournaments(); }, []);

    // Pulse Animation for Alerts
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.5, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (news.length > 0 && contentWidth > 0) {
            const startAnimation = () => {
                scrollX.setValue(0);
                Animated.loop(
                    Animated.timing(scrollX, {
                        toValue: -(contentWidth / 2),
                        duration: Math.max(news.length * 8000, 15000),
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ).start();
            };
            startAnimation();
        }
    }, [news, contentWidth]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTournaments();
    };

    const TournamentStat = ({ Icon, text }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.9 }}>
            <Icon color={COLORS.primary} size={12} />
            <Text style={{ color: COLORS.textDim, fontSize: 11, fontFamily: 'Outfit_600SemiBold', letterSpacing: 0.5 }}>{text}</Text>
        </View>
    );

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <GlassCircle size={400} color={COLORS.primary} top={-150} left={-100} opacity={0.08} />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header with Intelligence Pulse */}
                <View style={[styles.homeHeader, { marginTop: Platform.OS === 'android' ? 60 : 15 }]}>
                    <View style={{ paddingHorizontal: 24 }}>
                        <Text style={styles.welcomeText}>WELCOME BACK, COMMANDER</Text>
                        <Text style={[styles.ignHome, { fontSize: 28 }]}>{user?.ff_ign || 'UNKNOWN'}</Text>
                    </View>
                    <TouchableOpacity style={[styles.notifBtn, { marginRight: 24, padding: 0 }]} onPress={onSelectNotifications}>
                        <View style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                            <Bell color={COLORS.primary} size={22} />
                            <Animated.View style={{
                                position: 'absolute', top: 12, right: 12,
                                width: 8, height: 8, borderRadius: 4,
                                backgroundColor: COLORS.primary,
                                transform: [{ scale: pulseAnim }],
                                opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.8, 0] })
                            }} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Professionalized Glass Ticker */}
                <View style={{ height: 44, justifyContent: 'center' }}>
                    <LinearGradient
                        colors={['rgba(212,175,55,0.08)', 'rgba(0,0,0,0)', 'rgba(212,175,55,0.08)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(212,175,55,0.1)' }}
                    >
                        <Animated.View
                            onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 40, paddingHorizontal: 24, transform: [{ translateX: scrollX }] }}
                        >
                            {news.length > 0 ? [...news, ...news].map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginRight: 10 }} />
                                    <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>{item}</Text>
                                </View>
                            )) : (
                                <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 2 }}>ESTABLISHING SECURE UPLINK...</Text>
                            )}
                        </Animated.View>
                    </LinearGradient>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    {/* WATCH LIVE: Command Ticker Style */}
                    <TouchableOpacity
                        style={{ height: 50, borderRadius: 12, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.3)' }}
                        onPress={onWatchLive}
                    >
                        <LinearGradient colors={['rgba(190, 30, 45, 0.15)', 'rgba(190, 30, 45, 0.05)']} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                            <Animated.View style={[styles.pulseInner, { backgroundColor: '#ff4444', marginRight: 12, transform: [{ scale: pulseAnim }] }]} />
                            <Text style={{ color: '#ff4444', fontFamily: 'Outfit_700Bold', fontSize: 11, flex: 1, letterSpacing: 2 }}>LIVE DATA STREAM: DETECTED</Text>
                            <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 10, marginRight: 8 }}>WATCH</Text>
                            <ChevronRight color="#ff4444" size={16} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.sectionTitle, { fontSize: 12, letterSpacing: 3, marginBottom: 0, color: COLORS.textDim }]}>ARENA DEPLOYMENTS</Text>
                            <TouchableOpacity onPress={() => setShowRules(true)} style={{ padding: 4 }}>
                                <HelpCircle color={COLORS.primary} size={14} />
                            </TouchableOpacity>
                        </View>
                        {loading && refreshing && <ActivityIndicator size="small" color={COLORS.primary} />}
                    </View>

                    {loading && !refreshing ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
                    ) : tournaments.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Zap color="rgba(212,175,55,0.2)" size={48} style={{ marginBottom: 16 }} />
                            <Text style={{ color: COLORS.textDim, fontFamily: 'Outfit_400Regular', textAlign: 'center' }}>NO ACTIVE DEPLOYMENTS DETECTED IN THIS SECTOR.</Text>
                        </View>
                    ) : (
                        tournaments.map((t, index) => {
                            const isFull = t.registration_count >= (t.max_teams || 12);
                            const isLive = t.status === 'live';

                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    activeOpacity={0.9}
                                    style={[
                                        styles.tournamentCard,
                                        {
                                            padding: 0, overflow: 'hidden',
                                            backgroundColor: 'transparent',
                                            borderWidth: 0,
                                            marginBottom: 24,
                                            height: 180 // Increased height for briefings
                                        }
                                    ]}
                                    onPress={() => onSelectTournament(t)}
                                >
                                    <LinearGradient
                                        colors={isLive ? ['rgba(255,68,68,0.1)', 'rgba(10,10,11,0.95)'] : ['rgba(212,175,55,0.08)', 'rgba(10,10,11,0.98)']}
                                        style={{ flex: 1, padding: 16, borderRadius: 28, borderWidth: 1, borderColor: isLive ? 'rgba(255,68,68,0.3)' : 'rgba(212,175,55,0.15)' }}
                                    >
                                        {/* Tactical Map Visual (Briefing Header) */}
                                        <View style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 60, opacity: 0.15 }}>
                                            <LinearGradient
                                                colors={[isLive ? '#ff4444' : COLORS.primary, 'transparent']}
                                                style={{ flex: 1 }}
                                            />
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, zIndex: 1 }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <View style={{ backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ color: COLORS.primary, fontSize: 8, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 2 }}>{t.format?.toUpperCase() || 'BATTLE ROYALE'}</Text>
                                                    </View>
                                                    {isLive && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff4444', transform: [{ scale: pulseAnim }] }} />
                                                            <Text style={{ color: '#ff4444', fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>LIVE OP</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Outfit_700Bold', marginTop: 4, letterSpacing: 0.5 }}>{t.title?.toUpperCase()}</Text>
                                                {t.sponsor_name && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                                                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1.5 }}>POWERED BY</Text>
                                                        <Text style={{ color: COLORS.primary, fontSize: 8, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1 }}>{t.sponsor_name.toUpperCase()}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ color: COLORS.primary, fontSize: 22, fontFamily: 'Outfit_700Bold' }}>₹{t.prize_pool || '5,000'}</Text>
                                                <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 1.5 }}>TOTAL BOUNTY</Text>
                                            </View>
                                        </View>

                                        {/* Briefing Intel Row */}
                                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15, zIndex: 1 }}>
                                            <View style={{ flex: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' }}>
                                                    <MapPin color={COLORS.primary} size={14} />
                                                </View>
                                                <View>
                                                    <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>BRIEFING LOC</Text>
                                                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold' }}>{t.map_name?.toUpperCase() || 'BERMUDA'}</Text>
                                                </View>
                                            </View>

                                            <View style={{ flex: 1, backgroundColor: isFull ? 'rgba(255,68,68,0.05)' : 'rgba(212,175,55,0.05)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: isFull ? 'rgba(255,68,68,0.2)' : 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: isFull ? '#ff4444' : COLORS.primary, fontSize: 18, fontFamily: 'Outfit_700Bold' }}>{t.registration_count || 0}/{t.max_teams || 12}</Text>
                                                <Text style={{ color: COLORS.textDim, fontSize: 7, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>SLOTS FILLED</Text>
                                            </View>
                                        </View>

                                        {/* Tactical Footer */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10, zIndex: 1 }}>
                                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Calendar color={COLORS.textDim} size={10} />
                                                    <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_600SemiBold' }}>{new Date(t.start_date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Star color={COLORS.textDim} size={10} />
                                                    <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_600SemiBold' }}>{t.prestige_points || 500} XP</Text>
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isFull ? '#555' : '#4CAF50' }} />
                                                <Text style={{ color: isFull ? '#555' : '#4CAF50', fontSize: 9, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1 }}>{isFull ? 'LOCKDOWN' : 'OPEN COMS'}</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Tactical Rules Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showRules}
                onRequestClose={() => setShowRules(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 24, zIndex: 10, padding: 8 }}
                        onPress={() => setShowRules(false)}
                    >
                        <X color="#fff" size={24} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ paddingVertical: 40 }}>
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                <ShieldAlert color={COLORS.primary} size={48} />
                                <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 24, letterSpacing: 3, marginTop: 16 }}>COMBAT PROTOCOLS</Text>
                                <View style={{ width: 40, height: 2, backgroundColor: COLORS.primary, marginTop: 8 }} />
                            </View>

                            <RuleSection
                                icon={<Target color={COLORS.primary} size={20} />}
                                title="ENGAGEMENT RULES"
                                rules={[
                                    "Anti-hack active. Illegal software = Life ban.",
                                    "Teaming strictly prohibited in solo/duo missions.",
                                    "All operatives must use their registered FF IDs.",
                                    "Matches start exactly at the scheduled epoch."
                                ]}
                            />

                            <RuleSection
                                icon={<Award color={COLORS.primary} size={20} />}
                                title="SCORING MATRIX"
                                rules={[
                                    "Kill Bounty: +1 Combat Point per elimination.",
                                    "Victory (Booyah): +12 Strategic Points.",
                                    "Points are calculated post-extraction."
                                ]}
                            />

                            <RuleSection
                                icon={<Users color={COLORS.primary} size={20} />}
                                title="SQUAD CONDUCT"
                                rules={[
                                    "Minimum 4 operatives per squad deployment.",
                                    "Substitutes must be pre-vetted in Roster.",
                                    "Leader must confirm room entry in 5 mins."
                                ]}
                            />

                            <TouchableOpacity
                                style={{
                                    backgroundColor: COLORS.primary,
                                    padding: 18,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    marginTop: 40,
                                    shadowColor: COLORS.primary,
                                    shadowOpacity: 0.3,
                                    shadowRadius: 10,
                                    elevation: 5
                                }}
                                onPress={() => setShowRules(false)}
                            >
                                <Text style={{ color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 14, letterSpacing: 2 }}>I UNDERSTAND THE PROTOCOLS</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </LinearGradient >
    );
};

const RuleSection = ({ icon, title, rules }) => (
    <View style={{ marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {icon}
            <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 12, letterSpacing: 2 }}>{title}</Text>
        </View>
        {rules.map((rule, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 6 }} />
                <Text style={{ color: COLORS.textDim, fontFamily: 'Outfit_400Regular', fontSize: 12, flex: 1, lineHeight: 18 }}>{rule}</Text>
            </View>
        ))}
    </View>
);

export default HomeScreen;
