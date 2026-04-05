import axios from 'axios';

// Get the base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * Fetch dashboard-wide analytics for a specific user.
 * @param {string} user_id - The ID of the authenticated user.
 */
export const fetchDashboardData = async (user_id = 'test_user_123') => {
    try {
        const response = await apiClient.get(`/dashboard`, {
            params: { user_id }
        });
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
            formData.append('user_id', payload.user_id);
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
 * @param {string} user_id - The ID of the authenticated user.
 */
export const fetchHistory = async (user_id = 'test_user_123') => {
    try {
        const response = await apiClient.get('/conversation/history', {
            params: { user_id }
        });
        return response.data;
    } catch (error) {
        console.error('API Error: fetchHistory', error);
        throw error;
    }
};

/**
 * Clear all dashboard data for a user.
 * @param {string} user_id - The ID of the authenticated user.
 */
export const clearDashboardData = async (user_id = 'test_user_123') => {
    try {
        const response = await apiClient.delete('/dashboard/clear', {
            data: { user_id }
        });
        return response.data;
    } catch (error) {
        console.error('API Error: clearDashboardData', error);
        throw error;
    }
};

export default apiClient;
