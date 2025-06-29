# Bloom A/B Test Demo

A full-stack application demonstrating A/B testing for Bloom app generation pipelines. The project consists of a Next.js frontend with a Flask backend API, featuring real-time analytics dashboard and PostHog integration for event tracking.

## Project Overview

This application allows users to:
- Generate apps using different Bloom pipelines (A/B testing)
- View real-time analytics and statistical significance testing
- Track user selections and pipeline performance
- Monitor A/B test results through an interactive dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- PostHog account and API keys

### Environment Setup
Create a `.env.local` file in the root directory:
```env
PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
PUBLIC_POSTHOG_DOMAIN=https://us.i.posthog.com
POSTHOG_API_KEY=your_posthog_personal_api_key
```

## Frontend (Next.js)

### Technology Stack
- **Framework**: Next.js 13.4.3
- **Language**: TypeScript 5.0.4
- **Styling**: Tailwind CSS 3.3.2
- **Charts**: Recharts 3.0.2
- **Analytics**: PostHog JavaScript SDK

### Key Features
- **Interactive Dashboard**: Real-time A/B test analytics with statistical significance testing
- **Phone Preview**: Visual app preview with A/B test variants
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

### Project Structure
```
app/
├── components/          # Reusable React components
│   ├── AbTestPhonePreview.tsx
│   ├── Chat.tsx
│   ├── PhonePreview.tsx
│   ├── PhonePreviewContainer.tsx
│   └── types.ts
├── dashboard/          # Analytics dashboard
│   └── page.tsx
├── lib/               # Utility functions
├── globals.css        # Global styles
├── layout.tsx         # Root layout
└── page.tsx           # Main app page
```

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Key Components

#### Dashboard (`app/dashboard/page.tsx`)
- Real-time A/B test analytics
- Statistical significance testing (Chi-square test)
- Interactive charts using Recharts
- Time range filtering (1h, 24h, 7d, 30d)

#### Phone Preview (`app/components/PhonePreview.tsx`)
- Visual representation of generated apps
- A/B test variant display
- Selection tracking

### API Integration
The frontend communicates with the Flask backend through Next.js API rewrites:
- Development: `http://127.0.0.1:5328/api/*`
- Production: `/api/*`

## Backend (Flask)

### Technology Stack
- **Framework**: Flask 3.0.3
- **Language**: Python 3.8+
- **CORS**: flask-cors
- **Analytics**: PostHog Python SDK
- **Environment**: python-dotenv

### Key Features
- **A/B Test Logic**: Intelligent pipeline selection and tracking
- **Event Tracking**: PostHog integration for analytics
- **Database Integration**: Flexible database client for app storage
- **RESTful API**: Clean API endpoints for frontend communication

### Project Structure
```
api/
├── index.py              # Main Flask application
├── ab_test.py            # A/B testing logic
├── bloom.py              # Bloom app generation
├── database_client.py    # Database operations
├── datatypes.py          # Data models
├── posthog_client.py     # PostHog integration
├── settings.py           # Configuration
└── resource/             # Static resources
    ├── a/               # Pipeline A resources
    └── b/               # Pipeline B resources
```

### Setup Instructions

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Flask Server**
   ```bash
   cd api
   python index.py
   ```

3. **Environment Variables**
   Ensure your `.env.local` file contains:
   ```env
   PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
   PUBLIC_POSTHOG_DOMAIN=https://us.i.posthog.com
   POSTHOG_API_KEY=your_posthog_personal_api_key
   ```

### API Endpoints

#### `POST /api/app`
Generate apps using Bloom pipelines with A/B testing support.

**Request Body:**
```json
{
  "message": "Create a todo app",
  "user_id": "optional_user_id"
}
```

**Response:**
```json
{
  "apps": [
    {
      "id": "app_id",
      "name": "App Name",
      "description": "App Description",
      "pipeline": "a|b"
    }
  ]
}
```

#### `POST /api/app/selection`
Track user app selections for analytics.

**Request Body:**
```json
{
  "selected_id": "app_id",
  "choices": ["app_id_1", "app_id_2"],
  "app_selections": [
    {"app_id": "app_id_1", "is_selected": true},
    {"app_id": "app_id_2", "is_selected": false}
  ],
  "user_id": "optional_user_id"
}
```

#### `GET /api/abtest/events`
Retrieve A/B test events for dashboard analytics.

**Query Parameters:**
- `after`: ISO timestamp for start date
- `before`: ISO timestamp for end date  
- `limit`: Maximum number of events (default: 100)

#### `GET /api/project-info`
Get PostHog project information.

### A/B Testing Logic

The backend implements sophisticated A/B testing:

1. **Pipeline Selection**: Randomly assigns users to Pipeline A or B
2. **Event Tracking**: Captures all user interactions with PostHog
3. **Statistical Analysis**: Provides chi-square testing for significance
4. **Real-time Analytics**: Dashboard shows live performance metrics

### Database Integration

The `database_client.py` provides a flexible interface for:
- Storing generated apps
- Tracking user selections
- Managing A/B test data

## Development

### Running Both Services

1. **Terminal 1 - Backend**
   ```bash
   cd api
   python index.py
   ```

2. **Terminal 2 - Frontend**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5328

### Development Workflow

1. **Frontend Changes**: Edit files in `app/` directory
2. **Backend Changes**: Edit files in `api/` directory
3. **API Testing**: Use the dashboard or Postman to test endpoints
4. **Analytics**: Monitor PostHog dashboard for event tracking

## Production Deployment

### Frontend Deployment
- Build the Next.js app: `npm run build`
- Deploy to Vercel, Netlify, or your preferred hosting
- Configure environment variables in your hosting platform

### Backend Deployment
- Deploy Flask app to Heroku, Railway, or your preferred hosting
- Set environment variables in your hosting platform
- Ensure CORS is properly configured for production domains

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## License

This project is licensed under the MIT License.
