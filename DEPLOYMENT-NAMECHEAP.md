# Deploying EuroEdge Admission Group on Namecheap (WordPress Migration Guide)

This platform replaces your previous WordPress installation on **`euroedgeadmissiongroup.com`** with a high-speed, secured **React 19 + TypeScript + Framer Motion + Express 5 CMS** built on top of `bishopZ/2026-Boilerplate`.

All legacy WordPress URLs (`/about-us`, `/study-in-uk`, `/b1-english-course`, `/visa-assistance`, etc.) automatically **301 redirect** to their upgraded routes so you retain **100% of your existing Google SEO rankings**.

---

## Option A: Namecheap Shared / Stellar / Business Hosting (cPanel "Setup Node.js App")

1. **Build the Production Bundle Locally (or in CI):**
   ```bash
   npm install --engine-strict=false
   npm run build
   ```
2. **Back Up & Archive Old WordPress Files:**
   - In Namecheap **cPanel → File Manager**, move your old `public_html` WordPress files into a backup folder (e.g., `wp_backup_2026`).
3. **Upload EuroEdge Project Folder:**
   - Upload the project files (`src/`, `public/`, `dist/`, `data/`, `package.json`, `package-lock.json`, `server.mjs`, `vite.config.ts`, `tsconfig*.json`) to `/home/<cpanel_user>/euroedge-app`.
4. **Configure cPanel Node.js Selector:**
   - Open **cPanel → Software → Setup Node.js App → Create Application**:
     - **Node.js version:** `20.x` or `22.x+`
     - **Application mode:** `Production`
     - **Application root:** `euroedge-app`
     - **Application URL:** `euroedgeadmissiongroup.com`
     - **Application startup file:** `server.mjs`
5. **Set Production Environment Variables in cPanel:**
   Generate your custom admin password hash on any machine with Node:
   ```bash
   node -e "const c=require('crypto');const p=process.argv[1];const s=c.randomBytes(8).toString('hex');const h=c.pbkdf2Sync(p,s,100000,64,'sha512').toString('hex');console.log('ADMIN_PASSWORD_SALT='+s);console.log('ADMIN_PASSWORD_HASH='+h);" "YourNewStrongPassword"
   ```
   Add these variables in cPanel Node.js App settings:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = *(64-char random secret)*
   - `LOCAL_STORAGE_KEY` = *(32-char random secret)*
   - `ADMIN_USERNAME` = `admin@euroedgeadmissiongroup.com`
   - `ADMIN_PASSWORD_SALT` = *(output from command above)*
   - `ADMIN_PASSWORD_HASH` = *(output from command above)*
6. **Install Dependencies & Start:**
   - Click **Run NPM Install** inside cPanel Node.js Selector, then click **Restart**.
   - Ensure `data/` folder has write permissions (`755`) so live Admin CMS edits and form submissions persist across restarts!

---

## Option B: Namecheap VPS / Cloud / Railway / Render (Recommended for Ultra-Fast Global Edge)

If your Namecheap domain points via DNS (`A` / `CNAME` record in **Namecheap Advanced DNS**) to a VPS, Render, or Railway Node container:

1. Build Command: `npm install && npm run build`
2. Start Command: `npm run start` (`NODE_ENV=production tsx src/server/main.ts`)
3. Mount a persistent volume at `/app/data` (so `cms-data.json` and `inquiries.json` persist across container redeploys) and set the environment variables above.

---

## Using the Built-In Admin CMS & Secured Form Inbox

1. Navigate to **`/login`** (or click **Admin CMS** in the website footer).
2. Sign in with your `.env` credentials (local starter default: username `test`, password `test`).
3. Inside **`/admin`**, you can update without touching code:
   - **Form Inbox (CRM):** View student inquiries, update status (`New`, `In Review`, `Contacted`, `Converted`), add internal advisor notes, launch 1-click WhatsApp/Email replies, or **Export CSV**.
   - **Hero, Contact & Stats:** Edit headlines, announcement banner, phone/WhatsApp/email, office hours, social links, and homepage stats.
   - **English Courses:** Add/remove courses, update £ / BDT prices, promo badges (`Special Offer!`, `Hot Deal!`), and syllabi.
   - **Study Destinations:** Edit or add countries, visa timelines, tuition ranges, and university lists.
   - **Blog, Team & FAQs:** Publish new study-abroad articles, manage founder/team bios, student testimonials, and FAQs.
   - **Backup JSON:** Download a full snapshot of your CMS content + student inquiries anytime with one click.
