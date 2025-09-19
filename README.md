# 📚 Book Oracle - Book Recommendation System

A modern full-stack book recommendation application built with Django REST Framework and React, featuring advanced search, personalized recommendations, and an intuitive user interface.

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login with JWT authentication
- Role-based access (User/Admin dashboards)
- Secure API endpoints with token-based authentication

### 📖 Core Functionality
- **Personalized Book Recommendations**: AI-powered suggestions based on favorite genres
- **Live Search**: Real-time book search by title or author with debounced input
- **Book Exploration**: Infinite scroll pagination through book catalog
- **Book Details**: Comprehensive book information with rich details
- **User Preferences**: Genre selection and customization options
- **Saved Books**: Bookmark favorite books for later

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Theme Support**: Built with TailwindCSS
- **Animated Components**: Smooth transitions and loading states
- **Intuitive Navigation**: Breadcrumb navigation and clear page hierarchy

### 🛠️ Technical Features
- **RESTful API**: Well-documented endpoints with proper error handling
- **Pagination**: Efficient data loading with offset/limit pagination
- **Debounced Search**: Optimized search experience with debouncing
- **State Management**: React hooks for efficient state handling

## 🏗️ Architecture

### Backend (Django + DRF)
```
backend/
├── books/
│   ├── models.py          # Book, User, Genre models
│   ├── views.py           # API endpoints and business logic
│   ├── serializers.py     # Data serialization
│   ├── urls.py           # URL routing
│   └── migrations/       # Database migrations
├── backend/
│   ├── settings.py       # Django configuration
│   └── urls.py          # Main URL routing
└── requirements.txt      # Python dependencies
```

### Frontend (React + TypeScript)
```
book-oracle-70/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── auth/        # Authentication forms
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   │   ├── BookDetail.tsx      # Individual book view
│   │   ├── ExploreBooks.tsx    # Book exploration
│   │   ├── SearchPage.tsx      # Search interface
│   │   ├── UserDashboard.tsx   # User dashboard
│   │   └── AdminDashboard.tsx  # Admin dashboard
│   ├── services/        # API service layer
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main app component
├── package.json        # Node dependencies
└── tailwind.config.ts  # Tailwind configuration
```

## 📋 Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm** or **bun**: For package management
- **PostgreSQL**: For production database (SQLite works for development)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjay-nithin/Book_recommendation.git
cd Book_recommendation
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Database
The project uses SQLite for development by default. To change database settings, edit `backend/backend/settings.py`.

#### Start Django Server
```bash
python manage.py runserver 8000
```
**Server will be available at:** `http://127.0.0.1:8000`

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd book-oracle-70
npm install
```

#### Start Development Server
```bash
npm run dev
```
**Frontend will be available at:** `http://localhost:8081`

## 🚀 Running the Application

### Separate Terminal Windows:

#### Terminal 1 - Backend (Django)
```bash
cd backend
python manage.py runserver 8000
```

#### Terminal 2 - Frontend (React)
```bash
cd book-oracle-70
npm run dev
```

## Creating Admin User
### In Backend Terminal (Book_Recommendation\backend)
```bash
python manage.py createsuperuser
```
Then fill the details that you are prompted for and sign in using the email and password you have given to create a superuser and

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/register/` | User registration |
| GET | `/api/books/recommended/` | Personalized recommendations |
| GET | `/api/books/search/?q=<query>` | Search books |
| GET | `/api/books/explore/?offset=0&limit=10` | Explore books with pagination |
| GET | `/api/books/<book_id>/` | Get individual book details |
| POST | `/api/books/<book_id>/toggle-save/` | Save/unsave a book |
| GET | `/api/users/me/` | Get current user details |
| GET | `/api/users/saved-books/` | Get user's saved books |
| PUT | `/api/users/preferences/` | Update user genre preferences |

## 🎯 Key Components

### Frontend Pages
- **HomePage**: Landing page with authentication links
- **UserDashboard**: Main user interface with recommendations and saved books
- **SearchPage**: Live search with debounced input
- **ExploreBooks**: Infinite scroll book discovery
- **BookDetail**: Individual book information page

### Backend Models
- **User**: Custom user model with genre preferences
- **Book**: Comprehensive book model with metadata
- **Genre**: Book categorization system


## 🗄️ Database Schema

### Book Model
- title, author, isbn, description
- cover_image, publish_date, rating
- genres (JSONField), page_count, publisher
- language, created_at, updated_at

### User Model
- Personal info (name, email, username)
- favorite_genres (ManyToMany to Genre)
- saved_books (ManyToMany to Book)
- preferences (language, notifications)

### Genre Model
- name (unique)
- users (ManyToMany relationship)

## 🎨 Styling & Components

- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: TailwindCSS with custom animations
- **Icons**: Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router with protected routes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Sanjay Nithin** - *Developer & Creator*

## 🙏 Acknowledgments

- Open Library API and GoodReads for book data inspiration
- Shadcn/ui for the excellent component library
- Django REST Framework community
- All contributors to the open-source ecosystem

---

**⭐ If you found this project helpful, please consider starring the repository!**
