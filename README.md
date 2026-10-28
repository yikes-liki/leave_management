# Leave Management System

A web-based application designed to simplify employee leave management. Employees can apply for leave, track their leave balances, and view their leave history, while administrators can review, approve, or reject leave requests through an administrative dashboard.

## Project Overview

The Leave Management System replaces manual leave tracking with a centralized application. It provides employees and administrators with an organized way to manage leave requests, monitor balances, and track approval statuses.

## Features

### Employee Features

* Secure employee registration and login.
* Employee dashboard with leave statistics.
* Apply for casual, sick, and earned leave.
* View available leave balances.
* Track pending, approved, and rejected requests.
* View leave history.
* Cancel pending leave requests when permitted.

### Administrator Features

* Secure administrator login.
* Admin dashboard with leave statistics.
* View employee leave requests.
* Approve or reject leave applications.
* Add comments to leave decisions.
* Monitor employee leave balances.
* Filter and review leave requests.

### General Features

* Role-based access control.
* Form validation and error handling.
* Responsive user interface.
* Centralized database management.
* Secure authentication and database access policies.

## Technology Stack

| Technology     | Purpose                           |
| -------------- | --------------------------------- |
| React          | Frontend user interface           |
| TypeScript     | Type-safe development             |
| Vite           | Development server and build tool |
| Tailwind CSS   | Responsive styling                |
| Supabase Auth  | Authentication                    |
| PostgreSQL     | Database                          |
| Supabase       | Backend services                  |
| React Router   | Client-side navigation            |
| Lucide React   | Icons                             |
| Recharts       | Dashboard charts                  |
| Git and GitHub | Version control                   |
| Vercel         | Application deployment            |

## Application Architecture

The application uses React and TypeScript for the frontend, Supabase Auth for authentication, and PostgreSQL for data storage.

Employees and administrators interact with the frontend. Authenticated requests access the database through Supabase, where Row Level Security policies enforce data access permissions.

```text
Employee / Administrator
          |
          v
    React Frontend
          |
          v
     Supabase Auth
          |
          v
  PostgreSQL Database
          |
          v
  Row Level Security
          |
          v
Profiles, Leave Requests,
    and Leave Balances
```

## Database Structure

### Profiles

Stores employee profile information and assigned roles.

### Leave Balances

Stores leave entitlements and used leave days for each employee.

### Leave Requests

Stores leave applications, requested dates, leave types, approval statuses, and administrator comments.

The database uses relationships, constraints, and security policies to protect application data.

## Prerequisites

Before running the project, install:

* Node.js and npm.
* Git.
* A Supabase account.
* A GitHub account.

## Installation and Setup

### 1. Clone the Repository

Replace the placeholder with your actual GitHub repository URL.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Project Directory

```bash
cd leave-management-system
```

If your repository contains a nested project directory, navigate into the directory containing `package.json`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root.

Add the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholder values with the credentials from your Supabase project.

Never expose Supabase secret or service-role keys in frontend code.

### 5. Configure Supabase

1. Create a Supabase project.
2. Configure email authentication.
3. Create the required database tables.
4. Apply the project's SQL migrations.
5. Enable and configure Row Level Security policies.
6. Configure secure administrator role assignment.
7. Configure authentication redirect URLs.

### 6. Run the Application

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

### 7. Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Environment Variables

| Variable                        | Description              |
| ------------------------------- | ------------------------ |
| `VITE_SUPABASE_URL`             | Supabase project URL     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

The `.env.local` file must not be committed to GitHub.

## API and Data Operations

The application uses Supabase client operations and, where implemented, secure database functions.

The main operations include:

* User registration and login.
* Session management and logout.
* Leave application creation.
* Leave history retrieval.
* Leave request cancellation.
* Leave approval and rejection.
* Leave balance retrieval and management.

Administrative operations must verify permissions before changing request statuses or leave balances.

See the source code and database migrations for the actual implementation details.

## Security

The application is designed to use:

* Supabase authentication.
* PostgreSQL Row Level Security.
* Role-based authorization.
* Protected application routes.
* Database constraints and validation.
* Secure administrator role assignment.
* Restricted access to employee records.

Administrative privileges must not be assigned through unrestricted public registration.

## Testing

Before deployment, verify:

* Employee registration and login.
* Administrator authentication.
* Protected routes.
* Leave application validation.
* Leave history.
* Leave approval and rejection.
* Leave balance calculations.
* Authorization and database security.
* Responsive layouts.
* Production build.

## Deployment

The application is intended to be deployed using Vercel, with Supabase providing authentication and database services.

Deployment steps:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the production environment variables.
4. Deploy the frontend.
5. Configure Supabase authentication URLs.
6. Apply the required database migrations.
7. Test the production application.

### Live Application

**Production URL:** Add your actual Vercel deployment URL after deployment.

### GitHub Repository

**Repository URL:** Add your actual GitHub repository URL.

## Future Enhancements

Potential improvements include:

* Email notifications for leave decisions.
* Public holiday integration.
* Leave reports and exports.
* Employee directory management.
* Approval audit logs.
* Enhanced analytics.
* Configurable leave policies.

## License

Specify the project's license before distributing the application.
