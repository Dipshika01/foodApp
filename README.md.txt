#FoodApp
A very basic full-stack food ordering app with role-based access control.

# Tech stack
food-app-backend/ - Node.js + Express + MongoDB
food-app-frontend/ - React.js

# Backend setup
bash:
cd food-app-backend
npm init -y
npm install
npm run seed # for population the MongoDB
npm run dev # for starting the backend server

# Project Structure
/food-app-frontend : React + Vite app
/food-app-backend: Express(Node.js), mongodb

#Features
Auth with JWT: token stored in localStorage
Roles for RBAC-control(ADMIN, MANAGER, MEMBER)
Restaurants can be added only by Admin
Menu can br added by everyone
I have made the price to be either in ₹ or $ based on country
For payments, I have saved card list and implemented fake txn id capture
Dark mode and light mode both are available

# To run locally, follow the steps below:
Clone the repository.
Frontend:
cd food-app-frontend
npm install
Backend:
cd food-app-backend
npm install express, mongoose, jsonwebtoken, bcrypt, dotenv

# Run servers:
Frontend:
npm run dev
npm install
Backend:
npm run dev 