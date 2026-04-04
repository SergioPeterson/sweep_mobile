import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3050';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

const getFallbackToken = async () => {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    // SecureStore not available (e.g. web)
    return null;
  }
};

apiClient.interceptors.request.use(async (config) => {
  const token = getToken ? await getToken() : await getFallbackToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
