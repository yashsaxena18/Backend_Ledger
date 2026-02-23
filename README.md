# 🏦 Backend Ledger

> A robust, account-based money movement API built with Node.js, Express 5, and MongoDB — powered by a double-entry ledger system.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT-based registration, login & logout with cookie or Bearer token support |
| 🏦 Accounts | Create accounts, retrieve balances computed directly from ledger entries |
| 💸 Transfers | Double-entry ledger posting for every transaction |
| 🔁 Idempotency | Duplicate transfer protection via `idempotencyKey` |
| 🤖 System Funds | Privileged endpoint for seeding initial account funds |
| 🚫 Token Blacklist | Invalidated JWTs cleaned up automatically after 3 days |
| 📧 Notifications | Email alerts on registration and successful transfers (Gmail OAuth2) |

---

## 🛠 Tech Stack

- **Runtime:** Node.js 20.19+
- **Framework:** Express 5
- **Database:** MongoDB + Mongoose 9
- **Auth:** bcryptjs · jsonwebtoken · cookie-parser
- **Email:** Nodemailer (Gmail OAuth2)

---

## 📁 Project Structure

```text
backend-ledger/
├── server.js
├── package.json
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    ├── middleware/
    │   └── auth.middleware.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── account.routes.js
    │   └── transaction.routes.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── account.controller.js
    │   └── transaction.controller.js
    ├── models/
    │   ├── user.model.js
    │   ├── account.model.js
    │   ├── transaction.model.js
    │   ├── ledger.model.js
    │   └── blackList.model.js
    └── services/
        └── email.service.js
```

---

## ⚙️ Setup

### Prerequisites
- Node.js `v20.19+`
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Gmail OAuth2 credentials for outbound email

### 1. Clone & Install

```bash
git clone https://github.com/your-username/backend-ledger.git
cd backend-ledger
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
MONGO_URI=<mongodb connection string>
JWT_SECRET=<strong random secret>
CLIENT_ID=<google oauth client id>
CLIENT_SECRET=<google oauth client secret>
REFRESH_TOKEN=<google oauth refresh token>
EMAIL_USER=<gmail sender address>
```

> ⚠️ **Security:** Never commit `.env` to version control. Rotate any secrets that were accidentally exposed.

### 3. Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server starts at **`http://localhost:3000`**.

---

## 🔌 API Reference

### Health Check

```
GET /
→ "Ledger Service is up and running"
```

---

### 🔐 Auth — `/api/auth`

#### Register
```http
POST /api/auth/register
```
```json
// Request
{ "email": "alice@example.com", "password": "secret123", "name": "Alice" }

// Response 201
{ "user": { "_id": "...", "email": "alice@example.com", "name": "Alice" }, "token": "<jwt>" }
```

#### Login
```http
POST /api/auth/login
```
```json
// Request
{ "email": "alice@example.com", "password": "secret123" }

// Response 200 — returns user and token
```

#### Logout
```http
POST /api/auth/logout
```
Blacklists the current token and clears the auth cookie.

---

### 🏦 Accounts — `/api/accounts` *(Protected)*

#### Create Account
```http
POST /api/accounts
```
```json
// Response 201
{ "account": { "_id": "...", "user": "...", "status": "ACTIVE", "currency": "INR" } }
```

#### List Accounts
```http
GET /api/accounts
```
Returns all accounts belonging to the authenticated user.

#### Get Balance
```http
GET /api/accounts/balance/:accountId
```
```json
// Response 200
{ "accountId": "...", "balance": 5000 }
```

---

### 💸 Transactions — `/api/transactions`

#### Create Transfer *(Protected)*
```http
POST /api/transactions
```
```json
// Request
{
  "fromAccount": "<accountId>",
  "toAccount": "<accountId>",
  "amount": 100,
  "idempotencyKey": "txn-001"
}
```

| Status | Meaning |
|---|---|
| `201` | Transfer completed successfully |
| `200` | Already processed or still processing |
| `400` | Invalid input, frozen/closed account, or insufficient balance |
| `500` | Previous attempt failed — please retry |

#### Seed Initial Funds *(System User Only)*
```http
POST /api/transactions/system/initial-funds
```
```json
// Request
{ "toAccount": "<accountId>", "amount": 1000, "idempotencyKey": "seed-001" }
```
Requires the authenticated user to have `systemUser: true`.

---

## 📋 Data Models

### User
- `email` — unique, validated
- `name`
- `password` — bcrypt hashed via pre-save hook *(hidden by default)*
- `systemUser` — immutable boolean *(hidden by default)*

### Account
- `user` → ref to User
- `status` — `ACTIVE | FROZEN | CLOSED` (default: `ACTIVE`)
- `currency` (default: `INR`)
- `getBalance()` — instance method computing `totalCredit − totalDebit` from ledger

### Transaction
- `fromAccount`, `toAccount` → refs to Account
- `amount`
- `idempotencyKey` — unique
- `status` — `PENDING | COMPLETED | FAILED | REVERSED`

### Ledger *(Immutable)*
- `account`, `amount`, `transaction`
- `type` — `CREDIT | DEBIT`
- Update/delete operations throw errors by design

### Token Blacklist
- Stores invalidated JWTs
- TTL index auto-removes entries after **3 days**

---

## 🔁 Transfer Flow

```
Client → POST /api/transactions
         │
         ├─ Validate payload & idempotency key
         ├─ Check account statuses (ACTIVE required)
         ├─ Compute sender balance from ledger
         ├─ Open MongoDB session
         ├─ Create Transaction (PENDING)
         ├─ Write DEBIT ledger entry
         ├─ [15s intentional delay]         ← see known limitations
         ├─ Write CREDIT ledger entry
         ├─ Mark Transaction COMPLETED
         └─ Send email notification
```

---

## ⚡ cURL Quick Start

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123","name":"Alice"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'

# Create account
curl -X POST http://localhost:3000/api/accounts \
  -H "Authorization: Bearer <jwt>"

# Transfer funds
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"fromAccount":"<id>","toAccount":"<id>","amount":100,"idempotencyKey":"txn-001"}'
```

---

## ⚠️ Known Limitations

- No automated tests configured
- No global error-handling middleware
- Port is hardcoded to `3000` in `server.js`
- Input validation is manual (no schema validator like Zod or Joi)
- `createTransaction` does not verify that `fromAccount` belongs to `req.user`
- `createInitialFundsTransaction` does not pre-check for duplicate `idempotencyKey`
- `createTransaction` catch block does not abort/end the MongoDB session before returning
- `cookieparser` is listed in dependencies but the app uses `cookie-parser`
- The 15-second delay in the transfer flow is intentional but may cause timeouts in production

---

## 📜 NPM Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `nodemon` | Run with hot reload |
| `start` | `node` | Run in production mode |
| `test` | — | Placeholder (exits with error) |

---

## 📄 License

ISC
