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
