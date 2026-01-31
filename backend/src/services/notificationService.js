const { Expo } = require('expo-server-sdk');
const db = require('../config/db');

// Create a new Expo SDK client
let expo = new Expo();

const notificationService = {
    // Send a push notification to specific users
    sendPushNotification: async (userIds, title, body, data = {}) => {
        try {
            // Fetch push tokens for these users
            const res = await db.query(
                'SELECT push_token FROM users WHERE id = ANY($1) AND push_token IS NOT NULL',
                [userIds]
            );

            const pushTokens = res.rows.map(row => row.push_token);
            if (pushTokens.length === 0) return;

            let messages = [];
            for (let pushToken of pushTokens) {
                if (!Expo.isExpoPushToken(pushToken)) {
                    console.error(`Push token ${pushToken} is not a valid Expo push token`);
                    continue;
                }

                messages.push({
                    to: pushToken,
                    sound: 'default',
                    title: title,
                    body: body,
                    data: data,
                });
            }

            let chunks = expo.chunkPushNotifications(messages);
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log('Notification Tickets:', ticketChunk);
                } catch (error) {
                    console.error('Error sending notification chunk:', error);
                }
            }
        } catch (err) {
            console.error('Notification Service Error:', err);
        }
    },

    // Broadcast to all users (optional utility)
    broadcastNotification: async (title, body, data = {}) => {
        try {
            const res = await db.query('SELECT push_token FROM users WHERE push_token IS NOT NULL');
            const pushTokens = res.rows.map(row => row.push_token);
            // ... similar logic as above or reuse function
            // keeping it simple for now
        } catch (err) {
            console.error('Broadcast Error:', err);
        }
    }
};

module.exports = notificationService;
