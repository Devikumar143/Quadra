import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import { X, Users } from 'lucide-react';

const MatchManagement = ({ tournament, onBack }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [newMatch, setNewMatch] = useState({
        room_id: '',
        room_password: '',
        map_name: 'Bermuda',
        round_number: 1,
        scheduled_at: '',
        status: 'scheduled'
    });
    const [activeTab, setActiveTab] = useState('matches');
    const [registrations, setRegistrations] = useState([]);

    const fetchMatches = async () => {
        try {
            const res = await api.get(`/tournaments/${tournament.id}/matches`);
            setMatches(res.data);
        } catch (err) {
            console.error('Fetch matches error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        try {
            console.log('Fetching registrations for:', tournament.id);
            const res = await api.get(`/tournaments/${tournament.id}/registrations`);
            console.log('Registration Data:', res.data);
            setRegistrations(res.data);
        } catch (err) {
            console.error('Fetch registrations error:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'matches') fetchMatches();
        if (activeTab === 'registry') fetchRegistrations();
    }, [tournament.id, activeTab]);

    const handleVerify = async (regId, status) => {
        try {
            await api.post(`/tournaments/registrations/${regId}/verify`, { status });
            setRegistrations(registrations.map(r => r.id === regId ? { ...r, status } : r));
            window.alert(`Registration ${status.toUpperCase()} successfully.`);
        } catch (err) {
            console.error(err);
            window.alert('Verification Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage) return;
        try {
            await api.post('/users/broadcast', {
                targetType: 'tournament',
                targetId: tournament.id,
                type: 'match',
                message: broadcastMessage
            });
            setShowBroadcastModal(false);
            setBroadcastMessage('');
            window.alert('Strategic Alert Dispatched to all operatives.');
        } catch (err) {
            window.alert('Broadcast Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const updateMatchStatus = async (matchId, status) => {
        try {
            await api.put(`/tournaments/matches/${matchId}/status`, { status });
            setMatches(matches.map(m => m.id === matchId ? { ...m, status } : m));
            window.alert(`Strategic Update: Match is now ${status.toUpperCase()}`);
        } catch (err) {
            window.alert('Status Update Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCreateMatch = async () => {
        try {
            const res = await api.post(`/tournaments/${tournament.id}/matches`, newMatch);
            setMatches([...matches, res.data]);
            setShowCreateModal(false);
            window.alert('Match Scheduled Successfully');
        } catch (err) {
            window.alert('Match Creation Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={onBack} className="btn-glass" style={{ padding: '10px' }}>
                    <span>BACK</span>
                </button>
                <h2 className="gradient-text" style={{ margin: 0 }}>{tournament.title} // MATCHES</h2>
            </div>



            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('matches')}
                    style={{
                        background: 'transparent', border: 'none', padding: '12px 0',
                        color: activeTab === 'matches' ? 'var(--primary)' : 'var(--text-dim)',
                        borderBottom: activeTab === 'matches' ? '2px solid var(--primary)' : 'none',
                        cursor: 'pointer', fontWeight: '700'
                    }}
                >
                    MATCH SCHEDULE
                </button>
                <button
                    onClick={() => setActiveTab('registry')}
                    style={{
                        background: 'transparent', border: 'none', padding: '12px 0',
                        color: activeTab === 'registry' ? 'var(--primary)' : 'var(--text-dim)',
                        borderBottom: activeTab === 'registry' ? '2px solid var(--primary)' : 'none',
                        cursor: 'pointer', fontWeight: '700'
                    }}
                >
                    SQUAD REGISTRY
                </button>
            </div>

            {
                activeTab === 'matches' ? (
                    // MATCHES TAB CONTENT
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 className="text-dim" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>OPERATIONAL SCHEDULE</h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowBroadcastModal(true)}
                                    className="btn-glass"
                                    style={{ padding: '12px 24px', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                                >
                                    DISPATH ALERT
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-glass"
                                    style={{ padding: '12px 24px', background: 'var(--primary)', color: '#000', border: 'none' }}
                                >
                                    SCHEDULE MATCH
                                </button>
                            </div>
                        </div>

                        {loading ? <p className="text-dim">Scanning match protocols...</p> : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {matches.length === 0 ? (
                                    <div className="card glass-panel" style={{ textAlign: 'center', padding: '40px', borderStyle: 'dashed' }}>
                                        <p className="text-dim">No matches scheduled for this arena.</p>
                                    </div>
                                ) : matches.map(m => (
                                    <div key={m.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', color: '#fff' }}>Round {m.round_number} - {m.map_name}</h4>
                                            <p className="text-dim" style={{ fontSize: '0.8rem', margin: 0 }}>
                                                ID: <span style={{ color: 'var(--primary)' }}>{m.room_id || 'PENDING'}</span> |
                                                Time: {new Date(m.scheduled_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                color: m.status === 'live' ? '#4CAF50' : m.status === 'completed' ? '#888' : 'var(--primary)',
                                                border: `1px solid ${m.status === 'live' ? 'rgba(76,175,80,0.3)' : m.status === 'completed' ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.3)'}`,
                                                padding: '4px 12px',
                                                borderRadius: '20px'
                                            }}>
                                                {m.status.toUpperCase()}
                                            </span>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {m.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => updateMatchStatus(m.id, 'live')}
                                                        className="btn-glass"
                                                        style={{ padding: '6px 12px', fontSize: '10px', color: '#4CAF50', borderColor: 'rgba(76,175,80,0.2)' }}
                                                    >
                                                        START
                                                    </button>
                                                )}
                                                {m.status === 'live' && (
                                                    <button
                                                        onClick={() => updateMatchStatus(m.id, 'completed')}
                                                        className="btn-glass"
                                                        style={{ padding: '6px 12px', fontSize: '10px', color: '#FFD700', borderColor: 'rgba(212,175,55,0.2)' }}
                                                    >
                                                        COMPLETE
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // REGISTRY TAB CONTENT
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <div style={{ padding: '8px 16px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: '8px', color: '#4CAF50', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {registrations.filter(r => r.status === 'approved').length} / {tournament.max_teams || 12} SQUADS APPROVED
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {registrations.length === 0 ? (
                                <div className="card glass-panel" style={{ textAlign: 'center', padding: '40px', borderStyle: 'dashed' }}>
                                    <p className="text-dim">No registration requests received.</p>
                                </div>
                            ) : registrations.map(r => (
                                <div key={r.id} className="card glass-panel" style={{
                                    padding: '20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: r.status === 'pending' ? '4px solid #FF9800' : r.status === 'approved' ? '4px solid #4CAF50' : '4px solid #F44336'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span>SQUAD</span>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', color: '#fff' }}>{r.team_name}</h4>
                                            <p className="text-dim" style={{ fontSize: '0.8rem', margin: 0 }}>
                                                TXN ID: <span style={{ color: '#fff', userSelect: 'all', fontFamily: 'monospace' }}>{r.transaction_id || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '12px' }}>
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </span>

                                        {r.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleVerify(r.id, 'approved')}
                                                    className="btn-glass"
                                                    style={{ padding: '8px 16px', background: 'rgba(76,175,80,0.1)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
                                                >
                                                    VERIFY
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(r.id, 'rejected')}
                                                    className="btn-glass"
                                                    style={{ padding: '8px', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)' }}
                                                >
                                                    <span style={{ fontWeight: 'bold' }}>X</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                background: r.status === 'approved' ? 'rgba(76,175,80,0.1)' : 'rgba(255,68,68,0.1)',
                                                color: r.status === 'approved' ? '#4CAF50' : '#ff4444'
                                            }}>
                                                {r.status.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {
                showCreateModal && (
                    <div className="modal-backdrop" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex',
                        justifyContent: 'center', alignItems: 'center', zIndex: 4000
                    }}>
                        <div className="card glass-panel" style={{ width: '500px', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 className="gradient-text" style={{ margin: 0 }}>SCHEDULE MATCH</h3>
                                <span style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowCreateModal(false)}>[X]</span>
                            </div>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>MAP NAME</label>
                                    <select
                                        style={{ width: '100%', padding: '12px' }}
                                        value={newMatch.map_name}
                                        onChange={e => setNewMatch({ ...newMatch, map_name: e.target.value })}
                                    >
                                        <option value="Bermuda">BERMUDA</option>
                                        <option value="Purgatory">PURGATORY</option>
                                        <option value="Kalahari">KALAHARI</option>
                                        <option value="Alpine">ALPINE</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ROOM ID</label>
                                        <input
                                            style={{ width: '100%' }}
                                            placeholder="Room ID"
                                            value={newMatch.room_id}
                                            onChange={e => setNewMatch({ ...newMatch, room_id: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
                                        <input
                                            style={{ width: '100%' }}
                                            placeholder="Password"
                                            value={newMatch.room_password}
                                            onChange={e => setNewMatch({ ...newMatch, room_password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ROUND #</label>
                                        <input
                                            type="number"
                                            style={{ width: '100%' }}
                                            value={newMatch.round_number}
                                            onChange={e => setNewMatch({ ...newMatch, round_number: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SCHEDULED AT</label>
                                        <input
                                            type="datetime-local"
                                            style={{ width: '100%' }}
                                            value={newMatch.scheduled_at}
                                            onChange={e => setNewMatch({ ...newMatch, scheduled_at: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <button onClick={handleCreateMatch} className="btn-glass" style={{ flex: 2, padding: '14px', background: 'var(--primary)', color: '#000', border: 'none' }}>DEPLOY MATCH</button>
                                <button onClick={() => setShowCreateModal(false)} className="btn-glass" style={{ flex: 1, padding: '14px' }}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showBroadcastModal && (
                    <div className="modal-backdrop" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex',
                        justifyContent: 'center', alignItems: 'center', zIndex: 4000
                    }}>
                        <div className="card glass-panel" style={{ width: '500px', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 className="gradient-text" style={{ margin: 0 }}>DISPATCH STRATEGIC ALERT</h3>
                                <span style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowBroadcastModal(false)}>[X]</span>
                            </div>
                            <p className="text-dim" style={{ fontSize: '12px', marginBottom: '20px' }}>This message will be sent to all operatives registered for this tournament.</p>
                            <div>
                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>MESSAGE CONTENT</label>
                                <textarea
                                    style={{ width: '100%', minHeight: '120px', padding: '12px' }}
                                    placeholder="Example: Room ID updated to 12345. Pass: secure."
                                    value={broadcastMessage}
                                    onChange={e => setBroadcastMessage(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <button onClick={handleBroadcast} className="btn-glass" style={{ flex: 2, padding: '14px', background: 'var(--primary)', color: '#000', border: 'none' }}>BROADCAST INTEL</button>
                                <button onClick={() => setShowBroadcastModal(false)} className="btn-glass" style={{ flex: 1, padding: '14px' }}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MatchManagement;
