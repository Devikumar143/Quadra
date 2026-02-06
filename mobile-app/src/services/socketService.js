import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAuthToken, SOCKET_URL } from './api';

class SocketService {
    constructor() {
        this.socket = null;
    }

    async connect(onNotification) {
        if (this.socket) return;

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            this.socket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket']
            });

            this.socket.on('connect', () => {
                console.log('[Socket] Connected to High Command');
            });

            this.socket.on('notification', (data) => {
                console.log('[Socket] Tactical Alert Received:', data);
                if (onNotification) onNotification(data);
            });

            this.socket.on('disconnect', () => {
                console.log('[Socket] Disconnected from Central Command');
            });

            this.socket.on('connect_error', async (err) => {
                console.log('[Socket] Connection Error:', err.message);

                if (err.message.includes('Authentication') || err.message.includes('Token') || err.message.includes('jwt')) {
                    console.log('[Socket] Attempting token refresh...');
                    try {
                        const newToken = await refreshAuthToken();
                        if (this.socket) {
                            this.socket.auth.token = newToken;
                            this.socket.connect();
                        }
                    } catch (refreshErr) {
                        console.error('[Socket] Refresh failed:', refreshErr);
                        this.disconnect();
                    }
                }
            });

        } catch (err) {
            console.error('[Socket Service Error]', err.message);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }
}

export default new SocketService();
