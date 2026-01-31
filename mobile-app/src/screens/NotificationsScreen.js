import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Calendar, Trophy, User, MessageCircle, AlertTriangle, ChevronLeft, ShieldAlert, Cpu, Activity } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import api from '../services/api';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const NotificationsScreen = ({ styles, onBack }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/users/notifications');
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setNotifications(res.data);
        } catch (err) {
            console.error('Fetch notifications error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'match': return <Calendar color={COLORS.primary} size={20} />;
            case 'achievement': return <Trophy color="#FFD700" size={20} />;
            case 'system': return <AlertTriangle color="#FF4444" size={20} />;
            case 'social': return <User color="#44AAFF" size={20} />;
            default: return <Bell color={COLORS.primary} size={20} />;
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/users/notifications/read');
            fetchNotifications();
        } catch (err) {
            console.error('Mark read error:', err.message);
        }
    };

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            {/* Tactical Grid Overlay */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 }}>
                <View style={{ height: '100%', width: '100%', borderLeftWidth: 1, borderTopWidth: 1, borderColor: COLORS.primary }} />
            </View>

            <SafeAreaView style={{ flex: 1, paddingTop: 40 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 25 }}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={{
                            width: 40, height: 40, borderRadius: 12,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            justifyContent: 'center', alignItems: 'center',
                            borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
                        }}
                    >
                        <ChevronLeft color={COLORS.primary} size={24} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 2, marginLeft: 0 }]}>COMMAND LOG</Text>
                        <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_600SemiBold', letterSpacing: 2 }}>TACTICAL FEED :: 01-ALPHA</Text>
                    </View>
                    {notifications.some(n => !n.is_read) && (
                        <TouchableOpacity
                            onPress={markAllRead}
                            style={{
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                paddingHorizontal: 12, paddingVertical: 6,
                                borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
                            }}
                        >
                            <Text style={{ color: COLORS.primary, fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>WIPE BADGES</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {loading && !refreshing ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', marginTop: 15, letterSpacing: 2 }}>INITIALIZING HANDSHAKE...</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150, paddingTop: 0 }]}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                        }
                    >
                        {notifications.length === 0 ? (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                                <View style={{
                                    width: 100, height: 100, borderRadius: 50,
                                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                                    justifyContent: 'center', alignItems: 'center',
                                    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)',
                                    marginBottom: 24
                                }}>
                                    <Cpu color={COLORS.textDim} size={40} opacity={0.3} />
                                    <Activity color={COLORS.primary} size={20} style={{ position: 'absolute' }} />
                                </View>
                                <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, marginBottom: 8 }}>NO ACTIVE INTEL</Text>
                                <Text style={{ color: COLORS.textDim, fontFamily: 'Outfit_400Regular', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 }}>
                                    All tactical channels are clear. No operational updates recorded in the log.
                                </Text>
                            </View>
                        ) : (
                            notifications.map((notif) => (
                                <TouchableOpacity
                                    key={notif.id}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.glassCard,
                                        {
                                            marginBottom: 16,
                                            padding: 0,
                                            overflow: 'hidden',
                                            borderWidth: 1,
                                            borderColor: notif.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(212, 175, 55, 0.3)',
                                            backgroundColor: notif.is_read ? 'rgba(20, 20, 22, 0.4)' : 'rgba(212, 175, 55, 0.05)'
                                        }
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', padding: 16 }}>
                                        <View style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            backgroundColor: notif.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(212, 175, 55, 0.1)',
                                            justifyContent: 'center', alignItems: 'center', marginRight: 15,
                                            borderWidth: 1, borderColor: notif.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(212, 175, 55, 0.2)'
                                        }}>
                                            {getIcon(notif.type || 'system')}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <View style={{
                                                        width: 6, height: 6, borderRadius: 3,
                                                        backgroundColor: notif.is_read ? COLORS.textDim : COLORS.primary,
                                                        marginRight: 8
                                                    }} />
                                                    <Text style={{
                                                        color: notif.is_read ? COLORS.textDim : COLORS.primary,
                                                        fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1.5
                                                    }}>
                                                        {notif.type?.toUpperCase() || 'MESSAGE'}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_400Regular' }}>
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            <Text style={{
                                                color: notif.is_read ? 'rgba(255,255,255,0.6)' : '#fff',
                                                fontSize: 14, fontFamily: 'Outfit_500Medium', lineHeight: 20
                                            }}>
                                                {notif.message}
                                            </Text>
                                        </View>
                                    </View>

                                    {!notif.is_read && (
                                        <LinearGradient
                                            colors={[COLORS.primary, 'transparent']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{ height: 1, opacity: 0.3 }}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default NotificationsScreen;
