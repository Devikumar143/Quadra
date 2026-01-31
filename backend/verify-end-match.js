const API_URL = 'http://localhost:5001/api';

async function request(url, method, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };

    // Auth Fix: Backend expects 'x-auth-token'
    if (token) headers['x-auth-token'] = token;

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(API_URL + url, options);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data;
}

async function verifyEndMatch() {
    try {
        console.log('1. Authenticating as Admin...');
        const loginData = await request('/auth/login', 'POST', {
            email: 'admin@quadra.com',
            password: 'admin'
        });

        const token = loginData.token;
        if (!token) throw new Error('Login response did not contain token');
        console.log(`✅ Authenticated. Token received: ${token.substring(0, 20)}...`);

        console.log('\n2. Creating Test Tournament...');
        const tourneyData = await request('/tournaments/create', 'POST', {
            title: 'End Match Verification Cup',
            game: 'Free Fire',
            format: 'Battle Royale',
            entry_fee: 0,
            prize_pool: 0,
            max_teams: 12,
            start_date: new Date().toISOString(),
            // Fix: scoring_params is required
            scoring_params: {
                kill_points: 1,
                placement_points: {
                    "1": 12, "2": 9, "3": 8, "4": 7, "5": 6,
                    "6": 5, "7": 4, "8": 3, "9": 2, "10": 1, "11": 0, "12": 0
                }
            }
        }, token);

        const tournamentId = tourneyData.id;
        console.log(`✅ Tournament Created: ID ${tournamentId}`);

        console.log('\n3. Creating Test Match...');
        const matchData = await request(`/tournaments/${tournamentId}/matches`, 'POST', {
            round_number: 1,
            map_name: 'Bermuda',
            scheduled_at: new Date().toISOString()
        }, token);

        const matchId = matchData.id;
        console.log(`✅ Match Created: ID ${matchId}`);

        console.log('\n4. Setting Match to LIVE...');
        await request(`/tournaments/matches/${matchId}/status`, 'PUT', { status: 'live' }, token);
        console.log('✅ Match set to LIVE.');

        console.log('\n5. Ending Match (Setting to COMPLETED)...');
        const endData = await request(`/tournaments/matches/${matchId}/status`, 'PUT', { status: 'completed' }, token);

        if (endData.match.status === 'completed') {
            console.log('✅ SUCCESS: Match status updated to COMPLETED.');
        } else {
            console.error('❌ FAILURE: Match status is ' + endData.match.status);
        }

        console.log('\n6. Cleaning up...');
        await request(`/tournaments/${tournamentId}`, 'DELETE', null, token);
        console.log('✅ Cleanup successful.');

    } catch (err) {
        console.error('❌ Verification Failed:', err.message);
    }
}

verifyEndMatch();
