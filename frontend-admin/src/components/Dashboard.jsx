import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LayoutDashboard, Trophy, Users, Flag } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ activeArenas: 0, totalAthletes: 0, liveMatches: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tournamentsRes, usersRes] = await Promise.all([
                    api.get('/tournaments'),
                    api.get('/users/all')
                ]);

                // Count active arenas (tournaments that are open or active)
                const activeCount = tournamentsRes.data.filter(t => t.status === 'open' || t.status === 'active').length;

                setStats({
                    activeArenas: activeCount,
                    totalAthletes: usersRes.data.length,
                    liveMatches: 0 // Placeholder until match system is fully real-time
                });
            } catch (err) {
                console.error('Dashboard Stats Error:', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <LayoutDashboard color="var(--primary)" size={32} />
                <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>SYSTEM OVERVIEW</h1>
            </div>

            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                {/* Active Arenas */}
                <div className="card glass-panel stat-card" style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(212,175,55,0.2)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <span className="text-dim" style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>ACTIVE ARENAS</span>
                            <h2 className="gradient-text" style={{ fontSize: '3.5rem', margin: '8px 0', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
                                {stats.activeArenas.toString().padStart(2, '0')}
                            </h2>
                        </div>
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(212,175,55,0.1)',
                            border: '1px solid rgba(212,175,55,0.2)'
                        }}>
                            <Trophy color="var(--primary)" size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 8px #4CAF50' }}></div>
                        <span style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>OPERATIONAL</span>
                    </div>
                </div>

                {/* Total Athletes */}
                <div className="card glass-panel stat-card" style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(212,175,55,0.2)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <span className="text-dim" style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>TOTAL ATHLETES</span>
                            <h2 className="gradient-text" style={{ fontSize: '3.5rem', margin: '8px 0', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
                                {stats.totalAthletes.toString().padStart(2, '0')}
                            </h2>
                        </div>
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(212,175,55,0.1)',
                            border: '1px solid rgba(212,175,55,0.2)'
                        }}>
                            <Users color="var(--primary)" size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>REGISTERED PERSONNEL</span>
                    </div>
                </div>

                {/* Live Matches */}
                <div className="card glass-panel stat-card" style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(212,175,55,0.2)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <span className="text-dim" style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>LIVE MATCHES</span>
                            <h2 className="gradient-text" style={{ fontSize: '3.5rem', margin: '8px 0', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
                                {stats.liveMatches.toString().padStart(2, '0')}
                            </h2>
                        </div>
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(212,175,55,0.1)',
                            border: '1px solid rgba(212,175,55,0.2)'
                        }}>
                            <Flag color="var(--primary)" size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>AWAITING DEPLOYMENT</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
