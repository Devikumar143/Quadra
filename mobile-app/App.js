import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { Home, BarChart2, Users, User, Trophy, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
} from '@expo-google-fonts/outfit';

// Modular Imports
import { COLORS } from './src/constants/theme';
import { globalStyles as styles } from './src/styles/globalStyles';
import { IconButton, NotificationToast } from './src/components/Shared';
import api from './src/services/api';
import socketService from './src/services/socketService';
import { usePushNotifications } from './src/hooks/usePushNotifications';

// Screen Imports
import HomeScreen from './src/screens/HomeScreen';
import TournamentDetailScreen from './src/screens/TournamentDetailScreen';
import SquadsScreen from './src/screens/SquadsScreen';
import StatsScreen from './src/screens/StatsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LiveMatchScreen from './src/screens/LiveMatchScreen';
import TournamentStandingsScreen from './src/screens/TournamentStandingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MatchHistoryScreen from './src/screens/MatchHistoryScreen';
import RecruitmentScreen from './src/screens/RecruitmentScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
    let [fontsLoaded] = useFonts({
        Outfit_400Regular,
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold
    });

    const [screen, setScreen] = useState('login'); // 'login', 'register', 'home', 'stats', 'leaderboard', 'profile', 'editProfile', 'teams', 'detail'
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [activeToast, setActiveToast] = useState(null);
    const [appReady, setAppReady] = useState(false);

    const handleLoginSuccess = async (newToken, userData, refreshToken) => {
        try {
            await AsyncStorage.setItem('token', newToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
            console.error('Save session error:', e);
        }
        setToken(newToken);
        setUser(userData);
        setScreen('home');
        fetchFullProfile();
        socketService.connect((notif) => {
            setActiveToast(notif.message);
            fetchNotifications(); // Refresh list to get latest unread items
        });
    };

    const fetchFullProfile = async () => {
        if (!token) return;
        try {
            const res = await api.get('/auth/me');
            const updatedUser = res.data;
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error('Fetch profile error:', err.message);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setNotifications([]);
        socketService.disconnect();
        setScreen('login');
    };

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await api.get('/users/notifications');
            const unread = res.data.filter(n => !n.is_read);

            // If we have a new unread notification that we haven't toasted yet
            if (unread.length > 0 && (!notifications[0] || unread[0].id !== notifications[0].id)) {
                setActiveToast(unread[0].message);
            }
            setNotifications(res.data);
        } catch (err) {
            console.error('Fetch notifications error:', err.message);
        }
    };

    // Initial session check
    useEffect(() => {
        const checkSession = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');

                if (savedToken && savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    setToken(savedToken);
                    setUser(parsedUser);
                    setScreen('home');
                    fetchFullProfile();
                    fetchNotifications();
                    socketService.connect((notif) => {
                        setActiveToast(notif.message);
                        fetchNotifications();
                    });
                }
            } catch (err) {
                console.error('Session restore error:', err);
            } finally {
                setAppReady(true);
            }
        };
        checkSession();
    }, []);

    const { expoPushToken } = usePushNotifications();

    // Sync Push Token with Backend
    useEffect(() => {
        if (token && expoPushToken && expoPushToken.startsWith('ExponentPushToken')) {
            const syncToken = async () => {
                try {
                    await api.put('/users/me/push-token', { push_token: expoPushToken });
                    console.log("Push token synced with HQ.");
                } catch (err) {
                    console.log("Failed to sync push token:", err.message);
                }
            };
            syncToken();
        }
    }, [token, expoPushToken]);

    // Notifications handled via Real-time Uplink (Socket.io)
    // Removed legacy 30s polling

    // Safety timeout
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!fontsLoaded) {
                await SplashScreen.hideAsync();
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [fontsLoaded]);

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded && appReady) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, appReady]);

    if (!fontsLoaded || !appReady) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <StatusBar barStyle="light-content" />
            {screen === 'login' ? (
                <LoginScreen onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setScreen('register')} styles={styles} />
            ) : screen === 'register' ? (
                <RegisterScreen onSwitchToLogin={() => setScreen('login')} styles={styles} />
            ) : (
                <View style={{ flex: 1 }}>
                    <View style={{ flex: 1 }}>
                        {screen === 'home' && (
                            <HomeScreen
                                user={user}
                                onSelectTournament={(t) => {
                                    setSelectedTournament(t);
                                    setScreen('detail');
                                }}
                                onSelectNotifications={() => setScreen('notifications')}
                                onWatchLive={() => setScreen('liveMatch')}
                                styles={styles}
                            />
                        )}
                        {screen === 'detail' && (
                            <TournamentDetailScreen
                                user={user}
                                tournament={selectedTournament}
                                onBack={() => {
                                    setScreen('home');
                                    setSelectedTournament(null);
                                }}
                                styles={styles}
                            />
                        )}
                        {screen === 'stats' && <StatsScreen styles={styles} />}
                        {screen === 'leaderboard' && <LeaderboardScreen styles={styles} />}
                        {screen === 'profile' && (
                            <ProfileScreen
                                user={user}
                                onLogout={handleLogout}
                                onEdit={() => setScreen('editProfile')}
                                onViewHistory={() => setScreen('matchHistory')}
                                styles={styles}
                            />
                        )}
                        {screen === 'editProfile' && (
                            <EditProfileScreen
                                user={user}
                                onSave={() => {
                                    setScreen('profile');
                                    fetchFullProfile();
                                }}
                                onCancel={() => setScreen('profile')}
                                styles={styles}
                            />
                        )}
                        {screen === 'matchHistory' && (
                            <MatchHistoryScreen
                                onBack={() => setScreen('profile')}
                                styles={styles}
                            />
                        )}
                        {screen === 'teams' && (
                            <SquadsScreen
                                user={user}
                                token={token}
                                onOpenRecruitment={() => setScreen('recruitment')}
                                styles={styles}
                            />
                        )}
                        {screen === 'notifications' && <NotificationsScreen user={user} onBack={() => setScreen('home')} styles={styles} />}
                        {screen === 'recruitment' && (
                            <RecruitmentScreen
                                onBack={() => setScreen('teams')}
                                styles={styles}
                            />
                        )}
                        {screen === 'liveMatch' && (
                            <LiveMatchScreen
                                route={{ params: { matchId: selectedTournament?.activeMatchId || 101 } }}
                                navigation={{ goBack: () => setScreen('home') }}
                            />
                        )}
                    </View>

                    {/* Bottom Navigation */}
                    {['home', 'stats', 'leaderboard', 'teams', 'profile'].includes(screen) && (
                        <View style={styles.bottomNav}>
                            <LinearGradient colors={['rgba(20, 20, 22, 0.95)', '#141416']} style={styles.navGradient}>
                                <IconButton Icon={Home} active={screen === 'home'} onPress={() => setScreen('home')} label="Arena" />
                                <IconButton Icon={BarChart2} active={screen === 'stats'} onPress={() => setScreen('stats')} label="Stats" />
                                <IconButton Icon={Trophy} active={screen === 'leaderboard'} onPress={() => setScreen('leaderboard')} label="Global" />
                                <IconButton Icon={Users} active={screen === 'teams'} onPress={() => setScreen('teams')} label="Squads" />
                                <IconButton
                                    Icon={User}
                                    active={screen === 'profile'}
                                    onPress={() => {
                                        setScreen('profile');
                                        fetchFullProfile(); // Refresh stats when viewing profile
                                        if (notifications.some(n => !n.is_read)) {
                                            api.put('/users/notifications/read').then(() => fetchNotifications());
                                        }
                                    }}
                                    label="Profile"
                                    badgeCount={notifications.filter(n => !n.is_read).length}
                                />
                            </LinearGradient>
                        </View>
                    )}
                </View>
            )}
            {activeToast && <NotificationToast message={activeToast} onHide={() => setActiveToast(null)} />}
        </View>
    );
}
