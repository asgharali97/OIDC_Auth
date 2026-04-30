# OIDC Authentication Server (v1)

## 🧭 Overview

This project is a **minimal, production-oriented OpenID Connect (OIDC) Identity Provider**.

It enables:

* User authentication (login/signup)
* Developer client registration (OAuth apps)
* OIDC-based login for external applications

This system is designed to be:

* Deployable
* Reusable across projects
* Extendable to production-grade features later

---

# 🎯 Goals

### Functional Goals

* Implement OIDC Authorization Code Flow
* Provide identity via ID Tokens (JWT)
* Allow external apps to authenticate users

### Non-Goals (for v1)

* PKCE
* Refresh tokens
* Social login
* Multi-tenant orgs
* Consent screens

---

# 🧠 Core Concepts

* OAuth 2.0 → Authorization (access)
* OIDC → Authentication (identity layer on top of OAuth)

This system implements:

```
OIDC = OAuth Flow + Identity (ID Token) + Trust (JWKS)
```

---

# 🏗️ System Architecture

```
Client App (Assignment Project)
        ↓
OIDC Auth Server (this project)
        ↓
PostgreSQL (data storage)
```

---

# 🔄 Core Flows

## 1. Developer Flow (Client Registration)

1. Developer logs in
2. Creates a client
3. Server generates:

   * client_id
   * client_secret
4. Secret is hashed before storing
5. Credentials returned once

---

## 2. User Authentication Flow

1. User registers
2. User logs in
3. Server creates session (cookie-based)
4. Session used in authorization step

---

## 3. Authorization Flow

1. Client redirects user to `/authorize`
2. Server validates:

   * client_id
   * redirect_uri
3. If not logged in → redirect to login
4. If logged in:

   * generate auth_code
   * store in DB
5. Redirect back with `code`

---

## 4. Token Exchange Flow

1. Client sends POST `/token`
2. Server validates:

   * auth code
   * client
   * redirect_uri
   * expiration
3. Server generates:

   * access_token (random)
   * id_token (JWT)
4. Deletes auth code
5. Returns tokens

---

## 5. Identity Verification Flow

1. Client verifies ID Token using `/jwks`
2. Extracts user identity (`sub`, `email`)
3. User authenticated

---

# 🧱 Data Model (Design Decisions)

## Users

* password stored as hash (never raw)
* email unique
* timestamps for audit

## Clients

* secret stored as hash
* multiple redirect URIs allowed
* supports future extensibility

## Authorization Codes

* bound to:

  * user
  * client
  * redirect URI
* short-lived (≤ 5 minutes)

## Tokens

* minimal storage (access token only)
* allows revocation later

---

# 🛡️ Security Model

## Authentication Security

* Password hashing (bcrypt)
* Session cookies (httpOnly)

## OAuth Security

* Exact redirect URI matching
* Auth code expiration
* One-time use codes

## OIDC Security

* RS256 JWT signing
* Private key never exposed
* Public key via JWKS only

## Input Security

* DTO validation using Zod
* Reject invalid data early

---

# 🌐 Public Endpoints

```
GET  /.well-known/openid-configuration
GET  /jwks
GET  /authorize
POST /token
GET  /userinfo
```

---

# 🔧 Internal Endpoints

```
POST /auth/register
POST /auth/login
POST /auth/logout

POST /admin/clients
GET  /admin/clients
```

---

# 🧪 Testing Strategy

* Full browser flow test
* Token exchange via Postman
* JWT verification using JWKS
* Negative testing:

  * expired code
  * invalid client
  * wrong redirect URI

---

# 🚀 Deployment Plan

Requirements:

* Persistent RSA keys
* Environment variables
* HTTPS support

Deployment:

* Server → Render / Railway
* DB → Managed Postgres

---

# 📦 Reusability Model

This system is **not copied into projects**.

Instead:

```
Project A → uses OIDC Server
Project B → uses same OIDC Server
```

---
