import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Dimensions, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crosshair as Target, Trophy, Zap, TrendingUp, AlertTriangle, X, Award, Shield, MapPin, Star } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import api from '../services/api';

const screenWidth = Dimensions.get("window").width;

const StatsScreen = ({ styles }) => {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dispute State
    const [disputeModalVisible, setDisputeModalVisible] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                api.get('/users/me/stats'),
                api.get('/users/me/stats-history')
            ]);
            setStats(statsRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error('Fetch stats error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openDispute = (result) => {
        setSelectedResult(result);
        setDisputeReason('');
        setEvidenceUrl('');
        setDisputeModalVisible(true);
    };

    const submitDispute = async () => {
        if (!disputeReason.trim()) {
            Alert.alert("Missing Intel", "You must provide a reason for this contest.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/disputes/create', {
                result_id: selectedResult.result_id,
                reason: disputeReason,
                evidence_url: evidenceUrl
            });
            Alert.alert("Dispute Filed", "Your grievance has been lodged with the Conflict Bureau.");
            setDisputeModalVisible(false);
        } catch (err) {
            Alert.alert("Filing Failed", err.response?.data?.message || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const TacticalStatCard = ({ label, value, Icon, color, glowColor }) => (
        <View style={{ flex: 1, minWidth: '45%', margin: 8 }}>
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={{
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(212,175,55,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* HUD Corner Accents */}
                <View style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color, opacity: 0.5 }} />
                <View style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: color, opacity: 0.5 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
                        <Icon color={color} size={16} />
                    </View>
                    <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1.5 }}>{label}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Outfit_700Bold' }}>{value || '0'}</Text>
                    {label === 'WIN RATE' && <Text style={{ color: color, fontSize: 12, fontFamily: 'Outfit_700Bold', marginBottom: 4 }}>%</Text>}
                </View>

                {/* Micro Visualizer */}
                <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1, marginTop: 12, overflow: 'hidden' }}>
                    <LinearGradient
                        colors={[color, glowColor]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ height: '100%', width: label === 'WIN RATE' ? `${value}%` : '65%' }}
                    />
                </View>
            </LinearGradient>
        </View>
    );

    const chartConfig = {
        backgroundGradientFrom: "#141416",
        backgroundGradientTo: "#141416",
        color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 2,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#D4AF37"
        }
    };

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Tactical Header */}
                    <View style={{ marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0, marginBottom: 24 }}>
                        <Text style={{ color: COLORS.textDim, fontSize: 13, fontFamily: 'Outfit_600SemiBold', letterSpacing: 2 }}>COMMAND PROTOCOL</Text>
                        <Text style={{ color: '#fff', fontSize: 32, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>WAR ROOM</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
                    ) : (
                        <>
                            {/* Identity Section */}
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                                <LinearGradient
                                    colors={['rgba(212,175,55,0.15)', 'rgba(212,175,55,0.05)']}
                                    style={{ flex: 1.5, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <Award color={COLORS.primary} size={18} />
                                        <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>COMBAT ROLE</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>
                                            {stats?.performance?.kd_ratio > 2.0 ? 'SLAYER' : stats?.performance?.win_rate > 60 ? 'TACTICIAN' : 'OPERATIVE'}
                                        </Text>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary }} />
                                    </View>
                                </LinearGradient>

                                <View style={{ flex: 1, padding: 20, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' }}>
                                    <Text style={{ color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 1.5, marginBottom: 5 }}>PRESTIGE XP</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Star color={COLORS.primary} size={14} fill={COLORS.primary} />
                                        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' }}>{stats?.profile?.prestige_points || 0}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Performance Grid */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
                                <TacticalStatCard
                                    label="K/D RATIO"
                                    value={stats?.performance?.kd_ratio}
                                    Icon={Target}
                                    color={COLORS.primary}
                                    glowColor={COLORS.secondary}
                                />
                                <TacticalStatCard
                                    label="WIN RATE"
                                    value={stats?.performance?.win_rate}
                                    Icon={Trophy}
                                    color="#FFD700"
                                    glowColor="#B8860B"
                                />
                            </View>

                            {/* Strategic Chart Section */}
                            <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1.5, marginTop: 24, marginBottom: 15 }}>LETHALITY TREND (LAST 10 MATCHES)</Text>
                            <View style={{ borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderWidth: 1, borderColor: 'rgba(212,175,55,0.05)', alignItems: 'center' }}>
                                {history.length > 1 ? (
                                    <LineChart
                                        data={{
                                            labels: history.map((_, i) => `${i + 1}`),
                                            datasets: [{ data: history.map(h => h.kills) }]
                                        }}
                                        width={screenWidth - 60}
                                        height={180}
                                        chartConfig={{
                                            ...chartConfig,
                                            backgroundGradientFrom: 'transparent',
                                            backgroundGradientTo: 'transparent',
                                            fillShadowGradient: COLORS.primary,
                                            fillShadowGradientOpacity: 0.2,
                                            decimalPlaces: 0,
                                        }}
                                        bezier
                                        style={{ marginVertical: 8, borderRadius: 16 }}
                                        withVerticalLines={false}
                                        withHorizontalLines={true}
                                        horizontalLabelRotation={0}
                                    />
                                ) : (
                                    <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ color: COLORS.textDim, fontFamily: 'Outfit_500Medium', letterSpacing: 1 }}>DATA SCAN INCOMPLETE...</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 32, fontSize: 12, marginBottom: 15 }]}>MISSION DOSSIERS (WAR LOG)</Text>
                            {stats?.warLog?.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No secure mission records found.</Text>
                                </View>
                            ) : (
                                stats?.warLog?.map((log, idx) => (
                                    <View key={idx} style={{
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        borderRadius: 20,
                                        padding: 16,
                                        marginBottom: 12,
                                        borderLeftWidth: 3,
                                        borderLeftColor: COLORS.primary,
                                        borderWidth: 1,
                                        borderColor: 'rgba(212,175,55,0.05)'
                                    }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Outfit_700Bold' }}>{log.tournament_title}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <MapPin size={10} color={COLORS.textDim} />
                                                    <Text style={{ color: COLORS.textDim, fontSize: 11, fontFamily: 'Outfit_500Medium' }}>{log.map_name?.toUpperCase() || 'UNKNOWN ARENA'}</Text>
                                                    <Text style={{ color: 'rgba(255,255,255,0.1)' }}>|</Text>
                                                    <Text style={{ color: COLORS.textDim, fontSize: 11, fontFamily: 'Outfit_500Medium' }}>{log.created_at ? new Date(log.created_at).toLocaleDateString() : 'RECENT OP'}</Text>
                                                </View>
                                            </View>

                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ color: COLORS.primary, fontSize: 18, fontFamily: 'Outfit_700Bold' }}>#{log.placement}</Text>
                                                <Text style={{ color: COLORS.textDim, fontSize: 9, fontFamily: 'Outfit_700Bold' }}>PLACEMENT</Text>
                                            </View>
                                        </View>

                                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 }} />

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <Target color={COLORS.primary} size={14} />
                                                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold' }}>{log.kills}</Text>
                                                    <Text style={{ color: COLORS.textDim, fontSize: 10 }}>KILLS</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => openDispute(log)}
                                                style={{
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 6,
                                                    backgroundColor: 'rgba(255, 68, 68, 0.05)',
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255, 68, 68, 0.2)',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <AlertTriangle size={10} color="#ff4444" />
                                                <Text style={{ color: '#ff4444', fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>TACTICAL OVERRIDE</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </>
                    )}
                </ScrollView>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={disputeModalVisible}
                    onRequestClose={() => setDisputeModalVisible(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.92)', padding: 24 }}>
                        <View style={{ width: '100%', backgroundColor: '#0f0f11', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)', position: 'relative', overflow: 'hidden' }}>
                            {/* HUD Background Pattern */}
                            <View style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, backgroundColor: 'rgba(255, 68, 68, 0.03)', borderRadius: 100 }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                                        <AlertTriangle color="#ff4444" size={24} />
                                    </View>
                                    <View>
                                        <Text style={{ color: '#ff4444', fontSize: 16, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>CONFLICT REPORT</Text>
                                        <Text style={{ color: 'rgba(255, 68, 68, 0.6)', fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>OPERATIONAL GRIEVANCE</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setDisputeModalVisible(false)}>
                                    <X color={COLORS.textDim} size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1, marginBottom: 4 }}>TARGET MISSION</Text>
                                <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Outfit_600SemiBold' }}>{selectedResult?.tournament_title?.toUpperCase()}</Text>
                            </View>

                            <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1, marginBottom: 10, marginLeft: 5 }}>GRIEVANCE STATEMENT</Text>
                            <TextInput
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    padding: 16,
                                    borderRadius: 16,
                                    fontFamily: 'Outfit_500Medium',
                                    height: 100,
                                    textAlignVertical: 'top',
                                    marginBottom: 20
                                }}
                                placeholder="State the tactical discrepancy..."
                                placeholderTextColor="#444"
                                value={disputeReason}
                                onChangeText={setDisputeReason}
                                multiline
                            />

                            <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1, marginBottom: 10, marginLeft: 5 }}>EVIDENCE INTEL (URL)</Text>
                            <TextInput
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    padding: 16,
                                    borderRadius: 16,
                                    fontFamily: 'Outfit_500Medium',
                                    marginBottom: 24
                                }}
                                placeholder="https://evidence.clip/screenshot"
                                placeholderTextColor="#444"
                                value={evidenceUrl}
                                onChangeText={setEvidenceUrl}
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                onPress={submitDispute}
                                disabled={submitting}
                            >
                                <LinearGradient
                                    colors={['#ff4444', '#990000']}
                                    style={{ padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#ff4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }}
                                >
                                    {submitting ? <ActivityIndicator color="#fff" /> : (
                                        <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, letterSpacing: 2 }}>FILE OFFICIAL CONTEST</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default StatsScreen;
