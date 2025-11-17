# WhatsApp Campaign Sender

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

A professional, full-stack application for sending WhatsApp campaign messages using the WhatsApp Cloud API. Built with Node.js, Express v5, TypeScript, React 19, PostgreSQL, and Docker.

> **Perfect for**: Marketing campaigns, customer notifications, bulk messaging, and automated WhatsApp communications with delivery tracking and analytics.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Application Structure](#application-structure)
- [API Endpoints](#api-endpoints)
- [Usage Guide](#usage-guide)
- [Technology Stack](#technology-stack)
- [Configuration](#configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- **Campaign Management**: Send WhatsApp messages to multiple contacts with dry-run testing
- **Contact Management**: Upload, manage, and organize contacts with CSV import/export
- **Template System**: Sync and select from your approved WhatsApp templates
- **Per-Country Throttling**: Intelligent rate limiting with separate queues per country code
- **Analytics Dashboard**: Track campaigns, delivery rates, and country-specific statistics
- **Delivery Tracking**: Monitor message status (sent → delivered → read → failed)
- **Webhook Integration**: Receive real-time message status updates

### Technical Features
- **Database-Driven**: PostgreSQL with Drizzle ORM for type-safe queries
- **Rate Limiting**: Configurable per-country limits with p-queue
- **Phone Validation**: E.164 format validation and country code extraction
- **Retry Logic**: Exponential backoff for failed messages
- **Production-Ready**: Docker deployment with health checks
- **Type-Safe**: Full TypeScript implementation (backend + frontend)
- **Modern Stack**: Express v5, React 19, Vite 7, Tailwind CSS v3

## 📦 Prerequisites

Before you begin, ensure you have:

1. **Docker & Docker Compose** installed ([Get Docker](https://docs.docker.com/get-docker/))
2. **WhatsApp Business Account** with approved message templates
3. **Meta Developer Account** with a WhatsApp Business API app ([Create App](https://developers.facebook.com/apps))
4. **Node.js 18+** (if running without Docker)
5. **PostgreSQL 16** (if running without Docker)

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/whatsapp-campaign-sender.git
cd whatsapp-campaign-sender
\`\`\`

### 2. Configure Environment Variables

\`\`\`bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your WhatsApp credentials
\`\`\`

**Required Environment Variables:**

\`\`\`env
# Get these from https://developers.facebook.com/apps
WHATSAPP_TOKEN=your_whatsapp_business_api_token
PHONE_NUMBER_ID=your_phone_number_id
WEBHOOK_VERIFY_TOKEN=your_secure_verify_token

# Optional
BUSINESS_ACCOUNT_ID=your_business_account_id

# Database (can use defaults for development)
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whatsapp_sender
\`\`\`

### 3. Start the Application

\`\`\`bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
\`\`\`

This will start:
- **PostgreSQL** on port 5432
- **Backend API** on port 3000
- **Frontend Web UI** on port 80

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000/health

## 📁 Application Structure

\`\`\`
WhatsAppTool/
├── src/                          # Backend source code
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # Drizzle ORM schema
│   │   ├── index.ts              # Database connection
│   │   └── seed.ts               # Database seeding
│   ├── routes/                   # API routes
│   │   ├── templates.ts          # Template management
│   │   ├── contacts.ts           # Contact management
│   │   ├── countryLimits.ts      # Country limits
│   │   └── analytics.ts          # Analytics endpoints
│   ├── utils/                    # Utility functions
│   │   ├── phone.ts              # Phone number utilities
│   │   └── contactParser.ts      # CSV/vCard parsing
│   ├── index.ts                  # Express app entry
│   ├── sender.ts                 # Campaign sender logic
│   ├── webhook.ts                # Webhook handler
│   ├── whatsapp.ts               # WhatsApp API client
│   ├── contacts.ts               # Contact operations
│   ├── env.ts                    # Environment validation
│   └── types.ts                  # TypeScript types
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── CampaignForm.tsx  # Campaign form
│   │   │   ├── ContactsList.tsx  # Contacts list
│   │   │   ├── ContactsUpload.tsx # Upload contacts
│   │   │   ├── Dashboard.tsx     # Dashboard
│   │   │   └── Layout.tsx        # App layout
│   │   ├── pages/                # Page components
│   │   │   └── Contacts.tsx      # Contacts page
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   └── utils.ts          # Utilities
│   │   └── types/index.ts        # TypeScript types
│   ├── Dockerfile                # Frontend Docker image
│   └── nginx.conf                # Nginx configuration
├── drizzle/                      # Database migrations
├── Dockerfile                    # Backend Docker image
├── docker-compose.yml            # Production Docker Compose
├── docker-compose.dev.yml        # Development Docker Compose
└── README.md                     # This file
\`\`\`

## 🔌 API Endpoints

### Campaigns
- \`POST /send\` - Send campaign messages
- \`POST /webhook\` - WhatsApp webhook endpoint

### Templates
- \`GET /api/templates\` - List all templates
- \`GET /api/templates/sync/whatsapp\` - Sync from WhatsApp

### Contacts
- \`GET /api/contacts\` - List contacts (with pagination)
- \`POST /api/contacts\` - Create contact
- \`POST /api/contacts/upload\` - Upload CSV
- \`GET /api/contacts/export\` - Export to CSV

### Country Limits
- \`GET /api/country-limits\` - List all limits
- \`PUT /api/country-limits/:code\` - Update limit

### Analytics
- \`GET /api/analytics/overview\` - Dashboard statistics
- \`GET /api/analytics/campaigns\` - Campaign history
- \`GET /api/analytics/delivery-rates\` - Delivery breakdown
- \`GET /api/analytics/country-stats\` - Per-country stats
- \`GET /api/analytics/timeline\` - Message delivery timeline

## 📖 Usage Guide

### 1. Upload Contacts

Navigate to the **Contacts** tab and:
1. Click or drag-and-drop a CSV file
2. Choose upload mode (Merge or Replace)
3. Click "Upload Contacts"

**CSV Format:**
\`\`\`csv
phone,opt_in,tags
+972501234567,true,vip-customer
+14155551234,true,premium
\`\`\`

### 2. Send a Campaign

1. Navigate to **Send Campaign** tab
2. Select a template (optional)
3. Set number of recipients
4. Write message body
5. Click **Dry Run** to test
6. Click **Send Campaign** to send

### 3. Monitor Analytics

View the **Dashboard** for:
- Total contacts and campaigns
- Success rates
- Per-country statistics

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express v5
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Validation**: Zod v3
- **Queue Management**: p-queue v8
- **HTTP Client**: Axios
- **Logging**: Pino

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v3
- **Data Fetching**: TanStack Query v5
- **Routing**: React Router v7
- **UI Components**: shadcn/ui, Lucide React

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (for frontend serving)
- **Database Migrations**: Drizzle Kit

## ⚙️ Configuration

### Environment Variables

All configuration is done through environment variables. Copy `.env.example` to `.env` and configure:

#### Required Variables
- \`WHATSAPP_TOKEN\` - Your WhatsApp Business API token
- \`PHONE_NUMBER_ID\` - Your WhatsApp phone number ID
- \`WEBHOOK_VERIFY_TOKEN\` - Secure token for webhook verification
- \`BUSINESS_ACCOUNT_ID\` - Your WhatsApp Business Account ID (optional)

#### Optional Variables
- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/whatsapp_sender`)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: `postgres`)
- `PORT` - Backend server port (default: `3000`)
- `SEND_MAX_PER_SECOND` - Rate limit per country (default: `80`)
- `SEND_CONCURRENCY` - Concurrent requests (default: `15`)
- `RETRY_MAX_ATTEMPTS` - Max retry attempts (default: `3`)
- `RETRY_BASE_MS` - Base retry delay in ms (default: `1000`)

### WhatsApp Setup

1. **Create a Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/apps)
   - Create a new app and add WhatsApp product

2. **Get API Credentials**:
   - Navigate to WhatsApp > API Setup
   - Copy your Phone Number ID and Access Token

3. **Configure Webhook** (Optional):
   - Set webhook URL: `https://your-domain.com/webhook`
   - Set verify token (same as `WEBHOOK_VERIFY_TOKEN` in `.env`)
   - Subscribe to message status updates

4. **Create Message Templates**:
   - Go to WhatsApp > Message Templates
   - Create and get approval for your templates
   - Sync templates in the app

## 💻 Development

### Running Locally (Without Docker)

#### Backend
\`\`\`bash
# Install dependencies
npm install

# Start PostgreSQL (using Docker)
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run db:push

# Start development server with hot reload
npm run dev
\`\`\`

Backend runs on: `http://localhost:3000`

#### Frontend
\`\`\`bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

Frontend runs on: `http://localhost:5173`

### Building for Production

#### Backend
\`\`\`bash
npm run build
npm start
\`\`\`

#### Frontend
\`\`\`bash
cd frontend
npm run build
npm run preview
\`\`\`

### Database Management

\`\`\`bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes directly (development)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
\`\`\`

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify `.env` variables
- Check logs: \`docker-compose logs backend\`

### Messages not sending
- Verify WhatsApp token is valid
- Check template is approved
- Ensure phone numbers are E.164 format
- Check contacts have \`opt_in=true\`

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting contributions.

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/yourusername/whatsapp-campaign-sender/issues) with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) for the messaging platform
- [Drizzle ORM](https://orm.drizzle.team/) for the excellent TypeScript ORM
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/yourusername/whatsapp-campaign-sender/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/whatsapp-campaign-sender/discussions)

---

**Ready to send your first campaign?** Add your WhatsApp API credentials to \`.env\` and run \`docker-compose up\`! 🚀
