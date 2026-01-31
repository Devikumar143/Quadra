import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy, Target, Calendar, AlertTriangle } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import api from '../services/api';

const MatchHistoryScreen = ({ onBack, styles }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/users/me/match-history');
            setHistory(res.data);
        } catch (err) {
            console.error('Fetch history error:', err.message);
            Alert.alert("Intelligence Error", "Failed to retrieve combat history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const handleDispute = (item) => {
        Alert.alert(
            "Conflict Bureau",
            `Report a discrepancy in ${item.tournament_title}?`,
            [
                { text: "ABORT", style: "cancel" },
                { text: "REPORT", onPress: () => Alert.alert("Initiated", "Head to the War Room (Stats) to file a formal dispute.") }
            ]
        );
    };

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.header, { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0, height: 'auto', paddingBottom: 10 }]}>
                    <TouchableOpacity onPress={onBack} style={{ marginRight: 16 }}>
                        <ChevronLeft color={COLORS.primary} size={28} />
                    </TouchableOpacity>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>WAR HISTORY</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                        }
                    >
                        {history.length === 0 ? (
                            <View style={[styles.emptyState, { marginTop: 80 }]}>
                                <Text style={styles.emptyText}>No combat logs found in the archives.</Text>
                            </View>
                        ) : (
                            history.map((item, idx) => (
                                <View key={idx} style={[styles.tournamentCard, { flexDirection: 'column', alignItems: 'stretch', padding: 20, marginBottom: 16 }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.tTitle, { fontSize: 16 }]}>{item.tournament_title}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <Calendar color={COLORS.textDim} size={12} style={{ marginRight: 4 }} />
                                                <Text style={styles.tMetaText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 8, borderRadius: 10, height: 40, justifyContent: 'center' }}>
                                            <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 18 }}>#{item.placement}</Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 }}>
                                        <View style={{ flexDirection: 'row', gap: 20 }}>
                                            <View>
                                                <Text style={[styles.label, { fontSize: 9 }]}>LETHALITY</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                    <Target color={COLORS.primary} size={14} style={{ marginRight: 6 }} />
                                                    <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>{item.kills} KILLS</Text>
                                                </View>
                                            </View>
                                            <View>
                                                <Text style={[styles.label, { fontSize: 9 }]}>PRESTIGE Gained</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                    <Trophy color={COLORS.secondary} size={14} style={{ marginRight: 6 }} />
                                                    <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>+{item.total_points} PTS</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handleDispute(item)}
                                            style={{ backgroundColor: 'rgba(255, 68, 68, 0.05)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)' }}
                                        >
                                            <AlertTriangle color="#ff4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default MatchHistoryScreen;
