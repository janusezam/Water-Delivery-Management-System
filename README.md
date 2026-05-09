# WRS-DMS: Water Refilling Station Delivery Management System

A full-stack MERN application for managing water refilling station deliveries.

## Project Structure

- `client/`: React frontend (Vite)
- `server/`: Node.js/Express backend

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. **Run the application**:
   From the root directory:
   ```bash
   npm run dev
   ```

## Folder Structure Details

### Server
- `config/`: Database and environment config.
- `controllers/`: Request handling logic.
- `models/`: Mongoose schemas.
- `routes/`: API routes.
- `middleware/`: Authentication and custom middleware.

### Client
- `src/components/`: Reusable components.
- `src/pages/`: Main page components.
- `src/hooks/`: Custom React hooks.
- `src/context/`: State management.
- `src/services/`: API services.
