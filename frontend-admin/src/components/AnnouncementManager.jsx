import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Megaphone, Plus, Trash2, ShieldAlert } from 'lucide-react';

const AnnouncementManager = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [priority, setPriority] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error('Fetch announcements error:', err);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        setLoading(true);
        try {
            await api.post('/announcements',
                { content: newContent, priority }
            );
            setNewContent('');
            setPriority(0);
            fetchAnnouncements();
        } catch (err) {
            alert('Failed to add announcement: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Kill this announcement?')) return;

        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch (err) {
            alert('Kill sequence failed.');
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <Megaphone color="var(--primary)" size={32} />
                <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>LIVE FEED CONTROL</h1>
            </div>

            <div className="card glass-panel" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(212,175,55,0.2)' }}>
                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.2rem' }}>DEPLOY NEW ANNOUNCEMENT</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '11px', marginBottom: '8px', letterSpacing: '1px' }}>CONTENT</label>
                        <input
                            className="glass-input"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Priority broadcast content..."
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ width: '150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '11px', marginBottom: '8px', letterSpacing: '1px' }}>PRIORITY</label>
                        <select
                            className="glass-input"
                            value={priority}
                            onChange={(e) => setPriority(parseInt(e.target.value))}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)' }}
                        >
                            <option value={0}>NORMAL</option>
                            <option value={1}>HIGH (CRITICAL)</option>
                        </select>
                    </div>
                    <button className="btn-glass" type="submit" disabled={loading} style={{ height: '48px', padding: '0 32px' }}>
                        {loading ? 'DEPLOYING...' : 'BROADCAST'}
                    </button>
                </form>
            </div>

            <div className="announcement-list" style={{ display: 'grid', gap: '16px' }}>
                <h3 style={{ color: 'var(--text-dim)', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>ACTIVE BROADCASTS</h3>
                {announcements.map((a) => (
                    <div key={a.id} className="card glass-panel" style={{
                        padding: '16px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: a.priority ? '4px solid #ff4444' : '1px solid rgba(212,175,55,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {a.priority ? <ShieldAlert color="#ff4444" size={20} /> : <Megaphone color="var(--primary)" size={20} />}
                            <span style={{ color: '#fff', fontSize: '15px' }}>{a.content}</span>
                        </div>
                        <button
                            onClick={() => handleDelete(a.id)}
                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', opacity: 0.6 }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnnouncementManager;
