import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, BlurView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export const GlassCircle = ({ size, color, top, left, opacity }) => (
    <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, top, left, opacity, zIndex: -1
    }} />
);

export const IconButton = ({ Icon, active, onPress, label, badgeCount }) => (
    <TouchableOpacity onPress={onPress} style={styles.navItem}>
        <View>
            <Icon color={active ? COLORS.primary : COLORS.textDim} size={24} />
            {badgeCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                </View>
            )}
        </View>
        <Text style={[styles.navLabel, { color: active ? COLORS.primary : COLORS.textDim }]}>{label}</Text>
    </TouchableOpacity>
);

export const NotificationToast = ({ message, onHide }) => {
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    React.useEffect(() => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: 20, duration: 500, useNativeDriver: true }),
            Animated.delay(4000),
            Animated.timing(slideAnim, { toValue: -100, duration: 500, useNativeDriver: true })
        ]).start(() => onHide());
    }, []);

    return (
        <Animated.View style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.toastInner}>
                <View style={styles.toastIcon}>
                    <Bell color={COLORS.primary} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.toastTitle}>TACTICAL ALERT</Text>
                    <Text style={styles.toastMsg} numberOfLines={2}>{message}</Text>
                </View>
            </View>
        </Animated.View>
    );
};

export const TacticalModal = ({ visible, title, message, onConfirm, onCancel, confirmText, cancelText, type = 'danger' }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={modalStyles.overlay}>
                <Pressable style={modalStyles.backdrop} onPress={onCancel} />
                <View style={modalStyles.container}>
                    <LinearGradient
                        colors={['rgba(30, 30, 35, 0.98)', 'rgba(20, 20, 25, 1)']}
                        style={modalStyles.content}
                    >
                        {/* Header Accent */}
                        <View style={[modalStyles.accentBar, { backgroundColor: type === 'danger' ? '#FF4444' : COLORS.primary }]} />

                        <View style={modalStyles.inner}>
                            <View style={modalStyles.iconContainer}>
                                {type === 'danger' ? (
                                    <ShieldAlert color="#FF4444" size={32} />
                                ) : (
                                    <AlertTriangle color={COLORS.primary} size={32} />
                                )}
                            </View>

                            <Text style={[modalStyles.title, { color: type === 'danger' ? '#FF4444' : COLORS.primary }]}>{title.toUpperCase()}</Text>
                            <Text style={modalStyles.message}>{message}</Text>

                            <View style={modalStyles.buttonRow}>
                                <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
                                    <Text style={modalStyles.cancelText}>{cancelText || 'ABORT'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={modalStyles.confirmBtn} onPress={onConfirm}>
                                    <LinearGradient
                                        colors={type === 'danger' ? ['#FF4444', '#991111'] : [COLORS.primary, '#997B2A']}
                                        style={modalStyles.btnGradient}
                                    >
                                        <Text style={modalStyles.confirmText}>{confirmText || 'CONFIRM'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    container: {
        width: '85%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    content: {
        padding: 2,
    },
    accentBar: {
        height: 4,
        width: '100%',
    },
    inner: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 3,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: 'Outfit_400Regular',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cancelText: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Outfit_700Bold',
        fontSize: 13,
        letterSpacing: 2,
    },
    confirmBtn: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        overflow: 'hidden',
    },
    btnGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmText: {
        color: '#000',
        fontFamily: 'Outfit_700Bold',
        fontSize: 13,
        letterSpacing: 2,
    }
});

const styles = StyleSheet.create({
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_500Medium',
        marginTop: 4,
        letterSpacing: 1,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#FF4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#141416'
    },
    badgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
    },
    toast: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        zIndex: 9999,
        backgroundColor: 'rgba(20, 20, 22, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        padding: 12,
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    toastInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toastIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toastTitle: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    toastMsg: {
        color: '#fff',
        fontSize: 12,
        marginTop: 2,
    }
});
