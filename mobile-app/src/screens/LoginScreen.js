import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { GlassCircle } from '../components/Shared';
import api from '../services/api';

const LoginScreen = ({ onLoginSuccess, onSwitchToRegister, styles }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            onLoginSuccess(response.data.token, response.data.user, response.data.refreshToken);
        } catch (err) {
            Alert.alert('Authentication Failed', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={COLORS.bg} style={styles.container}>
            <GlassCircle size={500} color={COLORS.primary} top={-250} left={-150} opacity={0.05} />
            <View style={styles.authContainer}>
                <Text style={styles.welcomeTextAlt}>ROYAL ARENA ACCESS</Text>
                <Text style={styles.appName}>QUADRA</Text>

                <View style={styles.authCard}>
                    <View style={styles.inputContainer}>
                        <Mail color={COLORS.primary} size={20} style={styles.inputIcon} />
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#444" autoCapitalize="none" />
                    </View>
                    <View style={styles.inputContainer}>
                        <Lock color={COLORS.primary} size={20} style={styles.inputIcon} />
                        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#444" />
                    </View>

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                        <LinearGradient colors={[COLORS.primary, '#997B2A']} style={styles.btnGradient}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={[styles.btnText, { color: '#000' }]}>SIGN IN</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onSwitchToRegister} style={styles.switchBtn}>
                        <Text style={styles.switchText}>New champion? <Text style={styles.switchLink}>Initiate Profile</Text></Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient >
    );
};

export default LoginScreen;
