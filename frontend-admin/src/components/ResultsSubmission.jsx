import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X } from 'lucide-react';
import ToastContainer from './Toast';

const ResultsSubmission = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [results, setResults] = useState([]);
    const [scoringParams, setScoringParams] = useState(null);
    const [squads, setSquads] = useState([]);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await api.get('/tournaments/matches/all');
            setMatches(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch matches error:', err);
            setLoading(false);
        }
    };

    const openResultsModal = async (match) => {
        try {
            // Fetch tournament details for scoring params
            const tournamentRes = await api.get('/tournaments');
            const tournament = tournamentRes.data.find(t => t.id === match.tournament_id);
            const params = typeof tournament?.scoring_params === 'string'
                ? JSON.parse(tournament.scoring_params)
                : tournament?.scoring_params;
            setScoringParams(params);

            // Initialize results array with 12 slots
            const initialResults = [];
            for (let i = 1; i <= 12; i++) {
                initialResults.push({
                    team_id: '',
                    team_name: '',
                    placement: i,
                    kills: 0,
                    total_points: (params?.placement_points?.[i.toString()] !== undefined)
                        ? params.placement_points[i.toString()]
                        : Math.max(0, 13 - i),
                    player_results: [],
                    showPlayers: false
                });
            }

            setResults(initialResults);
            setSelectedMatch(match);
            setShowResultsModal(true);

            // Fetch approved squads for reference
            const squadsRes = await api.get(`/tournaments/${match.tournament_id}/registrations`);
            setSquads(squadsRes.data);
        } catch (err) {
            console.error('Error opening results modal:', err);
            alert('Failed to load match details');
        }
    };

    const calculatePoints = (placement, kills) => {
        let placementPoints = 0;

        // Use tournament params if available, otherwise default to "13 - placement" logic
        if (scoringParams?.placement_points && scoringParams.placement_points[placement.toString()] !== undefined) {
            placementPoints = scoringParams.placement_points[placement.toString()];
        } else {
            placementPoints = Math.max(0, 13 - (parseInt(placement) || 13));
        }

        const killPoints = (parseInt(kills) || 0) * (scoringParams?.kill_points || 1);
        return placementPoints + killPoints;
    };

    const updateResult = (index, field, value) => {
        let activeId = value;
        if (field === 'team_id' && value.length > 10) {
            activeId = value.slice(0, 10);
        }

        setResults(prev => prev.map((res, i) => i === index ? { ...res, [field]: activeId } : res));

        // Side Effects (Auto-lookup)
        if (field === 'team_id' && activeId) {
            if (activeId.length === 10) {
                const squad = squads.find(s => s.team_id.toString() === activeId.toString());

                if (squad) {
                    setResults(prev => prev.map((res, i) => i === index ? {
                        ...res,
                        team_name: squad.team_name || `Team ${squad.team_id}`,
                        player_results: (squad.roster_snapshot || squad.members || []).map(m => ({
                            user_id: m.user_id || m.id,
                            ff_ign: m.ff_ign || 'Unknown Player',
                            kills: 0
                        }))
                    } : res));
                } else {
                    // Start Async Lookup
                    setResults(prev => prev.map((res, i) => i === index ? { ...res, team_name: "🔍 FETCHING UNIT INTEL..." } : res));

                    api.get(`/teams/${activeId}`).then(res => {
                        if (res.data) {
                            setResults(latest => latest.map((resItem, idx) => {
                                if (idx === index && resItem.team_id.toString() === activeId.toString()) {
                                    return {
                                        ...resItem,
                                        team_name: res.data.name,
                                        player_results: res.data.members ? res.data.members.map(m => ({
                                            user_id: m.id,
                                            ff_ign: m.ff_ign,
                                            kills: 0
                                        })) : []
                                    };
                                }
                                return resItem;
                            }));
                        }
                    }).catch(err => {
                        console.log('Team lookup failed:', err.message);
                        setResults(latest => latest.map((resItem, idx) =>
                            idx === index && resItem.team_id.toString() === activeId.toString()
                                ? { ...resItem, team_name: `Team ${index + 1}` }
                                : resItem
                        ));
                    });
                }
            } else {
                setResults(prev => prev.map((res, i) => i === index ? {
                    ...res,
                    player_results: [],
                    team_name: activeId.length === 0 ? `Team ${index + 1}` : res.team_name
                } : res));
            }
        } else if (field === 'kills' || field === 'placement') {
            setResults(prev => prev.map((res, i) => i === index ? {
                ...res,
                [field]: value,
                total_points: calculatePoints(field === 'placement' ? value : res.placement, field === 'kills' ? value : res.kills)
            } : res));
        }
    };

    const updatePlayerKill = (teamIndex, userIndex, kills) => {
        setResults(prev => {
            const next = [...prev];
            next[teamIndex].player_results[userIndex].kills = parseInt(kills) || 0;

            // Auto-sum team kills
            const totalKills = next[teamIndex].player_results.reduce((sum, pr) => sum + (pr.kills || 0), 0);
            next[teamIndex].kills = totalKills;

            // Auto-update total points
            next[teamIndex].total_points = calculatePoints(next[teamIndex].placement, totalKills);

            return next;
        });
    };

    const togglePlayers = (index) => {
        const newResults = [...results];
        newResults[index].showPlayers = !newResults[index].showPlayers;
        setResults(newResults);
    };

    const [toasts, setToasts] = useState([]);

    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const submitResults = async () => {
        try {
            const token = localStorage.getItem('token');

            // Filter out teams with no team_id
            const validResults = results
                .filter(r => r.team_id && r.team_id.toString().length > 0)
                .map(r => ({
                    match_id: selectedMatch.id,
                    team_id: r.team_id.toString(), // Keep as string for BIGINT safety or let backend handle
                    placement: parseInt(r.placement),
                    kills: parseInt(r.kills) || 0,
                    player_results: r.player_results
                }));

            if (validResults.length === 0) {
                addToast('warning', 'Please add at least one team result with a valid Team ID');
                return;
            }

            await api.post('/results/bulk',
                { results: validResults }
            );

            addToast('success', 'Results submitted successfully!');
            setTimeout(() => setShowResultsModal(false), 2000); // Delay close to show toast
            fetchMatches();
        } catch (err) {
            console.error('Submit results error:', err);
            addToast('error', 'Failed to submit results: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '8px' }}>MATCH RESULTS</h2>
                <p className="text-dim">Submit final results for completed matches</p>
            </div>

            {loading ? (
                <p className="text-dim">Loading matches...</p>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {matches.filter(m => m.status === 'completed').map(match => (
                        <div key={match.id} className="card glass-panel" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ color: '#fff', marginBottom: '8px' }}>{match.tournament_title}</h3>
                                    <p className="text-dim" style={{ fontSize: '14px' }}>
                                        Round {match.round_number} • {match.map_name} • {new Date(match.scheduled_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => openResultsModal(match)}
                                    className="btn-glass"
                                    style={{ padding: '12px 24px' }}
                                >
                                    SUBMIT RESULTS
                                </button>
                            </div>
                        </div>
                    ))}
                    {matches.filter(m => m.status === 'completed').length === 0 && (
                        <p className="text-dim">No completed matches found. Mark a match as 'completed' to submit results.</p>
                    )}
                </div>
            )}

            {showResultsModal && (
                <div className="modal-backdrop" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 5000,
                    overflowY: 'auto', padding: '40px'
                }}>
                    <div className="card glass-panel" style={{
                        width: '1200px', maxHeight: '90vh', overflow: 'auto',
                        padding: '40px', backgroundColor: '#0D0D0F'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <div>
                                <h3 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                                    SUBMIT MATCH RESULTS
                                </h3>
                                <p className="text-dim">{selectedMatch?.tournament_title} - Round {selectedMatch?.round_number}</p>
                            </div>
                            <X color="var(--text-dim)" style={{ cursor: 'pointer' }} onClick={() => setShowResultsModal(false)} />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <p className="text-dim" style={{ fontSize: '12px' }}>
                                Enter team IDs, placements, and kills. Points will be calculated automatically based on tournament scoring rules.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
                            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                                {results.map((result, index) => (
                                    <div key={index} style={{ marginBottom: '10px' }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '60px 2fr 1fr 1fr 1fr 40px',
                                            gap: '16px',
                                            alignItems: 'center',
                                            padding: '16px',
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(212,175,55,0.1)'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '4px' }}>POS</div>
                                                <input
                                                    type="number"
                                                    value={result.placement}
                                                    onChange={(e) => updateResult(index, 'placement', e.target.value)}
                                                    style={{
                                                        width: '45px',
                                                        textAlign: 'center',
                                                        fontWeight: '800',
                                                        fontSize: '18px',
                                                        color: 'var(--primary)',
                                                        background: 'transparent',
                                                        padding: '4px'
                                                    }}
                                                />
                                            </div>
                                            <input
                                                placeholder="Team Name (optional)"
                                                value={result.team_name}
                                                onChange={(e) => updateResult(index, 'team_name', e.target.value)}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="10-digit Team ID *"
                                                value={result.team_id}
                                                onChange={(e) => updateResult(index, 'team_id', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    borderColor: result.team_id && result.team_id.toString().length === 10 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                    color: result.team_id && result.team_id.toString().length === 10 ? '#fff' : '#ff4444'
                                                }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Total Kills"
                                                value={result.kills}
                                                onChange={(e) => updateResult(index, 'kills', e.target.value)}
                                                style={{ width: '100%', fontWeight: 'bold', color: 'var(--primary)' }}
                                            />
                                            <div style={{
                                                textAlign: 'center',
                                                background: 'rgba(212,175,55,0.05)',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(212,175,55,0.1)'
                                            }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '1px' }}>TOTAL POINTS</div>
                                                <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '18px' }}>
                                                    {calculatePoints(result.placement, result.kills)}
                                                </div>
                                                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                                                    {scoringParams?.placement_points?.[result.placement.toString()] || 0}P + {result.kills * (scoringParams?.kill_points || 1)}K
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => togglePlayers(index)}
                                                className="btn-glass"
                                                style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)' }}
                                            >
                                                {result.showPlayers ? '▲' : '▼'}
                                            </button>
                                        </div>

                                        {/* Individual Player Kills */}
                                        {result.showPlayers && result.player_results && result.player_results.length > 0 && (
                                            <div style={{
                                                marginLeft: '60px',
                                                marginTop: '8px',
                                                padding: '12px',
                                                background: 'rgba(212,175,55,0.03)',
                                                borderRadius: '8px',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: '12px'
                                            }}>
                                                {result.player_results.map((player, pIdx) => (
                                                    <div key={player.user_id}>
                                                        <label style={{ fontSize: '9px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{player.ff_ign}</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Kills"
                                                            value={player.kills}
                                                            onChange={(e) => updatePlayerKill(index, pIdx, e.target.value)}
                                                            style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="card glass-panel" style={{ padding: '24px', alignSelf: 'start', position: 'sticky', top: '0' }}>
                                <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '16px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '8px' }}>SQUAD REFERENCE</h4>
                                <div style={{ display: 'grid', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                                    {squads.length === 0 ? <p className="text-dim" style={{ fontSize: '11px' }}>No squads found.</p> : squads.map(s => (
                                        <div key={s.team_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{s.team_name}</span>
                                            <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '800' }}>ID: {s.team_id}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={submitResults}
                                className="btn-glass"
                                style={{ flex: 2, padding: '16px', fontSize: '16px', background: 'var(--primary)', color: '#000', border: 'none' }}
                            >
                                SUBMIT RESULTS
                            </button>
                            <button
                                onClick={() => setShowResultsModal(false)}
                                className="btn-glass"
                                style={{
                                    flex: 1, padding: '16px'
                                }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default ResultsSubmission;
