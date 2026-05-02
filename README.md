# OIDC Authentication Server

A minimal, self-hostable OpenID Connect identity provider built with Node.js and Express. Designed to be deployed once and reused across multiple projects as a centralized authentication service.

---

## Overview

This server implements the OpenID Connect Authorization Code Flow on top of OAuth 2.0. External applications register as clients, redirect users here to authenticate, and receive a signed JWT (ID Token) to verify identity.

It handles user registration, login, session management, client registration, token issuance, and public key exposure for token verification.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Token Signing | JWT RS256 (RSA) |
| Password Hashing | bcrypt |
| Session | express-session |

---

## How It Works

```
Client Application
      |
      | 1. Redirect user to /authorize
      v
OIDC Auth Server  <-->  PostgreSQL
      |
      | 2. User logs in
      | 3. Auth code issued to client
      | 4. Client exchanges code for tokens
      v
Client receives id_token (JWT) + access_token
```

### Authorization Code Flow

1. Client redirects user to `/authorize` with `client_id`, `redirect_uri`, `scope`, and `state`
2. If user is not logged in, server redirects to login page
3. After login, server generates a one-time authorization code and redirects back to the client
4. Client sends the code to `/token` along with `client_id` and `client_secret`
5. Server validates everything and returns `access_token` and `id_token`
6. Client decodes the `id_token` (JWT) to get user identity

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and create session |
| POST | `/auth/logout` | Destroy session |
| GET | `/auth/me` | Get current logged in user |

### OIDC Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/authorize` | Start authorization flow |
| POST | `/token` | Exchange auth code for tokens |
| GET | `/userinfo` | Get user claims from access token |
| GET | `/jwks` | Public key set for token verification |
| GET | `/.well-known/openid-configuration` | OIDC discovery document |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/clients` | Register a new OAuth client |
| GET | `/admin/clients` | List all clients |
| GET | `/admin/clients/:id` | Get client by ID |
| PATCH | `/admin/clients/:id/toggle` | Enable or disable a client |

---

## Token Response

The `/token` endpoint returns the following shape:

```json
{
  "access_token": "a3f8c2d1e4b5...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiJ9...",
  "scope": "openid profile email"
}
```

The `id_token` is a signed RS256 JWT containing:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "iss": "https://your-oidc-server.com",
  "aud": "client_id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Supported Scopes

| Scope | Claims returned |
|-------|----------------|
| `openid` | `sub`, `iss`, `aud`, `iat`, `exp` |
| `profile` | `name` |
| `email` | `email` |

---

## Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL or Docker

### Setup

```bash
# clone the repo
git clone <repo-url>
cd oidc_auth

# install dependencies
npm install

# start PostgreSQL via Docker
docker-compose up -d

# copy environment file and fill in values
cp .env.example .env

# push schema to database
npm run db:push

# start development server
npm run dev
```

### Environment Variables

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/oidc_db
SESSION_SECRET=your_random_32_byte_hex_string
ISSUER_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:3000
PRIVATE_KEY=    # contents of private.pem, leave empty to read from file
PUBLIC_KEY=     # contents of public.pem, leave empty to read from file
```

To generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Scripts

```bash
npm run dev          # start with file watching
npm run start        # start production server
npm run db:push      # push schema to database
npm run db:generate  # generate migration files
npm run db:migrate   # run migrations
npm run db:studio    # open Drizzle Studio
```

---

## Integrating with a Client Application

Your application needs to do three things:

**1. Redirect the user to authorize**
```
GET https://your-oidc-server.com/authorize
  ?response_type=code
  &client_id=client_xxx
  &redirect_uri=https://yourapp.com/callback
  &scope=openid profile email
  &state=random_csrf_token
```

**2. Exchange the code for tokens (on your backend)**
```bash
POST https://your-oidc-server.com/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "received_code",
  "redirect_uri": "https://yourapp.com/callback",
  "client_id": "client_xxx",
  "client_secret": "your_client_secret"
}
```

**3. Verify and decode the id_token**
```javascript
import jwt from "jsonwebtoken";

const decoded = jwt.verify(id_token, PUBLIC_KEY, { algorithms: ["RS256"] });

const user = {
  id: decoded.sub,
  email: decoded.email,
  name: decoded.name,
};
```

The public key for verification is available at `/jwks`.

---

## Security

- Passwords are hashed with bcrypt before storage
- Client secrets are hashed before storage and returned only once on creation
- Authorization codes are single-use and expire in 5 minutes
- ID tokens are signed with RS256, private key never exposed
- Public key is available via `/jwks` for external verification
- Sessions use HttpOnly cookies
- Redirect URIs are validated with exact string matching

---

## Deployment

This server is deployed on Render with a Neon PostgreSQL database.

For deployment, RSA keys should be passed as environment variables. Convert your PEM files to a single line format:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem
```

Paste the output as `PRIVATE_KEY` and `PUBLIC_KEY` in your hosting platform's environment variable settings.

---

## License

MIT