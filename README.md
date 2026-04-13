# PINUS Website

Source code for the **Perhimpunan Indonesia NUS (PINUS)** public website. The app is a **Next.js** full-stack project (App Router): React on the client, **Route Handlers** under `app/api/` for backend logic, and **MongoDB** (plus external services such as Notion and Firebase where configured) for data.

Production site: **[https://www.pinusonline.org](https://www.pinusonline.org)**

All URLs below use the production host **`https://www.pinusonline.org`** unless noted. Replace path segments like `{formId}`, `{itemId}`, `{slug}` with real IDs or slugs from your environment.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS, component library under `app/components/` |
| Auth | JWT in HTTP-only cookies; session via `/api/auth/me` |
| Data | MongoDB (Mongoose), Notion API for some content, Firebase Storage for marketplace images |

---

## Site map (pages in `app/`)

### Public & marketing

| Feature | URL | Notes |
|--------|-----|--------|
| **Home / About** | [https://www.pinusonline.org/](https://www.pinusonline.org/) | Hero, vision, missions, about copy |
| **Committee** | [https://www.pinusonline.org/committee](https://www.pinusonline.org/committee) | Committee structure; data may come from API |
| **Events** | [https://www.pinusonline.org/events](https://www.pinusonline.org/events) | Events listing |
| **Guides (index)** | [https://www.pinusonline.org/guides](https://www.pinusonline.org/guides) | Guide chapters / navigation |
| **Guide article** | `https://www.pinusonline.org/guides/{slug}` | Example: content pages resolved by Notion/slug |
| **Blog (index)** | [https://www.pinusonline.org/blog](https://www.pinusonline.org/blog) | Blog post listing |
| **Blog post** | `https://www.pinusonline.org/blog/{slug}` | Individual article |
| **FAQ** | [https://www.pinusonline.org/faq](https://www.pinusonline.org/faq) | Frequently asked questions |
| **Contact us** | [https://www.pinusonline.org/contact-us](https://www.pinusonline.org/contact-us) | Contact form (submits via API) |

### Authentication & account

| Feature | URL | Notes |
|--------|-----|--------|
| **Login** | [https://www.pinusonline.org/login](https://www.pinusonline.org/login) | Email/password; sets auth cookie |
| **Register** | [https://www.pinusonline.org/register](https://www.pinusonline.org/register) | New account; may require email verification |
| **Verify email** (NOT IN USE) | [https://www.pinusonline.org/verify-email](https://www.pinusonline.org/verify-email) | Email verification flow (query params from link) |
| **Profile** | [https://www.pinusonline.org/profile](https://www.pinusonline.org/profile) | Logged-in user: career, contact fields, etc. |

### Forms (authenticated features)

| Feature | URL | Notes |
|--------|-----|--------|
| **Forms hub** | [https://www.pinusonline.org/forms](https://www.pinusonline.org/forms) | Lists forms you can access; creators see management actions; share/copy links for organisers |
| **Create form** | [https://www.pinusonline.org/forms/create](https://www.pinusonline.org/forms/create) | Requires permission to create forms; title, description, optional **short link**, managers, field builder |
| **Fill / view form** | `https://www.pinusonline.org/forms/{formId}` | Fill answers, edit form (if allowed), share participant link, view managers, read-only “your responses” after submit |
| **Form responses** | `https://www.pinusonline.org/forms/{formId}/responses` | Organisers/managers/admins: **Cards** or **Table** view, CSV export, **delete** individual submissions, respondent **name, email, phone, Telegram** |
| **Thank you** | `https://www.pinusonline.org/forms/{formId}/thank-you` | Post-submit confirmation; links back to form or list |
| **Short link (redirect)** | `https://www.pinusonline.org/f/{slug}` | Optional pretty URL; **redirects** to `/forms/{formId}`. Slug is unique; duplicates get a numeric suffix (e.g. `my-form-2`) |

**Forms capabilities (implemented in app):**

- Field types: short text, number, date/time modes, yes/no, dropdown, multi-select with min/max selections, segmented/path text, section blocks.
- Optional **field descriptions** and **response length** (min/max characters) on text / segmented fields.
- **Sharing**: form can be opened to participants (`isShared`); copy link prefers short URL `/f/{slug}` when set.
- **Submissions**: one response per user; submitters see thank-you page; reopening shows **own answers** when they can no longer edit-fill.
- **Responses UI**: export **CSV** including Phone & Telegram columns; table view with horizontal scroll; per-response delete for authorised roles.

### Marketplace

| Feature | URL | Notes |
|--------|-----|--------|
| **Marketplace home** | [https://www.pinusonline.org/marketplace](https://www.pinusonline.org/marketplace) | Browse/filter listings, modal or detail access |
| **Create listing** | [https://www.pinusonline.org/marketplace/create](https://www.pinusonline.org/marketplace/create) | Logged-in; title, description, **price in SGD** with live **IDR estimate** (via server FX route), **category** (design-system `Select`), meetup, image upload or URL |
| **Listing detail** | `https://www.pinusonline.org/marketplace/{itemId}` | Single item view |
| **My listings** | [https://www.pinusonline.org/marketplace/my-listings](https://www.pinusonline.org/marketplace/my-listings) | Seller’s own items |

**Marketplace notes:**

- Categories are defined in `lib/constants/marketplace-categories.ts`.
- Image upload uses Firebase Storage (see env/config).
- Price display includes indicative **SGD → IDR** conversion sourced via server API (see API section).

### Administration

| Feature | URL | Notes |
|--------|-----|--------|
| **Admin dashboard** | [https://www.pinusonline.org/admin/dashboard](https://www.pinusonline.org/admin/dashboard) | Super/admin user management, filters, roles (requires admin privileges) |

### Dev / internal tools (often not linked in main nav)

| Feature | URL | Notes |
|--------|-----|--------|
| **UI examples** | [https://www.pinusonline.org/examples](https://www.pinusonline.org/examples) | Component showcase / design reference |
| **Bikin blog** | [https://www.pinusonline.org/bikin-blog](https://www.pinusonline.org/bikin-blog) | Internal or experimental blog tooling |

---

## API routes (`app/api/`)

Base URL for all endpoints: **`https://www.pinusonline.org/api`**

These are **not** meant to be opened in a browser for browsing; they are JSON (or binary) endpoints for the SPA and integrations.

### Auth

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/register` | Register |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Profile

| Method | Path | Purpose |
|--------|------|---------|
| GET/PATCH | `/api/profile` | Read/update profile |

### Forms

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/forms` | List forms (permission-scoped) |
| POST | `/api/forms` | Create form (optional `shortLink` for slug) |
| GET/PATCH/DELETE | `/api/forms/{formId}` | Get/update/delete form; PATCH supports `slug`, fields, managers, `isShared`, etc. |
| GET/POST | `/api/forms/{formId}/responses` | List submissions / submit answers |
| DELETE | `/api/forms/{formId}/responses/{responseId}` | Delete one submission (organisers/admins) |
| GET | `/api/forms/managers` | List users eligible as form managers |

### Marketplace

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/marketplace` | List / create items |
| GET/PATCH/DELETE | `/api/marketplace/{itemId}` | Item CRUD |

### FX (helper for marketplace create page)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/fx/sgd-idr` | Cached indicative SGD→IDR rate for UI (not a bank rate) |

### Content & misc

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/blogs` | Blog listing data |
| GET | `/api/blog-detail` | Single blog payload |
| GET | `/api/blog-tags` | Tags |
| GET | `/api/guides` | Guides |
| GET | `/api/guides-page` | Guides page structure |
| GET | `/api/events` | Events |
| GET | `/api/committee` | Committee data |
| GET | `/api/contact-us` | Contact endpoint (submit) |
| GET | `/api/sharing-sessions` | Sharing sessions |
| GET | `/api/pbl` | PBL content |
| GET/POST | `/api/admin/permissions` | Admin permissions |
| GET/POST/PATCH/DELETE | `/api/admin/users` | User list / create |
| GET/PATCH/DELETE | `/api/admin/users/{userId}` | Single user admin ops |

---

## Repository layout (high level)

- `app/` — Routes, layouts, `page.tsx` files, and `api/` route handlers.
- `app/components/` — Shared UI (header, forms, buttons, etc.).
- `lib/` — Models (Mongoose), auth helpers, validation, constants, Firebase helpers.
- `public/` — Static assets.

---

## Branching & contribution

Create a **feature branch** from `main`, implement changes, then open a **pull request** into `main`. Avoid committing secrets; use `.env` locally (see project env template if present).

---

## Contact

For technical or product questions about the site, contact the **PINUS Tech** director or your committee lead.
