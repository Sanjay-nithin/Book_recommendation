import { 
  User, Book, Genre, AuthResponse, LoginRequest, RegisterRequest,
  GenrePreferencesRequest, BookSearchParams, BookSearchResponse,
  DashboardStats 
} from "@/types/api";

const API_BASE = "http://127.0.0.1:8000/api";

// ---- Token helpers ----
const getAccessToken = () => localStorage.getItem("auth_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("auth_token", access);
  localStorage.setItem("refresh_token", refresh);
};

const clearTokens = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
};

// ---- Refresh token logic ----
const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  setTokens(data.access, refresh);
  return data.access;
};

// ---- Fetch wrapper for protected routes ----
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let access = getAccessToken();

  const request = async (token?: string) => fetch(url, {
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  let response = await request(access);

  // Retry once if token expired
  if (response.status === 401 && getRefreshToken()) {
    access = await refreshAccessToken();
    response = await request(access);
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "API request failed");
  }

  return response.json();
};

// ---- Fetch wrapper for public routes ----
const fetchPublic = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "API request failed");
  }

  return res.json();
};

// ---- API Service ----
export const apiService = {
  // ---- Auth ----
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const data = await fetchPublic(`${API_BASE}/auth/login/`, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const data = await fetchPublic(`${API_BASE}/auth/register/`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  async logout(): Promise<void> {
    clearTokens();
  },

  // ---- Genres (public) ----
  async getGenres(): Promise<Genre[]> {
    return fetchPublic(`${API_BASE}/genres/`);
  },

  // ---- User (protected) ----
  async getCurrentUser(): Promise<User> {
    return fetchWithAuth(`${API_BASE}/user/profile/`);
  },

  async updateUserGenrePreferences(preferences: GenrePreferencesRequest): Promise<void> {
    await fetchWithAuth(`${API_BASE}/user/preferences/genres/`, {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  },

  // ---- Books (protected) ----
  async searchBooks(params: BookSearchParams): Promise<BookSearchResponse> {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`${API_BASE}/books/search/?${query}`);
  },

  async getBook(id: number): Promise<Book> {
    return fetchWithAuth(`${API_BASE}/books/${id}/`);
  },

  async getRecommendedBooks(id: number): Promise<Book[]> {
    return fetchWithAuth(`${API_BASE}/books/recommended/?id=${id}`);
  },  

  async toggleBookSave(bookId: number): Promise<void> {
    await fetchWithAuth(`${API_BASE}/books/${bookId}/toggle-save/`, { method: "POST" });
  },

  // ---- Dashboard (protected) ----
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchWithAuth(`${API_BASE}/dashboard/stats/`);
  },

  isAuthenticated(): boolean {
    return !!getAccessToken();
  },
};
