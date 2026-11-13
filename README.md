# EuroEdge Admission Group — Full-Stack Web & CMS Platform

Modern, animated full-stack web platform and Content Management System for **EuroEdge Admission Group**, built starting from [`bishopZ/2026-Boilerplate`](https://github.com/bishopZ/2026-Boilerplate) to replace WordPress with zero-bloat speed, creative UI choreography, multi-layer form security, and a live Admin Dashboard.

## Highlights

- **Creative UI Fusion:** Synthesizes **Raycast** (obsidian lighting stage, specular 1px glass cards, interactive `⌘K` Pathway Launcher, 3D tilt admission console), **WebsiteStyle.ai** (oversized drifting watermark typography, agency motion, bold metric counters), and **Structure Consulting Engineers** (multi-velocity staggered scroll parallax, architectural coordinate hairlines, sector/region filtering).
- **Smart Brand Logo System:** Uses EuroEdge's official Royal Cobalt (`#2953E4`) & Electric Azure (`#1B84FF`) palette across Horizontal & Stacked logo lockups (Horizontal lockup in Floating Glass Navbar & Royal Cobalt CTAs; Stacked lockup in the Architectural Mega-Footer, Royal Monolith Card, and Admin Gate).
- **Multi-Layer Secured Form Maintenance:**
  1. Double-Submit CSRF Token + Custom Origin Header verification
  2. Server-signed stateless **HMAC Math Challenge** (`GET /api/form-challenge`)
  3. Invisible **Honeypot** field + minimum human fill-time check
  4. Dedicated **IP Rate Limiting** (`express-rate-limit`)
  5. Strict **Zod** schema validation + server-side HTML/XSS tag sanitization + Dossier Ticket IDs (`EE-2026-XXXX`)
- **Built-In Admin CMS & Lead CRM (`/admin`):** Update Hero copy, Contact details, Stats, Courses, Study Destinations, Blog Articles, Team Members, Testimonials, and FAQs live in the browser + manage/export student inquiries.
- **WordPress SEO Preservation:** Built-in 301 redirects for all legacy WordPress URLs (`/about-us`, `/study-in-uk`, `/b1-english-course`, `/visa-assistance`, etc.) + dynamic `/sitemap.xml`.

## Quick Start

```bash
cp .envTemplate .env
npm install --engine-strict=false
npm run dev
```

- **Public Website:** `http://localhost:3000`
- **Admin CMS Login:** `http://localhost:3000/login` (starter template credentials from `.env`: `test` / `test` — see `DEPLOYMENT-NAMECHEAP.md` to rotate for production)
