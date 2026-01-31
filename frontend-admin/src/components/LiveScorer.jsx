import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LiveScorer = ({ match, onClose }) => {
    const [tickerText, setTickerText] = useState("");
    const [lastUpdate, setLastUpdate] = useState(null);
    const [teams, setTeams] = useState([]);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState(null);

    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await api.get(`/live/${match.id}/state`);
                setTeams(res.data.teams);
                setScores(res.data.current_scores || []);
            } catch (err) {
                console.error("Failed to load live state", err);
            } finally {
                setLoading(false);
            }
        };
        fetchState();
    }, [match.id]);

    const sendUpdate = async (type, payload) => {
        try {
            await api.post(`/live/${match.id}/update`,
                { type, payload }
            );
            setLastUpdate(new Date());

            const teamPts = payload.points || (type === 'player_kill' ? 1 : 0);

            if (type === 'score' || type === 'player_kill') {
                setScores(prev => {
                    const existing = prev.find(s => s.team === payload.team);
                    let players = existing?.players || {};

                    if (type === 'player_kill') {
                        const pName = payload.player;
                        players = { ...players, [pName]: { kills: (players[pName]?.kills || 0) + 1 } };
                    }

                    if (existing) {
                        return prev.map(s => s.team === payload.team ? {
                            ...s,
                            points: (s.points || 0) + teamPts,
                            players
                        } : s);
                    }
                    return [...prev, { team: payload.team, points: teamPts, status: 'alive', players }];
                });
            } else if (type === 'status') {
                setScores(prev => {
                    const existing = prev.find(s => s.team === payload.team);
                    if (existing) {
                        return prev.map(s => s.team === payload.team ? { ...s, status: payload.status } : s);
                    }
                    return [...prev, { team: payload.team, points: 0, status: payload.status }];
                });
            } else if (type === 'alive_count') {
                setScores(prev => {
                    const existing = prev.find(s => s.team === payload.team);
                    if (existing) {
                        return prev.map(s => s.team === payload.team ? { ...s, alive_count: payload.count } : s);
                    }
                    return [...prev, { team: payload.team, points: 0, status: 'alive', alive_count: payload.count }];
                });
            }

            if (type === 'ticker') setTickerText("");
        } catch (err) {
            alert('Failed to broadcast: ' + err.message);
        }
    };

    const getTeamScore = (teamName) => scores.find(s => s.team === teamName)?.points || 0;
    const getTeamStatus = (teamName) => scores.find(s => s.team === teamName)?.status || 'alive';
    const getAliveCount = (teamName) => scores.find(s => s.team === teamName)?.alive_count ?? 4;
    const getPlayerKills = (teamName, ign) => scores.find(s => s.team === teamName)?.players?.[ign]?.kills || 0;

    const updateAliveCount = (teamName, change) => {
        const current = getAliveCount(teamName);
        const newCount = Math.max(0, Math.min(4, current + change));
        if (newCount !== current) {
            sendUpdate('alive_count', { team: teamName, count: newCount });
        }
    };

    const toggleExpand = (teamName) => {
        setExpandedTeam(expandedTeam === teamName ? null : teamName);
    };

    const handleEndMatch = async () => {
        if (!window.confirm("Are you sure you want to OFFICIALY END this match? This action cannot be undone.")) {
            return;
        }

        try {
            await api.put(`/tournaments/matches/${match.id}/status`, { status: "completed" });
            await api.post(`/live/${match.id}/update`, { type: 'ticker', payload: { text: "MATCH COMPLETED - RTB ALL UNITS" } });
            alert("Match completed successfully! You can now submit results.");
            onClose();
        } catch (err) {
            console.error("End match error:", err);
            alert("Failed to end match: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 5000,
            display: 'flex', flexDirection: 'column', padding: '40px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <div style={{ color: '#4CAF50', fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>LIVE CASTING // {match.room_id}</div>
                    <h1 style={{ color: '#fff', margin: 0, fontSize: '2.5rem' }}>MATCH OPERATION CENTER</h1>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={handleEndMatch}
                        className="btn-glass"
                        style={{
                            padding: '12px 24px',
                            color: '#FFD700',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            fontWeight: 'bold'
                        }}
                    >
                        COMPLETE MATCH
                    </button>
                    <button onClick={onClose} className="btn-secondary" style={{ padding: '12px 24px' }}>
                        CLOSE FEED
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', flex: 1, overflow: 'hidden' }}>

                {/* TICKER CONTROL */}
                <div className="card glass-panel" style={{ borderLeft: '4px solid #FFD700', height: 'fit-content', padding: '32px' }}>
                    <h2 style={{ color: '#FFD700', marginTop: 0 }}>NEWS TICKER</h2>
                    <textarea
                        value={tickerText}
                        onChange={(e) => setTickerText(e.target.value)}
                        placeholder="Manual override message..."
                        style={{
                            width: '100%', height: '100px', background: 'rgba(0,0,0,0.3)',
                            border: '1px solid #444', borderRadius: '12px', color: '#fff', padding: '16px',
                            fontSize: '16px', marginBottom: '20px', fontFamily: 'inherit'
                        }}
                    />
                    <button
                        onClick={() => sendUpdate('ticker', { text: tickerText })}
                        disabled={!tickerText.trim()}
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                    >
                        BROADCAST
                    </button>
                </div>

                {/* SCOREBOARD CONTROL */}
                <div className="card glass-panel" style={{ borderLeft: '4px solid #4CAF50', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '32px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ color: '#4CAF50', marginTop: 0, margin: 0 }}>LIVE SCORING</h2>
                    </div>

                    <div style={{ overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {loading ? <p className="text-dim">Loading Squads...</p> : teams.length === 0 ? (
                            <p className="text-dim">No squads registered for this match.</p>
                        ) : teams.map(t => {
                            const score = getTeamScore(t.team_name);
                            const status = getTeamStatus(t.team_name);
                            const isExpanded = expandedTeam === t.team_name;

                            return (
                                <div key={t.team_id} style={{
                                    padding: '16px', background: status === 'eliminated' ? 'rgba(255, 68, 68, 0.05)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    border: status === 'eliminated' ? '1px solid rgba(255, 68, 68, 0.2)' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div onClick={() => toggleExpand(t.team_name)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: status === 'eliminated' ? '#ff4444' : '#fff', fontWeight: '700', fontSize: '1.2rem' }}>{t.team_name}</span>
                                            <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{score} PTS</span>
                                            {!isExpanded && <span className="text-dim" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click to view roster</span>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '4px' }}>
                                                <button
                                                    onClick={() => updateAliveCount(t.team_name, -1)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontWeight: 'bold' }}
                                                >-</button>
                                                <span style={{ color: '#fff', fontSize: '12px', width: '12px', textAlign: 'center' }}>{getAliveCount(t.team_name)}</span>
                                                <button
                                                    onClick={() => updateAliveCount(t.team_name, 1)}
                                                    style={{ background: 'transparent', border: 'none', color: '#4CAF50', cursor: 'pointer', fontWeight: 'bold' }}
                                                >+</button>
                                                <span style={{ fontSize: '9px', color: 'var(--text-dim)', marginLeft: '2px' }}>ALIVE</span>
                                            </div>
                                            <button
                                                onClick={() => sendUpdate('score', { team: t.team_name, points: 5 })}
                                                disabled={status === 'eliminated'}
                                                style={{ background: '#FFC107', border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#000', fontWeight: 'bold', cursor: 'pointer', opacity: status === 'eliminated' ? 0.5 : 1 }}
                                            >
                                                +5 PTS
                                            </button>
                                            <button
                                                onClick={() => sendUpdate('status', { team: t.team_name, status: status === 'eliminated' ? 'alive' : 'eliminated' })}
                                                style={{ background: status === 'eliminated' ? '#333' : '#FF4444', border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                                            >
                                                {status === 'eliminated' ? 'REVIVE' : 'WIPEOUT'}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>ROSTER OPERATIONS</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                                {t.roster && t.roster.length > 0 ? t.roster.map(player => (
                                                    <div key={player.ff_ign} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{player.ff_ign}</div>
                                                            <div className="text-dim" style={{ fontSize: '0.8rem' }}>{getPlayerKills(t.team_name, player.ff_ign)} Kills</div>
                                                        </div>
                                                        <button
                                                            onClick={() => sendUpdate('player_kill', { team: t.team_name, player: player.ff_ign, points: 1 })}
                                                            disabled={status === 'eliminated'}
                                                            className="btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        >
                                                            KILL (+1)
                                                        </button>
                                                    </div>
                                                )) : <span className="text-dim">No roster data available.</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveScorer;
