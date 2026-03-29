# Code Review Report: URL Shortener

This review was conducted with a focus on security, performance, reliability, and architectural best practices.

## Summary of Findings

Overall, the codebase is well-structured and uses modern technologies (TypeScript, tRPC, MongoDB, Redis). However, there are several critical issues, particularly regarding user privacy and performance, that need immediate attention.

---

## 🔴 Critical Issues

### 1. Massive Privacy Leak: Analytics are Public
- **File**: `server/src/controllers/analytics.controller.ts` & `server/src/services/analytics.service.ts`
- **Issue**: The `analytics.getAnalytics` tRPC procedure is a `publicProcedure` and the underlying service does not verify if the requesting user owns the URL.
- **Impact**: Any user (authenticated or not) can view detailed click analytics, OS, browser, and location data for any URL if they know its `urlId`.
- **Recommendation**: 
    1. Change `getAnalytics` to `loggedInUserProcedure`.
    2. Add an ownership check in `AnalyticsService.getAnalyticsForUrlId` to ensure the `userId` in context matches the `userId` associated with the URL.

### 2. N+1 Query Performance Problem in Dashboard
- **File**: `server/src/services/analytics.service.ts` (Method: `getUserAnalytics`)
- **Issue**: The dashboard analytics fetches all user URLs and then iterates through them, calling `this.analyticsRepository.getTotalClicksForUrl(url.id)` for each one.
- **Impact**: If a user has 100 URLs, 101 database queries will be executed. This will cause significant latency as the user's link count grows and put unnecessary load on MongoDB.
- **Recommendation**: Use a single MongoDB aggregation pipeline with `$match` on `userId` (via a join if necessary) or `$in: [all_user_url_ids]` to get all click counts in one roundtrip.

### 3. Missing Session Revocation for Access Tokens
- **File**: `server/src/middlewares/auth.middleware.ts`
- **Issue**: The authentication middleware verifies the JWT signature but does not check the `tokenVersion` against the database. 
- **Impact**: When a user logs out or changes their password (incrementing `tokenVersion`), their existing *access tokens* remain valid until they naturally expire. Immediate session revocation is currently not functional.
- **Recommendation**: Include `tokenVersion` in the access token payload and verify that it matches the current `tokenVersion` in the user's database record during middleware execution.

---

## 🟡 High & Medium Issues

### 4. Unhandled Reset/Redirection Errors
- **File**: `server/src/controllers/url.controller.ts` (Function: `redirectUrl`)
- **Issue**: The `redirectUrl` Express handler lacks a `try-catch` block. It calls `urlService.getOriginalUrl`, which is designed to throw an exception if a URL is not found, expired, or inactive.
- **Impact**: An invalid URL request will result in an unhandled promise rejection, likely leading to a default 500 error instead of a clean 404, and making the subsequent `if (!url)` check dead code.
- **Recommendation**: Wrap the logic in a `try-catch` block and return a proper 404 or redirect to a custom error page on failure.

### 5. Inefficient Search Implementation
- **File**: `server/src/repositories/url.repository.ts` (Methods: `getUrlsOfUser`, `countUrlsOfUser`)
- **Issue**: Searching for URLs uses case-insensitive regex (`$options: "i"`) without being anchored to the start of the string.
- **Impact**: MongoDB cannot efficiently use standard indexes for these queries, leading to full collection scans as the data grows.
- **Recommendation**: Implement MongoDB Text Search (`$text`) and create a text index on the searchable fields (`originalUrl`, `shortUrl`, `tags`).

### 6. Potential Precision Loss in URL Generation
- **File**: `server/src/utils/base62.ts`
- **Issue**: The `toBase62` function uses JavaScript `number` for its input.
- **Impact**: JavaScript numbers lose precision after $2^{53}-1$ (`Number.MAX_SAFE_INTEGER`). While this is a large number, a high-volume URL shortener could eventually hit this limit, causing incorrect short URL generation.
- **Recommendation**: Update the function to accept and use `BigInt`.

---

## 🔵 Improvements & Clean Code

### 7. Weak Password Requirements
- **Files**: `server/src/models/user.model.ts` & `auth.controller.ts`
- **Issue**: The minimum password length is only 6 characters (enforced only via Zod in the controller), and there are no requirements for complexity (uppercase, numbers, symbols).
- **Recommendation**: Increase minimum length to 8+ and add a regex check for complexity in the registration validator.

### 8. Misleading Type Casting in Auth Middleware
- **File**: `server/src/middlewares/auth.middleware.ts`
- **Issue**: The middleware casts the decoded JWT to a type including `tokenVersion`, but the access token payload doesn't actually contain `tokenVersion`.
- **Impact**: Downstream code might mistakenly believe it has access to a valid `tokenVersion` from the context.

### 9. Redundant Collision Check
- **File**: `server/src/services/url.service.ts`
- **Issue**: `createShortUrl` performs a `findByShortUrl` check even when getting a unique ID from the cache counter.
- **Recommendation**: If the ID generator is reliable (e.g., Redis `INCR`), the collision check can be removed to save a DB roundtrip.
