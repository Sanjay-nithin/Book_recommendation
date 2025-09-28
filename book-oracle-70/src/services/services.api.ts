import { User, Book, LoginRequest, RegisterRequest, DashboardStats } from '@/types/api';

const API_BASE = "https://book-recommendation-g5gx.onrender.com/api";

// 🛠️ Store tokens + user
function setSession(access: string, refresh: string, user: User) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}

// Standardize responses
async function handleResponse(res: Response) {
  try {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { ok: false, error: errorData.detail || res.statusText };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err.message || "Unexpected error" };
  }
}

// Refresh access token
async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    if (data.access) {
      localStorage.setItem("access", data.access);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Authenticated fetch
async function authFetch(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem("access");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      token = localStorage.getItem("access");
      console.log("Retrying with token:", token);
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return handleResponse(retryRes);
    }
  }

  return handleResponse(res);
}

export const apiService = {
  // Auth
  async login(credentials: LoginRequest) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await handleResponse(res);

    if (result.ok && result.data) {
      const { access, refresh, user } = result.data;
      setSession(access, refresh, user);
    }
    return result;
  },

  async register(userData: RegisterRequest) {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const result = await handleResponse(res);

    if (result.ok && result.data) {
      const { access, refresh, user } = result.data;
      setSession(access, refresh, user);
    }
    return result;
  },

  async logout() {
    clearSession();
  },

  // Genres
  async getGenres() {
    return authFetch(`${API_BASE}/genres/`);
  },

  async updateUserGenrePreferences(payload: { genres: string[] }) {
    return authFetch(`${API_BASE}/users/preferences/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // Books
  async searchBooks(params: { query?: string }) {
    const queryString = params.query ? `?q=${encodeURIComponent(params.query)}` : "";
    return authFetch(`${API_BASE}/books/search/${queryString}`);
  },

  async getBook(id: number) {
    return authFetch(`${API_BASE}/books/${id}/`);
  },

  async getRecommendedBooks() {
    return authFetch(`${API_BASE}/books/recommended/`);
  },

  async toggleBookSave(bookId: number) {
    return authFetch(`${API_BASE}/books/${bookId}/toggle-save/`, { method: "POST" });
  },

  // Dashboard
  async getDashboardStats() {
    return authFetch(`${API_BASE}/dashboard/`);
  },

  getCurrentUserDetails() {
    return authFetch(`${API_BASE}/users/me/`);
  },

  async getSavedBooks() {
    return authFetch(`${API_BASE}/users/saved-books/`);
  },

  async exploreBooks(params: { offset: number; limit: number }) {
    const queryString = `?offset=${params.offset}&limit=${params.limit}`;
    return authFetch(`${API_BASE}/books/explore/${queryString}`);
  },

  // Admin endpoints
  async getAllUsers() {
    return authFetch(`${API_BASE}/admin/users/`);
  },

  async deleteUser(userId: number) {
    return authFetch(`${API_BASE}/admin/users/${userId}/delete/`, { method: "DELETE" });
  },

  async getAllBooksAdmin(params?: { q?: string; offset?: number; limit?: number }) {
    const { q, offset = 0, limit = 10 } = params || {};
    let url = `${API_BASE}/admin/books/?offset=${offset}&limit=${limit}`;
    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    return authFetch(url);
  },

  async addBookAdmin(bookData: any) {
    return authFetch(`${API_BASE}/books/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
  },

  async editBookAdmin(bookId: number, bookData: any) {
    return authFetch(`${API_BASE}/books/${bookId}/edit/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
  },

  async deleteBookAdmin(bookId: number) {
    return authFetch(`${API_BASE}/books/${bookId}/delete/`, { method: "DELETE" });
  },

  async updateCurrentUser() {
    const result = await this.getCurrentUserDetails();
    if (result.ok && result.data) {
      setSession(localStorage.getItem("access") || "", localStorage.getItem("refresh") || "", result.data);
      return result.data;
    }
    return null;
  },

  // Helpers
  getCurrentUser() {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("access");
  },
};
