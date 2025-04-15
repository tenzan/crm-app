# Multi-Tenant CRM Application

A simple CRM application with multi-tenant functionality built with Next.js, Tailwind CSS, Neon DB, and Mailgun.

## Features

- **Authentication**: Login and registration with email/password
- **Magic Link Authentication**: Send magic links for new customer registration
- **Multi-Tenant Architecture**: Each customer has their own isolated data
- **Role-Based Access Control**: Super Admin, Admin, and User roles
- **Customer Management**: Add and view customers

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon DB)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Email**: Mailgun

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Neon DB account
- A Mailgun account

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/crm-app.git
cd crm-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Neon DB connection string
DATABASE_URL="postgres://user:password@endpoint.neon.tech/neondb?pgbouncer=true&connect_timeout=10"
DIRECT_URL="postgres://user:password@endpoint.neon.tech/neondb?connect_timeout=10"

# Mailgun credentials
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"
MAILGUN_FROM_EMAIL="no-reply@your-domain.com"

# NextAuth configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Super admin credentials
SUPER_ADMIN_EMAIL="askar75@gmail.com"
SUPER_ADMIN_PASSWORD="draJAMU7"
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Push the database schema to your Neon DB:

```bash
npx prisma db push
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Super Admin

- Log in with the super admin credentials specified in the `.env` file
- Add new tenants by entering their email address
- View all tenants in the system

### Tenant Admin

- Receive an invitation email with a magic link
- Complete registration by setting up name and password
- Add new customers by entering their email address
- View all customers in their tenant

### Customer

- Receive an invitation email with a magic link
- Complete registration by setting up name and password
- Access the CRM dashboard

## Project Structure

- `/src/app`: Next.js app directory
  - `/api`: API routes
  - `/dashboard`: Dashboard page
  - `/login`: Login page
  - `/register`: Registration page
- `/src/components`: React components
- `/src/lib`: Utility functions
- `/prisma`: Prisma schema and migrations

## License

This project is licensed under the MIT License.
