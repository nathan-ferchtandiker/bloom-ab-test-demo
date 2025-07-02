# Bloom A/B Test Demo

## What is this Demo?

This demo showcases how to evaluate code generation pipelines for Bloom using PostHog analytics. Two pipelines (A and B) generate mobile apps, which are simulated by images of mobile app screens. Users are presented with these app variants and asked to select which app they think is better. All user selections and interactions are tracked with PostHog. Additionally, the application features a dashboard that pulls data from PostHog and displays analytics—including statistical significance testing—to determine whether pipeline B (the new pipeline) performs better than pipeline A (the old pipeline).

A full-stack application demonstrating A/B testing for Bloom app generation pipelines. The project consists of a Next.js frontend with a Node.js/TypeScript backend API, featuring real-time analytics dashboard and PostHog integration for event tracking.

## Project Overview

This application allows users to:
- Generate apps using different Bloom pipelines (A/B testing)
- View real-time analytics and statistical significance testing
- Track user selections and pipeline performance
- Monitor A/B test results through an interactive dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
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

## Backend (Node.js/TypeScript)

### Technology Stack
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.0.4
- **CORS**: cors middleware
- **Analytics**: PostHog HTTP API integration
- **Environment**: dotenv
- **Build Tool**: tsx for development, tsc for production

### Key Features
- **A/B Test Logic**: Intelligent pipeline selection and tracking
- **Event Tracking**: PostHog integration for analytics
- **Database Integration**: Flexible database client for app storage
- **RESTful API**: Clean API endpoints for frontend communication

### Project Structure
```
api/
├── index.ts              # Main Express application
├── ab-test.ts            # A/B testing logic
├── bloom.ts              # Bloom app generation
├── database-client.ts    # Database operations
├── datatypes.ts          # Data models
├── posthog-client.ts     # PostHog integration
├── settings.ts           # Configuration
├── tsconfig.json         # TypeScript configuration
└── resroucre/            # Static resources
    ├── a/               # Pipeline A resources
    └── b/               # Pipeline B resources
```

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run api-dev
   ```

3. **Build for Production**
   ```bash
   npm run api-build
   npm run api-start
   ```

4. **Run Both Frontend and Backend**
   ```bash
   npm run dev:full
   ```

5. **Environment Variables**
   Ensure your `.env.local` file contains:
   ```env
   PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
   PUBLIC_POSTHOG_DOMAIN=https://us.i.posthog.com
   PRIVATE_POSTHOG_KEY=your_posthog_private_api_key
   POSTHOG_PERSONAL_API_KEY=your_posthog_personal_api_key
   POSTHOG_PROJECT_ID=your_posthog_project_id
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

## Deployment

### Vercel Deployment

1. **Deploy to Vercel**
   ```bash
   # Push your code to GitHub, then connect to Vercel
   # Vercel will automatically deploy both frontend and API functions
   ```

2. **Environment Variables**
   Set these in your Vercel project settings:
```env
PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
PUBLIC_POSTHOG_DOMAIN=https://us.i.posthog.com
PRIVATE_POSTHOG_KEY=your_posthog_private_api_key
POSTHOG_PERSONAL_API_KEY=your_posthog_personal_api_key
POSTHOG_PROJECT_ID=your_posthog_project_id
```

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run api-dev` - Start API development server with hot reload
- `npm run dev:full` - Start both frontend and backend in development
- `npm run api-build` - Build TypeScript API for production
- `npm run api-start` - Start production API server
- `npm run build` - Build Next.js application
- `npm start` - Start production Next.js server

The backend implements A/B testing with the following approach:

1. **A/B Test Decision**: Each request has a 50% chance of triggering an A/B test (controlled by `is_ab_test()` function)
2. **Dual Pipeline Generation**: When A/B testing is enabled, the system generates apps from BOTH Pipeline A and Pipeline B simultaneously
3. **Single Pipeline Fallback**: When A/B testing is disabled, only Pipeline A (default) is used to generate a single app
4. **Randomization**: The order of apps is shuffled to prevent position bias in the UI
5. **Event Tracking**: All user interactions are captured with PostHog for analytics
6. **Statistical Analysis**: The dashboard provides chi-square testing to determine significance between pipeline performance

### Database Simulation

The backend uses an in-memory database simulation for demonstration purposes:

#### Storage Structure
```python
storage = {
    "bloom_apps": {
        "image_hash": {
            "id": str,           # SHA256 hash of the image
            "image": str,        # Base64 encoded image data URL
            "origin_pipeline": str  # Pipeline name (a/b)
        }
    },
    "pipeline_ids": [str]        # List of unique pipeline names
}
```

#### Key Features
- **In-Memory Storage**: Uses Python dictionaries to simulate a real database
- **Image Preloading**: Automatically loads all PNG images from `api/resroucre/` directory on startup
- **Hash-Based IDs**: Each app gets a unique SHA256 hash based on its image content
- **Pipeline Tracking**: Associates each app with its source pipeline (A or B)
- **Base64 Encoding**: Images are stored as data URLs for easy frontend consumption

#### Database Operations
- **`create(key, value)`**: Store a new key-value pair
- **`read(query)`**: Supports single key, multiple keys, or dict-based filtering
- **`update(key, value)`**: Update existing entries
- **`delete(key)`**: Remove entries
- **`add_app(app)`**: Add a new Bloom app to the apps database
- **`read_apps()`**: Retrieve all stored apps

#### Initialization Process
1. **Scan Resource Directory**: Reads all PNG files from `api/resroucre/a/` and `api/resroucre/b/`
2. **Generate Hashes**: Creates SHA256 hashes for each image as unique identifiers
3. **Encode Images**: Converts images to base64 data URLs
4. **Store Metadata**: Saves app information with pipeline association
5. **Pipeline Discovery**: Automatically detects available pipelines

#### Usage in A/B Testing
- **App Generation**: When creating new apps, they're stored in the in-memory database
- **Pipeline Assignment**: Each app is tagged with its source pipeline for analytics
- **Selection Tracking**: User selections are tracked against stored app IDs
- **Dashboard Data**: The analytics dashboard reads from this simulated database

**Note**: This is a demonstration implementation. In production, you would replace this with a real database like PostgreSQL, MongoDB, or a cloud database service.

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