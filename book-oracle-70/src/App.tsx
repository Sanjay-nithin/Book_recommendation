import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import Navbar from "./components/layout/Navbar";
import ScrollToTop from "./components/feed/ScrollToTop";
import HomePage from "./pages/HomePage";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import GenrePreferences from "./components/auth/GenrePreferences";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";
import ExploreBooks from "./pages/ExploreBooks";
import BookDetail from "./pages/BookDetail";
import PdfViewer from "./pages/PdfViewer";
import { apiService } from "./services/services.api";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const isAuthenticated = apiService.isAuthenticated();
  const currentUser = apiService.getCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !currentUser?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = apiService.isAuthenticated();
  const currentUser = apiService.getCurrentUser();

  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.is_admin ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              {/* Public Auth Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterForm />
                </PublicRoute>
              } />
              <Route path="/preferences" element={<GenrePreferences />} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              <Route path="/explore" element={
                <ProtectedRoute>
                  <ExploreBooks />
                </ProtectedRoute>
              } />
              <Route path="/books/:bookId" element={
                <ProtectedRoute>
                  <BookDetail />
                </ProtectedRoute>
              } />

              {/* PDF Preview (Protected) */}
              <Route path="/preview" element={
                <ProtectedRoute>
                  <PdfViewer />
                </ProtectedRoute>
              } />

              {/* Protected Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
