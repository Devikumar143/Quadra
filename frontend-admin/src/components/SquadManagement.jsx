import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import { ShieldAlert, Users, ChevronLeft } from 'lucide-react';

const SquadManagement = () => {
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSquad, setExpandedSquad] = useState(null);

    useEffect(() => {
        fetchSquads();
    }, []);

    const fetchSquads = async () => {
        try {
            const res = await api.get('/teams/all');
            setSquads(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch Squads Error:', err);
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedSquad(expandedSquad === id ? null : id);
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <span style={{ fontSize: '32px', color: 'var(--primary)' }}>🛡️</span>
                <h1 className="gradient-text" style={{ margin: 0 }}>SQUAD REGISTRY</h1>
            </div>

            {loading ? (
                <p className="text-dim">Scanning database...</p>
            ) : squads.length === 0 ? (
                <div style={{
                    padding: '80px',
                    textAlign: 'center',
                    border: '1px dashed var(--glass-border)',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.01)'
                }}>
                    <span style={{ fontSize: '48px', opacity: 0.5, marginBottom: '20px', display: 'block' }}>👥</span>
                    <h3 style={{ color: '#fff', margin: '0 0 8px 0' }}>NO ACTIVE SQUADS</h3>
                    <p className="text-dim">The registry is currently empty. No units have been formed.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {squads.map(squad => (
                        <div key={squad.id} className="card glass-panel" style={{
                            padding: '0',
                            borderLeft: `4px solid ${expandedSquad === squad.id ? 'var(--primary)' : 'transparent'}`,
                            transition: 'all 0.3s ease'
                        }}>
                            {/* Header / Summary */}
                            <div
                                onClick={() => toggleExpand(squad.id)}
                                style={{
                                    padding: '24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: expandedSquad === squad.id ? 'rgba(212, 175, 55, 0.05)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                                            {squad.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.2rem' }}>{squad.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className="text-dim" style={{ fontSize: '10px', letterSpacing: '1px' }}>ID: {squad.id}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', letterSpacing: '1px' }}>
                                                INVITE: {squad.invite_code}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="text-dim" style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>STRENGTH</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                                            {squad.member_count} / 5
                                        </span>
                                    </div>
                                    <div style={{
                                        transform: `rotate(${expandedSquad === squad.id ? '180deg' : '0deg'})`,
                                        transition: 'transform 0.3s ease'
                                    }}>
                                        <span style={{ color: 'var(--text-dim)' }}>▼</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expansion Details */}
                            {expandedSquad === squad.id && (
                                <div style={{
                                    padding: '0 24px 24px 24px',
                                    animation: 'fadeIn 0.3s ease',
                                    borderTop: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ marginTop: '24px' }}>
                                        <h4 style={{ color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>ROSTER MANIFEST</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                            {squad.members.map(member => (
                                                <div key={member.id} style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        background: member.role === 'leader' ? 'var(--primary)' : '#4CAF50',
                                                        boxShadow: member.role === 'leader' ? '0 0 8px var(--primary)' : 'none'
                                                    }} />
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ color: '#fff', fontWeight: '600' }}>{member.ff_ign}</span>
                                                            {member.role === 'leader' && <span style={{ color: 'var(--primary)' }}>👑</span>}
                                                        </div>
                                                        <span className="text-dim" style={{ fontSize: '11px' }}>{member.role.toUpperCase()} // K/D: {(member.stats?.total_kills / Math.max(member.stats?.total_matches, 1)).toFixed(2) || '0.00'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment & Contact Info */}
                                    <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                        <h4 style={{ color: 'var(--primary)', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px', marginTop: 0 }}>OFFICIAL RECORDS</h4>
                                        <div style={{ display: 'flex', gap: '32px' }}>
                                            <div>
                                                <p className="text-dim" style={{ fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>LEADER UPI ID</p>
                                                <p style={{ color: '#fff', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                                                    {squad.upi_id || <span style={{ opacity: 0.3 }}>NOT REGISTERED</span>}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-dim" style={{ fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>CONTACT NUMBER</p>
                                                <p style={{ color: '#fff', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                                                    {squad.mobile_number || <span style={{ opacity: 0.3 }}>NOT REGISTERED</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SquadManagement;
