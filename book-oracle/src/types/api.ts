// Simplified types for Django REST integration

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user: number;
  favorite_genres: string[]; // simple string list
  saved_books: number[];
  preferences: {
    language?: string;
    notifications_enabled?: boolean;
  };
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description: string;
  cover_image: string;
  publish_date: string;
  rating: number;
  liked_percentage: number;
  genres: string[]; // simple string list
  language: string;
  page_count: number;
  publisher: string;
  created_at: string;
  updated_at: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface LoginRequest { email: string; password: string }

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface BookSearchParams {
  query?: string;
  genre?: string;
  language?: string;
  rating_min?: number;
  year_from?: number;
  year_to?: number;
  page?: number;
  limit?: number;
}

export interface BookSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Book[];
}

export interface DashboardStats {
  total_books: number;
  total_users: number;
  most_popular_genres: string[]; // simple strings
  recent_searches: string[];
  top_rated_books: Book[];
}
