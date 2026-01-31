import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import { Trophy, Plus, X, LayoutDashboard, Settings, Trash2 } from 'lucide-react';
import MatchManagement from './MatchManagement';

const TournamentManagement = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newTournament, setNewTournament] = useState({
        title: '',
        description: '',
        format: 'Squad',
        registration_deadline: '',
        start_date: '',
        prize_pool: '₹5,000',
        prestige_points: 500,
        map_name: 'Bermuda',
        max_teams: 12,
        sponsor_name: '',
        sponsor_logo: '',
        sponsor_message: '',
        upi_id: '',
        contact_info: '',
        scoring_params: {
            placement_points: {
                '1': 10, '2': 6, '3': 5, '4': 4, '5': 3, '6': 2, '7': 2, '8': 2, '9': 1, '10': 1, '11': 1, '12': 1
            },
            kill_points: 1
        }
    });

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/tournaments');
            setTournaments(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch tournaments error:', err);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newTournament.title || !newTournament.start_date) {
            window.alert('Strategic Error: Tournament Title and Start Date are mandatory.');
            return;
        }
        try {
            if (isEditing) {
                await api.put(`/tournaments/${editingId}`, newTournament);
                window.alert('✅ Arena Intelligence Updated');
            } else {
                await api.post('/tournaments/create', newTournament);
                window.alert('✅ Arena Successfully Deployed');
            }
            setShowModal(false);
            setIsEditing(false);
            setEditingId(null);
            fetchTournaments();
            // Reset form
            setNewTournament({
                title: '',
                description: '',
                format: 'Squad',
                registration_deadline: '',
                start_date: '',
                prize_pool: '₹5,000',
                prestige_points: 500,
                map_name: 'Bermuda',
                max_teams: 12,
                sponsor_name: '',
                sponsor_logo: '',
                sponsor_message: '',
                upi_id: '',
                contact_info: '',
                scoring_params: {
                    placement_points: {
                        '1': 10, '2': 6, '3': 5, '4': 4, '5': 3, '6': 2, '7': 2, '8': 2, '9': 1, '10': 1, '11': 1, '12': 1
                    },
                    kill_points: 1
                }
            });
        } catch (err) {
            window.alert('❌ Operation Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (e, t) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditingId(t.id);
        setNewTournament({
            title: t.title,
            description: t.description || '',
            format: t.format,
            registration_deadline: t.registration_deadline ? t.registration_deadline.substring(0, 16) : '',
            start_date: t.start_date ? t.start_date.substring(0, 16) : '',
            prize_pool: t.prize_pool || '₹5,000',
            prestige_points: t.prestige_points || 500,
            map_name: t.map_name || 'Bermuda',
            max_teams: t.max_teams || 12,
            sponsor_name: t.sponsor_name || '',
            sponsor_logo: t.sponsor_logo || '',
            sponsor_message: t.sponsor_message || '',
            upi_id: t.upi_id || '',
            contact_info: t.contact_info || '',
            scoring_params: t.scoring_params || {
                placement_points: {
                    '1': 10, '2': 6, '3': 5, '4': 4, '5': 3, '6': 2, '7': 2, '8': 2, '9': 1, '10': 1, '11': 1, '12': 1
                },
                kill_points: 1
            }
        });
        setShowModal(true);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS TOURNAMENT? THIS ACTION IS IRREVERSIBLE.")) return;

        try {
            await api.delete(`/tournaments/${id}`);
            setTournaments(tournaments.filter(t => t.id !== id));
            window.alert('Tournament Deleted Successfully');
        } catch (err) {
            window.alert('Deletion Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const updatePlacementPoints = (rank, val) => {
        setNewTournament({
            ...newTournament,
            scoring_params: {
                ...newTournament.scoring_params,
                placement_points: {
                    ...newTournament.scoring_params.placement_points,
                    [rank]: parseInt(val) || 0
                }
            }
        });
    };

    if (selectedTournament) {
        return <MatchManagement tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />;
    }

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '8px', letterSpacing: '1px' }}>COMMAND CENTER</h2>
                    <p className="text-dim">Strategic Tournament Deployment & Oversight</p>
                </div>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setEditingId(null);
                        setNewTournament({
                            title: '',
                            description: '',
                            format: 'Squad',
                            registration_deadline: '',
                            start_date: '',
                            prize_pool: '₹5,000',
                            prestige_points: 500,
                            map_name: 'Bermuda',
                            max_teams: 12,
                            upi_id: '',
                            contact_info: '',
                            scoring_params: {
                                placement_points: {
                                    '1': 10, '2': 6, '3': 5, '4': 4, '5': 3, '6': 2, '7': 2, '8': 2, '9': 1, '10': 1, '11': 1, '12': 1
                                },
                                kill_points: 1
                            }
                        });
                        setShowModal(true);
                    }}
                    className="btn-glass"
                    style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>+</span> LAUNCH NEW ARENA
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <span className="text-dim" style={{ fontSize: '0.8rem' }}>QUICK ACTION:</span>
                <button
                    className="btn-glass"
                    style={{ padding: '4px 12px', fontSize: '0.7rem' }}
                    onClick={() => {
                        setIsEditing(false);
                        setNewTournament({ ...newTournament, prize_pool: '₹10,000' });
                        setShowModal(true);
                    }}
                >SET PRIZEPOOL ₹10K</button>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="text-dim" style={{ animation: 'pulse 1.5s infinite' }}>Scanning for active protocols...</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {tournaments.map(t => (
                        <div key={t.id} className="card glass-panel tournament-item" style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '24px',
                            borderLeft: '4px solid var(--primary)',
                            cursor: 'pointer'
                        }} onClick={() => setSelectedTournament(t)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '24px' }}>🏆</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.2rem', fontWeight: '700' }}>{t.title}</h3>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <span className="text-dim" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>📅</span> {t.format}
                                        </span>
                                        <span className="text-dim" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>⚙️</span> {new Date(t.start_date).toLocaleDateString()}
                                        </span>
                                        <span className="text-dim" style={{ fontSize: '0.85rem' }}>ID: <span style={{ color: 'var(--primary)' }}>{t.id}</span></span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    display: 'inline-block', padding: '6px 16px', borderRadius: '30px',
                                    fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px',
                                    background: t.status === 'open' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                                    color: t.status === 'open' ? '#4CAF50' : 'var(--primary)',
                                    border: `1px solid ${t.status === 'open' ? 'rgba(76,175,80,0.2)' : 'rgba(212,175,55,0.2)'}`
                                }}>
                                    {t.status.toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => handleEdit(e, t)}
                                        className="btn-glass"
                                        style={{
                                            background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)',
                                            color: 'var(--primary)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer'
                                        }}
                                    >
                                        <span>⚙️</span>
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, t.id)}
                                        className="btn-glass"
                                        style={{
                                            background: 'rgba(255, 68, 68, 0.05)', border: '1px solid rgba(255, 68, 68, 0.2)',
                                            color: '#ff4444', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer'
                                        }}
                                    >
                                        <span>🗑️</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {tournaments.length === 0 && (
                        <div className="card glass-panel" style={{ textAlign: 'center', padding: '80px', borderStyle: 'dashed' }}>
                            <p className="text-dim" style={{ fontSize: '1.1rem' }}>No active arenas detected. Initialize your first operation.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="card glass-panel" style={{
                        width: '750px', padding: '0', backgroundColor: '#0D0D0F',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)'
                    }}>

                        <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 className="gradient-text" style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>{isEditing ? 'UPDATE ARENA' : 'ARENA INITIALIZATION'}</h3>
                                <p className="text-dim" style={{ fontSize: '0.8rem', marginTop: '4px' }}>{isEditing ? 'Modify strategic parameters for the active match.' : 'Configure strategic parameters for the upcoming match.'}</p>
                            </div>
                            <span style={{ cursor: 'pointer', color: 'var(--text-dim)', fontSize: '24px' }} onClick={() => { setShowModal(false); setIsEditing(false); }}>×</span>
                        </div>

                        <div style={{ padding: '40px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '20px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '10px' }}>GENERAL PROTOCOL</h4>
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ARENA TITLE</label>
                                            <input
                                                type="text"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    outline: 'none',
                                                    position: 'relative',
                                                    zIndex: 1
                                                }}
                                                placeholder="Example: Royal University Invitational"
                                                value={newTournament.title || ''}
                                                onChange={e => setNewTournament({ ...newTournament, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>OPERATIONAL SUMMARY</label>
                                            <textarea
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: '#fff',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    minHeight: '100px',
                                                    outline: 'none',
                                                    position: 'relative',
                                                    zIndex: 1
                                                }}
                                                placeholder="Detailed mission brief for the combatants..."
                                                value={newTournament.description || ''}
                                                onChange={e => setNewTournament({ ...newTournament, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '20px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '10px' }}>LOGISTICS</h4>
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>COMBAT FORMAT</label>
                                            <select
                                                style={{
                                                    width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px', padding: '12px'
                                                }}
                                                value={newTournament.format}
                                                onChange={e => setNewTournament({ ...newTournament, format: e.target.value })}
                                            >
                                                <option value="Solo">SOLO (Single operative)</option>
                                                <option value="Duo">DUO (Pairs)</option>
                                                <option value="Squad">SQUAD (Full unit)</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PRIZE POOL</label>
                                                <input
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        color: '#fff',
                                                        padding: '12px',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        outline: 'none'
                                                    }}
                                                    placeholder="₹5,000"
                                                    value={newTournament.prize_pool}
                                                    onChange={e => setNewTournament({ ...newTournament, prize_pool: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>MAX SQUADS</label>
                                                <input
                                                    type="number"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        color: '#fff',
                                                        padding: '12px',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        outline: 'none'
                                                    }}
                                                    value={newTournament.max_teams}
                                                    onChange={e => setNewTournament({ ...newTournament, max_teams: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>MAP NAME</label>
                                                <select
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px' }}
                                                    value={newTournament.map_name}
                                                    onChange={e => setNewTournament({ ...newTournament, map_name: e.target.value })}
                                                >
                                                    <option value="Bermuda">BERMUDA</option>
                                                    <option value="Purgatory">PURGATORY</option>
                                                    <option value="Kalahari">KALAHARI</option>
                                                    <option value="Alpine">ALPINE</option>
                                                    <option value="Nexterra">NEXTERRA</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PRESTIGE POINTS</label>
                                                <input
                                                    type="number"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        color: '#fff',
                                                        padding: '12px',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '12px',
                                                        outline: 'none'
                                                    }}
                                                    value={newTournament.prestige_points}
                                                    onChange={e => setNewTournament({ ...newTournament, prestige_points: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>START DATE</label>
                                            <input
                                                type="datetime-local"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    outline: 'none'
                                                }}
                                                value={newTournament.start_date}
                                                onChange={e => setNewTournament({ ...newTournament, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ENLISTMENT DEADLINE</label>
                                            <input
                                                type="datetime-local"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    outline: 'none'
                                                }}
                                                value={newTournament.registration_deadline}
                                                onChange={e => setNewTournament({ ...newTournament, registration_deadline: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '20px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '10px' }}>BRANDING & SPONSORSHIP</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SPONSOR NAME</label>
                                            <input
                                                type="text"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none' }}
                                                placeholder="e.g. Monster Energy"
                                                value={newTournament.sponsor_name || ''}
                                                onChange={e => setNewTournament({ ...newTournament, sponsor_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SPONSOR LOGO URL</label>
                                            <input
                                                type="text"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none' }}
                                                placeholder="https://link-to-logo.png"
                                                value={newTournament.sponsor_logo || ''}
                                                onChange={e => setNewTournament({ ...newTournament, sponsor_logo: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SPONSOR MESSAGE / TAGLINE</label>
                                            <input
                                                type="text"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none' }}
                                                placeholder="e.g. Powered by Innovation"
                                                value={newTournament.sponsor_message || ''}
                                                onChange={e => setNewTournament({ ...newTournament, sponsor_message: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '20px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '10px' }}>PAYMENT & CONTACT</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>UPI ID (FOR PAYMENTS)</label>
                                            <input
                                                type="text"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none' }}
                                                placeholder="e.g. tournament@upi"
                                                value={newTournament.upi_id || ''}
                                                onChange={e => setNewTournament({ ...newTournament, upi_id: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>CONTACT MOBILE NO.</label>
                                            <input
                                                type="text"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none' }}
                                                placeholder="e.g. +91 98765 43210"
                                                value={newTournament.contact_info || ''}
                                                onChange={e => setNewTournament({ ...newTournament, contact_info: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '20px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '10px' }}>SCORING PARAMS</h4>
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>KILL POINTS</label>
                                            <input
                                                type="number"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    outline: 'none'
                                                }}
                                                value={newTournament.scoring_params.kill_points}
                                                onChange={e => setNewTournament({ ...newTournament, scoring_params: { ...newTournament.scoring_params, kill_points: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>PLACEMENT REWARDS (1st - 12th)</label>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(6, 1fr)',
                                                gap: '12px'
                                            }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(rank => (
                                                    <div key={rank}>
                                                        <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--primary)', marginBottom: '4px' }}>#{rank}</div>
                                                        <input
                                                            type="number"
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px 5px',
                                                                textAlign: 'center',
                                                                background: 'rgba(255,255,255,0.03)',
                                                                fontSize: '12px',
                                                                border: '1px solid var(--glass-border)',
                                                                borderRadius: '8px',
                                                                color: '#fff',
                                                                outline: 'none'
                                                            }}
                                                            value={newTournament.scoring_params.placement_points[rank] || ''}
                                                            onChange={e => updatePlacementPoints(rank, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div style={{ padding: '32px 40px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.01)' }}>
                            <button
                                onClick={handleSave}
                                className="btn-glass"
                                style={{
                                    flex: 2, height: '56px', borderRadius: '16px',
                                    background: 'var(--primary)', color: '#000', fontWeight: '900',
                                    fontSize: '0.9rem', letterSpacing: '2px', cursor: 'pointer', border: 'none'
                                }}
                            >
                                {isEditing ? 'SYNCHRONIZE UPDATE' : 'DEPLOY ARENA'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-glass"
                                style={{
                                    flex: 1, height: '56px', borderRadius: '16px',
                                    fontSize: '0.9rem', letterSpacing: '2px'
                                }}
                            >
                                ABORT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentManagement;
