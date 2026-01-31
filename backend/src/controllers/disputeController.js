const db = require('../config/db');

exports.createDispute = async (req, res) => {
    const { result_id, reason, evidence_url } = req.body;
    const user_id = req.user.id;

    try {
        const dispute = await db.query(
            'INSERT INTO disputes (result_id, user_id, reason, evidence_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [result_id, user_id, reason, evidence_url]
        );
        res.status(201).json({ message: 'Dispute submitted and logged in the bureau.', dispute: dispute.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Bureau error: Failed to log contestation.' });
    }
};

exports.getDisputes = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ message: 'Access denied: Bureau clearance required.' });
        }

        const disputes = await db.query(`
            SELECT d.*, u.ff_ign, u.ff_uid, mr.kills, mr.placement, t.name as team_name, m.round_number, tr.title as tournament_title
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN match_results mr ON d.result_id = mr.id
            JOIN teams t ON mr.team_id = t.id
            JOIN matches m ON mr.match_id = m.id
            JOIN tournaments tr ON m.tournament_id = tr.id
            WHERE d.status = 'open'
            ORDER BY d.created_at ASC
        `);
        res.json(disputes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching bureau files.' });
    }
};

exports.resolveDispute = async (req, res) => {
    const { dispute_id } = req.params;
    const { status, admin_response } = req.body; // 'resolved', 'dismissed'

    try {
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const disputeRes = await db.query('UPDATE disputes SET status = $1, admin_response = $2 WHERE id = $3 RETURNING *', [status, admin_response, dispute_id]);

        if (disputeRes.rows.length === 0) return res.status(404).json({ message: 'Dispute not found.' });

        const dispute = disputeRes.rows[0];

        // Notify the operative of the resolution via context-aware dispatch
        await req.notificationService.dispatch(
            dispute.user_id,
            'DISPUTE_RESOLUTION',
            `Contestation Protocol Updated: Result ID ${dispute.result_id} is now ${status.toUpperCase()}. Message: ${admin_response}`,
            { disputeId: dispute.id, resultId: dispute.result_id }
        );

        res.json({ message: 'Contestation resolved and operative notified.', dispute });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error resolving contestation.' });
    }
};
