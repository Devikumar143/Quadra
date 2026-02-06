import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_IP = '10.185.110.250';
const LOCAL_URL = `http://${LOCAL_IP}:5001/api`;
const PROD_URL = 'https://quadra-production.railway.app/api';

// Forcing PROD_URL for 5G testing. Switch back to __DEV__ ? ... for local dev.
export const API_URL = PROD_URL;
export const SOCKET_URL = 'https://quadra-production.railway.app';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds timeout for production/cold starts
});


export const refreshAuthToken = async () => {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = res.data;

        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common['x-auth-token'] = newToken;
        return newToken;
    } catch (error) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        throw error;
    }
};

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newToken = await refreshAuthToken();
                originalRequest.headers['x-auth-token'] = newToken;
                return api(originalRequest);
            } catch (refreshError) {
                // Token refresh failed, user needs to login
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
