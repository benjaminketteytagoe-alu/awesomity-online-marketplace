# Marketplace API

A comprehensive RESTful API for an online marketplace where **shoppers** buy products, **sellers** manage stores, and **admins** govern the platform.

Built with **Spring Boot 3.3**, **PostgreSQL 16**, **RabbitMQ 3.13**, and **JWT auth**. The entire stack runs in Docker — no local Java, Maven, Node, or Postgres installation required.

[![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3-6DB33F?logo=spring)](#)
[![Java](https://img.shields.io/badge/java-21-ED8B00?logo=openjdk)](#)
[![Postgres](https://img.shields.io/badge/postgres-16-336791?logo=postgresql)](#)
[![RabbitMQ](https://img.shields.io/badge/rabbitmq-3.13-FF6600?logo=rabbitmq)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## Table of Contents

- [Repository](#-repository)
- [Quick Start](#-quick-start)
- [Service URLs (Local)](#-service-urls-local)
- [API Documentation](#-api-documentation)
- [Admin Credentials](#-admin-credentials)
- [System Design](#-system-design)
- [Request Flow — Place & Pay for an Order](#-request-flow--place--pay-for-an-order)
- [Entity Relationships](#-entity-relationships)
- [Testing the API](#-testing-the-api)
- [Running Tests](#-running-tests)
- [Features Implemented](#-features-implemented)
- [Tech Stack](#-tech-stack)
- [Design Decisions](#-design-decisions)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## Repository

**GitHub:** [https://github.com/benjaminketteytagoe-alu/awesomity-online-marketplace.git](https://github.com/benjaminketteytagoe-alu/awesomity-online-marketplace.git)

```bash
git clone https://github.com/benjaminketteytagoe-alu/awesomity-online-marketplace.git
cd awesomity-online-marketplace

## Security Notes

### CVE-2026-53669 — React Router open redirect (moderate)

Affects `react-router-dom` versions 6.0.0 through 7.17.0. A crafted path
containing backslashes can cause `<Link>` or `useNavigate` to navigate to an
external origin, enabling phishing and token-exfiltration attacks.

**Status: mitigated at the application layer.**

All dynamic navigation targets are validated with `safeInternalPath()`
(`frontend/src/lib/navigation.ts`). This function rejects anything that is
not a clean internal path — including paths containing backslashes, paths
starting with `//`, and paths with a scheme prefix. It is applied at every
place untrusted input flows into a navigation primitive:

- `RequireRole.tsx` — the `redirectTo` prop
- `auth.mutations.ts` — the `useLogin` return-to-origin path

**Library upgrade to `react-router-dom@7.18.0+` is planned as a dedicated
migration step.** It is deferred because React Router 7 is a breaking major
release requiring route-tree changes, testing, and updated imports.

### GHSA-337j-9hxr-rhxg — SSR constructor injection (moderate)

**Status: not applicable.**

This advisory only affects React Router **Framework Mode** and **Data Mode**
applications performing server-side rendering and hydration. This project
uses **Declarative Mode** routing (`<BrowserRouter>` + `<Routes>` +
`<Route element>`). No SSR, no hydration, no exposure.
