# Cardápio Digital Tia Nalva V2

## Overview
A dynamic digital menu application for Quiosque Tia Nalva built with Next.js, featuring:
- Customer-facing menu with category filters and WhatsApp ordering
- Protected admin panel for product management (CRUD)
- MongoDB database for product storage

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: Zustand (cart persistence with localStorage)
- **Authentication**: Auth.js (NextAuth.js) with Credentials and Google OAuth
- **Database**: MongoDB
- **Package Manager**: pnpm

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── produtos/              # Products API (public GET, protected CRUD)
│   │   └── seed/                  # Database seeder endpoint
│   ├── admin/                     # Protected admin panel
│   │   ├── login/                 # Admin login page
│   │   └── page.tsx               # Admin dashboard
│   ├── pedido/                    # Order summary page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Customer menu page
├── components/
│   ├── ui/                        # ShadCN UI components
│   ├── Header.tsx                 # Beach-themed header
│   ├── CategoryTabs.tsx           # Category filter tabs
│   ├── ProductCard.tsx            # Product display with add to cart
│   ├── ProductList.tsx            # Product listing by subcategory
│   └── FloatingCartButton.tsx     # Floating cart button
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── mongodb.ts                 # MongoDB connection
│   └── utils.ts                   # Utility functions
├── store/
│   └── cartStore.ts               # Zustand cart store
└── types/
    └── produto.ts                 # Product type definitions
```

## Environment Variables Required
- `MONGODB_URI` - MongoDB connection string
- `AUTH_SECRET` - NextAuth secret (auto-generated if not set)
- `ADMIN_USERNAME` - Admin credentials (default: admin)
- `ADMIN_PASSWORD` - Admin password (default: admin123)
- `ADMIN_EMAILS` - Comma-separated list of allowed Google OAuth emails
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` - WhatsApp number for orders

## Running the Application
```bash
pnpm dev
```

## Seeding the Database
POST to `/api/seed` to populate initial product data.

## Key Features
1. **Customer Menu (/)**: Browse products by category, add to cart, send order via WhatsApp
2. **Order Summary (/pedido)**: Review cart, adjust quantities, submit order
3. **Admin Panel (/admin)**: Login required, full CRUD for products
4. **WhatsApp Integration**: Formatted order message opens WhatsApp

## User Preferences
- Portuguese language (pt-BR)
- Beach/tropical theme with teal color scheme (#2d9da1)
- Mobile-first responsive design
