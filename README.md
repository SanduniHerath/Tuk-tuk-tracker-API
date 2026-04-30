# Tuk tuk tracker API - Coursework for WEB API module

## Student Information
- **Name:** H.M.S.S. Herath
- **Index No:** COBSCCOMP242P-016
- **Coventry Index No:** 16114092

---

## Project Overview
The **Tuk-Tuk Tracker API** is a robust, production-ready backend system designed for the Sri Lanka Police to monitor and track three-wheeler (Tuk-Tuk) movements across the country. The system implements real-time data ingestion from GPS devices, sophisticated role-based access control (RBAC), and jurisdictional data scoping to ensure security and privacy.

This project was developed as part of the **Web API Development** module (NB6007CEM)

---

## Key Features

- **Real-Time Tracking**: Ingests high-frequency location pings from GPS devices linked to specific vehicles.
- **Role-Based Access Control (RBAC)**: Supports 4 distinct user roles with specific permissions:
  - `hq_admin`: Full system access and user management.
  - `provincial_officer`: Regional oversight scoped to their province.
  - `station_officer`: Local oversight scoped to their police station district.
  - `gps_device`: Restriced to high-security location ping submission.
- **Suspicious Vehicle Detection**: Automated anomaly detection for speeding, night movements, boundary crossings, and erratic behavior.
- **Jurisdictional Scoping**: Ensures officers can only view data and vehicles within their authorized province or district.
- **Interactive Documentation**: Fully documented using **Swagger/OpenAPI**.
- **Automated Test Suite**: 240+ tests ensuring 100% reliability.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js (ES6+ Modules) |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas (via Mongoose ODM) |
| **Security** | JWT Authentication, Helmet, bcryptjs |
| **Validation** | Express-validator & Mongoose Schema Validation |
| **Logging** | Morgan & Custom Error Handling Middleware |
| **Testing** | Mocha, Chai, Supertest, c8 |
| **Documentation** | Swagger-UI / OpenAPI 3.0 |

---

## Getting Started

### 1. Prerequisites
- Node.js (v18.x or higher)
- MongoDB Atlas account (or local MongoDB)

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd Tuk-tuk-tracker-API

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and configure the following:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=1d
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tuktuk_tracker
MONGO_URI_TEST=mongodb+srv://<user>:<password>@cluster.mongodb.net/tuktuk_tracker_test
```

### 4. Running the Application
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

---

## Testing & Quality Assurance

The system includes a comprehensive test suite designed to validate every security layer and business rule.

| Command | Description |
| :--- | :--- |
| `npm test` | Runs the full suite of 246 tests using Mocha. |
| `npm run test:coverage` | Generates a detailed V8 code coverage report. |
| `npm run lint` | Runs ESLint to ensure code quality and consistency. |

> [!IMPORTANT]
> The test suite uses a dedicated `MONGO_URI_TEST` to ensure zero interference with actual database.

---

## API Documentation
Once the server is running, you can access the interactive API documentation at:
**`http://localhost:3000/api-docs`**

---

## Security Architecture
- **JWT Protection**: All sensitive routes are guarded by JWT verification.
- **Role Scoping**: Middlewares automatically filter query results based on the logged-in officer's jurisdiction.
- **Data Integrity**: Global error handling captures and sanitizes all system and database exceptions.
- **Security Headers**: Implemented via `helmet` to protect against common web vulnerabilities.
