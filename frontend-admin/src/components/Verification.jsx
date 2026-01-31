import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import { CheckCircle, Users, X, AlertTriangle } from 'lucide-react';

const Verification = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [unverifiedUsers, setUnverifiedUsers] = useState([]);
    const [pendingResults, setPendingResults] = useState([]);
    const [pendingSquads, setPendingSquads] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, resultsRes, squadsRes, disputesRes] = await Promise.all([
                api.get('/users/unverified'),
                api.get('/results/pending'),
                api.get('/tournaments/registrations/pending'),
                api.get('/disputes/all')
            ]);
            setUnverifiedUsers(usersRes.data);
            setPendingResults(resultsRes.data);
            setPendingSquads(squadsRes.data);
            setDisputes(disputesRes.data);
        } catch (err) {
            console.error('Fetch verification data error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleVerifyUser = async (id) => {
        try {
            await api.post(`/users/verify/${id}`, {});
            setUnverifiedUsers(unverifiedUsers.filter(u => u.id !== id));
            window.alert('Athlete Verified Successfully');
        } catch (err) {
            window.alert('Verification Failed: ' + err.message);
        }
    };

    const handleVerifyResult = async (id) => {
        try {
            await api.post(`/results/verify/${id}`, {});
            setPendingResults(pendingResults.filter(r => r.id !== id));
            window.alert('Match Result Verified & Stats Synchronized');
        } catch (err) {
            window.alert('Verification Failed: ' + err.message);
        }
    };

    const handleVerifyRegistration = async (id, status) => {
        try {
            await api.post(`/tournaments/registrations/${id}/verify`, { status });
            setPendingSquads(pendingSquads.filter(s => s.id !== id));
            window.alert(`Registration ${status.toUpperCase()} Successfully`);
        } catch (err) {
            window.alert('Action Failed: ' + err.message);
        }
    };

    const handleResolveDispute = async (id, status) => {
        const admin_response = window.prompt(`Strategic Reason for ${status.toUpperCase()}:`);
        if (admin_response === null) return;

        try {
            await api.patch(`/disputes/${id}/resolve`, { status, admin_response });
            setDisputes(disputes.filter(d => d.id !== id));
            window.alert(`Conflict Bureau: Case ${status.toUpperCase()}`);
        } catch (err) {
            window.alert('Resolution Failed: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>VERIFICATION BUREAU</h2>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(212,175,55,0.1)' }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        className="btn-glass"
                        style={{ padding: '8px 16px', fontSize: '11px', border: activeTab === 'users' ? '1px solid var(--primary)' : '1px solid transparent', background: activeTab === 'users' ? 'rgba(212,175,55,0.1)' : 'transparent' }}
                    >
                        OPERATIVES ({unverifiedUsers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className="btn-glass"
                        style={{ padding: '8px 16px', fontSize: '11px', border: activeTab === 'results' ? '1px solid var(--primary)' : '1px solid transparent', background: activeTab === 'results' ? 'rgba(212,175,55,0.1)' : 'transparent' }}
                    >
                        RESULTS ({pendingResults.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('squads')}
                        className="btn-glass"
                        style={{ padding: '8px 16px', fontSize: '11px', border: activeTab === 'squads' ? '1px solid var(--primary)' : '1px solid transparent', background: activeTab === 'squads' ? 'rgba(212,175,55,0.1)' : 'transparent' }}
                    >
                        SQUADS ({pendingSquads.length})
                    </button>
                </div>
            </div>

            {loading ? <p className="text-dim">Decrypting encrypted transmissions...</p> : (
                activeTab === 'users' ? (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {unverifiedUsers.length === 0 ? (
                            <div className="card glass-panel" style={{ padding: '80px', textAlign: 'center', borderStyle: 'dashed' }}>
                                <p className="text-dim">All operatives currently verified and active.</p>
                            </div>
                        ) : unverifiedUsers.map(u => (
                            <div key={u.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderLeft: '4px solid var(--primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(212,175,55,0.2)' }}>
                                        <span>USR</span>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', color: '#fff' }}>{u.ff_ign}</h3>
                                        <p className="text-dim" style={{ fontSize: '0.8rem', margin: 0 }}>UID: <span style={{ color: 'var(--primary)' }}>{u.ff_uid}</span> | {u.university_id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleVerifyUser(u.id)}
                                    className="btn-glass"
                                    style={{ padding: '12px 24px' }}
                                >
                                    AUTHORIZE IDENTITY
                                </button>
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'results' ? (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {pendingResults.length === 0 ? (
                            <div className="card glass-panel" style={{ padding: '80px', textAlign: 'center', borderStyle: 'dashed' }}>
                                <p className="text-dim">No match results pending intelligence verification.</p>
                            </div>
                        ) : pendingResults.map(r => (
                            <div key={r.id} className="card glass-panel" style={{ padding: '32px', borderLeft: '4px solid var(--primary)' }}>
                                {/* Result verification UI would go here - simplified for now based on backup */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Match Result #{r.id}</h4>
                                        <p className="text-dim">Submitted by: {r.player_ign}</p>
                                    </div>
                                    <button onClick={() => handleVerifyResult(r.id)} className="btn-glass">VERIFY INTEL</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {pendingSquads.length === 0 ? (
                            <div className="card glass-panel" style={{ padding: '80px', textAlign: 'center', borderStyle: 'dashed' }}>
                                <p className="text-dim">No squad registrations awaiting approval.</p>
                            </div>
                        ) : pendingSquads.map(s => (
                            <div key={s.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderLeft: '4px solid var(--primary)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', color: '#fff' }}>{s.team_name}</h3>
                                    <p className="text-dim" style={{ fontSize: '0.8rem' }}>Tournament ID: {s.tournament_id}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => handleVerifyRegistration(s.id, 'confirmed')} className="btn-glass">APPROVE</button>
                                    <button onClick={() => handleVerifyRegistration(s.id, 'rejected')} className="btn-glass" style={{ color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)' }}>REJECT</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default Verification;
