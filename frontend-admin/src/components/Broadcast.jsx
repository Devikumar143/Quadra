import React, { useState } from 'react';
import api from '../services/api';
import { ShieldAlert } from 'lucide-react';

const Broadcast = () => {
    const [targetType, setTargetType] = useState('global');
    const [targetId, setTargetId] = useState('');
    const [type, setType] = useState('system');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const handleBroadcast = async () => {
        if (!message.trim()) return alert('Message content required.');

        setLoading(true);
        try {
            await api.post('/users/broadcast', {
                targetType,
                targetId: targetId || null,
                type,
                message
            });

            setHistory([{ targetType, type, message, date: new Date() }, ...history]);
            setMessage('');
            alert('Broadcast dispatched successfully!');
        } catch (err) {
            alert('Broadcast Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <ShieldAlert color="var(--primary)" size={32} />
                <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>COMMS CENTER</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                <div>
                    <div className="card glass-panel" style={{ padding: '32px', borderLeft: '4px solid var(--primary)' }}>
                        <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '24px' }}>NEW TRANSMISSION</h3>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>TARGET AUDIENCE</label>
                                <select
                                    style={{ width: '100%', padding: '12px' }}
                                    value={targetType}
                                    onChange={e => setTargetType(e.target.value)}
                                >
                                    <option value="global">GLOBAL (All Operatives)</option>
                                    <option value="tournament">TOURNAMENT Roster</option>
                                    <option value="user">SINGLE OPERATIVE</option>
                                </select>
                            </div>

                            {targetType !== 'global' && (
                                <div>
                                    <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>TARGET ID</label>
                                    <input
                                        style={{ width: '100%' }}
                                        placeholder={targetType === 'tournament' ? "Tournament ID" : "User ID"}
                                        value={targetId}
                                        onChange={e => setTargetId(e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ALERT TYPE</label>
                                <select
                                    style={{ width: '100%', padding: '12px' }}
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="system">SYSTEM ALERT (Red)</option>
                                    <option value="match">MATCH UPDATE (Green)</option>
                                    <option value="achievement">ACHIEVEMENT (Gold)</option>
                                    <option value="social">SOCIAL (Blue)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>MESSAGE PAYLOAD</label>
                                <textarea
                                    style={{ width: '100%', minHeight: '150px', padding: '16px' }}
                                    placeholder="Enter strategic communication..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleBroadcast}
                                disabled={loading}
                                className="btn-glass"
                                style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '16px', background: 'var(--primary)', color: '#000', border: 'none' }}
                            >
                                {loading ? 'DIPLOMATIC HANDSHAKE...' : 'DISPATCH TRANSMISSION'}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>TRANSMISSION LOG</h3>
                    <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
                        {history.length === 0 ? (
                            <p className="text-dim">No recent broadcasts recorded in this session.</p>
                        ) : history.map((h, idx) => (
                            <div key={idx} className="card glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)' }}>{h.type.toUpperCase()}</span>
                                    <span className="text-dim" style={{ fontSize: '10px' }}>{h.date.toLocaleTimeString()}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>{h.message}</p>
                                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-dim)' }}>
                                    TARGET: {h.targetType.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Broadcast;
