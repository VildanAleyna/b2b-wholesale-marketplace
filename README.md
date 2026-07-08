# Wholesale B2B Management App


A full-stack B2B wholesale management application built with Expo, React Native Web, Express, and MongoDB.

The project focuses on a real wholesale workflow where dealers place orders and wholesalers manage products, stock, payments, credit accounts, employees, and operational alerts from a single system.

The application was designed as a mobile-first Expo project and also supports web usage through React Native Web.

## Important Note

This project is built for portfolio and demo purposes. It includes realistic business flows, role-based screens, and seeded demo data, but it is not configured as a production-ready system yet.

Authentication uses bcrypt password hashing and JWT-based session tokens. Further production-level improvements such as stricter authorization middleware, refresh tokens, rate limiting, audit logging, and secure deployment settings are listed as future improvements.

## Overview

This system has two main user groups:

- Dealers who browse products, create orders, and track their account status
- Wholesalers who manage orders, stock, payments, dealers, and employees

The project also includes employee-based access control. A wholesaler can create operational users for warehouse, accounting, and sales workflows.

## User Roles

### Dealer

Dealers can:

- Browse products and categories
- Add products to cart
- Manage favorite products
- Place orders
- View order history
- Track credit account balance
- Send payment notifications

### Wholesaler Admin

Wholesaler admins can:

- View incoming dealer orders
- Update order and shipping status
- Manage product stock and prices
- Add new products
- Define minimum stock levels
- Approve or reject payment notifications
- Track dealer credit accounts
- Manage employees and permissions
- View operational alerts

### Warehouse Employee

Warehouse employees can:

- View incoming orders
- Start order preparation
- Update shipping status
- Follow stock-related operations

### Accounting Employee

Accounting employees can:

- View payment notifications
- Approve or reject payment records
- Track dealer credit accounts
- Follow collection status

### Sales Employee

Sales employees can:

- Follow dealer activity
- Track order status
- Support customer relationship processes

## Features

- Single login flow for dealers, wholesaler admins, and employees
- JWT-based authentication
- bcrypt password hashing
- Role-based navigation
- Product, category, cart, and favorites flows
- Dealer order history
- Dealer credit account tracking
- Wholesaler order management
- Product stock and price management
- Minimum stock level configuration
- Payment notification and approval workflow
- Dealer account and collection tracking
- Employee management with role-based permissions
- Rule-based operational insights
- Seed data for realistic demo usage
- Responsive web layout with Expo and React Native Web
- Modular frontend API layer
- Modular backend route structure

## Operational Insights

The system includes rule-based business alerts for daily wholesale operations.

Examples:

- Low stock warning
- Out of stock warning
- Pending payment approval
- Risky dealer credit usage
- Active order workload
- Rejected payment notification

These alerts are implemented with business rules rather than machine learning. The goal is to make important operational problems visible to the user without requiring manual checking across multiple screens.

## Tech Stack

### Frontend

- Expo
- React Native
- React Native Web
- React Navigation
- Axios
- Context API

Context API is used for the current project scope because the shared state is mainly authentication, cart, and user session data. If the project grows further, a dedicated state management library such as Zustand or Redux Toolkit could be considered.

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

## Architecture

The codebase is organized around reusable UI, separated API modules, and backend route separation.

```text
toptanci-programi/
  components/
    ui/
      AppToast.js
      EmptyState.js
      PageHeader.js
      SummaryMetricCard.js
    OperationalInsightsPanel.js

  constants/
    responsiveLayout.js
    roles.js
    uiTheme.js

  context/
    AuthContext.js
    CartContext.js

  data/
    api/
      authApi.js
      productApi.js
      orderApi.js
      accountingApi.js
      customerApi.js
      employeeApi.js
    apiClient.js
    Data.js

  screens/
    Category/
    PremiumScreens/
    Profile/
    CartScreen.js
    HomeScreen.js
    FavoritesScreen.js
    OrderHistoryScreen.js

  server/
    config/
    data/
      seedProductCatalog.js
    models/
    routes/
    utils/
    index.js
    seed.js
```

