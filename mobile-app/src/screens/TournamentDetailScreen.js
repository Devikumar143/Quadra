import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Platform, StatusBar, Modal, TextInput, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, Calendar, Zap, Trophy, Shield, Hash } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { GlassCircle } from '../components/Shared';
import api from '../services/api';

const TournamentDetailScreen = ({ user, tournament, onBack, styles }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enlisting, setEnlisting] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
    const [squadCount, setSquadCount] = useState(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [txnId, setTxnId] = useState('');

    const fetchMatches = async () => {
        try {
            const matchesRes = await api.get(`/tournaments/${tournament.id}/matches`);
            setMatches(matchesRes.data);
        } catch (err) {
            console.error('Fetch matches error:', err.message);
        }
    };

    const fetchSquadCount = async () => {
        try {
            const res = await api.get(`/tournaments/${tournament.id}/registrations/count`);
            setSquadCount(res.data.count || 0);
        } catch (err) {
            console.error("Fetch Squad Count Error:", err);
        }
    };

    const checkRegistrationStatus = async () => {
        try {
            const teamRes = await api.get('/teams/my-team');
            if (teamRes.data?.id) {
                try {
                    const regsRes = await api.get(`/tournaments/${tournament.id}/registrations`);
                    const myReg = regsRes.data.find(r => r.team_id === teamRes.data.id);
                    if (myReg) {
                        setRegistrationStatus(myReg.status);
                    }
                } catch (e) {
                    console.log("Error checking specific registration", e);
                }
            }
        } catch (err) {
            console.error('Check registration status error:', err.message);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (tournament?.id) {
                    setLoading(true);
                    await Promise.all([
                        fetchMatches(),
                        fetchSquadCount(),
                        checkRegistrationStatus()
                    ]);
                }
            } catch (err) {
                console.error('Fetch data error:', err.message);
            } finally {
                setLoading(false);
            }
        };
        if (tournament?.id) fetchData();
    }, [tournament?.id]);

    const handleEnlist = async () => {
        // 1. Get user's team
        try {
            const teamRes = await api.get('/teams/my-team');
            if (!teamRes.data || !teamRes.data.id) {
                Alert.alert("Registry Error", "You must be part of a tactical squad to enlist in this arena.");
                return;
            }
            const squad = teamRes.data;
            // 2. Check if user is team leader
            if (squad.leader_id !== user.id) {
                Alert.alert("Authorization Denied", "Only the squad leader can enlist the team in tournaments.");
                return;
            }

            // 3. Open Payment Modal
            setShowPaymentModal(true);
        } catch (err) {
            Alert.alert("Error", "Could not synchronize with Command HQ.");
        }
    };

    const submitPayment = async () => {
        if (!txnId.trim()) {
            Alert.alert("Payment Required", "Please enter the Transaction ID to verify your entry.");
            return;
        }

        setEnlisting(true);
        try {
            const teamRes = await api.get('/teams/my-team');
            const squad = teamRes.data;

            await api.post('/tournaments/register', {
                tournament_id: tournament.id,
                team_id: squad.id,
                transaction_id: txnId
            });

            setShowPaymentModal(false);
            Alert.alert("Enlistment Pending", "Transaction submitted. Your squad is waitlisted pending payment verification.");
            setRegistrationStatus('pending');
        } catch (err) {
            Alert.alert("Deployment Failed", err.response?.data?.message || err.message);
        } finally {
            setEnlisting(false);
        }
    };

    if (!tournament) return null;

    const scoring = typeof tournament.scoring_params === 'string'
        ? JSON.parse(tournament.scoring_params)
        : tournament.scoring_params;

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <GlassCircle size={400} color={COLORS.primary} top={-150} left={-100} opacity={0.08} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20, height: 'auto', paddingBottom: 10 }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MISSION BRIEF</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.glassCard, { marginBottom: 30 }]}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{tournament.status?.toUpperCase() || 'ACTIVE'}</Text>
                        </View>
                        <Text style={styles.detailTitle}>{tournament.title}</Text>

                        {tournament.sponsor_name && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10, padding: 12, backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 2 }}>OFFICIAL SPONSOR</Text>
                                    <Text style={{ color: COLORS.primary, fontSize: 13, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1 }}>{tournament.sponsor_name.toUpperCase()}</Text>
                                    {tournament.sponsor_message && (
                                        <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'Outfit_600SemiBold', opacity: 0.7, marginTop: 2 }}>{tournament.sponsor_message}</Text>
                                    )}
                                </View>
                                {tournament.sponsor_logo && (
                                    <ImageBackground
                                        source={{ uri: tournament.sponsor_logo }}
                                        style={{ width: 40, height: 40 }}
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                        )}

                        <View style={styles.detailMetaRow}>
                            <View style={styles.metaBadge}>
                                <Users color={COLORS.primary} size={14} />
                                <Text style={styles.metaBadgeText}>{tournament.format}</Text>
                            </View>
                            <View style={styles.metaBadge}>
                                <Calendar color={COLORS.primary} size={14} />
                                <Text style={styles.metaBadgeText}>{new Date(tournament.start_date).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.metaBadge, { backgroundColor: squadCount >= 12 ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)' }]}>
                                <Users color={squadCount >= 12 ? '#4CAF50' : '#FF9800'} size={14} />
                                <Text style={[styles.metaBadgeText, { color: squadCount >= 12 ? '#4CAF50' : '#FF9800' }]}>
                                    {squadCount}/12 SQUADS
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>WAR LOG (MATCHES)</Text>
                    <View style={{ marginBottom: 32 }}>
                        {loading ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : matches.length === 0 ? (
                            <View style={[styles.glassCard, { borderStyle: 'dashed', alignItems: 'center', padding: 32 }]}>
                                <Text style={[styles.textDim, { textAlign: 'center' }]}>No matches scheduled yet. Stand by for orders.</Text>
                            </View>
                        ) : matches.map(m => (
                            <View key={m.id} style={[styles.glassCard, { marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>RD {m.round_number} - {m.map_name?.toUpperCase()}</Text>
                                        <Text style={{ color: COLORS.primary, fontSize: 12, marginTop: 4 }}>{new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ color: '#fff', fontSize: 12, opacity: 0.6 }}>STATUS</Text>
                                        <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 12 }}>{m.status?.toUpperCase()}</Text>
                                    </View>
                                </View>

                                {(m.room_id || m.room_password) ? (
                                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', gap: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Hash size={14} color={COLORS.primary} />
                                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{m.room_id}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Shield size={14} color={COLORS.primary} />
                                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{m.room_password}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.6 }}>
                                            <Shield size={14} color="#666" />
                                            <Text style={{ color: '#aaa', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>CREDENTIALS ENCRYPTED</Text>
                                        </View>
                                        {registrationStatus !== 'approved' && (
                                            <Text style={{ color: COLORS.primary, fontSize: 10, marginTop: 4 }}>
                                                {registrationStatus === 'pending' ? 'VERIFICATION PENDING' : 'ENLIST TO DECRYPT'}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>OPERATIONAL SUMMARY</Text>
                    <View style={[styles.glassCard, { marginBottom: 32 }]}>
                        <Text style={styles.descriptionText}>
                            {tournament.description || "No mission summary provided. Proceed with caution."}
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.glassCard, { flex: 1, alignItems: 'center' }]}>
                            <Zap color={COLORS.primary} size={24} style={{ marginBottom: 12 }} />
                            <Text style={styles.statValue}>{scoring.kill_points}</Text>
                            <Text style={styles.statLabel}>Pts / Kill</Text>
                        </View>
                        <View style={[styles.glassCard, { flex: 1, alignItems: 'center' }]}>
                            <Trophy color={COLORS.primary} size={24} style={{ marginBottom: 12 }} />
                            <Text style={styles.statValue}>{scoring.placement_points["1"] || '12'}</Text>
                            <Text style={styles.statLabel}>Win Pts</Text>
                        </View>
                    </View>

                    <View style={[styles.glassCard, { marginTop: 12 }]}>
                        <Text style={[styles.label, { marginBottom: 16 }]}>PLACEMENT REWARDS</Text>
                        {Object.entries(scoring.placement_points || {}).map(([rank, pts]) => (
                            <View key={rank} style={styles.rankRow}>
                                <Text style={styles.rankText}>#{rank} POSITION</Text>
                                <Text style={styles.rankPoints}>{pts} PTS</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, { marginTop: 40 }, (registrationStatus === 'approved' || registrationStatus === 'pending' || enlisting) && { opacity: 0.6 }]}
                        onPress={handleEnlist}
                        disabled={registrationStatus === 'approved' || registrationStatus === 'pending' || enlisting}
                    >
                        <LinearGradient colors={registrationStatus === 'approved' ? ['#4CAF50', '#2E7D32'] : [COLORS.primary, '#997B2A']} style={styles.btnGradient}>
                            {enlisting ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={[styles.btnText, { color: '#000' }]}>
                                    {registrationStatus === 'approved' ? 'ENLISTMENT CONFIRMED' :
                                        registrationStatus === 'pending' ? 'VERIFICATION PENDING' :
                                            'ENLIST SQUAD'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>


                <Modal
                    visible={showPaymentModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowPaymentModal(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
                        <LinearGradient colors={['#1a1a1a', '#000']} style={{ borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.primary }}>
                            <Text style={styles.sectionTitle}>SECURE PAYMENT GATEWAY</Text>

                            <View style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: 16, borderRadius: 12, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: COLORS.primary }}>
                                <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>ENTRY FEE: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>₹100 / SQUAD</Text></Text>
                                <Text style={{ color: '#fff', fontSize: 14 }}>UPI ID: <Text style={{ fontWeight: 'bold', color: '#fff' }} selectable>quadra@upi</Text></Text>
                                <TouchableOpacity onPress={() => Linking.openURL('upi://pay?pa=quadra@upi&pn=QuadraEsports&mc=0000&mode=02&purpose=00')}>
                                    <Text style={{ color: COLORS.primary, fontSize: 10, marginTop: 8, textDecorationLine: 'underline' }}>TAP TO PAY VIA UPI APP</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { marginBottom: 8 }]}>ENTER TRANSACTION ID (UTR)</Text>
                            <TextInput
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    borderRadius: 12,
                                    padding: 16,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    marginBottom: 24,
                                    fontFamily: 'Outfit_600SemiBold'
                                }}
                                placeholder="e.g. 40283232123"
                                placeholderTextColor="#666"
                                value={txnId}
                                onChangeText={setTxnId}
                            />

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={submitPayment}
                                disabled={enlisting}
                            >
                                <LinearGradient colors={[COLORS.primary, '#997B2A']} style={styles.btnGradient}>
                                    {enlisting ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={[styles.btnText, { color: '#000' }]}>VERIFY & DEPLOY</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={{ marginTop: 16, alignItems: 'center' }}>
                                <Text style={{ color: '#888', fontSize: 12 }}>ABORT TRANSACTION</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default TournamentDetailScreen;
