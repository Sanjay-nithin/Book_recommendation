// Simplified types for Django REST integration

export interface Genre {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  favorite_genres: Genre[];
  saved_books: number[];
  created_at: string;
  updated_at: string;
  preferred_language: string;
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
  preview_url: string;
  buy_now_url: string;
  download_url: string;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}


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
  books_added_today: number;
  avg_rating: number;
  most_popular_genres: string[]; // simple strings
  recent_searches: string[];
  top_rated_books: Book[];
}
