# Full-Stack Portfolio Application

A production-ready Full-Stack Developer Portfolio decomposed from a monolithic single-file HTML page into a modular frontend, Express REST API, and SQLite database.

## Architecture Overview

```
Portfolio/
├── client/                      # FRONTEND PRESENTATION LAYER
│   ├── index.html               # Clean semantic HTML structure
│   ├── css/
│   │   ├── variables.css        # Design tokens (colors, typography, spacing)
│   │   ├── base.css             # Resets, layout defaults, section rules
│   │   ├── admin.css            # Admin portal stylesheet
│   │   └── components/          # Isolated component stylesheets
│   │       ├── loader.css       # Terminal boot sequence styles
│   │       ├── nav.css          # Navigation bar styles
│   │       ├── hero.css         # Hero section & manifesto styles
│   │       ├── work.css         # Projects grid styles
│   │       ├── process.css      # Engineering methodology styles
│   │       └── contact.css      # Inquiry form & contact card styles
│   ├── js/
│   │   ├── api.js               # Client API wrapper (REST calls)
│   │   ├── loader.js            # Boot ritual & loader timeline
│   │   ├── canvas3d.js          # Three.js 3D wireframe icosahedrons
│   │   ├── animations.js        # GSAP & ScrollTrigger bindings
│   │   └── main.js              # Application bootstrapper & DOM hydration
│   └── admin/                   # ADMIN CONTROL CENTER
│       ├── index.html           # Inquiries inbox & project management
│       └── admin.js             # Admin dashboard logic
├── server/                      # BACKEND API LAYER
│   ├── server.js                # Express app entry & static file server
│   ├── config/
│   │   └── db.js                # SQLite database setup & auto-seeder
│   ├── controllers/
│   │   ├── projectController.js # CRUD operations for projects
│   │   ├── contactController.js # Inquiry validation & persistence
│   │   └── profileController.js # Profile data management
│   ├── routes/
│   │   ├── projectRoutes.js     # /api/projects routes
│   │   ├── contactRoutes.js     # /api/contact routes
│   │   └── profileRoutes.js     # /api/profile routes
│   ├── middleware/
│   │   └── errorHandler.js      # Global error handler
│   └── test.js                  # Automated test suite
├── data/                        # PERSISTENCE LAYER
│   └── portfolio.sqlite         # SQLite database file
├── portfolio.html               # Original source HTML (preserved)
├── package.json                 # Project dependencies & scripts
├── .env.example                 # Environment variables template
└── README.md
```

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run the Development Server
```bash
npm start
```
The server will start on **`http://localhost:3000`**.

### 3. Run Automated Tests
```bash
npm test
```

---

## Features & Endpoints

### 🌐 Frontend
- **Main Portfolio (`/`)**: Dynamically loads projects from the database, renders interactive 3D WebGL background, and accepts contact form inquiries.
- **Admin Portal (`/admin`)**: Inspect incoming inquiries, delete messages, and publish new projects dynamically.

### 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/projects` | List all portfolio projects |
| `GET` | `/api/projects/:id` | Get project by ID |
| `POST` | `/api/projects` | Add a new project (`{ title, year, category, description, stack }`) |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `GET` | `/api/contact` | Retrieve received contact inquiries |
| `POST` | `/api/contact` | Submit a contact form message (`{ name, email, message }`) |
| `DELETE` | `/api/contact/:id`| Delete an inquiry |
| `GET` | `/api/profile` | Retrieve profile metadata and bio |
| `PUT` | `/api/profile` | Update profile information |

---

## Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (zero configuration, persistent file-based)
- **Frontend**: Vanilla JavaScript (ES Modules), Modular CSS3
- **Graphics & Motion**: Three.js (WebGL), GSAP 3, ScrollTrigger
