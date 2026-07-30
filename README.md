# EduNest

EduNest is a production-focused LMS PWA for a single Class 5 student and two teachers.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma + MongoDB
- Auth.js / NextAuth credentials login
- PWA support with next-pwa
- Cloudinary storage
- Firebase Cloud Messaging hooks

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in all values.
3. Generate Prisma client: `npm run prisma:generate`
4. Push schema to MongoDB: `npm run prisma:migrate`
5. Seed the database: `npm run seed`
6. Start the app: `npm run dev`

## Demo Accounts

The seed script creates three accounts:

- Mathematics teacher
- English/Hindi/EVS teacher
- Student

Use the seeded emails and passwords from `prisma/seed.ts` after seeding.

## Notes

- Image and PDF uploads are designed for Cloudinary.
- The app is installable as a PWA.
- Firebase Cloud Messaging is wired for push notifications when credentials are provided.