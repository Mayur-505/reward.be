# Multi-Project Reward & Referral Engine (NestJS + MongoDB + JWT)

A modular, multi-tenant reward and referral platform built with **NestJS 11**, **MongoDB (Mongoose)**, and **JWT authentication**.

---

## Key Architecture & Features

### 1. Multi-Tenant Project Isolation
- Multiple applications/projects can be created independently (e.g. `PocketLog`, `QuizApp`).
- **Data Isolation**: Each project has its own isolated:
  - Users / Members (`externalUserId`, balance, profile)
  - Coins / Wallet (`coinBalance`, `totalEarnedCoins`, `totalSpentCoins`)
  - Coin transaction ledger (full audit history of all credits and debits)
  - Referral codes & referral networks
  - Gift card catalog & redemption requests
- **No data is shared across projects**—except universal coupons!

### 2. Universal Coupons (Shared Across All Projects)
- Coupons are created globally once (e.g. code: `WELCOME100` giving 100 coins).
- A member of **Project A** can redeem `WELCOME100` into their Project A wallet.
- A member of **Project B** can redeem the same `WELCOME100` into their Project B wallet.
- Duplicate redemption prevention: Each member in each project can only redeem the code once.

### 3. Referral Engine
- When a user joins a project, they automatically receive a unique project-specific referral code.
- If they register using a friend's referral code:
  - The referrer receives the project's configured referral reward (e.g. 50 coins).
  - The referee receives the referee bonus (e.g. 25 coins) plus welcome coins.
  - An atomic transaction and referral record are created.

### 4. Project-Specific Gift Cards Catalog & Redemptions
- Each project can configure its own gift cards (e.g., "$5 Amazon Gift Card" = 500 coins).
- Members redeem cards using their project coin balance.
- Inventory is tracked, and if a request is rejected by an admin, coins are automatically refunded.

---

## API Endpoints Overview

Base URL: `/api`

### 1. Authentication (Admins / Operators)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register admin account |
| `POST` | `/api/auth/login` | Login and receive JWT access token |
| `GET` | `/api/auth/profile` | View current logged-in admin profile |

### 2. Projects Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects` | Create a new project with custom referral & welcome coin rules |
| `GET` | `/api/projects` | List all registered projects |
| `GET` | `/api/projects/:id` | Get project details by ID |
| `PUT` | `/api/projects/:id` | Update project settings, name, or coin reward rules |
| `POST` | `/api/projects/:id/regenerate-api-key` | Regenerate API key for project client |

### 3. Project Members & Coin Wallet
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects/:projectId/members` | Onboard member (with optional referral code) & award welcome coins |
| `GET` | `/api/projects/:projectId/members` | List all members in this project |
| `GET` | `/api/projects/:projectId/members/:memberId` | Get member balance, referral code & stats |
| `GET` | `/api/projects/:projectId/members/:memberId/transactions` | Full coin ledger history (credits/debits) |
| `POST` | `/api/projects/:projectId/members/:memberId/adjust-coins` | Manually credit or debit member coins |

### 4. Referral System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:projectId/referrals/stats/:memberId` | Get user referral code, invite count & total referral coins earned |
| `GET` | `/api/projects/:projectId/referrals` | List all referral conversions in this project |

### 5. Gift Cards Catalog & Redemptions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects/:projectId/gift-cards` | Add new gift card item to project catalog |
| `GET` | `/api/projects/:projectId/gift-cards` | List available gift cards in this project |
| `POST` | `/api/projects/:projectId/gift-cards/:id/redeem` | Member redeems card using project coins |
| `GET` | `/api/projects/:projectId/gift-cards/redemptions` | List redemption requests in project |
| `GET` | `/api/projects/:projectId/gift-cards/redemptions/member/:memberId` | List member redemption history |
| `PUT` | `/api/projects/:projectId/gift-cards/redemptions/:redemptionId/fulfill` | Approve, deliver voucher code, or reject (with auto-refund) |

### 6. Universal Coupons (Cross-Project Shared)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/coupons` | Create universal coupon code |
| `GET` | `/api/coupons` | List all universal coupons |
| `GET` | `/api/coupons/:code` | Get universal coupon details |
| `POST` | `/api/projects/:projectId/coupons/redeem` | Member redeems universal coupon into their project wallet |
| `GET` | `/api/projects/:projectId/coupons/redemptions` | List coupon redemptions for a project |

---

## Interactive Swagger Documentation

Swagger UI is mounted at:
```
http://localhost:3000/api/docs
```
You can inspect all schemas, test every endpoint interactively, and authorize using the JWT Bearer token.

For offline or markdown reference, see:
- [**SWAGGER_API_DOCUMENTATION.md**](SWAGGER_API_DOCUMENTATION.md) — Comprehensive offline Markdown documentation covering all 40 endpoints, request/response bodies, cURL examples, schema models, and integration workflows.
- [**API_DOCUMENTATION.md**](API_DOCUMENTATION.md) — Mirror copy for standard API docs naming.

---

## Getting Started

1. **Configure Environment** (optional, defaults provided in `.env`):
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/reward_db
   JWT_SECRET=superSecretKeyChangeInProduction123456789!
   JWT_EXPIRES_IN=7d
   ```

2. **Start Development Server**:
   ```bash
   npm run start:dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```
