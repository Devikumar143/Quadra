import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    Shield,
    Zap,
    Target,
    TrendingUp,
    Activity,
    BarChart3,
    Trophy,
    RefreshCw
} from 'lucide-react';

const CommandAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, perfRes] = await Promise.all([
                api.get('/analytics/global'),
                api.get('/analytics/tournaments')
            ]);
            setStats(statsRes.data);
            setPerformance(perfRes.data);
            setError(null);
        } catch (err) {
            setError('Intelligence retrieval failed: Access Denied or Network Error.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
            <RefreshCw className="animate-spin" style={{ color: 'var(--primary)', width: '32px', height: '32px', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '4px' }}>DECRYPTING COMMAND DATA...</p>
        </div>
    );

    if (error) return (
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(255, 68, 68, 0.2)', backgroundColor: 'rgba(255, 68, 68, 0.05)', textAlign: 'center' }}>
            <p style={{ color: '#ff4444', fontFamily: 'monospace' }}>{error}</p>
        </div>
    );

    // If stats is still null after loading (null-safety)
    if (!stats) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px', fontStyle: 'italic' }}>HIGH-COMMAND ANALYTICS</h1>
                    <p style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px' }}>REAL-TIME ARENA INTELLIGENCE OVERRIDE</p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn-glass"
                    style={{ padding: '10px' }}>
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Global Metrics Grid */}
            <div className="stat-grid">
                {[
                    { label: 'OPERATIVES', value: stats.operatives, icon: Users, color: '#52aaff' },
                    { label: 'SQUADRONS', value: stats.squads, icon: Shield, color: 'var(--primary)' },
                    { label: 'MISSIONS', value: stats.missions, icon: Zap, color: '#a855f7' },
                    { label: 'AVG LETHALITY', value: stats.avgKD || '0.00', icon: Target, color: '#ff5252' }
                ].map((item, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.1 }}>
                            <item.icon size={48} color={item.color} />
                        </div>
                        <p style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '3px', marginBottom: '12px' }}>{item.label}</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: 0 }}>{item.value}</p>
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={12} color="var(--primary)" />
                            <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>LIVE FEED ACTIVE</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                {/* Tournament Engagement */}
                <div className="glass-panel" style={{ padding: '32px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <Trophy color="var(--primary)" size={24} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>MISSION ENGAGEMENT</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {performance.map((tp, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '12px', fontStyle: 'italic' }}>{tp.title?.toUpperCase()}</span>
                                    <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '11px' }}>{tp.registrations} SQUADS</span>
                                </div>
                                <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                                            width: `${Math.min((tp.registrations / 12) * 100, 100)}%`,
                                            transition: 'width 1s ease-out'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Engagement Metrics */}
                <div className="glass-panel" style={{ padding: '32px', background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <BarChart3 color="var(--primary)" size={24} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>TOTAL LETHALITY</h2>
                    </div>

                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <p style={{ fontSize: '3.5rem', fontWeight: '900', color: '#fff', fontStyle: 'italic', letterSpacing: '-2px' }}>{stats.totalKills?.toLocaleString() || 0}</p>
                        <p style={{ color: 'var(--primary)', opacity: 0.5, fontFamily: 'monospace', fontSize: '9px', letterSpacing: '4px', marginTop: '16px' }}>CONFIRMED ELIMINATIONS</p>
                    </div>

                    <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace' }}>
                            <span style={{ color: 'var(--text-dim)' }}>SYSTEM STATUS:</span>
                            <span style={{ color: '#4CAF50' }}>OPERATIONAL</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace' }}>
                            <span style={{ color: 'var(--text-dim)' }}>DATA SYNC:</span>
                            <span style={{ color: 'var(--primary)' }}>OPTIMAL</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandAnalytics;
