# EduNest

EduNest is a production-focused Learning Management System (LMS) Progressive Web App (PWA) designed specifically for a single Class 5 student and their two teachers. It provides a structured, digital environment for managing subjects, chapters, notes, homework, tests, attendance, announcements, and push notifications.

## Features

- **Role-Based Access Control:** Secure access tailored for Admin (Teachers) and Student roles, redirecting users to role-specific dashboards.
- **Academic Management:** Comprehensive models and basic REST APIs for Subjects, Chapters, Notes, Homework, Tests, and Attendance.
- **Modern Tech Stack:** Built with Next.js 15 App Router, TypeScript, and styled with Tailwind CSS.
- **Robust Database & ORM:** Uses MongoDB as the primary database, seamlessly integrated via Prisma.
- **Authentication:** Secure credentials-based authentication powered by NextAuth.js / Auth.js.
- **Progressive Web App (PWA):** Installable web app experience with `next-pwa` integration, including theme configurations.
- **Media & Storage:** Wired for Cloudinary for image and PDF storage/uploads.
- **Notifications:** Built-in hooks for Firebase Cloud Messaging for robust push notifications.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **State Management / Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **External Services:** [Cloudinary](https://cloudinary.com/) (Storage), [Firebase Admin](https://firebase.google.com/) (Push Notifications)

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB instance (Local or Atlas)
- Cloudinary Account
- Firebase Project setup (for push notifications)

### Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and fill in your configurations:
   ```bash
   cp .env.example .env
   ```
   Ensure you provide valid values for your MongoDB URI, NextAuth secret, Cloudinary, and Firebase credentials.

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Push Schema to MongoDB:**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed the Database:**
   Populates the database with default subjects, chapters, demo accounts, and sample data.
   ```bash
   npm run seed
   ```

6. **Start the Development Server:**
   ```bash
   npm run dev
   ```

The application will be running at [http://localhost:3000](http://localhost:3000).

## Demo Accounts

The database seed script (`prisma/seed.ts`) provisions three default accounts for testing:

- **Mathematics Teacher (Admin):**
  - Email: `maths@edunest.dev`
  - Password: `Maths@1234`
- **Language Teacher (Admin):**
  - Email: `language@edunest.dev`
  - Password: `Languages@1234`
- **Student:**
  - Email: `student@edunest.dev`
  - Password: `Student@1234`

## Project Structure Overview

- `src/app`: Next.js App Router containing pages, layouts, and API routes.
- `src/components`: Reusable UI components (buttons, cards, forms, auth, shell layouts).
- `src/lib`: Shared utilities, validators, auth logic, Prisma singleton, Cloudinary, and Firebase integrations.
- `prisma`: Prisma schema (`schema.prisma`) and database seed script.
- `public`: Static assets including PWA manifest and icons.

## Current State & Remaining Work

The project currently has a robust scaffold with data models, auth flows, basic API endpoints, and role-based shell layouts fully implemented. The production build passes successfully.

**Upcoming integrations include:**
- Completing the Notes module UI (image uploads, reordering, PDF viewer, offline caching).
- Homework module UI and student submission flow.
- Admin Test builder and automated MCQ checking.
- Interactive monthly attendance views.
- Fully wired push notifications delivery.