# 🚼 DevPulse – Internal Issue & Feature Tracking System

DevPulse is a production-ready backend system designed to help software teams efficiently report bugs, request features, and manage issue lifecycles with secure role-based control and scalable architecture.

---

## 🌐 Live API Deployment

## **LIVE URL:** [View Live URL👉](https://assignment-2-cyan-delta.vercel.app)

## ⚙️ Tech Stack

- **Runtime:** Node.js (LTS v24+)
- **Language:** TypeScript (Strict Mode Enabled)
- **Framework:** Express.js (Modular Architecture)
- **Database:** PostgreSQL (Native `pg` driver)
- **Query Method:** Raw SQL using `pool.query()`
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcrypt (Password Hashing, salt rounds: 8–12)

---

## ✨ Key Features

### 🔐 Authentication & Security

- Secure user registration with hashed passwords using bcrypt
- JWT-based authentication system
- Token-based request authorization via middleware
- Passwords are never exposed in API responses or logs

---

### 👥 Role-Based Access Control (RBAC)

#### Contributor

- Register and login
- Create new issues (bug / feature request)
- View all issues
- Update own issues only when status is `open`

#### Maintainer

- Full system access
- Update any issue field
- Change issue status independently
- Delete any issue
- Access all system-level data

---

### 🐞 Issue Management System

- Create bug reports and feature requests
- Retrieve all issues with filtering and sorting:
  - Sort: `newest | oldest`
  - Filter: `type`, `status`
- Fetch single issue with reporter details
- Update issue (title, description, type)
- Delete issue (maintainer only)

---

## 🧠 System Design Highlights

- JWT payload includes: `id`, `name`, `role`
- Reporter ID is securely extracted from token (not request body)
- Multi-query approach used instead of JOIN (as per requirement)
- Strict validation for issue status transitions
- Centralized error handling middleware implemented

---

## 🗄️ Database Schema

### Users Table

- id (Primary Key)
- name
- email (Unique)
- password (Hashed)
- role (contributor | maintainer)
- created_at
- updated_at

### Issues Table

- id (Primary Key)
- title (Max 150 chars)
- description (Min 20 chars)
- type (bug | feature_request)
- status (open | in_progress | resolved)
- reporter_id
- created_at
- updated_at

---

## 📡 API Endpoints

### Auth Routes

- `POST /api/auth/signup` → Register user
- `POST /api/auth/login` → Login user
- `GET /api/auth` → Get all users (only maintainer)

### Issue Routes

- `POST /api/issues` → Create issue
- `GET /api/issues` → Get all issues (filter + sort)
- `GET /api/issues/:id` → Get single issue
- `PATCH /api/issues/:id` → Update issue
- `DELETE /api/issues/:id` → Delete issue

### Matrics Routes

- `GET /api/metrics` → Get all matrics only (maintainer)
