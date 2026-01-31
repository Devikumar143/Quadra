import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertCircle, CheckCircle, XCircle, MessageSquare, ExternalLink, Shield } from 'lucide-react';

const DisputeBureau = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/disputes/all');
            setDisputes(res.data);
        } catch (err) {
            console.error('Fetch disputes error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDisputes(); }, []);

    const handleResolve = async (id, status) => {
        const admin_response = window.prompt(`Strategic Intelligence for ${status.toUpperCase()}:`);
        if (admin_response === null) return;

        try {
            await api.patch(`/disputes/${id}/resolve`, {
                status,
                admin_response
            });
            alert(`Dispute Bureau: Case ${status.toUpperCase()}`);
            fetchDisputes();
        } catch (err) {
            alert('Resolution Failure: ' + err.message);
        }
    };

    const filteredDisputes = disputes.filter(d => filter === 'all' ? true : d.status === filter);

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 className="gradient-text" style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '2px' }}>DISPUTE BUREAU</h2>
                    <p className="text-dim" style={{ marginTop: '8px', letterSpacing: '1px' }}>CONFLICT RESOLUTION & INTELLIGENCE VERIFICATION</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.1)' }}>
                    {['open', 'resolved', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="btn-glass"
                            style={{
                                padding: '10px 20px',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                border: filter === f ? '1px solid var(--primary)' : '1px solid transparent',
                                background: filter === f ? 'rgba(212,175,55,0.1)' : 'transparent'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '100px', textAlign: 'center' }}>
                    <div className="loader" style={{ marginBottom: '20px' }}></div>
                    <p className="text-dim">DECRYPTING DISPUTE LOGS...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '24px' }}>
                    {filteredDisputes.length === 0 ? (
                        <div className="card glass-panel" style={{ gridColumn: '1/-1', padding: '100px', textAlign: 'center', borderStyle: 'dashed' }}>
                            <Shield color="rgba(212,175,55,0.2)" size={64} style={{ marginBottom: '20px' }} />
                            <p className="text-dim" style={{ fontSize: '1.2rem' }}>NO ACTIVE CONFLICTS DETECTED IN SECTOR.</p>
                        </div>
                    ) : filteredDisputes.map(dispute => (
                        <div key={dispute.id} className="card glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: dispute.status === 'open' ? '#ff4444' : '#4CAF50' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                                        <AlertCircle color="var(--primary)" size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>OPERATIVE: {dispute.ff_ign}</h4>
                                        <p className="text-dim" style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>SQUAD: {dispute.team_name}</p>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '10px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px',
                                    background: dispute.status === 'open' ? 'rgba(255,68,68,0.1)' : 'rgba(76,175,80,0.1)',
                                    color: dispute.status === 'open' ? '#ff4444' : '#4CAF50',
                                    border: `1px solid ${dispute.status === 'open' ? 'rgba(255,68,68,0.2)' : 'rgba(76,175,80,0.2)'}`
                                }}>
                                    {dispute.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    <MessageSquare size={14} style={{ marginRight: '8px', verticalAlign: 'middle', opacity: 0.5 }} />
                                    {dispute.reason}
                                </p>
                            </div>

                            {dispute.evidence_url && (
                                <a
                                    href={dispute.evidence_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-glass"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px', padding: '12px' }}
                                >
                                    <ExternalLink size={16} /> VIEW FIELD INTELLIGENCE
                                </a>
                            )}

                            {dispute.status === 'open' ? (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleResolve(dispute.id, 'resolved')}
                                        className="btn-glass"
                                        style={{ flex: 1, backgroundColor: 'rgba(76,175,80,0.1)', borderColor: 'rgba(76,175,80,0.3)', color: '#4CAF50' }}
                                    >
                                        <CheckCircle size={18} style={{ marginRight: '8px' }} /> VALIDATE
                                    </button>
                                    <button
                                        onClick={() => handleResolve(dispute.id, 'dismissed')}
                                        className="btn-glass"
                                        style={{ flex: 1, backgroundColor: 'rgba(255,68,68,0.1)', borderColor: 'rgba(255,68,68,0.3)', color: '#ff4444' }}
                                    >
                                        <XCircle size={18} style={{ marginRight: '8px' }} /> DISMISS
                                    </button>
                                </div>
                            ) : (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                    <p className="text-dim" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>ADMIN VERDICT</p>
                                    <p style={{ color: 'var(--primary)', fontStyle: 'italic', fontSize: '0.9rem' }}>"{dispute.admin_response}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DisputeBureau;
