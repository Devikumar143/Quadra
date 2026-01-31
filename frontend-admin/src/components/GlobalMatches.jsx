import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
// import { Flag, CalendarClock } from 'lucide-react';
import LiveScorer from './LiveScorer';

const GlobalMatches = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLiveMatch, setSelectedLiveMatch] = useState(null);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await api.get('/tournaments/matches/all');
            setMatches(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch Matches Error:', err);
            setLoading(false);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'live': return '#4CAF50';
            case 'completed': return '#8A8A8E';
            case 'scheduled': return '#FFD700';
            default: return '#fff';
        }
    };

    if (selectedLiveMatch) {
        return <LiveScorer match={selectedLiveMatch} onClose={() => setSelectedLiveMatch(null)} />;
    }

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <span style={{ fontSize: '32px' }}>🚩</span>
                <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>GLOBAL MATCH OVERVIEW</h1>
            </div>

            {loading ? (
                <p className="text-dim">Scanning match protocols...</p>
            ) : matches.length === 0 ? (
                <div className="card glass-panel" style={{
                    padding: '80px',
                    textAlign: 'center',
                    borderStyle: 'dashed'
                }}>
                    <span style={{ fontSize: '48px', opacity: 0.5, marginBottom: '20px', display: 'block' }}>📅</span>
                    <h3 style={{ color: '#fff', margin: '0 0 8px 0' }}>NO ACTIVE PROTOCOLS</h3>
                    <p className="text-dim">All arenas are currently silent. Schedule a match in Tournaments.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {matches.map(match => (
                        <div key={match.id} className="card glass-panel" style={{
                            padding: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: `4px solid ${getStatusColor(match.status)}`
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{
                                        fontSize: '10px', fontWeight: '800',
                                        background: getStatusColor(match.status), color: '#000',
                                        padding: '4px 8px', borderRadius: '4px'
                                    }}>
                                        {match.status.toUpperCase()}
                                    </span>
                                    <span className="text-dim" style={{ fontSize: '12px', letterSpacing: '1px' }}>
                                        {match.tournament_title?.toUpperCase()}
                                    </span>
                                </div>
                                <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.2rem' }}>
                                    ROOM: {match.room_id} // MAP: {match.map_name}
                                </h3>
                                <p className="text-dim" style={{ fontSize: '12px', margin: 0 }}>
                                    Scheduled: {new Date(match.scheduled_at).toLocaleString()}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {match.status === 'scheduled' && (
                                    <button
                                        onClick={() => updateMatchStatus(match.id, 'live')}
                                        className="btn-glass"
                                        style={{ padding: '8px 16px', fontSize: '11px', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.2)' }}
                                    >
                                        START
                                    </button>
                                )}
                                {match.status === 'live' && (
                                    <>
                                        <button
                                            className="btn-glass"
                                            style={{
                                                padding: '8px 16px', fontSize: '12px'
                                            }}
                                            onClick={() => setSelectedLiveMatch(match)}
                                        >
                                            SCORING CONSOLE
                                        </button>
                                        <button
                                            className="btn-glass"
                                            style={{
                                                padding: '8px 16px', fontSize: '12px', color: '#52aaff', border: '1px solid rgba(82,170,255,0.3)'
                                            }}
                                            onClick={() => navigate(`/caster/${match.id}`)}
                                        >
                                            INTELLIGENCE HUD
                                        </button>
                                        <button
                                            onClick={() => updateMatchStatus(match.id, 'completed')}
                                            className="btn-glass"
                                            style={{ padding: '8px 16px', fontSize: '11px', color: '#FFD700', border: '1px solid rgba(212,175,55,0.2)' }}
                                        >
                                            COMPLETE
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlobalMatches;
