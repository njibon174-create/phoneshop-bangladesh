# PhoneShop BD

Award-winning e-commerce platform for mobile phones in Bangladesh. Built with React + Vite + Tailwind CSS, planned to integrate with Supabase backend and Vercel hosting.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 3
- **Routing:** React Router
- **Icons:** Lucide React
- **Backend (planned):** Supabase (Postgres + Auth + Storage)
- **Hosting (planned):** Vercel

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
src/
├── components/
│   ├── ui/          # Reusable primitives (Button, Card, PhoneCard)
│   └── layout/      # Page chrome (Header, Footer)
├── pages/           # Route-level components
├── lib/             # Utilities, Supabase client (WIP)
├── App.jsx
├── main.jsx
└── index.css
```

## Design System

- Dark theme (Linear/Notion-style)
- Single accent color (Indigo `#6366F1`)
- Mobile-first, thumb-zone layout
- Progressive disclosure pattern

## Roadmap

- [x] Step 1: Project foundation + dark design system + homepage skeleton
- [ ] Step 2: Supabase schema (brands, products, inventory, images)
- [ ] Step 3: Product listing pages + filtering
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

## Conventions

- RLS is disabled on Supabase (run manually via SQL Editor)
- Schema migrations are output as SQL — never run automatically
- Image URLs only — no downloads of product images
- Use royalty-free sources (Pexels, Unsplash, Pixabay) for design mockups
- Brand logos used editorially to indicate "we sell this brand"
