import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, Instagram, MessageSquare, Save, X, Camera } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { GlassCircle } from '../components/Shared';
import api from '../services/api';

const EditProfileScreen = ({ user, onSave, onCancel, styles: globalStyles }) => {
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [ffIgn, setFfIgn] = useState(user?.ff_ign || '');
    const [ffUid, setFfUid] = useState(user?.ff_uid || '');
    const [bio, setBio] = useState(user?.profile?.bio || '');
    const [discord, setDiscord] = useState(user?.profile?.social_links?.discord || '');
    const [instagram, setInstagram] = useState(user?.profile?.social_links?.instagram || '');
    const [combatRole, setCombatRole] = useState(user?.combat_role || 'Operative');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Required Intel", "Identity field (Name) cannot be blank.");
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/me/profile', {
                full_name: fullName,
                bio: bio,
                combat_role: combatRole,
                social_links: { discord, instagram }
            });
            Alert.alert("Success", "Combatant profile updated.");
            onSave();
        } catch (err) {
            Alert.alert("Update Failed", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={COLORS.bg} style={globalStyles.container}>
            <GlassCircle size={400} color={COLORS.primary} top={-150} left={-100} opacity={0.08} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.header, { paddingHorizontal: 16 }]}>
                    <TouchableOpacity onPress={onCancel} style={{ width: 40 }}>
                        <X color={COLORS.textDim} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center' }]}>EDIT PROFILE</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading} style={{ width: 40, alignItems: 'flex-end' }}>
                        {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Save color={COLORS.primary} size={24} />}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={globalStyles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarGlow}>
                            <View style={styles.avatarCircle}>
                                <User color="#fff" size={48} />
                                <TouchableOpacity style={styles.cameraBtn}>
                                    <Camera color="#000" size={16} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={styles.avatarHint}>AVATAR SYNC PENDING</Text>
                    </View>

                    <View style={globalStyles.glassCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={styles.sectionLabel}>IDENTITY</Text>
                            <Shield color={COLORS.primary} size={14} />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>OPERATIVE NAME</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter full name"
                                placeholderTextColor="#444"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={styles.label}>COMBAT IGN</Text>
                                <Text style={{ color: COLORS.primary, fontSize: 8, fontFamily: 'Outfit_700Bold' }}>LOCKED</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { opacity: 0.6, backgroundColor: 'rgba(255,255,255,0.01)' }]}
                                value={ffIgn}
                                editable={false}
                                placeholder="In-game Name"
                                placeholderTextColor="#444"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={styles.label}>FREE FIRE UID</Text>
                                <Text style={{ color: COLORS.primary, fontSize: 8, fontFamily: 'Outfit_700Bold' }}>LOCKED</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { opacity: 0.6, backgroundColor: 'rgba(255,255,255,0.01)' }]}
                                value={ffUid}
                                editable={false}
                                placeholder="Free Fire UID"
                                placeholderTextColor="#444"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={[globalStyles.glassCard, { marginTop: 16 }]}>
                        <Text style={styles.sectionLabel}>BIO & INTEL</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Brief combat record or bio..."
                            placeholderTextColor="#444"
                            multiline
                        />
                    </View>

                    <View style={[globalStyles.glassCard, { marginTop: 16 }]}>
                        <Text style={styles.sectionLabel}>COMBAT ROLE</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {['Ifrit', 'Omen', 'Sniper', 'Rusher', 'Medic', 'Scout'].map(role => (
                                <TouchableOpacity
                                    key={role}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 10,
                                        backgroundColor: combatRole === role ? COLORS.primary : 'rgba(255,255,255,0.03)',
                                        borderWidth: 1,
                                        borderColor: combatRole === role ? COLORS.primary : 'rgba(212,175,55,0.1)'
                                    }}
                                    onPress={() => setCombatRole(role)}
                                >
                                    <Text style={{
                                        color: combatRole === role ? '#000' : '#fff',
                                        fontSize: 10,
                                        fontFamily: 'Outfit_700Bold',
                                        letterSpacing: 1
                                    }}>{role.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[globalStyles.glassCard, { marginTop: 16 }]}>
                        <Text style={styles.sectionLabel}>SOCIAL SYNC</Text>

                        <View style={styles.socialRow}>
                            <MessageSquare color={COLORS.primary} size={18} />
                            <TextInput
                                style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                                value={discord}
                                onChangeText={setDiscord}
                                placeholder="Discord Tag (User#0000)"
                                placeholderTextColor="#444"
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.socialRow}>
                            <Instagram color={COLORS.primary} size={18} />
                            <TextInput
                                style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                                value={instagram}
                                onChangeText={setInstagram}
                                placeholder="Instagram Handle"
                                placeholderTextColor="#444"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.btnGradient}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>COMMIT CHANGES</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerTitle: {
        color: '#fff',
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        letterSpacing: 3
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 30
    },
    avatarGlow: {
        width: 106,
        height: 106,
        borderRadius: 53,
        padding: 3,
        backgroundColor: COLORS.primary
    },
    avatarCircle: {
        flex: 1,
        backgroundColor: '#0A0A0B',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#0A0A0B'
    },
    avatarHint: {
        color: COLORS.primary,
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 1,
        marginTop: 12
    },
    sectionLabel: {
        color: COLORS.primary,
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 2,
        marginBottom: 20
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        color: COLORS.textDim,
        fontSize: 10,
        marginBottom: 10,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 1
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.1)',
        color: '#fff',
        padding: 14,
        borderRadius: 12,
        fontFamily: 'Outfit_500Medium',
        fontSize: 14
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 10
    },
    saveBtn: {
        marginTop: 30,
        marginBottom: 50
    },
    btnGradient: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    saveBtnText: {
        color: '#000',
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        letterSpacing: 2
    }
});

export default EditProfileScreen;
