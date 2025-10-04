import { User, Book, LoginRequest, RegisterRequest, DashboardStats } from '@/types/api';

// Allow overriding base URL via Vite env (import.meta.env.VITE_API_BASE) and
// default to http on localhost to avoid browser SSL issues in dev.
const DEFAULT_LOCAL = "http://127.0.0.1:8000/api";
const API_BASE = (typeof (import.meta as any) !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE)
  ? (import.meta as any).env.VITE_API_BASE
  : DEFAULT_LOCAL;

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
      return { ok: false, error: errorData.detail || errorData.error || res.statusText };
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

  try {
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
  } catch (err: any) {
    // Network or protocol error (e.g. SSL issue). Return structured error so
    // callers don't get Uncaught (in promise) TypeError: Failed to fetch.
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export const apiService = {
  // Auth
  async login(credentials: LoginRequest) {
    try {
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
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error' };
    }
  },

  async register(userData: RegisterRequest) {
    try {
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
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error' };
    }
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

  // Password reset
  async forgotPassword(email: string) {
    return authFetch(`${API_BASE}/auth/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(email: string, otp: string) {
    return authFetch(`${API_BASE}/auth/verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
  },

  async resetPassword(email: string, otp_id: number, new_password: string) {
    return authFetch(`${API_BASE}/auth/reset-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_id, new_password }),
    });
  },

  getCurrentUserDetails() {
    return authFetch(`${API_BASE}/users/me/`);
  },

  async getSavedBooks() {
    return authFetch(`${API_BASE}/users/saved-books/`);
  },

  async exploreBooks(params: { 
    offset: number; 
    limit: number;
    author?: string;
    isbn?: string;
    genre?: string;
    published_year?: string;
    publisher?: string;
    language?: string;
  }) {
    const { offset, limit, author, isbn, genre, published_year, publisher, language } = params;
    
    let queryString = `?offset=${offset}&limit=${limit}`;
    if (author) queryString += `&author=${encodeURIComponent(author)}`;
    if (isbn) queryString += `&isbn=${encodeURIComponent(isbn)}`;
    if (genre) queryString += `&genre=${encodeURIComponent(genre)}`;
    if (published_year) queryString += `&published_year=${encodeURIComponent(published_year)}`;
    if (publisher) queryString += `&publisher=${encodeURIComponent(publisher)}`;
    if (language) queryString += `&language=${encodeURIComponent(language)}`;
    
    return authFetch(`${API_BASE}/books/explore/${queryString}`);
  },
  
  async getFilterOptions() {
    return authFetch(`${API_BASE}/books/filter-options/`);
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
    // Convert frontend camelCase fields to backend snake_case for consistency
    const payload = {
      ...bookData,
      buy_now_url: bookData.buyNowUrl ?? bookData.buy_now_url ?? '',
      preview_url: bookData.previewUrl ?? bookData.preview_url ?? '',
      download_url: bookData.downloadUrl ?? bookData.download_url ?? '',
    };

    // Remove camelCase keys to avoid duplicate/conflicting fields
    delete (payload as any).buyNowUrl;
    delete (payload as any).previewUrl;
    delete (payload as any).downloadUrl;

    return authFetch(`${API_BASE}/books/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async editBookAdmin(bookId: number, bookData: any) {
    const payload = {
      ...bookData,
      buy_now_url: bookData.buyNowUrl ?? bookData.buy_now_url ?? undefined,
      preview_url: bookData.previewUrl ?? bookData.preview_url ?? undefined,
      download_url: bookData.downloadUrl ?? bookData.download_url ?? undefined,
    };

    // remove camelCase to avoid duplicates
    delete (payload as any).buyNowUrl;
    delete (payload as any).previewUrl;
    delete (payload as any).downloadUrl;

    return authFetch(`${API_BASE}/books/${bookId}/edit/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async deleteBookAdmin(bookId: number) {
    return authFetch(`${API_BASE}/books/${bookId}/delete/`, { method: "DELETE" });
  },

  // Admin: Genres
  async addGenreAdmin(payload: { name?: string; names?: string[] }) {
    return authFetch(`${API_BASE}/admin/genres/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // Admin: CSV import
  async importBooksCsv(file: File) {
    const form = new FormData();
    form.append('file', file);
    // Do not set Content-Type; browser will set multipart boundary
    return authFetch(`${API_BASE}/admin/books/import-csv/`, {
      method: 'POST',
      body: form,
    });
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
