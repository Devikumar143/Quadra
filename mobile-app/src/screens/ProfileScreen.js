import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Alert, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Crown, ShieldCheck, Trophy, UserCircle, Hash, Crosshair, Users, Shield, Zap, X } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { GlassCircle } from '../components/Shared';
import api from '../services/api';

const ProfileScreen = ({ user, onLogout, onEdit, onViewHistory, styles }) => {
    const [achievements, setAchievements] = React.useState([]);
    const [loadingAch, setLoadingAch] = React.useState(false);
    const [passportVisible, setPassportVisible] = React.useState(false);

    React.useEffect(() => {
        const fetchAchievements = async () => {
            setLoadingAch(true);
            try {
                const res = await api.get('/achievements/me');
                setAchievements(res.data);
            } catch (err) {
                console.log("Achievement fetch failed:", err.message);
            } finally {
                setLoadingAch(false);
            }
        };
        fetchAchievements();
    }, []);

    const getIcon = (name) => {
        switch (name) {
            case 'Target': return <Crosshair color={COLORS.primary} size={18} />;
            case 'Crosshair': return <Crosshair color={COLORS.primary} size={18} />;
            case 'Shield': return <Shield color={COLORS.primary} size={18} />;
            case 'Users': return <Users color={COLORS.primary} size={18} />;
            default: return <Zap color={COLORS.primary} size={18} />;
        }
    };
    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <GlassCircle size={400} color={COLORS.primary} top={-150} left={-100} opacity={0.08} />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.profileGlow}>
                            <View style={styles.profileCircle}>
                                <User color="#fff" size={48} />
                            </View>
                        </LinearGradient>
                        <View style={styles.ignContainer}>
                            <Crown color={COLORS.primary} size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.ign}>{user?.ff_ign || 'UNKNOWN'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <View style={[styles.verifiedBadge, { marginTop: 0 }]}>
                                <Text style={[styles.verifiedText, { color: COLORS.primary }]}>{user?.combat_role || 'OPERATIVE'}</Text>
                            </View>
                            {user?.is_verified && (
                                <View style={[styles.verifiedBadge, { marginTop: 0, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.2)' }]}>
                                    <ShieldCheck color="#4CAF50" size={12} />
                                    <Text style={[styles.verifiedText, { color: '#4CAF50' }]}>VERIFIED</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* NEW: Prestige & Referral Section */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <View style={[styles.glassCard, { flex: 1, padding: 12, alignItems: 'center' }]}>
                            <Text style={{ color: COLORS.primary, fontSize: 18, fontFamily: 'Outfit_700Bold' }}>{user?.profile?.prestige_points || 0}</Text>
                            <Text style={{ color: COLORS.textDim, fontSize: 8, letterSpacing: 1 }}>PRESTIGE XP</Text>
                        </View>
                        <View style={[styles.glassCard, { flex: 1, padding: 12, alignItems: 'center' }]}>
                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Outfit_700Bold' }}>{user?.profile?.referral_code || '---'}</Text>
                            <Text style={{ color: COLORS.textDim, fontSize: 8, letterSpacing: 1 }}>REFERRAL CODE</Text>
                        </View>
                    </View>

                    {/* NEW: Bio Section */}
                    {user?.profile?.bio && (
                        <View style={[styles.glassCard, { marginBottom: 16, padding: 16 }]}>
                            <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 8 }}>COMBAT RECORD</Text>
                            <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{user.profile.bio}</Text>
                        </View>
                    )}

                    <View style={[styles.glassCard, styles.identityCard]}>
                        <View style={styles.infoRow}>
                            <UserCircle color={COLORS.primary} size={18} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.label}>OPERATIVE NAME</Text>
                                <Text style={styles.value}>{user?.full_name}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Users color={COLORS.primary} size={18} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.label}>SQUAD DESIGNATION</Text>
                                <Text style={[styles.value, { color: user?.team_name ? COLORS.primary : '#444', fontFamily: 'Outfit_700Bold' }]}>
                                    {user?.team_name || 'NO ACTIVE SQUAD'}
                                </Text>
                            </View>
                        </View>

                        {/* NEW: Social Links */}
                        {(user?.profile?.social_links?.discord || user?.profile?.social_links?.instagram) && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Target color={COLORS.primary} size={18} />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.label}>SOCIAL SYNC</Text>
                                        <Text style={styles.value}>
                                            {user.profile.social_links.discord && `DC: ${user.profile.social_links.discord} `}
                                            {user.profile.social_links.instagram && `IG: ${user.profile.social_links.instagram}`}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.glassCard, { flex: 1, alignItems: 'center' }]}>
                            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.statIconGlow}>
                                <Trophy color="#000" size={20} />
                            </LinearGradient>
                            <Text style={styles.statValue}>{user?.stats?.win_rate || '0%'}</Text>
                            <Text style={styles.statLabel}>Win Rate</Text>
                        </View>
                        <View style={[styles.glassCard, { flex: 1, alignItems: 'center' }]}>
                            <LinearGradient colors={['#333', '#111']} style={styles.statIconGlow}>
                                <Crosshair color={COLORS.primary} size={20} />
                            </LinearGradient>
                            <Text style={styles.statValue}>{user?.stats?.kd_ratio || '0.0'}</Text>
                            <Text style={styles.statLabel}>K/D Ratio</Text>
                        </View>
                        <View style={[styles.glassCard, { flex: 1, alignItems: 'center' }]}>
                            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.statIconGlow}>
                                <Zap color="#000" size={20} />
                            </LinearGradient>
                            <Text style={styles.statValue}>{user?.stats?.total_kills || '0'}</Text>
                            <Text style={styles.statLabel}>Kills</Text>
                        </View>
                    </View>

                    {/* NEW: Achievement Medal Rack */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 12 }}>MEDALS OF HONOR</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 12 }}>
                            {achievements.length === 0 ? (
                                <View style={[styles.glassCard, { width: 140, height: 100, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <View style={{ opacity: 0.2, alignItems: 'center' }}>
                                        <Trophy color="#fff" size={24} />
                                        <Text style={{ color: '#fff', fontSize: 8, marginTop: 8, fontFamily: 'Outfit_700Bold' }}>NO ACCOLADES</Text>
                                    </View>
                                </View>
                            ) : achievements.map((ach) => (
                                <View key={ach.id} style={[styles.glassCard, { width: 140, padding: 12, marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }]}>
                                    <LinearGradient colors={['rgba(212,175,55,0.2)', 'transparent']} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                        {getIcon(ach.icon_name)}
                                    </LinearGradient>
                                    <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Outfit_800ExtraBold', textAlign: 'center', letterSpacing: 1 }} numberOfLines={1}>{ach.title}</Text>
                                    <Text style={{ color: COLORS.primary, fontSize: 8, fontFamily: 'Outfit_700Bold', marginTop: 4 }}>+{ach.reward_points} XP</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        style={[styles.glassCard, { marginTop: 20, backgroundColor: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.3)' }]}
                        onPress={onViewHistory}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                            <Trophy color={COLORS.primary} size={18} />
                            <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>WAR HISTORY</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.glassCard, { marginTop: 12, backgroundColor: 'rgba(212,175,55,0.1)', borderColor: COLORS.primary }]}
                        onPress={onEdit}
                    >
                        <Text style={{ color: COLORS.primary, textAlign: 'center', fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>EDIT PROFILE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.glassCard, { marginTop: 12, backgroundColor: 'rgba(212,175,55,0.2)', borderColor: COLORS.primary, borderWidth: 2 }]}
                        onPress={() => setPassportVisible(true)}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                            <Shield color={COLORS.primary} size={18} />
                            <Text style={{ color: COLORS.primary, textAlign: 'center', fontFamily: 'Outfit_800ExtraBold', letterSpacing: 2 }}>GENERATE PASSPORT</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.glassCard, { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.02)' }]}
                        onPress={() => {
                            Alert.prompt(
                                "REDEEM REFERRAL",
                                "Provide a combatant's referral code to claim bonus Prestige XP.",
                                [
                                    { text: "ABORT", style: "cancel" },
                                    {
                                        text: "REDEEM",
                                        onPress: async (code) => {
                                            if (!code) return;
                                            try {
                                                const res = await api.post('/users/me/redeem-referral', { code });
                                                Alert.alert("COMMENDATION RECEIVED", res.data.message);
                                            } catch (err) {
                                                Alert.alert("LINK FAILED", err.response?.data?.message || err.message);
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>REDEEM REFERRAL CODE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                        <Text style={styles.logoutText}>LOGOUT SYSTEM</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* GAMER PASSPORT MODAL */}
                <PassportModal
                    visible={passportVisible}
                    onClose={() => setPassportVisible(false)}
                    user={user}
                    achievements={achievements}
                />
            </SafeAreaView>
        </LinearGradient>
    );
};

const PassportModal = ({ visible, onClose, user, achievements }) => {
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

    // Pulse animation for the "LIVE" indicator
    const pulseAnim = React.useRef(new Animated.Value(0.5)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        } else {
            scaleAnim.setValue(0.9);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Animated.View style={{
                    width: '100%',
                    aspectRatio: 0.65,
                    transform: [{ scale: scaleAnim }]
                }}>
                    <LinearGradient
                        colors={['#1a1a1c', '#0a0a0b']}
                        style={{
                            flex: 1,
                            borderRadius: 24,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            padding: 24,
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {/* CORNER ACCENTS */}
                        <View style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderColor: COLORS.primary, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 }} />
                        <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderColor: COLORS.primary, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 }} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderColor: COLORS.primary, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 }} />
                        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderColor: COLORS.primary, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 }} />

                        {/* HUD SCANLINES EFFECT */}
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }}>
                            {[...Array(40)].map((_, i) => (
                                <View key={i} style={{ height: 1, backgroundColor: '#fff', marginBottom: 10 }} />
                            ))}
                        </View>

                        {/* WATERMARK */}
                        <View style={{ position: 'absolute', top: '40%', alignSelf: 'center', opacity: 0.03 }}>
                            <Shield color="#fff" size={300} />
                        </View>

                        {/* HEADER */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, marginTop: 10 }}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ width: 8, height: 8, backgroundColor: COLORS.primary, borderRadius: 4 }} />
                                    <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 3 }}>QUADRA COMMAND</Text>
                                </View>
                                <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1, marginTop: 4 }}>OPERATIVE PASSPORT</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                                <X color="#fff" size={20} />
                            </TouchableOpacity>
                        </View>

                        {/* AVATAR & IDENTITY */}
                        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>
                            <View style={{
                                width: 100, height: 120, borderRadius: 12,
                                borderWidth: 1, borderColor: COLORS.primary,
                                backgroundColor: 'rgba(212,175,55,0.05)',
                                justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
                            }}>
                                <LinearGradient colors={['rgba(212,175,55,0.1)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%' }} />
                                <User color={COLORS.primary} size={60} style={{ opacity: 0.8 }} />

                                {/* HOLOGRAM GLITCH EFFECT OVER AVATAR */}
                                <Animated.View style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                    backgroundColor: COLORS.primary, opacity: pulseAnim,
                                    transform: [{ translateY: pulseAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0, 120] }) }]
                                }} />
                            </View>

                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>IGN / CODENAME</Text>
                                <Text style={{ color: '#fff', fontSize: 28, fontFamily: 'Outfit_800ExtraBold', marginBottom: 12, textShadowColor: COLORS.primaryGlow, textShadowRadius: 10 }}>{user?.ff_ign?.toUpperCase() || 'UNKNOWN'}</Text>

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View>
                                        <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>OPERATIVE UID</Text>
                                        <Text style={{ color: COLORS.primary, fontSize: 12, fontFamily: 'Outfit_700Bold' }}>{user?.id?.substring(0, 8).toUpperCase() || '########'}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>STATUS</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', opacity: pulseAnim }} />
                                            <Text style={{ color: '#4CAF50', fontSize: 12, fontFamily: 'Outfit_700Bold' }}>ACTIVE</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* COMBAT INTEL SECTION */}
                        <View style={{ marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12 }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 2 }}>COMBAT ANALYTICS</Text>
                                <ShieldCheck color={COLORS.primary} size={14} />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                <PassportStat label="KILLS" value={user?.stats?.total_kills || '0'} />
                                <PassportStat label="K/D RATIO" value={user?.stats?.kd_ratio || '0.00'} />
                                <PassportStat label="WIN RATE" value={user?.stats?.win_rate || '0%'} />
                                <PassportStat label="PRESTIGE" value={`${user?.profile?.prestige_points || 0}`} />
                            </View>
                        </View>

                        {/* SQUAD & ROLE */}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                            <View style={{ flex: 1, backgroundColor: 'rgba(212,175,55,0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' }}>
                                <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 4 }}>ASSIGNED ROLE</Text>
                                <Text style={{ color: COLORS.primary, fontSize: 14, fontFamily: 'Outfit_800ExtraBold' }}>{user?.combat_role?.toUpperCase() || 'OPERATIVE'}</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 4 }}>SQUAD ALLIANCE</Text>
                                <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Outfit_800ExtraBold' }}>{user?.team_name?.toUpperCase() || 'FREELANCER'}</Text>
                            </View>
                        </View>

                        {/* FOOTER BARCODE */}
                        <View style={{ marginTop: 'auto', alignItems: 'center' }}>
                            <View style={{ width: '100%', height: 30, backgroundColor: '#000', borderRadius: 4, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center', opacity: 0.8 }}>
                                <View style={{ flexDirection: 'row', gap: 2 }}>
                                    {[...Array(40)].map((_, i) => (
                                        <View key={i} style={{ width: Math.random() > 0.5 ? 2 : 1, height: 15, backgroundColor: COLORS.primary }} />
                                    ))}
                                </View>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7, fontFamily: 'Outfit_700Bold', marginTop: 8, letterSpacing: 4 }}>DIGITAL SYSTEM AUTHENTICATED</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* SHARE BUTTON */}
                <TouchableOpacity
                    style={{
                        marginTop: 30,
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 40,
                        paddingVertical: 15,
                        borderRadius: 30,
                        shadowColor: COLORS.primary,
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        elevation: 5
                    }}
                    onPress={() => Alert.alert("Export Success", "Passport intel has been saved to your local database gallery.")}
                >
                    <Text style={{ color: '#000', fontFamily: 'Outfit_800ExtraBold', fontSize: 14, letterSpacing: 2 }}>SHARE PASSPORT</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const PassportStat = ({ label, value }) => (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
        <Text style={{ color: COLORS.textDim, fontSize: 7, fontFamily: 'Outfit_700Bold', letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Outfit_800ExtraBold' }}>{value}</Text>
    </View>
);

export default ProfileScreen;
