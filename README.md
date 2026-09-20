# Marketplace

A full-stack online marketplace where **shoppers** buy products, **sellers** run
stores, and **admins** govern the platform. Built with Spring Boot 3.3,
PostgreSQL 16, RabbitMQ 3.13, and React 18. The entire stack runs in Docker —
no local Java, Maven, Node, or Postgres installation required.

> **Status:** Deployed — see [Deployment](#deployment) for the live URL and
> admin credentials.
>
> **Requirements** satisfied in this implementation are listed in the original
> challenge brief (`backend.md`, provided separately with the submission).

[![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3-6DB33F?logo=spring)](#)
[![Java](https://img.shields.io/badge/java-21-ED8B00?logo=openjdk)](#)
[![Postgres](https://img.shields.io/badge/postgres-16-336791?logo=postgresql)](#)
[![RabbitMQ](https://img.shields.io/badge/rabbitmq-3.13-FF6600?logo=rabbitmq)](#)
[![React](https://img.shields.io/badge/react-18-61DAFB?logo=react)](#)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?logo=typescript)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Default Accounts](#default-accounts)
- [Service URLs](#service-urls)
- [Architecture](#architecture)
- [Entity Relationships](#entity-relationships)
- [Order Flow — Create, Pay, Process](#order-flow--create-pay-process)
- [Features Implemented](#features-implemented)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Security Notes](#security-notes)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Quick Start

### Prerequisites

The only thing you need installed is **Docker** (with the Compose plugin).
No Java, Node.js, PostgreSQL, RabbitMQ, or any other runtime required. The
entire stack — backend, frontend, database, message broker, and email
server — runs inside Docker containers.

- **Docker Desktop** (macOS / Windows) — https://www.docker.com/products/docker-desktop
- **Docker Engine + Compose plugin** (Linux) — https://docs.docker.com/engine/install/

Verify with:

```bash
docker --version           # 24.x or newer
docker compose version

# 1. Clone the repository
git clone https://github.com/benjaminketteytagoe-alu/awesomity-online-marketplace.git
cd awesomity-online-marketplace

# 2. Copy the example environment file
cp .env.example .env

# 3. Start the entire stack
docker compose up -d --build

# Stop containers, keep data
docker compose down

# Stop containers, delete all data (fresh start — reseeds on next up)
docker compose down -v

# Rebuild both
docker compose up -d --build

# Rebuild only one
docker compose up -d --build backend
docker compose up -d --build frontend


# Inside the running backend container
docker compose exec backend ./mvnw test

# Or locally (requires Java 21 + Maven on the host)
cd backend
./mvnw test


cd frontend

# Type check — must pass with zero errors
npm run typecheck

# Lint — must pass with zero warnings
npm run lint

# Build — verifies the production bundle compiles
npm run build
