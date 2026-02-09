import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const generateIdempotencyKey = (): string =>
  `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and idempotency key
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = config.method?.toLowerCase();
    if (method && MUTATING_METHODS.has(method) && !config.headers['X-Idempotency-Key']) {
      config.headers['X-Idempotency-Key'] = generateIdempotencyKey();
    }
  } catch (error) {
    console.error('Error preparing request:', error);
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);