## API Overview

The backend is organized into route modules:

```text
server/routes/
  authRoutes.js        # register and login
  catalogRoutes.js     # products, categories, models, brands
  profileRoutes.js     # user profile, settings, favorites
  accountingRoutes.js  # dealer credit accounts and statements
  paymentRoutes.js     # payment notifications and approvals
  orderRoutes.js       # purchase, order history, order status
  employeeRoutes.js    # wholesaler employee management
  insightRoutes.js     # operational business alerts
```

Main API groups:

- `POST /login`
- `POST /register`
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `GET /categories`
- `POST /users/:userId/purchase`
- `GET /users/:userId/orders`
- `GET /wholesalers/:wholesalerId/orders`
- `PUT /customers/:customerId/orders/:orderId/status`
- `GET /wholesalers/:id/accounts`
- `POST /payments/notify`
- `GET /wholesalers/:id/payments`
- `PUT /payments/:id/status`
- `GET /wholesalers/:wholesalerId/employees`
- `POST /wholesalers/:wholesalerId/employees`
- `GET /wholesalers/:id/insights`

A Postman collection can be added later for easier API testing and review.

## Screenshots

Screenshots or a short demo GIF can be added here to present the main flows:

- Dealer product browsing
- Cart and order flow
- Wholesaler order management
- Stock management
- Payment approvals
- Employee management
- Operational insights

## Demo Data

The seed script creates a demo dataset for development and presentation:

- 60 products
- 15 dealers
- 200 orders
- 30 payment notifications
- Product stock and minimum stock levels
- Dealer credit accounts
- Employee demo accounts

## Demo Accounts

### Wholesaler Admin

```text
Email: vildan@toptan.com
Password: 1234
```

### Dealer

```text
Email: ahmet@bayi.com
Password: 1234
```

Additional demo dealers:

```text
bayi2@demo.com - bayi15@demo.com
Password: 1234
```

### Employee

```text
Username: admin
Password: admin
```

Additional employee accounts can be created from the wholesaler employee management screen.

These credentials are demo credentials created by the seed script. They should not be used in a production environment.

## Installation

Requirements:

- Node.js 20+
- npm
- MongoDB

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm --prefix server install
```

Create environment files:

```bash
copy .env.example .env
copy server\.env.example server\.env
```

Backend environment example:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/Toptanci
CORS_ORIGIN=*
```

For physical device testing with Expo Go, set the frontend API URL to the local IP address of the development machine:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## Running the Project

Start the backend:

```bash
npm run server
```

Seed the database:

```bash
npm run seed
```

Start Expo:

```bash
npm start
```

Run on web:

```bash
npm run web
```

## Validation

Backend syntax check:

```bash
npm run check:server
```

## Current Status

The project currently includes the main business flows required for a B2B wholesale management system:

- Dealer-side product and order flows
- Wholesaler-side operational panels
- Role-based employee access
- Stock, payment, credit account, and order tracking
- Seeded demo data for presentation

Possible next improvements:

- Automated tests
- Stricter route-level authorization checks
- Refresh token flow
- Rate limiting and audit logging
- Real payment provider integration
- Real shipping provider integration
- Deployment
- More detailed analytics dashboard

## License

No open-source license has been selected yet. If this repository is published publicly, adding a license such as MIT can make usage terms clear for other developers.

## Development Focus

The main focus of this project is not only UI development, but also modeling a realistic business process with a full-stack structure.

The application demonstrates:

- Role-based application flow design
- REST API development with Express
- MongoDB data modeling with Mongoose
- Responsive UI development with Expo and React Native Web
- Shared component usage
- Backend route modularization
- Seed data generation for demo scenarios

## Purpose

This project represents a practical B2B workflow rather than a simple product listing application. Dealers create orders, wholesalers manage fulfillment, accounting handles payment approvals, and managers follow stock and operational risks.

The goal is to show full-stack development ability through a business-oriented application structure.
