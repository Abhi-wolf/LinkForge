# LinkForge - URL Shortener

> **🚧 Work in Progress** - This project is currently under development and may contain incomplete features or bugs.

A modern, feature-rich URL shortener application with analytics, built with React, TypeScript, Node.js, and MongoDB. Includes Model Context Protocol (MCP) server integration for AI-powered URL management.

---

## 🚀 Features

- **URL Shortening**: Create short URLs with custom aliases
- **Analytics**: Comprehensive click tracking and analytics
- **User Authentication**: Secure JWT-based authentication
- **Dashboard**: Beautiful dashboard with charts and insights
- **MCP Integration**: Model Context Protocol server for AI tool integration
- **Responsive Design**: Mobile-first design with dark mode support
- **Docker Support**: Full containerization with Docker Compose

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, ShadCN UI |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB, Redis |
| **Authentication** | JWT (access + refresh tokens) |
| **Analytics** | Custom analytics service with Redis caching |
| **MCP Server** | Model Context Protocol for AI integration |
| **Containerization** | Docker & Docker Compose |

### Project Structure

```
url-shortener/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API services and MCP client
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   └── hooks/          # Custom React hooks
│   └── Dockerfile
├── server/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration files
│   │   ├── utils/          # Utility functions
│   │   ├── queues/         # Queue systems
│   │   ├── workers/        # Background job workers
│   │   ├── producers/      # Queue producers
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── middlewares/    # Express middlewares
│   │   ├── server.ts       # Main server entry point
│   │   └── mcp.server.ts   # MCP server implementation
│   └── Dockerfile
├── compose.yaml            # Docker Compose configuration
└── README.md              # This file
```

---

## 🐳 Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your system
- Git for cloning the repository

### Quick Start

1. **Clone the repository**
   ```bash
   https://github.com/Abhi-wolf/LinkForge.git
   cd LinkForge
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:4000
   - **MCP Server**: http://localhost:4200

### Services

The Docker Compose setup includes:

- **MongoDB** (port 27017): Primary database for URL data
- **Redis** (port 6379): Caching and session storage
- **Server** (ports 4000, 4200): Backend API and MCP server
- **Client** (port 3000): React frontend application

### Environment Variables

The server is configured with the following environment variables in `compose.yaml`:

```yaml
environment:
   -  PORT=4000
   -  DB_URL=mongodb://localhost:27017/url_shortener
   -  REDIS_URL=redis://localhost:6379
   -  REDIS_COUNTER_KEY=url_shortener_counter
   -  BASE_URL=http://localhost:4000
   -  NODE_ENV=development
   -  ANALYTICS_QUEUE=analytics_queue
   -  JWT_ACCESS_SECRET=access_secret_123
   -  JWT_REFRESH_SECRET=refresh_secret_123
   -  ACCESS_TOKEN_EXPIRE=10m
   -  REFRESH_TOKEN_EXPIRE=7d
   -  URL_EXPIRY_SCHEDULER=url_expiry_scheduler
   -  ANALYTICS_DEAD_LETTER_QUEUE=analytics_dead_letter_queue
   -  AGGREGATION_ANALYTICS_SCHEDULER=aggregation_analytics_scheduler
   -  EMAIL_TRANSPORTER=gmail
   -  SMTP_HOST=localhost
   -  SMTP_PORT=587
   -  SMTP_SECURE=false
   -  SMTP_USER=""
   -  SMTP_PASS=""
   -  EMAIL_FROM_ADDRESS=noreply@linkforge.com
   -  EMAIL_FROM_NAME=LinkForge
   -  EMAIL_TEMPLATES_PATH=./src/utils/email-templates
   -  VERIFICATION_TOKEN_EXPIRE=24h
   -  RESET_TOKEN_EXPIRE=30m
   -  EMAIL_REQUEST_RATE_LIMIT=3
   -  CLIENT_URL=http://localhost:3000
```

⚠️ **Security Note**: Update the JWT secrets before deploying to production.

---

## 🔧 MCP Server Integration

### Overview

The Model Context Protocol (MCP) server allows AI assistants to interact with the URL shortener through a standardized interface.

### MCP Server Details

- **URL**: http://localhost:4200
- **Transport**: Server-Sent Events (SSE)
- **Authentication**: API Key middleware

### Available Tools

The MCP server exposes the following tools:

1. **create_short_url**
   - Creates a short URL from an original URL
   - Input: `{ originalUrl: string, tags?: [string],expirationDate?: Date }`

2. **get_original_url**
   - Retrieves the original URL from a short URL ID
   - Input: `{ shortUrl: string }`

3. **get_analytics_info_about_a_url**
   - Retrieves analytics for a specific URL
   - Input: `{ shortUrl: string, startDate: Date, endDate: Date }`

4. **get_all_user_urls**
   - Retrieves all URLs created by the authenticated user
   - Input: No parameters required

### Connecting to MCP Server

#### API Key Authentication

The MCP server requires an API key for authentication. To generate an API key:

1. **Generate API Key** (via your application settings or API)
2. **Use the API Key** in the `x-api-key` header for all MCP requests


#### Using MCP Inspector

1. Install the MCP inspector:
   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=
   ```

3. The inspector UI will allow you to test all available tools.

---

## 📱 Application Features

### Frontend Features

- **Landing Page**: Public URL shortening without authentication
- **User Authentication**: Login and registration with JWT tokens
- **Dashboard**: Overview with KPI cards and charts
- **Link Management**: Create, view, edit, and delete short URLs
- **Analytics**: Detailed click analytics with charts
- **Settings**: Profile management and password change
- **Dark Mode**: System, light, and dark theme support

### Backend Features

- **RESTful API**: Full CRUD operations for URLs
- **Authentication**: JWT-based auth with refresh tokens
- **Analytics**: Click tracking with device and referrer data
- **Caching**: Redis integration for performance
- **Rate Limiting**: API rate limiting and security
- **Health Checks**: Docker health checks for all services

---

### API Endpoints

#### Health Check
- `GET /health-check` - Service health status

#### MCP Server
- `GET /sse` - SSE connection endpoint (requires `x-api-key` header)
- `POST /messages` - Message handling endpoint (requires `x-api-key` header)

---

## 🛠️ Development

### Local Development Setup

1. **Install dependencies**
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd server
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # In server directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start databases**
   ```bash
   docker-compose up mongo redis -d
   ```

4. **Run development servers**
   ```bash
   # Backend (in server directory)
   npm run dev

   # Frontend (in client directory)
   npm run dev
   ```

### Building for Production

```bash
# Build frontend
cd client
npm run build

# Build backend
cd server
npm run build
```

---

## 📊 Monitoring & Health Checks

The Docker Compose setup includes health checks for all services:

- **MongoDB**: Database connectivity check
- **Redis**: Redis ping check
- **Server**: HTTP health check endpoint

Health status can be checked with:
```bash
docker-compose ps
```

---

## 🔒 Security Considerations

- JWT secrets should be changed in production
- **API keys should be kept secure and rotated regularly**
- **Never expose API keys in client-side code or public repositories**
- Database credentials should use environment variables
- HTTPS should be enabled in production
- Rate limiting is implemented for API endpoints
- MCP server connections require valid API key via `x-api-key` header

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


---

**Built with ❤️ using modern web technologies**
