import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import { X } from 'lucide-react';

const COLORS = {
    primary: '#D4AF37',
    secondary: '#AA8A2E',
};

const PlayerManagement = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [messagingPlayer, setMessagingPlayer] = useState(null);
    const [directMessage, setDirectMessage] = useState('');
    const [newStats, setNewStats] = useState({
        kd_ratio: '0.00',
        win_rate: '0%',
        headshot_rate: '0%',
        avg_damage: '0',
        total_kills: 0,
        total_matches: 0,
        total_wins: 0
    });
    const [combatRole, setCombatRole] = useState('OPERATIVE');
    const [systemRole, setSystemRole] = useState('player');

    const fetchPlayers = async () => {
        try {
            const res = await api.get('/users/all');
            setPlayers(res.data);
        } catch (err) {
            console.error('Fetch players error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlayers(); }, []);

    const handleEditClick = (player) => {
        setEditingPlayer(player);
        setNewStats({
            kd_ratio: player.stats?.kd_ratio || '0.00',
            win_rate: player.stats?.win_rate || '0%',
            headshot_rate: player.stats?.headshot_rate || '0%',
            avg_damage: player.stats?.avg_damage || '0',
            total_kills: player.stats?.total_kills || 0,
            total_matches: player.stats?.total_matches || 0,
            total_wins: player.stats?.total_wins || 0
        });
        setCombatRole(player.combat_role || 'OPERATIVE');
        setSystemRole(player.role || 'player');
    };

    const handleSendMessage = async () => {
        if (!directMessage) return;
        try {
            await api.post('/users/broadcast', {
                targetType: 'user',
                targetId: messagingPlayer.id,
                type: 'social',
                message: directMessage
            });
            setMessagingPlayer(null);
            setDirectMessage('');
            window.alert('Transmission successfully beamed to operative.');
        } catch (err) {
            window.alert('Transmission Failed: ' + err.message);
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/users/${editingPlayer.id}/stats`, {
                stats: newStats,
                combat_role: combatRole,
                role: systemRole
            });
            setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, stats: newStats, combat_role: combatRole, role: systemRole } : p));
            setEditingPlayer(null);
            window.alert('Combat stats synchronized successfully.');
        } catch (err) {
            window.alert('Update Failed: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <h2 className="gradient-text" style={{ marginBottom: '32px', fontSize: '2rem' }}>GLOBAL ATHLETE REGISTRY</h2>
            {loading ? <p className="text-dim">Retrieving combatant data...</p> : (
                <div style={{ position: 'relative' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '16px', color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px' }}>OPERATIVE</th>
                                <th style={{ padding: '16px', color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px' }}>FF UID</th>
                                <th style={{ padding: '16px', color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px' }}>DESIGNATION</th>
                                <th style={{ padding: '16px', color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px' }}>K/D RATIO</th>
                                <th style={{ padding: '16px', color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '600', color: '#fff' }}>{p.ff_ign}</div>
                                        <div className="text-dim" style={{ fontSize: '0.8rem' }}>{p.full_name}</div>
                                    </td>
                                    <td style={{ padding: '16px' }} className="text-dim">{p.ff_uid}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            fontSize: '10px',
                                            background: 'rgba(212,175,55,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            color: COLORS.primary,
                                            fontWeight: '700'
                                        }}>{p.combat_role || 'OPERATIVE'}</span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                                            {p.stats?.kd_ratio || (p.total_kills ? (p.total_kills / Math.max(p.total_matches, 1)).toFixed(2) : "0.00")}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleEditClick(p)}
                                                className="btn-glass"
                                                style={{ padding: '8px 16px', fontSize: '10px' }}
                                            >
                                                STATS
                                            </button>
                                            <button
                                                onClick={() => setMessagingPlayer(p)}
                                                className="btn-glass"
                                                style={{ padding: '8px 16px', fontSize: '10px', borderColor: 'rgba(255,255,255,0.05)' }}
                                            >
                                                MESSAGE
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {editingPlayer && (
                        <div className="modal-backdrop" style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
                        }}>
                            <div className="card glass-panel" style={{ width: '450px', padding: '40px', backgroundColor: '#0A0A0B' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h3 className="gradient-text" style={{ margin: 0 }}>SYNCHRONIZE STATS</h3>
                                    <X color="var(--text-dim)" style={{ cursor: 'pointer' }} onClick={() => setEditingPlayer(null)} />
                                </div>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>K/D RATIO</label>
                                        <input
                                            style={{ width: '100%' }}
                                            value={newStats.kd_ratio} onChange={e => setNewStats({ ...newStats, kd_ratio: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>WIN RATE</label>
                                        <input
                                            style={{ width: '100%' }}
                                            value={newStats.win_rate} onChange={e => setNewStats({ ...newStats, win_rate: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>TOTAL KILLS</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%' }}
                                                value={newStats.total_kills} onChange={e => setNewStats({ ...newStats, total_kills: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>TOTAL MATCHES</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%' }}
                                                value={newStats.total_matches} onChange={e => setNewStats({ ...newStats, total_matches: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>TOTAL WINS</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%' }}
                                                value={newStats.total_wins} onChange={e => setNewStats({ ...newStats, total_wins: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>AVG DAMAGE</label>
                                        <input
                                            style={{ width: '100%' }}
                                            value={newStats.avg_damage} onChange={e => setNewStats({ ...newStats, avg_damage: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(212,175,55,0.05)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.1)' }}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>COMBAT DESIGNATION</label>
                                            <input
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)' }}
                                                value={combatRole} onChange={e => setCombatRole(e.target.value.toUpperCase())}
                                                placeholder="e.g. ELITE SNIPER"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SYSTEM ACCESS LEVEL</label>
                                            <select
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', padding: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                value={systemRole} onChange={e => setSystemRole(e.target.value)}
                                            >
                                                <option value="player">PLAYER</option>
                                                <option value="admin">ADMIN</option>
                                                <option value="moderator">MODERATOR</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                    <button
                                        onClick={handleUpdate}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '14px' }}
                                    >
                                        SYNC DATA
                                    </button>
                                    <button
                                        onClick={() => setEditingPlayer(null)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '14px' }}
                                    >
                                        ABORT
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {messagingPlayer && (
                        <div className="modal-backdrop" style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
                        }}>
                            <div className="card glass-panel" style={{ width: '450px', padding: '40px', backgroundColor: '#0A0A0B' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h3 className="gradient-text" style={{ margin: 0 }}>DIRECT TRANSMISSION</h3>
                                        <p className="text-dim" style={{ fontSize: '10px', marginTop: '4px' }}>TO: {messagingPlayer.ff_ign}</p>
                                    </div>
                                    <span style={{ cursor: 'pointer', color: 'var(--text-dim)', fontSize: '24px' }} onClick={() => setMessagingPlayer(null)}>×</span>
                                </div>

                                <div>
                                    <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>MESSAGE CONTENT</label>
                                    <textarea
                                        style={{ width: '100%', minHeight: '120px', padding: '12px' }}
                                        placeholder="Enter message for operative..."
                                        value={directMessage}
                                        onChange={e => setDirectMessage(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                    <button
                                        onClick={handleSendMessage}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '14px' }}
                                    >
                                        SEND INTEL
                                    </button>
                                    <button
                                        onClick={() => setMessagingPlayer(null)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '14px' }}
                                    >
                                        ABORT
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerManagement;
