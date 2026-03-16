# LinkForge — Frontend Feature Documentation

> A production-ready URL Shortener Web Application built with React, TypeScript, Tailwind CSS, and ShadCN UI.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Public Pages](#public-pages)
3. [Authentication](#authentication)
4. [Dashboard](#dashboard)
5. [My Links](#my-links)
6. [Analytics](#analytics)
7. [Settings](#settings)
8. [Shared UI & DX](#shared-ui--dx)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS + ShadCN UI |
| Routing | React Router v6 |
| State (server) | TanStack React Query |
| State (client) | Zustand (`authStore`) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Notifications | Sonner (toast) |
| Icons | Lucide React |
| Theme | next-themes (dark/light/system) |

---

## Public Pages

### Landing Page (`/`)
- Hero section with animated CTA — shorten a URL directly from the landing page without signing in.
- **Inline URL shortener form**: Zod-validated input, generates a mock short URL with a random alias, displays the result with a copy-to-clipboard button.
- **Expiration warning**: Links that will expire within 3 days show a prominent amber alert badge.
- Feature highlights section (cards) showcasing speed, analytics, and security.
- Fully responsive layout; dark-mode compatible.

---

## Authentication

### Login (`/login`)
- Email + password form validated with Zod.
- On success, stores user token + profile in Zustand (`authStore`) and redirects to `/dashboard/overview`.
- Mocked API call via `authService`; shows toast on success/error.
- Link to the Register page.

### Register (`/register`)
- Name, email, password, and confirm-password fields with full Zod validation.
- Passwords must match; minimum 6 characters enforced.
- On success, auto-logs in and redirects to the dashboard.
- Link to the Login page.

### Route Protection
- `ProtectedRoute` HOC in `App.tsx` guards all `/dashboard/*` routes.
- Unauthenticated users are redirected to `/login`.

---

## Dashboard

### Layout (`/dashboard/*`)
- Collapsible sidebar powered by ShadCN `SidebarProvider`.
- **Sidebar navigation**: Dashboard (Overview), My Links, Settings.
- **Top Navbar**: Sidebar toggle, app title, dark/light mode toggle, user avatar dropdown with logout.
- `DashboardLayout` uses React Router `<Outlet>` to render child pages.
- Redirects bare `/dashboard` to `/dashboard/overview`.

### Overview (`/dashboard/overview`)
- **KPI Cards** (4 metrics):
  - Total Links created
  - Total Clicks (across all links)
  - Average Engagement (clicks per link)
  - System Activity Status
- **Global Click Activity chart** – Line chart showing aggregated click volume over the past 30 days (from `analyticsService`).
- **Top Performing Links chart** – Horizontal bar chart ranking your top 5 links by total clicks.
- Loading skeleton UI while data is being fetched.
- "View All Links" button navigating to the My Links page.

---

## My Links

### Page (`/dashboard/links`)
- **Create Short URL dialog**: Opens a modal form with fields for Original URL, custom alias (optional), and expiry date (optional). Zod-validated; creates a link via `linkService`.
- **Links table** with columns:
  - Short Alias (clickable)
  - Original URL (truncated)
  - Total Clicks
  - Status badge (Active / Expired / Paused)
  - Expiry Date
  - Actions (View Analytics, Copy, Delete)
- **Filtering**: Search by URL or alias; filter by status (All / Active / Expired / Paused).
- **Copy to clipboard**: Copies the full short URL with a toast confirmation.
- **Delete link**: Confirmation-free deletion via `linkService`, invalidates React Query cache.
- **View Analytics**: Navigates to `/dashboard/analytics/:id` for per-link deep dive.
- Expiry warning badge: Links expiring within 3 days are highlighted in amber.
- Empty state illustration when no links exist.
- Loading skeleton and error state handling.

---

## Analytics

### Page (`/dashboard/analytics/:id`)
- Accessible by clicking "View Analytics" on any link row in My Links.
- **Header**: Displays the short alias and original URL of the selected link.
- **Time-range filter**: Week / Month / Year selector (re-fetches data via `analyticsService`).
- **Stat cards**: Total Clicks, Unique Visitors, Click-Through Rate, Average Daily Clicks.
- **Click Trend chart**: Line chart of daily click volume for the selected period.
- **Device Breakdown chart**: Pie chart with click split across Mobile, Desktop, Tablet.
- **Top Referrers chart**: Horizontal bar chart showing traffic source domains.
- Loading and error states handled gracefully.

---

## Settings

### Page (`/dashboard/settings`)
- **Profile Information card**:
  - Edit display name.
  - Email field is displayed but disabled (contact support to change).
  - "Save Changes" button; shows a success toast on submit.
- **Change Password card**:
  - Current Password, New Password, Confirm New Password fields.
  - Zod validation: minimum 6 characters; new password and confirm must match.
  - "Update Password" button; shows a success toast on submit and resets the form.
- All form state managed by React Hook Form + Zod resolvers.

---

## Shared UI & DX

| Feature | Details |
|---|---|
| **Dark Mode** | System / Light / Dark toggle via `ModeToggle` component in navbar |
| **Toast Notifications** | Sonner toasts for all async actions (success + error) |
| **Skeleton Loaders** | All data-heavy pages show skeleton cards while loading |
| **Error Boundaries** | Query-level error states displayed inline |
| **React Query** | All server data fetched & cached; mutations invalidate relevant queries |
| **Mocked API** | `mockApi.ts` simulates realistic data with random delays; no backend required |
| **Zod Validation** | All forms use Zod schemas for type-safe, end-to-end validated input |
| **Responsive Design** | Mobile-first; sidebar collapses on small screens; tables scroll horizontally |
| **TypeScript** | Strict mode enabled throughout; all components and services are fully typed |
