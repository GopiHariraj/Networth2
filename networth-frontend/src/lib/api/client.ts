import axios from 'axios';

// Dynamically determine API URL based on current hostname
// This allows mobile devices to connect using the network IP
const getApiUrl = () => {
    // 1. Prioritize environment variable
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Browser-side fallback logic
    if (typeof window !== 'undefined') {
        const { hostname, port, origin } = window.location;

        // If we're on localhost:3000 (frontend dev), backend is usually on :3001
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') {
            return 'http://localhost:3001/api';
        }

        // If we are on port 3000 but not localhost (e.g., staging IP:3000), 
        // fallback to :3001 if possible, or relative /api
        if (port === '3000') {
            return `${origin.replace(':3000', ':3001')}/api`;
        }

        // Default: use relative path for Nginx/reverse proxy setups
        // This handles port 80/443 and any custom paths
        return `${origin}/api`;
    }

    // 3. Absolute fallback for SSR
    return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();
console.log('[API Client] Initialized with Base URL:', API_URL);

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 seconds timeout to prevent indefinite hangs
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401) {
            console.warn('[API Client] Unauthorized access - redirecting to login');

            // Clear all auth data
            const savedUser = localStorage.getItem('user');
            let userId: string | null = null;
            try {
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    userId = user.id;
                }
            } catch (e) { }

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            document.cookie = 'token=; path=/; max-age=0';

            if (userId) {
                localStorage.removeItem(`activeGoal_${userId}`);
                localStorage.removeItem(`preferredCurrency_${userId}`);
            }

            // Only redirect if we are not already on the login page
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);


export const authApi = {
    login: (credentials: any) => apiClient.post('/auth/login', credentials),
};

export const usersApi = {
    updateCurrency: (currency: string) => apiClient.put('/users/me/currency', { currency }),
    updateModuleVisibility: (moduleVisibility: any) => apiClient.put('/users/me/module-visibility', { moduleVisibility }),
};

export const transactionsApi = {
    create: (data: any) => apiClient.post('/transactions', data),
    parseSMS: (text: string) => apiClient.post('/transactions/sms', { text }),
    analyzeReceipt: (image: string) => apiClient.post('/transactions/receipt', { image }),
    findAll: () => apiClient.get('/transactions'),
    getDashboard: (params?: any) => apiClient.get('/transactions/dashboard', { params }),
};

export default apiClient;

