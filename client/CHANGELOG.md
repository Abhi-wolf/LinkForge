# Changelog

All notable changes to **LinkForge** are documented here.  
Format: `[Date] — Description · File(s) changed`

---

## [2026-02-23] — Session 2: Hooks Refactor, Auth Header & Docs

### ✨ New: Dedicated Hooks Folder (`src/hooks/`)

| Hook File | Exported Hooks | Description |
|---|---|---|
| `src/hooks/useLinks.ts` | `useLinks` | Fetches all user links |
| | `useCreateLink` | Mutation to create a short link (with toast + cache invalidation) |
| | `useDeleteLink` | Mutation to delete a link by id (with toast + cache invalidation) |
| `src/hooks/useAnalytics.ts` | `useAnalytics(id, filter)` | Fetches analytics for a specific link |
| | `useOverviewAnalytics(firstLinkId)` | Fetches overview-level analytics for the Dashboard |

### ♻️ Refactored: Pages → Now Use Hooks

| File | Change |
|---|---|
| `src/pages/Dashboard/MyLinks.tsx` | Replaced inline `useQuery` / `useMutation` with `useLinks()` + `useDeleteLink()` |
| `src/pages/Dashboard/Analytics.tsx` | Replaced inline `useQuery` with `useLinks()` + `useAnalytics()` |
| `src/pages/Dashboard/DashboardOverview.tsx` | Replaced inline `useQuery` with `useLinks()` + `useOverviewAnalytics()` |

### 🎨 New: Auth Page Headers

| File | Change |
|---|---|
| `src/pages/Login.tsx` | Added sticky top header with navigable **LinkForge** logo (→ `/`) and `ModeToggle` |
| `src/pages/Register.tsx` | Same as Login |

---

## [2026-02-23] — Session 1: Initial Build, Bug Fixes & Settings Page

### 🐛 Fixed: TypeScript TS6133 Errors (`npm run build`)

| File | Fix |
|---|---|
| `src/pages/Dashboard/DashboardLayout.tsx` | Removed 4 unused imports: `LayoutDashboard`, `LinkIcon`, `Settings`, `FileText` |
| `src/pages/Dashboard/Settings.tsx` | Removed unused `CardFooter` import; prefixed unused `values` → `_values` |

### 🗂️ Updated: Routing (`src/App.tsx`)

| Change | Detail |
|---|---|
| Added `/dashboard/overview` route | Renders `DashboardOverview` component |
| Changed default redirect | `/dashboard` → `/dashboard/overview` (was `/dashboard/links`) |
| Wired up Settings page | Replaced `<div>Settings Placeholder</div>` with `<Settings />` |
| Added imports | `DashboardOverview`, `Settings` |

### 🔗 Updated: Sidebar (`src/components/layout/AppSidebar.tsx`)

| Change | Detail |
|---|---|
| Removed **Analytics** nav item | Analytics are now accessed via "View Analytics" button per link |
| Updated **Dashboard** link | Points to `/dashboard/overview` (was `/dashboard/links`) |
| Removed unused `BarChart` import | — |

### ⚙️ Updated: Settings Page (`src/pages/Dashboard/Settings.tsx`)

- Profile Information card: edit display name (email is read-only)
- Change Password card: current → new → confirm password with full Zod validation

### 📄 New: Documentation

| File | Content |
|---|---|
| `FEATURES.md` | Full feature documentation for all pages and capabilities |
| `CHANGELOG.md` | This file — tracks all changes per session |
