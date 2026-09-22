# Security

This document describes the security posture of the marketplace
application — what is implemented, what is intentionally deferred for
a demo submission, and how to report a concern.

## Implemented

- **Transport security:** HTTPS-only on public endpoints (Fly
  auto-provisions certs, `force_https = true` on both `api` and `web`
  services). Internal traffic between Fly apps runs over Fly's encrypted
  WireGuard mesh.

- **Authentication:** JWT access tokens (15 min) + refresh tokens
  (7 days), HS512 signed. Silent refresh on 401 via axios interceptor.

- **Password storage:** BCrypt (Spring's `PasswordEncoder`).

- **Email verification:** required before login.

- **Authorization:** role-based (`ADMIN`, `SHOPPER`, `SELLER`) enforced
  at the service layer with `@PreAuthorize` on every protected
  controller.

- **Ownership scoping:** sellers only see/touch their own products and
  orders; shoppers only see their own orders; reviews require a
  qualifying purchase.

- **Admin safety rails:** admins cannot suspend themselves; cannot
  change the role of a seller who owns a store.

- **Injection protection:** all DB access goes through Spring Data JPA
  (parameterized queries). No raw SQL string concatenation.

- **XSS protection:** React escapes output by default; no
  `dangerouslySetInnerHTML`; all user-generated content is rendered as
  text.

- **Open redirect protection:** dynamic navigation targets are
  validated via `safeInternalPath()`
  (`frontend/src/lib/navigation.ts`), mitigating CVE-2026-53669 in
  react-router-dom 6.x.

- **No CSRF risk:** authentication uses JWT in `Authorization` headers,
  not cookies.

- **Internal services are not public:** Postgres, RabbitMQ, and Mailhog
  live on Fly's private network. Only the API and web apps have public
  IPs.

- **Non-root containers:** both Dockerfiles run as a dedicated
  non-root user.

- **Secrets:** stored in Fly's encrypted secret store, never committed.
  `.env` is gitignored; `.env.example` contains placeholders.

## Deferred (Known Gaps)

These are deliberate trade-offs for a demo submission. They would be
addressed before any production use.

- **Login rate limiting / account lockout.** Not implemented. A
  brute-force attack against `/api/auth/login` is possible.

- **Content Security Policy (CSP) headers.** Not set. A strict CSP
  requires whitelisting Tailwind inline styles, self-hosted fonts, and
  API origins — a day of tuning, and a wrong CSP is worse than none.

- **Demo credentials in the README.** Intentional — the challenge
  requires admin credentials to be public so reviewers can test admin
  features without requesting access. Not production-safe.

- **Password reset flow.** Not implemented.

- **Google OAuth.** Not implemented.

- **Second-factor authentication.** Not implemented.

- **Strict CORS.** The backend relies on the frontend proxying via
  nginx, so there is no cross-origin exposure today. If the API were
  called directly from a different origin, CORS would need to be
  configured.

- **Dependency vulnerability scanning.** No Trivy/OWASP scan in CI.
  `npm audit` reports the known react-router-dom advisories; both are
  mitigated at the application layer (see above).

## Reporting a Vulnerability

This is a demo project. If you find a security issue, open an issue on
the GitHub repository. Do not exploit it against the live demo — that
just wastes everyone's time and potentially incurs infrastructure
costs.

## Reset Procedure

To reset the demo environment to a clean state:

    fly apps destroy marketplace-postgres-bkt
    cd infra && fly deploy --config fly.postgres.toml
    cd ../backend && fly deploy

This re-creates the database and triggers the `DemoDataSeeder` on the
next backend boot.
