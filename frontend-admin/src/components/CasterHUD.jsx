import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, Target, Users, Activity, ChevronLeft,
    Trophy, Sparkles, AlertTriangle, Timer, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CasterHUD = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState([]);

    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await api.get(`/live/${matchId}/state`);
                setData(res.data);

                // Process history for Recharts
                if (res.data.score_history) {
                    const formatted = res.data.score_history.map(entry => {
                        const obj = { time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
                        entry.scores.forEach(s => {
                            obj[s.team] = s.points;
                        });
                        return obj;
                    });
                    setHistoryData(formatted);
                }
                setLoading(false);
            } catch (err) {
                console.error("Caster HUD Fetch Error:", err);
            }
        };

        fetchState();
        const interval = setInterval(fetchState, 5000); // Poll every 5 seconds for analytics
        return () => clearInterval(interval);
    }, [matchId]);

    if (loading) return (
        <div style={{ background: '#050505', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{ border: '2px solid var(--primary)', borderTopColor: 'transparent', width: '40px', height: '40px', borderRadius: '50%' }}
            />
        </div>
    );

    const { match, current_scores, teams, analytics } = data;
    const sortedSquads = [...current_scores].sort((a, b) => b.points - a.points);
    const mvp = analytics?.mvpPrediction;

    // Chart Colors
    const colors = ['#D4AF37', '#52aaff', '#a855f7', '#ff5252', '#4CAF50', '#ff9800', '#00bcd4', '#e91e63'];

    return (
        <div style={{
            background: '#050505',
            minHeight: '100vh',
            color: '#fff',
            padding: '40px',
            fontFamily: 'Outfit, sans-serif',
            overflowX: 'hidden'
        }}>
            {/* HUD HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/matches')} className="btn-glass" style={{ padding: '10px' }}>
                        <ChevronLeft />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#ff4444', borderRadius: '50%', boxShadow: '0 0 10px #ff4444' }} />
                            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--text-dim)', fontWeight: '800' }}>LIVE // INTELLIGENCE OVERRIDE</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', margin: '4px 0', fontStyle: 'italic', fontWeight: '900' }}>
                            {match.tournament_title?.toUpperCase()}
                        </h1>
                        <span style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '2px' }}>
                            ROUND {match.round_number} • {match.map_name?.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px 40px', textAlign: 'right', borderColor: 'rgba(212,175,55,0.3)' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '10px', letterSpacing: '2px', marginBottom: '8px' }}>ROOM ID</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>{match.room_id}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '32px' }}>

                {/* LEFT COLUMN: WIN PROBABILITY & LEADERBOARD */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* WIN PROBABILITY METERS */}
                    <div className="glass-panel" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <TrendingUp color="var(--primary)" size={24} />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>WIN PROBABILITY</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {Object.entries(analytics?.winProbability || {}).slice(0, 5).map(([team, prob], i) => (
                                <div key={team}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                        <span style={{ fontWeight: '700' }}>{team.toUpperCase()}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: '900' }}>{prob}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: prob }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            style={{ height: '100%', background: `linear-gradient(90deg, ${colors[i % colors.length]}, transparent)` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIVE SQUAD RANKING */}
                    <div className="glass-panel" style={{ padding: '32px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <Shield color="var(--primary)" size={24} />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>SQUAD STANDINGS</h2>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {sortedSquads.map((s, i) => (
                                <div key={s.team} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '30px 1fr 60px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px',
                                    border: s.status === 'eliminated' ? '1px solid rgba(255,0,0,0.1)' : '1px solid transparent',
                                    opacity: s.status === 'eliminated' ? 0.4 : 1
                                }}>
                                    <span style={{ fontWeight: '900', color: i < 3 ? 'var(--primary)' : 'var(--text-dim)' }}>{i + 1}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{s.team}</span>
                                        <span style={{ fontSize: '10px', color: s.alive_count < 2 ? '#ff4444' : 'var(--text-dim)', fontWeight: '600' }}>
                                            {s.status === 'eliminated' ? 'ELIMINATED' : `${s.alive_count ?? 4}/4 OPERATIVES`}
                                        </span>
                                    </div>
                                    <span style={{ textAlign: 'right', fontWeight: '900', color: 'var(--primary)' }}>{s.points}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN: PERFORMANCE TRENDS & MVP */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* PERFORMANCE CHART */}
                    <div className="glass-panel" style={{ padding: '32px', height: '450px', background: 'radial-gradient(circle at top right, rgba(212,175,55,0.05), transparent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Activity color="var(--primary)" size={24} />
                                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>PERFORMANCE TRAJECTORY</h2>
                            </div>
                            <div className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px' }}>SQUAD POINT ACCUMULATION</div>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#0D0D0F', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                {current_scores.slice(0, 8).map((s, i) => (
                                    <Line
                                        key={s.team}
                                        type="monotone"
                                        dataKey={s.team}
                                        stroke={colors[i % colors.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#050505' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        animationDuration={1500}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

                        {/* MVP PREDICTION */}
                        <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
                                <Sparkles size={120} color="var(--primary)" />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Trophy color="var(--primary)" size={24} />
                                <h2 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, letterSpacing: '2px' }}>OPERATIVE OF THE MATCH</h2>
                            </div>

                            {mvp ? (
                                <div>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 8px 0', color: '#fff', fontStyle: 'italic' }}>
                                        {mvp.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className="glass-panel" style={{ padding: '4px 12px', fontSize: '10px', color: 'var(--primary)', fontWeight: '800' }}>
                                            {mvp.team.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '700' }}>
                                            {mvp.kills} CONFIRMED KILLS
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-dim">ANALYZING COMBAT DATA...</p>
                            )}
                        </div>

                        {/* MATCH STATS QUICK VIEW */}
                        <div className="glass-panel" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Target color="var(--primary)" size={24} />
                                <h2 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, letterSpacing: '2px' }}>ARENA STATUS</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '9px', letterSpacing: '2px', marginBottom: '8px' }}>ALIVE SQUADS</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: '#4CAF50' }}>{current_scores.filter(s => s.status !== 'eliminated').length}</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '9px', letterSpacing: '2px', marginBottom: '8px' }}>TOTAL ELIMS</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: 'var(--primary)' }}>{current_scores.reduce((sum, s) => sum + (s.kills || 0), 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CasterHUD;
