import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, UserPlus, Search, PlusCircle, MessageSquare, ChevronLeft, Target, Shield, Crosshair, Zap } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import api from '../services/api';

const RecruitmentScreen = ({ onBack, styles }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'LFS', 'LFM'
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Create post state
    const [type, setType] = useState('LFS');
    const [description, setDescription] = useState('');
    const [rolePref, setRolePref] = useState('Vanguard');

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/recruitment/posts${filter !== 'all' ? `?type=${filter}` : ''}`);
            setPosts(res.data);
        } catch (err) {
            console.error('Fetch recruitment failed:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchPosts(); }, [filter]);

    const handleCreate = async () => {
        if (!description) return Alert.alert("ABORT", "Intel brief cannot be empty.");
        try {
            await api.post('/recruitment/posts', {
                type,
                description,
                combat_role_pref: rolePref
            });
            Alert.alert("BROADCAST SUCCESS", "Recruitment transmission initialized.");
            setShowCreate(false);
            setDescription('');
            fetchPosts();
        } catch (err) {
            Alert.alert("LINK FAILED", err.response?.data?.message || err.message);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Vanguard': return <Shield color={COLORS.primary} size={14} />;
            case 'Omen': return <Target color={COLORS.primary} size={14} />;
            case 'Ifrit': return <Zap color={COLORS.primary} size={14} />;
            case 'Sentinel': return <Crosshair color={COLORS.primary} size={14} />;
            default: return <UserPlus color={COLORS.primary} size={14} />;
        }
    };

    return (
        <LinearGradient colors={COLORS.bg} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{
                    padding: 20,
                    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <TouchableOpacity onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold', letterSpacing: 2 }}>RECRUITMENT BOARD</Text>
                    <TouchableOpacity onPress={() => setShowCreate(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary }}>
                        <PlusCircle color={COLORS.primary} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 }}>
                    {['all', 'LFM', 'LFS'].map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: filter === f ? COLORS.primary : 'rgba(255,255,255,0.05)',
                                borderWidth: 1,
                                borderColor: filter === f ? COLORS.primary : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <Text style={{ color: filter === f ? '#000' : '#fff', fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>
                                {f === 'all' ? 'GLOBAL FEED' : f === 'LFM' ? 'SQUADS HIRING' : 'OPERATIVES LFS'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading && !refreshing ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={{ color: COLORS.textDim, marginTop: 12, fontSize: 10, letterSpacing: 2 }}>DECRYPTING BROADCASTS...</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={{ flex: 1, paddingHorizontal: 20 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor={COLORS.primary} />}
                    >
                        {posts.length === 0 ? (
                            <View style={{ padding: 60, alignItems: 'center', opacity: 0.3 }}>
                                <Search color="#fff" size={40} />
                                <Text style={{ color: '#fff', marginTop: 16, textAlign: 'center', fontSize: 12, letterSpacing: 1 }}>NO ACTIVE TRANSMISSIONS IN THIS SECTOR.</Text>
                            </View>
                        ) : posts.map(post => (
                            <TouchableOpacity key={post.id} style={[styles.glassCard, { marginBottom: 16, padding: 20, borderLeftWidth: 3, borderLeftColor: post.type === 'LFM' ? COLORS.primary : '#4CAF50' }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                                            {post.type === 'LFM' ? <Users color={COLORS.primary} size={16} /> : <UserPlus color="#4CAF50" size={16} />}
                                        </View>
                                        <View>
                                            <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold' }}>{post.type === 'LFM' ? post.team_name : post.ff_ign}</Text>
                                            <Text style={{ color: COLORS.textDim, fontSize: 9 }}>{post.type === 'LFM' ? 'SQUAD RECRUITMENT' : 'OPERATIVE AVAILABLE'}</Text>
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ color: COLORS.primary, fontSize: 8, fontFamily: 'Outfit_700Bold' }}>{new Date(post.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>

                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>{post.description}</Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
                                        {getRoleIcon(post.combat_role_pref)}
                                        <Text style={{ color: COLORS.primary, fontSize: 9, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }}>{post.combat_role_pref?.toUpperCase()}</Text>
                                    </View>

                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <MessageSquare color={COLORS.primary} size={16} />
                                        <Text style={{ color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold' }}>SIGNAL INTEREST</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}

                {/* Create Post Modal Overlay (Simplified for UI flow) */}
                {showCreate && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, padding: 30, justifyContent: 'center' }}>
                        <View style={[styles.glassCard, { padding: 24, borderColor: COLORS.primary }]}>
                            <Text style={{ color: COLORS.primary, fontSize: 18, fontFamily: 'Outfit_700Bold', marginBottom: 20, textAlign: 'center', letterSpacing: 2 }}>BROADCAST INSTRUCTIONS</Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                <TouchableOpacity onPress={() => setType('LFS')} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: type === 'LFS' ? COLORS.primary : 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
                                    <Text style={{ color: type === 'LFS' ? '#000' : '#fff', fontSize: 10, fontFamily: 'Outfit_700Bold' }}>INDIVIDUAL (LFS)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setType('LFM')} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: type === 'LFM' ? COLORS.primary : 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
                                    <Text style={{ color: type === 'LFM' ? '#000' : '#fff', fontSize: 10, fontFamily: 'Outfit_700Bold' }}>SQUAD (LFM)</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 8, letterSpacing: 2 }}>MISSION BRIEF</Text>
                            <TextInput
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 13, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 }}
                                placeholder="Describe your combat style or squad requirements..."
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                multiline
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Text style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 8, letterSpacing: 2 }}>ROLE SPECIALIZATION</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                {['Vanguard', 'Omen', 'Ifrit', 'Sentinel'].map(r => (
                                    <TouchableOpacity key={r} onPress={() => setRolePref(r)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: rolePref === r ? COLORS.primary : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: rolePref === r ? COLORS.primary : 'transparent' }}>
                                        <Text style={{ color: rolePref === r ? '#000' : COLORS.textDim, fontSize: 9, fontFamily: 'Outfit_700Bold' }}>{r.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={() => setShowCreate(false)} style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Outfit_700Bold' }}>ABORT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCreate} style={{ flex: 2, padding: 16, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' }}>
                                    <Text style={{ color: '#000', fontSize: 12, fontFamily: 'Outfit_700Bold' }}>INITIALIZE BROADCAST</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default RecruitmentScreen;
