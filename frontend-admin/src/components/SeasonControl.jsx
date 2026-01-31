import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SeasonControl = () => {
    const [seasonLabel, setSeasonLabel] = useState("");
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/seasons/history');
            setHistory(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleArchive = async () => {
        if (!seasonLabel.trim()) return alert("Enter a Season Label");
        if (!window.confirm(`ARCHIVE "${seasonLabel}"? This will snapshot the current leaderboard.`)) return;

        setLoading(true);
        try {
            await api.post('/seasons/archive', { seasonLabel });
            alert("Season Archived Successfully");
            setSeasonLabel("");
            fetchHistory();
        } catch (err) {
            alert("Archival Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <h2 className="gradient-text" style={{ marginBottom: '32px', fontSize: '2rem' }}>SEASON CONTROL</h2>

            <div className="card glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--primary)', marginBottom: '32px' }}>
                <h3 style={{ color: '#fff', marginTop: 0 }}>INITIATE ARCHIVAL PROTOCOL</h3>
                <p className="text-dim">Snapshot the current global leaderboard and reset for the next season.</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <input
                        type="text"
                        placeholder="Season Label (e.g. SEASON 1: GENESIS)"
                        value={seasonLabel}
                        onChange={(e) => setSeasonLabel(e.target.value)}
                        style={{ flex: 1, padding: '12px' }}
                    />
                    <button
                        onClick={handleArchive}
                        disabled={loading}
                        className="btn-glass"
                        style={{ padding: '0 24px' }}
                    >
                        {loading ? 'ARCHIVING...' : 'ARCHIVE SEASON'}
                    </button>
                </div>
            </div>

            <h3 style={{ color: '#fff' }}>ARCHIVAL HISTORY</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
                {history.map((h, idx) => (
                    <div key={idx} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px' }}>{h.season_label}</div>
                            <div className="text-dim" style={{ fontSize: '12px' }}>Archived: {new Date(h.archived_date).toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                            LOCKED
                        </div>
                    </div>
                ))}
                {history.length === 0 && <p className="text-dim">No archived seasons found.</p>}
            </div>
        </div>
    );
};

export default SeasonControl;
