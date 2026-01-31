import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export const globalStyles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 110 },
    authContainer: { flex: 1, justifyContent: 'center', padding: 24 },
    appName: {
        fontFamily: 'Outfit_700Bold', fontSize: 52, color: COLORS.primary,
        textAlign: 'center', letterSpacing: 8, textShadowColor: 'rgba(212, 175, 55, 0.5)',
        textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 15, marginBottom: 10
    },
    welcomeText: {
        fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: COLORS.textDim,
        letterSpacing: 1.5, marginBottom: 2
    },
    welcomeTextAlt: {
        fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: COLORS.textDim,
        textAlign: 'center', letterSpacing: 4, marginBottom: 10
    },
    authCard: {
        backgroundColor: COLORS.card, borderRadius: 32,
        padding: 24, marginTop: 20, borderWidth: 1, borderColor: COLORS.border
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 16,
        marginBottom: 16, paddingHorizontal: 16, height: 62,
        borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)'
    },
    inputIcon: { marginRight: 15 },
    input: { flex: 1, color: '#fff', fontFamily: 'Outfit_400Regular', fontSize: 16 },
    primaryBtn: { height: 62, borderRadius: 18, marginTop: 12, overflow: 'hidden' },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, letterSpacing: 2 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, height: 80 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 2 },
    detailTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 32, marginTop: 20, marginBottom: 16 },
    detailMetaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(212,175,55,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    metaBadgeText: { color: COLORS.primary, fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
    descriptionText: { color: '#aaa', fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 24 },
    rankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    rankText: { color: '#888', fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1 },
    rankPoints: { color: COLORS.primary, fontFamily: 'Outfit_700Bold', fontSize: 16 },
    secondaryBtn: {
        height: 62, borderRadius: 18,
        borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
        justifyContent: 'center', alignItems: 'center'
    },
    secondaryBtnText: { color: COLORS.primary, fontFamily: 'Outfit_600SemiBold', fontSize: 14, letterSpacing: 1 },
    switchBtn: { marginTop: 26, alignItems: 'center' },
    switchText: { fontFamily: 'Outfit_400Regular', color: COLORS.textDim, fontSize: 14 },
    switchLink: { color: COLORS.primary, fontFamily: 'Outfit_600SemiBold' },
    homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 24 },
    ignHome: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: '#fff', letterSpacing: 1 },
    notifBtn: {
        width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.card,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border
    },
    tCardLeft: { flex: 1 },
    featuredCard: { height: 180, borderRadius: 24, overflow: 'hidden', marginBottom: 32 },
    featuredGradient: { flex: 1, padding: 24, justifyContent: 'flex-end' },
    tag: {
        position: 'absolute', top: 16, right: 16, backgroundColor: COLORS.primary,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8
    },
    tagText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11 },
    featuredTitle: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#fff', marginBottom: 8 },
    featuredInfo: { flexDirection: 'row', alignItems: 'center' },
    featuredDetails: { color: COLORS.primary, fontFamily: 'Outfit_600SemiBold', fontSize: 12, marginLeft: 6 },
    tournamentCard: {
        backgroundColor: COLORS.card, borderRadius: 20, padding: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, borderWidth: 1, borderColor: COLORS.border
    },
    tTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 17, marginBottom: 6 },
    tMetaRow: { flexDirection: 'row', alignItems: 'center' },
    tMetaText: { color: COLORS.textDim, fontSize: 12, fontFamily: 'Outfit_400Regular', marginLeft: 6 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: COLORS.textDim, fontFamily: 'Outfit_400Regular' },
    bottomNav: {
        position: 'absolute', bottom: 20, left: 24, right: 24,
        height: 80, borderRadius: 25, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.border, elevation: 10
    },
    navGradient: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    navItem: { alignItems: 'center' },
    navLabel: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', marginTop: 4 },
    header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
    profileGlow: { padding: 3, borderRadius: 70 },
    profileCircle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center'
    },
    ignContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
    ign: {
        fontFamily: 'Outfit_700Bold', fontSize: 34, color: '#FFFFFF',
        letterSpacing: 2, textShadowColor: COLORS.primaryGlow, textShadowRadius: 10
    },
    verifiedBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, marginTop: 14, gap: 10,
        borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
    },
    verifiedText: {
        color: COLORS.primary, fontSize: 11, fontFamily: 'Outfit_700Bold', letterSpacing: 2
    },
    glassCard: {
        backgroundColor: COLORS.card, borderRadius: 30,
        padding: 24, borderWidth: 1, borderColor: COLORS.border
    },
    identityCard: { marginBottom: 22 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    label: { color: COLORS.textDim, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2, marginBottom: 4 },
    value: { color: COLORS.text, fontSize: 17, fontFamily: 'Outfit_500Medium' },
    divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginVertical: 18 },
    statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 35 },
    statIconGlow: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    statValue: { color: '#fff', fontSize: 26, fontFamily: 'Outfit_700Bold' },
    statLabel: { color: COLORS.textDim, fontSize: 12, fontFamily: 'Outfit_400Regular' },
    statSub: { color: COLORS.textDim, fontSize: 8, fontFamily: 'Outfit_700Bold', letterSpacing: 1, marginTop: 4 },
    sectionTitle: {
        color: '#fff', fontSize: 22, fontFamily: 'Outfit_700Bold',
        marginLeft: 6, marginBottom: 22, letterSpacing: 1.5
    },
    logoutBtn: {
        alignItems: 'center', padding: 22, borderRadius: 24,
        borderWidth: 1.5, borderColor: 'rgba(212, 175, 55, 0.15)',
        marginTop: 10
    },
    logoutText: { color: '#666', fontFamily: 'Outfit_700Bold', fontSize: 12, letterSpacing: 3 },

    // Premium UI Utility Extensions
    pulseInner: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary, shadowRadius: 10, shadowOpacity: 0.8
    },
    glassCardSunken: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 24,
        padding: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.05)'
    },
    glassCardRaised: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24,
        padding: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)',
        shadowColor: COLORS.primary, shadowRadius: 20, shadowOpacity: 0.1
    },
    metaBadge: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
    },
    metaBadgeText: {
        color: COLORS.primary, fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1
    }
});
