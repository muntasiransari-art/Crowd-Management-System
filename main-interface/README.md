<div align="center">

# 🛡️ PilgrimGuard

### AI-Powered Crowd Management System for Pilgrimage Sites

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

_Bridging pilgrims, temple management, security, and medical units in one modern, real-time web application._

---

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Dashboards](#-dashboards) • [API](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**PilgrimGuard** is a comprehensive, AI-assisted crowd management system designed to tackle the challenges faced by India's major pilgrimage sites. The platform ensures **safety**, **convenience**, and a **seamless spiritual experience** for millions of devotees through intelligent slot-based entry, real-time crowd monitoring, and instant emergency response.

### 🎯 Problem We Solve

- 🚷 **Overcrowding** at peak hours and festivals
- ⏳ **Long queues** causing pilgrim fatigue
- ⚠️ **Safety risks** during crowd surges
- 🏥 **Slow emergency response** to medical incidents
- 📊 **Inefficient resource deployment** of staff and security

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📱 Pilgrim App

- 🎫 **Slot Booking** with calendar & time selection
- 📲 **QR Code Tickets** for seamless entry
- ♿ **Priority Access** for elderly, differently-abled, and women with children
- 🗺️ **Live Temple Map** with zone-wise crowd heatmap
- 🆘 **Emergency SOS** button with location tracking
- 🤖 **AI Assistant** for real-time help and guidance
- 🔔 **Smart Notifications** for entry times and crowd updates

</td>
<td width="50%">

### 🖥️ Temple Dashboard

- 📊 **Real-time Analytics** and daily reports
- 🌡️ **Live Heatmap** with zone density monitoring
- 🚪 **Entry Gate Controls** with QR scanning
- 📅 **Slot Capacity Management**
- ✅ **Priority Request Approvals**
- 📢 **Alerts & Announcements** console
- 🧠 **AI-Generated Insights** for crowd behavior

</td>
</tr>
<tr>
<td width="50%">

### 👮 Security Dashboard

- 🚨 **Early Warning System** for overcrowding
- 📍 **SOS Incident Management** with live tracking
- 👥 **Personnel Deployment** panel
- 🛣️ **AI Route Suggestions** for emergencies
- 📝 **Incident Reporting** workflow
- ⏱️ **Timeline of Events** logging

</td>
<td width="50%">

### ⛑️ Medical Dashboard

- 🏥 **Medical Booth** availability tracking
- 🚑 **Ambulance Tracking** on live map
- 🆘 **SOS Case Workflow** management
- 📋 **AI Emergency SOP** generator
- 💊 **First-aid Resource** monitoring
- 📊 **Medical Incident Logs**

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br>Next.js 16
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br>React 19
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=typescript" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind v4
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=mongodb" width="48" height="48" alt="MongoDB" />
<br>MongoDB
</td>
<td align="center" width="96">
<img src="https://ui.shadcn.com/favicon.ico" width="48" height="48" alt="shadcn/ui" />
<br>shadcn/ui
</td>
</tr>
</table>

| Category                 | Technologies                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| **Frontend**             | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Maps & Visualization** | React Leaflet, Recharts                                                                  |
| **Backend**              | Next.js API Routes, MongoDB Atlas (Mongoose)                                             |
| **Real-time**            | Socket.IO (planned), Server Actions                                                      |
| **AI Integration**       | Google Generative AI (Gemini)                                                            |
| **Authentication**       | Clerk (JWT-based, Role management)                                                       |
| **Utilities**            | date-fns, nanoid, uuid, QRCode.react, html5-qrcode                                       |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ or **Bun** (recommended)
- **MongoDB Atlas** account
- **Clerk** account for authentication
- **Google AI** API key (for AI features)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Manav-Chudasama/pilgrimguard.git
cd pilgrimguard
```

2. **Install dependencies**

```bash
bun install
# or
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Optional: Cloudinary for image uploads
CLOUDINARY_URL=your_cloudinary_url
```

4. **Seed the database**

```bash
# Seed common data (temples, zones, etc.)
bun run seed:common

# Seed dummy data for testing
bun run seed:dummy
```

5. **Start the development server**

```bash
bun dev
# or
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📊 Dashboards

PilgrimGuard provides role-based dashboards for different user types:

| Role                | Dashboard Path | Access Level                              |
| ------------------- | -------------- | ----------------------------------------- |
| 🙏 **Pilgrim**      | `/pilgrim/*`   | Book slots, view tickets, SOS alerts      |
| 🛕 **Temple Staff** | `/temple/*`    | Manage slots, zones, approvals, analytics |
| 👮 **Security**     | `/security/*`  | Crowd monitoring, incident management     |
| ⛑️ **Medical**      | `/medical/*`   | Emergency response, resource tracking     |

---

## 🔌 API Endpoints

### Core APIs

| Endpoint                | Method              | Description                 |
| ----------------------- | ------------------- | --------------------------- |
| `/api/pilgrim/tickets`  | GET/POST            | Manage pilgrim tickets      |
| `/api/pilgrim/sos`      | POST                | Trigger emergency SOS       |
| `/api/temple/slots`     | GET/POST/PUT/DELETE | Slot CRUD operations        |
| `/api/temple/zones`     | GET                 | Fetch temple zones          |
| `/api/temple/analytics` | GET                 | Dashboard analytics         |
| `/api/security/alerts`  | GET                 | Security alerts feed        |
| `/api/medical/sos`      | GET                 | Medical SOS cases           |
| `/api/ai/insights`      | POST                | AI-generated crowd insights |

---

## 📁 Project Structure

```
pilgrimguard/
├── public/
│   └── images/          # Static images and assets
├── scripts/             # Database seeding scripts
├── src/
│   ├── app/
│   │   ├── (auth)/      # Authentication pages
│   │   ├── (dashboard)/ # Role-based dashboards
│   │   │   ├── pilgrim/
│   │   │   ├── temple/
│   │   │   ├── security/
│   │   │   └── medical/
│   │   └── api/         # API routes
│   ├── components/      # Reusable UI components
│   │   └── ui/          # shadcn/ui components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── models/          # Mongoose schemas
├── .env.local           # Environment variables
└── package.json
```

---

## 🤖 AI Capabilities

PilgrimGuard leverages **Google Generative AI** for intelligent features:

| Feature               | Description                                     |
| --------------------- | ----------------------------------------------- |
| **Crowd Insights**    | Natural-language explanations of crowd behavior |
| **Predictive Alerts** | Forecasting overcrowding before it happens      |
| **Emergency SOP**     | Auto-generated standard operating procedures    |
| **AI Assistant**      | Natural language help for pilgrims and staff    |

---

## 🧪 Available Scripts

```bash
# Development
bun dev              # Start development server

# Build
bun build            # Build for production
bun start            # Start production server

# Linting & Formatting
bun lint             # Run Biome linter
bun format           # Format code with Biome

# Database Seeding
bun run seed:common    # Seed common data
bun run seed:pilgrim   # Seed pilgrim data
bun run seed:temple    # Seed temple data
bun run seed:medical   # Seed medical data
bun run seed:security  # Seed security data
bun run seed:dummy     # Seed all dummy data
```

---

## 🎨 Design System

PilgrimGuard uses a carefully crafted design system:

- **UI Components**: Built with [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: Powered by [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theming**: Dark mode support with `next-themes`
- **Colors**: Custom CSS variables in `globals.css`

---

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Manav-Chudasama/pilgrimguard)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

- **Railway**: Full-stack deployment with MongoDB
- **Render**: Alternative hosting option
- **Docker**: Containerized deployment (coming soon)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Built with ❤️ for safer pilgrimages

**[⬆ Back to top](#️-pilgrimguard)**

</div>
