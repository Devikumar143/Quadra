import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, ShieldCheck, Hash, Trophy, Mail, Lock } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import api from '../services/api';

const RegisterScreen = ({ onRegisterSuccess, onSwitchToLogin, styles }) => {
    const [formData, setFormData] = useState({
        full_name: '', university_id: '', ff_uid: '', ff_ign: '', email: '', password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!formData.full_name || !formData.email || !formData.password || !formData.university_id || !formData.ff_uid) {
            Alert.alert('Protocol Error', 'All mandatory data required for enlistment.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/register', formData);
            Alert.alert('Profile Initialized', 'Welcome to the royal registry.', [{ text: 'LOGIN', onPress: onSwitchToLogin }]);
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.welcomeTextAlt}>JOIN THE ELITE</Text>
                    <Text style={[styles.appName, { marginBottom: 30 }]}>ENLIST</Text>

                    <View style={styles.authCard}>
                        <View style={styles.inputContainer}>
                            <User color={COLORS.primary} size={20} style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#444" onChangeText={(v) => setFormData({ ...formData, full_name: v })} />
                        </View>
                        <View style={styles.inputContainer}>
                            <ShieldCheck color={COLORS.primary} size={20} style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="University ID" placeholderTextColor="#444" onChangeText={(v) => setFormData({ ...formData, university_id: v })} />
                        </View>
                        <View style={styles.inputContainer}>
                            <Hash color={COLORS.primary} size={20} style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Free Fire UID" placeholderTextColor="#444" onChangeText={(v) => setFormData({ ...formData, ff_uid: v })} keyboardType="numeric" />
                        </View>
                        <View style={styles.inputContainer}>
                            <Trophy color={COLORS.primary} size={20} style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Gaming IGN" placeholderTextColor="#444" onChangeText={(v) => setFormData({ ...formData, ff_ign: v })} />
                        </View>
                        <View style={styles.inputContainer}>
                            <Mail color={COLORS.primary} size={20} style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Official Email" placeholderTextColor="#444" onChangeText={(v) => setFormData({ ...formData, email: v })} autoCapitalize="none" />
                        </View>
                        <View style={styles.inputContainer}>
                            <Lock color={COLORS.primary} size={20} style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Access Key" placeholderTextColor="#444" secureTextEntry onChangeText={(v) => setFormData({ ...formData, password: v })} />
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
                            <LinearGradient colors={[COLORS.primary, '#8E6E3A']} style={styles.btnGradient}>
                                {loading ? <ActivityIndicator color="#000" /> : <Text style={[styles.btnText, { color: '#000' }]}>INITIALIZE PROFILE</Text>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onSwitchToLogin} style={styles.switchBtn}>
                            <Text style={styles.switchText}>Already an elite? <Text style={styles.switchLink}>Verify Identity</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default RegisterScreen;
