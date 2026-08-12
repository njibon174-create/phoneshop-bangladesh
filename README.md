# PhoneShop BD

Award-winning e-commerce platform for mobile phones in Bangladesh. Built with React + Vite + Tailwind CSS, integrated with Supabase backend and deployed on Vercel.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 3
- **Routing:** React Router
- **Icons:** Lucide React
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Hosting:** Vercel

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
phoneshop-bangladesh/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable primitives (Button, Card, PhoneCard)
│   │   └── layout/      # Page chrome (Header, Footer)
│   ├── pages/           # Route-level components
│   ├── lib/             # Supabase client + query helpers
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/            # SQL migrations (run manually in Supabase SQL Editor)
│   ├── 001_schema.sql
│   ├── 002_seed_brands.sql
│   ├── 003_seed_products_sample.sql
│   └── README.md
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Design System

- Dark theme (Linear/Notion-style)
- Single accent color (Indigo `#6366F1`)
- Mobile-first, thumb-zone layout
- Progressive disclosure pattern

## Database (Supabase)

See [`supabase/README.md`](./supabase/README.md) for the full schema documentation.

Tables:
- `brands` — phone brands (10 currently)
- `products` — SKU-level products
- `product_specs` — indexable key/value specs for filtering
- `product_images` — multiple images per product
- `inventory` — stock counts
- `orders` + `order_items` — COD / bKash / Nagad orders

**Run order:** `001_schema.sql` → `002_seed_brands.sql` → `003_seed_products_sample.sql`

## Roadmap

- [x] Step 1: Project foundation + dark design system + homepage skeleton
- [x] Step 2: Supabase schema (brands, products, inventory, images, orders)
- [x] Step 3: Product listing pages + filtering + search
- [ ] Step 4: Product detail page
- [ ] Step 5: Cart + order flow (COD + bKash/Nagad)
- [ ] Step 6: Admin panel
- [ ] Step 7: Performance + SEO
- [ ] Step 8: Polish + production deploy

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

⚠️ Never commit the service/secret key. Only the anon/publishable key goes in frontend.

## Data-fetching utilities

`src/lib/queries.js` exposes:
- `fetchBrands()` — list of all active brands
- `fetchFeaturedProducts(limit)` — featured/bestseller phones
- `fetchProductsByBrand(slug, opts)` — phones by brand
- `fetchProductBySlug(slug)` — single product with full specs + images
- `searchProducts(query)` — full-text search
- `createOrder({ customer, items, paymentMethod, paymentRef })` — order placement

The Home page uses `fetchFeaturedProducts` and `fetchBrands`; if no Supabase
env vars are set, the page falls back to placeholder data so the UI still works.

## Conventions

- RLS is disabled on Supabase (run manually via SQL Editor)
- Schema migrations are output as SQL — never run automatically
- Image URLs only — no downloads of product images
- Use royalty-free sources (Pexels, Unsplash, Pixabay) for design mockups
- Brand logos used editorially to indicate "we sell this brand"
- Money stored as integer `bdt` (no decimals)
- All timestamps are `timestamptz` UTC
- Slugs are URL-safe (`iphone-15-pro-max-256gb-natural-titanium`)
