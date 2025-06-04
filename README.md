# Food Ordering System - Setup Instructions

This document provides detailed instructions for setting up and running the Food Ordering System application.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Backend Setup

1. **Install MongoDB**

   If you don't have MongoDB installed, you can download it from [MongoDB's official website](https://www.mongodb.com/try/download/community).

   Alternatively, you can use MongoDB Atlas, a cloud-based MongoDB service:
   - Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Set up database access (create a user with password)
   - Set up network access (allow access from your IP address)
   - Get your connection string

2. **Configure Environment Variables**

   Navigate to the backend directory and create a `.env` file:

   ```
   cd food-ordering-backend
   ```

   Edit the `.env` file with your MongoDB connection details:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/food-ordering-system
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   ```

   If you're using MongoDB Atlas, your connection string will look like:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/food-ordering-system
   ```

3. **Install Dependencies**

   ```
   npm install
   ```

4. **Seed the Database**

   The system comes with a seed script to populate the database with initial data:

   ```
   node src/utils/seed.js
   ```

   This will create:
   - Sample users with different roles
   - Restaurants in India and America
   - Food items for each restaurant
   - Sample orders

5. **Start the Backend Server**

   ```
   npm start
   ```

   The server will run on http://localhost:5000 by default.

## Frontend Setup

1. **Configure Environment Variables**

   Navigate to the frontend directory and create a `.env.local` file:

   ```
   cd food-ordering-frontend
   ```

   Add the API URL:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. **Install Dependencies**

   ```
   npm install
   ```

3. **Start the Frontend Development Server**

   ```
   npm run dev
   ```

   The frontend will run on http://localhost:3000 by default.

## Testing the Application

Once both the backend and frontend are running, you can access the application at http://localhost:3000.

### Demo Accounts

The seed script creates the following user accounts for testing:

1. **Admin User**
   - Username: nickfury
   - Password: password123
   - Role: admin
   - Access: Full access to all features and data from all countries

2. **Manager (India)**
   - Username: captainmarvel
   - Password: password123
   - Role: manager
   - Country: India
   - Access: Can view India restaurants/menu, create food items, place/cancel orders

3. **Manager (America)**
   - Username: captainamerica
   - Password: password123
   - Role: manager
   - Country: America
   - Access: Can view America restaurants/menu, create food items, place/cancel orders

4. **Team Member (India)**
   - Username: thanos
   - Password: password123
   - Role: member
   - Country: India
   - Access: Can view India restaurants/menu, create food items only

5. **Team Member (America)**
   - Username: travis
   - Password: password123
   - Role: member
   - Country: America
   - Access: Can view America restaurants/menu, create food items only

## API Documentation

The backend API is documented in the Postman collection included in the project:

```
food-ordering-backend/postman_collection.json
```

You can import this file into Postman to explore and test all available API endpoints.

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Verify that MongoDB is running
   - Check your connection string in the `.env` file
   - Ensure network access is configured correctly if using MongoDB Atlas

2. **Port Already in Use**
   - Change the PORT value in the `.env` file

### Frontend Issues

1. **API Connection Error**
   - Ensure the backend server is running
   - Verify the NEXT_PUBLIC_API_URL in `.env.local` is correct
   - Check browser console for specific error messages

2. **Authentication Issues**
   - Clear browser localStorage and try logging in again
   - Verify that the JWT_SECRET in the backend `.env` file hasn't changed

## Additional Configuration

### Changing JWT Secret

For production, it's recommended to use a strong, unique JWT secret:

1. Generate a secure random string
2. Update the JWT_SECRET in the backend `.env` file

### Deployment Considerations

For production deployment:

1. Set NODE_ENV=production
2. Use a process manager like PM2 for the backend
3. Build the Next.js frontend with `npm run build`
4. Consider using a reverse proxy like Nginx
5. Implement proper SSL/TLS certificates
6. Set up proper database backups
