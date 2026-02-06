import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator, Alert, Dimensions, RefreshControl, Platform, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Crown, Lock, ShieldCheck, User, TrendingUp, BarChart3, Crosshair as Target, Star, MapPin, Calendar, Send, Search, Zap, MessageSquare } from 'lucide-react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import api, { SOCKET_URL } from '../services/api';
import { TacticalModal } from '../components/Shared';

const SquadsScreen = ({ user, token, onOpenRecruitment, styles }) => {
    const [team, setTeam] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'roster', 'analytics'
    const [loadingPerf, setLoadingPerf] = useState(false);
    const socketRef = React.useRef(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger',
        confirmText: ''
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editUpi, setEditUpi] = useState('');
    const [editMobile, setEditMobile] = useState('');

    useEffect(() => {
        if (showEditModal && team) {
            setEditName(team.name || '');
            setEditUpi(team.upi_id || '');
            setEditMobile(team.mobile_number || '');
        }
    }, [showEditModal, team]);

    const handleUpdateTeam = async () => {
        if (!editName) return Alert.alert("Tactical Error", "Squad name is required.");

        try {
            const res = await api.put(`/teams/${team.id}`, {
                name: editName,
                upi_id: editUpi,
                mobile_number: editMobile
            });
            const updatedTeam = await fetchMyTeam();
            setTeam(updatedTeam);
            setShowEditModal(false);
            Alert.alert("Success", "Squad protocols updated.");
        } catch (err) {
            Alert.alert("Failed", err.response?.data?.message || err.message);
        }
    };

    const handleLeaveTeam = () => {
        setModalConfig({
            title: "Abandon Squad",
            message: "Are you sure you want to leave this unit? Your synergy with this squad will be lost as you enter solo status.",
            confirmText: "LEAVE UNIT",
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.post('/teams/leave');
                    setTeam(null);
                    setPerformance(null);
                    setActiveTab('create');
                    setModalVisible(false);
                } catch (err) {
                    Alert.alert("Error", err.response?.data?.message || err.message);
                }
            }
        });
        setModalVisible(true);
    };

    const handleDeleteTeam = () => {
        setModalConfig({
            title: "Disband Squad",
            message: "CRITICAL: This will permanently delete the unit and remove all members. Operational history and synergy scores will be purged.",
            confirmText: "DISBAND UNIT",
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete('/teams/delete');
                    setTeam(null);
                    setPerformance(null);
                    setActiveTab('create');
                    setModalVisible(false);
                } catch (err) {
                    Alert.alert("Error", err.response?.data?.message || err.message);
                }
            }
        });
        setModalVisible(true);
    };

    const fetchMyTeam = async () => {
        try {
            const res = await api.get('/teams/my-team');
            if (res.data && res.data.id) {
                setTeam(res.data);
                return res.data;
            } else {
                setTeam(null);
                return null;
            }
        } catch (err) {
            console.error('Fetch team error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformance = async (teamId) => {
        setLoadingPerf(true);
        try {
            const res = await api.get(`/teams/${teamId}/performance`);
            setPerformance(res.data);
        } catch (err) {
            console.error('Fetch performance error:', err.message);
        } finally {
            setLoadingPerf(false);
        }
    };

    useEffect(() => {
        fetchMyTeam().then((t) => {
            if (t?.id) {
                fetchPerformance(t.id);
                setActiveTab('roster');
                initializeSocket(t.id);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const initializeSocket = async (teamId) => {

        const stoken = await AsyncStorage.getItem('token');

        const socket = io(SOCKET_URL, {
            auth: { token: stoken },
            extraHeaders: { 'x-auth-token': stoken }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setSocketConnected(true);
            socket.emit('join_squad', teamId);
        });

        socket.on('disconnect', () => {
            setSocketConnected(false);
        });

        socket.on('error', (err) => {
            console.error('Squad Socket Error:', err.message);
        });
    };

    const handleCreateTeam = async () => {
        if (!name) return Alert.alert("Tactical Error", "Squad name is required.");
        if (!upiId) return Alert.alert("Tactical Error", "UPI ID is required for prize distribution.");
        if (!mobileNumber) return Alert.alert("Tactical Error", "Mobile number is required for contact.");

        setCreating(true);
        try {
            const res = await api.post('/teams/create', { name, upi_id: upiId, mobile_number: mobileNumber });
            const newTeam = await fetchMyTeam();
            if (newTeam?.id) fetchPerformance(newTeam.id);
            setActiveTab('roster');
        } catch (err) {
            Alert.alert("Failed", err.response?.data?.message || err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!inviteCode) return Alert.alert("Tactical Error", "Invite code is required.");
        try {
            await api.post('/teams/join', { invite_code: inviteCode });
            const newTeam = await fetchMyTeam();
            if (newTeam?.id) fetchPerformance(newTeam.id);
            setActiveTab('roster');
        } catch (err) {
            Alert.alert("Failed", err.response?.data?.message || err.message);
        }
    };

    const renderAnalytics = () => {
        if (!performance) return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={{ color: COLORS.primary, marginTop: 16, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>ANALYZING SQUAD DATA...</Text>
            </View>
        );

        const hasHistory = performance.match_history?.length > 0;
        const chartLabels = hasHistory ? performance.match_history.map((_, i) => `M${i + 1}`) : ["M1", "M2", "M3", "M4", "M5"];
        const chartDataPoints = hasHistory ? performance.match_history.map(m => m.kills) : [0, 0, 0, 0, 0];

        const chartData = {
            labels: chartLabels,
            datasets: [{
                data: chartDataPoints,
                color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
                strokeWidth: 3
            }]
        };

        return (
            <View style={{ marginTop: 10 }}>
                {/* Tactical Header */}
                <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 4, height: 24, backgroundColor: COLORS.primary, borderRadius: 2 }} />
                    <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>TACTICAL READOUT</Text>
                </View>

                {/* Main Visualization */}
                <View style={[styles.glassCard, { marginBottom: 24, padding: 0, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212, 175, 55, 0.1)' }]}>
                    <LinearGradient colors={['rgba(212, 175, 55, 0.05)', 'transparent']} style={{ paddingVertical: 20 }}>
                        <Text style={[styles.label, { marginBottom: 20, textAlign: 'center', fontSize: 10, letterSpacing: 3 }]}>LETHALITY TREND (REAL-TIME)</Text>
                        <LineChart
                            data={chartData}
                            width={Dimensions.get('window').width - 48}
                            height={220}
                            chartConfig={{
                                backgroundGradientFrom: 'transparent',
                                backgroundGradientTo: 'transparent',
                                color: (opacity = 1) => COLORS.primary,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                                propsForDots: { r: "5", strokeWidth: "3", stroke: COLORS.primary },
                                decimalPlaces: 0,
                                propsForLabels: { fontFamily: 'Outfit_600SemiBold', fontSize: 10 },
                                style: { paddingRight: 0 }
                            }}
                            bezier
                            withInnerLines={false}
                            withOuterLines={false}
                            style={{ borderRadius: 16, marginLeft: -8 }}
                        />
                    </LinearGradient>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }} pointerEvents="none">
                        {[...Array(20)].map((_, i) => (
                            <View key={i} style={{ height: 1, backgroundColor: '#fff', marginBottom: 10 }} />
                        ))}
                    </View>
                </View>

                {/* Metrics Grid */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    <LinearGradient
                        colors={['rgba(212, 175, 55, 0.1)', 'rgba(212, 175, 55, 0.02)']}
                        style={{ flex: 1, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
                    >
                        {/* HUD Corner */}
                        <View style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTopWidth: 2, borderLeftWidth: 2, borderColor: COLORS.primary, opacity: 0.5 }} />

                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' }}>
                            <TrendingUp color={COLORS.primary} size={20} />
                        </View>
                        <Text style={{ color: '#fff', fontSize: 28, fontFamily: 'Outfit_700Bold' }}>{performance.synergy_score}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary }} />
                            <Text style={{ color: COLORS.textDim, fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>SYNERGY</Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                        style={{ flex: 1, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
                    >
                        {/* HUD Corner */}
                        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottomWidth: 2, borderRightWidth: 2, borderColor: COLORS.textDim, opacity: 0.3 }} />

                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                            <Target color={COLORS.primary} size={20} />
                        </View>
                        <Text style={{ color: '#fff', fontSize: 28, fontFamily: 'Outfit_700Bold' }}>{performance.avg_kd}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textDim }} />
                            <Text style={{ color: COLORS.textDim, fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>UNIT K/D</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Top Performer Ribbon */}
                <View style={[styles.glassCard, { padding: 0, overflow: 'hidden', borderRadius: 24 }]}>
                    <LinearGradient
                        colors={['rgba(212, 175, 55, 0.15)', 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { fontSize: 10, letterSpacing: 3, marginBottom: 8 }]}>PRIME OPERATIVE</Text>
                            <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Outfit_700Bold' }}>{performance.top_performer?.ign || 'SCANNING...'}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 }} />
                                <Text style={{ color: '#aaa', fontSize: 12, fontFamily: 'Outfit_600SemiBold' }}>Lethality Rating: {performance.top_performer?.kd || '0.00'}</Text>
                            </View>
                        </View>
                        <LinearGradient colors={[COLORS.primary, '#997B2A']} style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}>
                            <Star color="#000" size={24} fill="#000" />
                        </LinearGradient>
                    </LinearGradient>
                </View>

                {/* Action Row */}
                <TouchableOpacity
                    style={{
                        marginTop: 32, marginBottom: 120, height: 64, borderRadius: 20, overflow: 'hidden',
                        borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
                    }}
                    onPress={() => setActiveTab('roster')}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(212, 175, 55, 0.05)', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', letterSpacing: 3, fontSize: 13 }}>RETURN TO ROSTER</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const CommsTab = () => {
        const [messages, setMessages] = useState([]);
        const [inputText, setInputText] = useState('');
        const [sending, setSending] = useState(false);
        const scrollViewRef = useRef();

        const fetchMessages = async () => {
            if (!team?.id) return;
            try {
                const res = await api.get(`/teams/${team.id}/messages`);
                setMessages(res.data);
            } catch (err) { console.log(err.message); }
        };

        useEffect(() => {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }, [team?.id]);

        const sendMessage = async () => {
            if (!inputText.trim() || !socketRef.current) return;

            socketRef.current.emit('send_message', {
                teamId: team.id,
                content: inputText.trim()
            });

            setInputText('');
        };

        useEffect(() => {
            if (!socketRef.current) return;

            const handleNewMessage = (msg) => {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            };

            socketRef.current.on('new_message', handleNewMessage);
            return () => {
                socketRef.current.off('new_message', handleNewMessage);
            };
        }, [socketRef.current]);

        return (
            <View style={{ marginTop: 10 }}>
                {/* Tactical Header */}
                <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Zap color={COLORS.primary} size={18} />
                        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Outfit_800Bold', letterSpacing: 2, fontStyle: 'italic' }}>
                            SECURE <Text style={{ color: COLORS.primary }}>COMM-LINK</Text>
                        </Text>
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: socketConnected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: socketConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 68, 68, 0.2)'
                    }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: socketConnected ? '#4CAF50' : '#FF4444' }} />
                        <Text style={{ color: socketConnected ? '#4CAF50' : '#FF4444', fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>
                            {socketConnected ? 'LINK ENCRYPTED' : 'LINK INTERRUPTED'}
                        </Text>
                    </View>
                </View>

                {/* Chat Window */}
                <View style={[styles.glassCard, {
                    height: 450,
                    padding: 0,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(10, 10, 12, 0.8)',
                    borderColor: 'rgba(212, 175, 55, 0.15)',
                    borderWidth: 1,
                    borderRadius: 24
                }]}>
                    {/* Background Grid Pattern Overlay (Simulated with components) */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 }}>
                        {[...Array(20)].map((_, i) => (
                            <View key={i} style={{ height: 1, backgroundColor: '#fff', marginBottom: 24 }} />
                        ))}
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        contentContainerStyle={{ padding: 20 }}
                        nestedScrollEnabled={true}
                    >
                        {messages.length === 0 ? (
                            <View style={{ flex: 1, alignItems: 'center', marginTop: 180 }}>
                                <MessageSquare color={COLORS.primary} size={32} style={{ opacity: 0.2, marginBottom: 16 }} />
                                <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 3, opacity: 0.4 }}>CHANNELS CLEAR. AWAITING TRANSMISSIONS.</Text>
                            </View>
                        ) : messages.map((msg, idx) => {
                            const isMe = msg.user_id === user.id;
                            const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();

                            return (
                                <View key={msg.id} style={{ marginBottom: 20, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                    {showDate && (
                                        <View style={{ alignSelf: 'center', marginVertical: 12, opacity: 0.4 }}>
                                            <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>
                                                --- BROADCAST DATE: {new Date(msg.created_at).toLocaleDateString()} ---
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                        {!isMe && (
                                            <View style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 10,
                                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderWidth: 1,
                                                borderColor: 'rgba(212, 175, 55, 0.2)'
                                            }}>
                                                <User color={COLORS.primary} size={14} />
                                            </View>
                                        )}
                                        <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                            {!isMe && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, marginLeft: 4 }}>
                                                    <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_800Bold', letterSpacing: 0.5 }}>{msg.ff_ign}</Text>
                                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'Outfit_400Regular' }}>SQUAD MEMBER</Text>
                                                </View>
                                            )}
                                            <View style={{
                                                maxWidth: '85%',
                                                padding: 14,
                                                borderRadius: 18,
                                                borderTopLeftRadius: isMe ? 18 : 0,
                                                borderTopRightRadius: isMe ? 0 : 18,
                                                backgroundColor: isMe ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                borderWidth: 1,
                                                borderColor: isMe ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                                                elevation: 2,
                                                shadowColor: isMe ? COLORS.primary : '#000',
                                                shadowOpacity: 0.1,
                                                shadowRadius: 10
                                            }}>
                                                <Text style={{
                                                    color: isMe ? '#fff' : 'rgba(255, 255, 255, 0.9)',
                                                    fontSize: 14,
                                                    fontFamily: 'Outfit_400Regular',
                                                    lineHeight: 22,
                                                    letterSpacing: 0.3
                                                }}>
                                                    {msg.content}
                                                </Text>
                                            </View>
                                            <Text style={{
                                                color: 'rgba(255, 255, 255, 0.2)',
                                                fontSize: 8,
                                                fontFamily: 'Outfit_700Bold',
                                                marginTop: 6,
                                                letterSpacing: 1
                                            }}>
                                                [{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] SYNC_COMPLETE
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Input Area */}
                <View style={{
                    marginTop: 20,
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    padding: 8,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)'
                }}>
                    <View style={{
                        flex: 1,
                        height: 52,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: 18,
                        paddingHorizontal: 16,
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(212, 175, 55, 0.05)'
                    }}>
                        <TextInput
                            style={{ color: '#fff', fontSize: 13, fontFamily: 'Outfit_400Regular' }}
                            placeholder="INITIALIZE TRANSMISSION..."
                            placeholderTextColor="rgba(255, 255, 255, 0.15)"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={sendMessage}
                        />
                    </View>
                    <TouchableOpacity
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 18,
                            backgroundColor: COLORS.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: (socketConnected && inputText.trim()) ? 1 : 0.4,
                            transform: [{ scale: 1 }]
                        }}
                        onPress={sendMessage}
                        disabled={!socketConnected || !inputText.trim()}
                    >
                        <Send color="#000" size={20} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={{
                        marginTop: 32,
                        marginBottom: 100,
                        height: 50,
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)'
                    }}
                    onPress={() => setActiveTab('roster')}
                >
                    <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'Outfit_700Bold', letterSpacing: 2, fontSize: 11 }}>TERMINATE SECURE LINK</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <LinearGradient colors={COLORS.bg} style={styles.container}>
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={COLORS.primary} />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sectionTitle, { marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }]}>SQUAD COMMAND</Text>

                    {!team ? (
                        <View style={{ marginTop: 24 }}>
                            <View style={[styles.glassCard, { padding: 32, alignItems: 'center', marginBottom: 32 }]}>
                                <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={[styles.statIconGlow, { width: 64, height: 64, borderRadius: 32, marginBottom: 20 }]}>
                                    <Users color="#000" size={32} />
                                </LinearGradient>
                                <Text style={[styles.appName, { fontSize: 28, marginBottom: 12, letterSpacing: 4 }]}>UNIDENTIFIED</Text>
                                <Text style={[styles.emptyText, { textAlign: 'center', lineHeight: 22 }]}>
                                    Operative status: <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold' }}>SOLO</Text>{"\n"}
                                    Initialize a new squad profile or join an existing unit to enter the arena.
                                </Text>
                            </View>

                            {/* Tab Switcher for Create/Join */}
                            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 6, marginBottom: 32 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: activeTab === 'create' ? 'rgba(212,175,55,0.15)' : 'transparent' }}
                                    onPress={() => setActiveTab('create')}
                                >
                                    <Text style={{ color: activeTab === 'create' ? COLORS.primary : COLORS.textDim, fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 1 }}>INITIALIZE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: activeTab === 'join' ? 'rgba(212,175,55,0.15)' : 'transparent' }}
                                    onPress={() => setActiveTab('join')}
                                >
                                    <Text style={{ color: activeTab === 'join' ? COLORS.primary : COLORS.textDim, fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 1 }}>ENLIST</Text>
                                </TouchableOpacity>
                            </View>

                            {activeTab === 'create' ? (
                                <View>
                                    <Text style={styles.label}>SQUAD DESIGNATION</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Unit Name (e.g. ALPHA SQUAD)"
                                            placeholderTextColor="#444"
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>
                                    <Text style={[styles.label, { marginTop: 16 }]}>PAYMENT & CONTACT</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Leader UPI ID (e.g. user@okhdfc)"
                                            placeholderTextColor="#444"
                                            value={upiId}
                                            onChangeText={setUpiId}
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, { marginTop: 16 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Mobile Number (e.g. 9876543210)"
                                            placeholderTextColor="#444"
                                            value={mobileNumber}
                                            onChangeText={setMobileNumber}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateTeam} disabled={creating}>
                                        <LinearGradient colors={[COLORS.primary, '#997B2A']} style={styles.btnGradient}>
                                            <Text style={[styles.btnText, { color: '#000' }]}>INITIALIZE UNIT</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <Text style={styles.label}>TACTICAL INVITE CODE</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[styles.input, { letterSpacing: 4, textAlign: 'center' }]}
                                            placeholder="A1B2C3D4"
                                            placeholderTextColor="#444"
                                            value={inviteCode}
                                            onChangeText={setInviteCode}
                                            autoCapitalize="characters"
                                            maxLength={8}
                                        />
                                    </View>
                                    <TouchableOpacity style={[styles.primaryBtn, { borderStyle: 'solid', borderWidth: 1, borderColor: COLORS.primary, backgroundColor: 'transparent' }]} onPress={handleJoinTeam}>
                                        <Text style={[styles.btnText, { color: COLORS.primary }]}>SECURE ENLISTMENT</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ marginTop: 24, padding: 20, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.05)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}
                                        onPress={onOpenRecruitment}
                                    >
                                        <Search color={COLORS.primary} size={20} />
                                        <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', letterSpacing: 2, fontSize: 13 }}>OPEN RECRUITMENT BOARD</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={{ marginTop: 24 }}>
                            {activeTab === 'analytics' ? renderAnalytics() :
                                activeTab === 'comms' ? <CommsTab /> : (
                                    <>
                                        {/* Unit Command Card */}
                                        <View style={[styles.glassCard, { padding: 0, overflow: 'hidden', borderRadius: 32, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
                                            <LinearGradient
                                                colors={['rgba(212, 175, 55, 0.12)', 'transparent']}
                                                style={{ padding: 24 }}
                                            >
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.label, { fontSize: 10, letterSpacing: 3 }]}>UNIT COMMAND</Text>
                                                        <Text style={[styles.detailTitle, { fontSize: 32, marginTop: 8, marginBottom: 4, color: '#fff' }]}>{team.name}</Text>
                                                        <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 12 }}>ID: {team.id}</Text>

                                                        {(team.members?.find(m => m.id === user.id)?.role === 'leader') && (
                                                            <TouchableOpacity
                                                                onPress={() => setShowEditModal(true)}
                                                                style={{
                                                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                                                    backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 10, paddingVertical: 5,
                                                                    borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12,
                                                                    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
                                                                }}
                                                            >
                                                                <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>EDIT PROTOCOLS</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                    <LinearGradient
                                                        colors={[COLORS.primary, '#997B2A']}
                                                        style={{ width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowRadius: 10, shadowOpacity: 0.3, elevation: 5 }}
                                                    >
                                                        <Crown color="#000" size={28} />
                                                    </LinearGradient>
                                                </View>

                                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                                    <View style={{
                                                        backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8,
                                                        borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
                                                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
                                                    }}>
                                                        <Lock color={COLORS.primary} size={14} />
                                                        <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 1 }}>{team.invite_code}</Text>
                                                    </View>
                                                    <View style={{
                                                        backgroundColor: 'rgba(212, 175, 55, 0.05)', paddingHorizontal: 12, paddingVertical: 8,
                                                        borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
                                                        borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)'
                                                    }}>
                                                        <Users color={COLORS.primary} size={14} />
                                                        <Text style={{ color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 11 }}>{team.members?.length} / 5 CAPACITY</Text>
                                                    </View>
                                                </View>
                                            </LinearGradient>
                                            <View style={{ height: 1, backgroundColor: 'rgba(212, 175, 55, 0.1)' }} />
                                        </View>

                                        <Text style={[styles.sectionTitle, { marginTop: 44, marginBottom: 24, fontSize: 18, letterSpacing: 4 }]}>ROSTER PROTOCOL</Text>

                                        {team.members?.map((member, idx) => (
                                            <View key={idx} style={{
                                                backgroundColor: 'rgba(255,255,255,0.03)',
                                                borderRadius: 24,
                                                marginBottom: 16,
                                                padding: 16,
                                                borderWidth: 1,
                                                borderColor: member.role === 'leader' ? 'rgba(212,175,55,0.3)' : 'rgba(255, 255, 255, 0.05)',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {/* HUD Accent for Leader */}
                                                {member.role === 'leader' && (
                                                    <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 2, borderRightWidth: 2, borderColor: COLORS.primary, opacity: 0.5 }} />
                                                )}

                                                <View style={{ position: 'relative' }}>
                                                    <LinearGradient
                                                        colors={member.role === 'leader' ? [COLORS.primary, 'transparent'] : ['rgba(255,255,255,0.2)', 'transparent']}
                                                        style={{ width: 64, height: 64, borderRadius: 32, padding: 2 }}
                                                    >
                                                        <View style={{ flex: 1, backgroundColor: '#0f0f11', borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                                            <User color={member.role === 'leader' ? COLORS.primary : '#888'} size={28} />
                                                        </View>
                                                    </LinearGradient>
                                                    {member.role === 'leader' && (
                                                        <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.primary, borderRadius: 12, padding: 5, borderWidth: 3, borderColor: '#141416' }}>
                                                            <Crown color="#000" size={12} fill="#000" />
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={{ flex: 1, marginLeft: 20 }}>
                                                    <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>{member.ff_ign?.toUpperCase()}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                                                        <View style={{ backgroundColor: member.role === 'leader' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                                            <Text style={{ color: member.role === 'leader' ? COLORS.primary : COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 2 }}>{member.role.toUpperCase()}</Text>
                                                        </View>
                                                        <Text style={{ color: 'rgba(255,255,255,0.1)' }}>|</Text>
                                                        <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_600SemiBold' }}>READY FOR DEPLOYMENT</Text>
                                                    </View>
                                                </View>

                                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                                        <Text style={{ color: COLORS.textDim, fontSize: 13, fontFamily: 'Outfit_700Bold' }}>{idx + 1}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}

                                        <Text style={[styles.sectionTitle, { marginTop: 44, marginBottom: 24, fontSize: 18, letterSpacing: 4 }]}>OPERATIONAL HISTORY</Text>

                                        {!performance?.match_history || performance.match_history.length === 0 ? (
                                            <View style={[styles.glassCard, { padding: 32, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                                                <Text style={{ color: COLORS.textDim, fontFamily: 'Outfit_500Medium', letterSpacing: 1 }}>NO MISSION DATA LOGGED IN SYSTEM.</Text>
                                            </View>
                                        ) : (
                                            performance.match_history.map((match, idx) => (
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
                                                            <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Outfit_700Bold' }} numberOfLines={1}>{match.tournament_title?.toUpperCase() || 'UNKNOWN OP'}</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                    <MapPin size={10} color={COLORS.textDim} />
                                                                    <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_600SemiBold' }}>{match.map_name?.toUpperCase() || 'BERMUDA'}</Text>
                                                                </View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                    <Calendar size={10} color={COLORS.textDim} />
                                                                    <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_600SemiBold' }}>{new Date(match.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                                                                </View>
                                                            </View>
                                                        </View>

                                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                                            <View style={{ alignItems: 'center' }}>
                                                                <Text style={{ color: COLORS.primary, fontSize: 16, fontFamily: 'Outfit_700Bold' }}>#{match.placement}</Text>
                                                                <Text style={{ color: COLORS.textDim, fontSize: 7, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1 }}>RANK</Text>
                                                            </View>
                                                            <View style={{ alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.05)', paddingLeft: 12 }}>
                                                                <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Outfit_700Bold' }}>{match.kills}</Text>
                                                                <Text style={{ color: COLORS.textDim, fontSize: 7, fontFamily: 'Outfit_800ExtraBold', letterSpacing: 1 }}>KILLS</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            ))
                                        )}

                                        <TouchableOpacity
                                            style={{ marginTop: 32, marginBottom: 16 }}
                                            onPress={() => setActiveTab('analytics')}
                                        >
                                            <LinearGradient
                                                colors={[COLORS.primary, '#997B2A']}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                style={{ height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowRadius: 15, shadowOpacity: 0.2, elevation: 8 }}
                                            >
                                                <BarChart3 color="#000" size={20} style={{ marginRight: 12 }} />
                                                <Text style={{ color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 15, letterSpacing: 2 }}>UNIT TACTICAL ANALYSIS</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ marginBottom: 40 }}
                                            onPress={() => setActiveTab('comms')}
                                        >
                                            <View
                                                style={{ height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 1, borderColor: COLORS.primary }}
                                            >
                                                <TrendingUp color={COLORS.primary} size={20} style={{ marginRight: 12 }} />
                                                <Text style={{ color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 15, letterSpacing: 2 }}>SECURE COMM-LINK</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ marginBottom: 40 }}
                                            onPress={onOpenRecruitment}
                                        >
                                            <View
                                                style={{ height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                            >
                                                <Search color="#fff" size={20} style={{ marginRight: 12 }} />
                                                <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 15, letterSpacing: 2 }}>SQUAD DISCOVERY</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Destruction Protocol */}
                                        <TouchableOpacity
                                            style={{ marginBottom: 120, alignItems: 'center' }}
                                            onPress={team.leader_id === user?.id ? handleDeleteTeam : handleLeaveTeam}
                                        >
                                            <Text style={{ color: '#661111', fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 3 }}>
                                                {team.leader_id === user?.id ? 'INITIATE DISBAND PROTOCOL' : 'LEAVE UNIT LOG'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Edit Squad Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showEditModal}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
                    <View style={[styles.glassCard, { backgroundColor: '#141416', borderWidth: 1, borderColor: COLORS.primary }]}>
                        <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 20 }]}>UPDATE PROTOCOLS</Text>

                        <Text style={styles.label}>SQUAD DESIGNATION</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Unit Name"
                                placeholderTextColor="#444"
                                value={editName}
                                onChangeText={setEditName}
                            />
                        </View>

                        <Text style={[styles.label, { marginTop: 16 }]}>PAYMENT & CONTACT</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Leader UPI ID"
                                placeholderTextColor="#444"
                                value={editUpi}
                                onChangeText={setEditUpi}
                            />
                        </View>
                        <View style={[styles.inputContainer, { marginTop: 16 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Mobile Number"
                                placeholderTextColor="#444"
                                value={editMobile}
                                onChangeText={setEditMobile}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <TouchableOpacity style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }} onPress={() => setShowEditModal(false)}>
                                <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }} onPress={handleUpdateTeam}>
                                <LinearGradient colors={[COLORS.primary, '#997B2A']} style={{ padding: 16, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                    <Text style={{ color: '#000', fontFamily: 'Outfit_700Bold' }}>CONFIRM UPDATE</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <TacticalModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalVisible(false)}
            />
        </LinearGradient>
    );
};

export default SquadsScreen;
