import axios from 'axios';

// Get the base API URL from environment variables
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_BASE_URL && !API_BASE_URL.endsWith('/api') && !API_BASE_URL.endsWith('/api/')) {
    API_BASE_URL = API_BASE_URL.endsWith('/') ? `${API_BASE_URL}api` : `${API_BASE_URL}/api`;
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Fetch dashboard-wide analytics for a specific user.
 */
export const fetchDashboardData = async () => {
    try {
        const response = await apiClient.get(`/dashboard`);
        return response.data;
    } catch (error) {
        console.error('API Error: fetchDashboardData', error);
        throw error;
    }
};

/**
 * Analyze financial conversation (text or audio).
 * Handles multipart/form-data automatically if an audio file is present.
 * @param {Object} payload - The analysis request data.
 */
export const analyzeConversation = async (payload) => {
    try {
        let data = payload;
        let config = {};

        // If audio file exists, use FormData
        if (payload.audio_file) {
            const formData = new FormData();
            formData.append('input_type', 'audio');
            formData.append('audio_file', payload.audio_file);
            if (payload.language_hint) formData.append('language_hint', payload.language_hint);
            
            data = formData;
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
        }

        const response = await apiClient.post('/conversation/analyze', data, config);
        return response.data;
    } catch (error) {
        console.error('API Error: analyzeConversation', error);
        throw error;
    }
};

/**
 * Fetch the full conversation history for a user.
 */
export const fetchHistory = async () => {
    try {
        const response = await apiClient.get('/conversation/history');
        return response.data;
    } catch (error) {
        console.error('API Error: fetchHistory', error);
        throw error;
    }
};

/**
 * Fetch a single conversation with details.
 */
export const fetchConversation = async (id) => {
    try {
        const response = await apiClient.get(`/conversation/${id}`);
        return response.data;
    } catch (error) {
        console.error('API Error: fetchConversation', error);
        throw error;
    }
};

/**
 * Clear all dashboard data for a user.
 */
export const clearDashboardData = async () => {
    try {
        const response = await apiClient.delete('/dashboard/clear');
        return response.data;
    } catch (error) {
        console.error('API Error: clearDashboardData', error);
        throw error;
    }
};

/**
 * Delete a specific conversation history item.
 */
export const deleteConversation = async (id) => {
    try {
        const response = await apiClient.delete(`/conversation/${id}`);
        return response.data;
    } catch (error) {
        console.error('API Error: deleteConversation', error);
        throw error;
    }
};

/**
 * Auth APIs
 */
export const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

export const getMe = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};

export const updateDashboardInsight = async (insightId, payload) => {
    const response = await apiClient.put(`/dashboard/insight/${insightId}`, payload);
    return response.data;
};

export default apiClient;
