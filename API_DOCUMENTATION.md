# Reward & Referral Engine - Swagger API Documentation

> **OpenAPI Specification Version**: `3.0.0`  
> **API Version**: `1.0`  
> **Application Title**: `Reward & Referral Engine API`  
> **Base URL**: `http://localhost:3000/api` (Default)  

## Overview & Architecture

Multi-Project Reward & Referral Backend with project-isolated coins, referrals, gift cards, and universal shared coupons.

This backend provides a complete multi-tenant rewards, referrals, coin wallets, digital gift cards, and universal coupon management platform.

### Core Capabilities
- **Multi-Tenant Data Isolation**: Projects (tenants) are isolated. Each project maintains its own members, coin balances, transaction ledgers, referral networks, and gift card catalogs.
- **Universal Coupons**: Cross-project shared coupons can be created globally and redeemed once per member within each individual project.
- **Referral System**: Configurable referrer and referee coin bonuses, unique referral codes per member, and referral conversion tracking.
- **Gift Card Catalog & Redemptions**: Catalog management with coin-cost redemptions, inventory tracking, and admin fulfillment (approve, deliver voucher, or reject with coin refund).
- **Partner Coupons Sync**: Automated and on-demand synchronization with Gostatus / Feedico partner coupons from Supabase.
- **Mobile App End-User API (`/api/me/*`)**: Dedicated self-service routes for mobile app members to manage their profile, wallet, referrals, and redemptions.

### Interactive Swagger UI & OpenAPI Endpoints

| Resource | URL Path | Description |
|---|---|---|
| **Swagger UI (Primary)** | [`/api/docs`](http://localhost:3000/api/docs) | Interactive Swagger documentation & sandbox |
| **Swagger UI (Alias)** | [`/docs`](http://localhost:3000/docs) | Alternative documentation URL |
| **OpenAPI JSON Spec** | [`/api/docs/json`](http://localhost:3000/api/docs/json) | Full raw OpenAPI 3.0 JSON specification |
| **OpenAPI YAML Spec** | [`/api/docs/yaml`](http://localhost:3000/api/docs/yaml) | Full raw OpenAPI 3.0 YAML specification |

### Security & Authentication Schemes

The API uses two primary authentication schemes:

1. **`JWT-auth` (Bearer Token)**:
   - **Header**: `Authorization: Bearer <token>`
   - **Admin / Operator Access**: Used for admin operations (projects, coupon creation, gift card fulfillment, manual coin adjustments).
   - **Member / Mobile Access**: Used for member self-service endpoints (`/api/me/*`), using the token returned by `POST /api/projects/{projectId}/members/login`.

2. **`api-key` (`x-api-key`)**:
   - **Header**: `x-api-key: <project_api_key>`
   - **Project Client Integration**: Used by client applications / mobile apps to interact with project-scoped endpoints (e.g. member login/registration).

3. **Public Endpoints**:
   - Endpoints marked with no security requirement (e.g., `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/api/gostatus-coupons`).

--- 

## Table of Contents

- [1. Authentication (Admin & Operator)](#1-authentication-admin-operator-) (3 endpoints)
  - [`POST` `/api/auth/register` - Register a new user](#post--api-auth-register)
  - [`POST` `/api/auth/login` - User login](#post--api-auth-login)
  - [`GET` `/api/auth/profile` - Get current user profile (JWT protected)](#get--api-auth-profile)
- [2. Project Tenant Management](#2-project-tenant-management) (5 endpoints)
  - [`POST` `/api/projects` - Create a new project tenant](#post--api-projects)
  - [`GET` `/api/projects` - List all registered projects](#get--api-projects)
  - [`GET` `/api/projects/{id}` - Get project details by ID](#get--api-projects-id-)
  - [`PUT` `/api/projects/{id}` - Update project details and reward settings](#put--api-projects-id-)
  - [`POST` `/api/projects/{id}/regenerate-api-key` - Regenerate API key for a project](#post--api-projects-id-regenerate-api-key)
- [3. Members & Coin Wallets (Admin / Service)](#3-members-coin-wallets-admin-service-) (6 endpoints)
  - [`POST` `/api/projects/{projectId}/members/login` - Member login & onboarding (Client / Mobile App)](#post--api-projects-projectid-members-login)
  - [`POST` `/api/projects/{projectId}/members` - Onboard or fetch a member in a specific project](#post--api-projects-projectid-members)
  - [`GET` `/api/projects/{projectId}/members` - List all members belonging to a project](#get--api-projects-projectid-members)
  - [`GET` `/api/projects/{projectId}/members/{memberId}` - Get member details, balance, and referral code](#get--api-projects-projectid-members-memberid-)
  - [`GET` `/api/projects/{projectId}/members/{memberId}/transactions` - Get coin balance transaction history for a member](#get--api-projects-projectid-members-memberid-transactions)
  - [`POST` `/api/projects/{projectId}/members/{memberId}/adjust-coins` - Adjust member coin balance (credit or debit)](#post--api-projects-projectid-members-memberid-adjust-coins)
- [4. Referral Engine & Stats](#4-referral-engine-stats) (2 endpoints)
  - [`GET` `/api/projects/{projectId}/referrals/stats/{memberId}` - Get referral statistics, referral code, and referee history for a member](#get--api-projects-projectid-referrals-stats-memberid-)
  - [`GET` `/api/projects/{projectId}/referrals` - List all referral conversions across this project](#get--api-projects-projectid-referrals)
- [5. Gift Cards & Redemptions](#5-gift-cards-redemptions) (6 endpoints)
  - [`POST` `/api/projects/{projectId}/gift-cards` - Create a new gift card item in project catalog](#post--api-projects-projectid-gift-cards)
  - [`GET` `/api/projects/{projectId}/gift-cards` - List all available gift cards in this project](#get--api-projects-projectid-gift-cards)
  - [`POST` `/api/projects/{projectId}/gift-cards/{id}/redeem` - Member redeems a gift card using project coin balance](#post--api-projects-projectid-gift-cards-id-redeem)
  - [`GET` `/api/projects/{projectId}/gift-cards/redemptions` - List all gift card redemption requests for this project](#get--api-projects-projectid-gift-cards-redemptions)
  - [`GET` `/api/projects/{projectId}/gift-cards/redemptions/member/{memberId}` - List redemption history for a specific member](#get--api-projects-projectid-gift-cards-redemptions-member-memberid-)
  - [`PUT` `/api/projects/{projectId}/gift-cards/redemptions/{redemptionId}/fulfill` - Approve, deliver, or reject a redemption request](#put--api-projects-projectid-gift-cards-redemptions-redemptionid-fulfill)
- [6. Universal Coupons (Shared Across Projects)](#6-universal-coupons-shared-across-projects-) (5 endpoints)
  - [`POST` `/api/coupons` - Create a universal coupon (shared across all projects)](#post--api-coupons)
  - [`GET` `/api/coupons` - List all universal coupons](#get--api-coupons)
  - [`GET` `/api/coupons/{code}` - Get details of a universal coupon by code](#get--api-coupons-code-)
  - [`POST` `/api/projects/{projectId}/coupons/redeem` - Redeem a universal coupon into a project member wallet](#post--api-projects-projectid-coupons-redeem)
  - [`GET` `/api/projects/{projectId}/coupons/redemptions` - List all coupon redemptions for a specific project](#get--api-projects-projectid-coupons-redemptions)
- [7. External / Partner Coupons (Gostatus & Feedico)](#7-external-partner-coupons-gostatus-feedico-) (3 endpoints)
  - [`GET` `/api/api/gostatus-coupons` - List & Search Synced Gostatus / Feedico Coupons](#get--api-api-gostatus-coupons)
  - [`GET` `/api/api/gostatus-coupons/{id}` - Get Coupon Details by ID](#get--api-api-gostatus-coupons-id-)
  - [`POST` `/api/api/gostatus-coupons/sync` - Trigger Immediate Sync from Gostatus / Feedico Supabase API](#post--api-api-gostatus-coupons-sync)
- [8. My Account (End-User & Mobile App)](#8-my-account-end-user-mobile-app-) (11 endpoints)
  - [`GET` `/api/me/profile` - Get current member profile and coin balance](#get--api-me-profile)
  - [`GET` `/api/me/transactions` - Get current member coin transaction ledger history](#get--api-me-transactions)
  - [`GET` `/api/me/referrals` - Get current member referral code, stats, and invited friends list](#get--api-me-referrals)
  - [`POST` `/api/me/referral` - Claim a referral code later for onboarding bonus](#post--api-me-referral)
  - [`GET` `/api/me/gift-cards` - Get available gift cards catalog for current project](#get--api-me-gift-cards)
  - [`POST` `/api/me/gift-cards/{id}/redeem` - Redeem a gift card using current member coin balance](#post--api-me-gift-cards-id-redeem)
  - [`GET` `/api/me/gift-cards/redemptions` - Get current member gift card redemption history](#get--api-me-gift-cards-redemptions)
  - [`POST` `/api/me/coupons/redeem` - Redeem a universal coupon code for current member](#post--api-me-coupons-redeem)
  - [`GET` `/api/me/gostatus-coupons` - Browse available Gostatus / Feedico partner coupons](#get--api-me-gostatus-coupons)
  - [`POST` `/api/me/gostatus-coupons/{id}/redeem` - Redeem a partner coupon using current member coins](#post--api-me-gostatus-coupons-id-redeem)
  - [`GET` `/api/me/gostatus-coupons/my-coupons` - Get all partner coupons redeemed by current member](#get--api-me-gostatus-coupons-my-coupons)
- [Data Schemas & DTO Reference](#data-schemas--dto-reference)
- [Standard Error Responses & Status Codes](#standard-error-responses--status-codes)
- [Integration Workflows & Best Practices](#integration-workflows--best-practices)

--- 

## 1. Authentication (Admin & Operator)

Endpoints for registering, logging in, and retrieving profiles for backend administrators and operators.

### `POST` /api/auth/register

**Summary**: Register a new user  
**Operation ID**: `AuthController_register`  
**Authentication**: None (Public)  

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`RegisterDto`](#schema-registerdto)

```json
{
  "email": "alex@example.com",
  "password": "Pass1234!",
  "name": "Alex Morgan"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | User registered successfully | [`AuthResponseDto`](#schema-authresponsedto) |
| `409` | Email is already registered | - |

<details>
<summary><b>Example Response (201)</b></summary>

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6605df93a40498b0f19c32de",
    "email": "alex@example.com",
    "name": "Alex Morgan",
    "roles": [
      "user"
    ],
    "createdAt": "2026-10-12T10:00:00.000Z",
    "updatedAt": "2026-10-12T10:00:00.000Z"
  }
}
```

</details>

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Pass1234!","name":"Alex Morgan"}'
```

</details>

---

### `POST` /api/auth/login

**Summary**: User login  
**Operation ID**: `AuthController_login`  
**Authentication**: None (Public)  

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`LoginDto`](#schema-logindto)

```json
{
  "email": "alex@example.com",
  "password": "Pass1234!"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | User logged in successfully | [`AuthResponseDto`](#schema-authresponsedto) |
| `401` | Invalid email or password | - |

<details>
<summary><b>Example Response (200)</b></summary>

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6605df93a40498b0f19c32de",
    "email": "alex@example.com",
    "name": "Alex Morgan",
    "roles": [
      "user"
    ],
    "createdAt": "2026-10-12T10:00:00.000Z",
    "updatedAt": "2026-10-12T10:00:00.000Z"
  }
}
```

</details>

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Pass1234!"}'
```

</details>

---

### `GET` /api/auth/profile

**Summary**: Get current user profile (JWT protected)  
**Operation ID**: `AuthController_getProfile`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | Current user profile details | [`UserProfileResponseDto`](#schema-userprofileresponsedto) |
| `401` | Missing or invalid JWT token | - |

<details>
<summary><b>Example Response (200)</b></summary>

```json
{
  "_id": "6605df93a40498b0f19c32de",
  "email": "alex@example.com",
  "name": "Alex Morgan",
  "roles": [
    "user"
  ],
  "createdAt": "2026-10-12T10:00:00.000Z",
  "updatedAt": "2026-10-12T10:00:00.000Z"
}
```

</details>

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

## 2. Project Tenant Management

Endpoints for creating and configuring multi-tenant projects, managing custom coin names, welcome rewards, referral rules, and API keys.

### `POST` /api/projects

**Summary**: Create a new project tenant  
**Operation ID**: `ProjectsController_create`  
**Authentication**: `JWT-auth`  

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`CreateProjectDto`](#schema-createprojectdto)

```json
{
  "name": "PocketLog",
  "code": "POCKETLOG",
  "description": "Reward app for expense tracking users",
  "settings": {
    "referralRewardCoins": 50,
    "refereeRewardCoins": 25,
    "welcomeCoins": 10,
    "currencyName": "Coins",
    "referralClaimWindowHours": 168,
    "maxReferralsPerMember": 10
  }
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | Project created successfully | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"PocketLog","code":"POCKETLOG","description":"Reward app for expense tracking users","settings":{"referralRewardCoins":50,"refereeRewardCoins":25,"welcomeCoins":10,"currencyName":"Coins","referralClaimWindowHours":168,"maxReferralsPerMember":10}}'
```

</details>

---

### `GET` /api/projects

**Summary**: List all registered projects  
**Operation ID**: `ProjectsController_findAll`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `GET` /api/projects/{id}

**Summary**: Get project details by ID  
**Operation ID**: `ProjectsController_findById`  
**Authentication**: `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `id` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{id}" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `PUT` /api/projects/{id}

**Summary**: Update project details and reward settings  
**Operation ID**: `ProjectsController_update`  
**Authentication**: `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `id` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`UpdateProjectDto`](#schema-updateprojectdto)

```json
{
  "name": "PocketLog Updated",
  "description": "Updated description",
  "isActive": true,
  "settings": {
    "referralRewardCoins": 50,
    "refereeRewardCoins": 25,
    "welcomeCoins": 10,
    "currencyName": "Coins",
    "referralClaimWindowHours": 168,
    "maxReferralsPerMember": 10
  }
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X PUT "http://localhost:3000/api/projects/{id}" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"PocketLog Updated","description":"Updated description","isActive":true,"settings":{"referralRewardCoins":50,"refereeRewardCoins":25,"welcomeCoins":10,"currencyName":"Coins","referralClaimWindowHours":168,"maxReferralsPerMember":10}}'
```

</details>

---

### `POST` /api/projects/{id}/regenerate-api-key

**Summary**: Regenerate API key for a project  
**Operation ID**: `ProjectsController_regenerateApiKey`  
**Authentication**: `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `id` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{id}/regenerate-api-key" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

## 3. Members & Coin Wallets (Admin / Service)

Endpoints for onboarding project members, querying balances, inspecting coin ledger transactions, and manually adjusting coins.

### `POST` /api/projects/{projectId}/members/login

**Summary**: Member login & onboarding (Client / Mobile App)  
**Description**: Public endpoint for mobile/client apps to log in or register end-users. Returns a Member JWT token for accessing /api/me routes.  
**Operation ID**: `MembersController_login`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`MemberLoginDto`](#schema-memberlogindto)

```json
{
  "externalUserId": "user_12345",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "referralCode": "POCK9A3F12"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | Member authenticated successfully | [`MemberAuthResponseDto`](#schema-memberauthresponsedto) |

<details>
<summary><b>Example Response (201)</b></summary>

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": {
    "_id": "6605df93a40498b0f19c32de",
    "projectId": "6605df93a40498b0f19c32df",
    "externalUserId": "user_12345",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "coinBalance": 100,
    "totalEarnedCoins": 100,
    "totalSpentCoins": 0,
    "referralCode": "POCK9A3F12",
    "referredBy": "POCK559443"
  }
}
```

</details>

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{projectId}/members/login" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"externalUserId":"user_12345","name":"Alice Smith","email":"alice@example.com","referralCode":"POCK9A3F12"}'
```

</details>

---

### `POST` /api/projects/{projectId}/members

**Summary**: Onboard or fetch a member in a specific project  
**Description**: Creates a project-scoped wallet, generates a project-specific referral code, and awards welcome/referral bonuses.  
**Operation ID**: `MembersController_register`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`RegisterMemberDto`](#schema-registermemberdto)

```json
{
  "externalUserId": "user_12345",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "referralCode": "REF1234"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | Member registered/fetched successfully | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{projectId}/members" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"externalUserId":"user_12345","name":"Alice Smith","email":"alice@example.com","referralCode":"REF1234"}'
```

</details>

---

### `GET` /api/projects/{projectId}/members

**Summary**: List all members belonging to a project  
**Operation ID**: `MembersController_listMembers`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/members" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `GET` /api/projects/{projectId}/members/{memberId}

**Summary**: Get member details, balance, and referral code  
**Operation ID**: `MembersController_getMember`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `memberId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/members/{memberId}" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `GET` /api/projects/{projectId}/members/{memberId}/transactions

**Summary**: Get coin balance transaction history for a member  
**Operation ID**: `MembersController_getTransactions`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `memberId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/members/{memberId}/transactions" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `POST` /api/projects/{projectId}/members/{memberId}/adjust-coins

**Summary**: Adjust member coin balance (credit or debit)  
**Operation ID**: `MembersController_adjustCoins`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `memberId` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`AdjustCoinsDto`](#schema-adjustcoinsdto)

```json
{
  "amount": 100,
  "description": "Bonus campaign reward"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{projectId}/members/{memberId}/adjust-coins" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"description":"Bonus campaign reward"}'
```

</details>

---

## 4. Referral Engine & Stats

Endpoints for querying member referral stats, inviter/referee trees, and project-wide referral conversion events.

### `GET` /api/projects/{projectId}/referrals/stats/{memberId}

**Summary**: Get referral statistics, referral code, and referee history for a member  
**Operation ID**: `ReferralsController_getMemberStats`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `memberId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/referrals/stats/{memberId}" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `GET` /api/projects/{projectId}/referrals

**Summary**: List all referral conversions across this project  
**Operation ID**: `ReferralsController_listProjectReferrals`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/referrals" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

## 5. Gift Cards & Redemptions

Endpoints for managing project gift card catalogs, handling redemption requests, and fulfilling/rejecting redemptions with automatic coin refunds.

### `POST` /api/projects/{projectId}/gift-cards

**Summary**: Create a new gift card item in project catalog  
**Operation ID**: `GiftCardsController_create`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`CreateGiftCardDto`](#schema-creategiftcarddto)

```json
{
  "title": "$10 Amazon Gift Card",
  "description": "Digital voucher redeemable on Amazon.com",
  "coinCost": 1000,
  "imageUrl": "https://example.com/amazon-card.png",
  "stock": 50,
  "isActive": true
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | Gift card created | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{projectId}/gift-cards" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"title":"$10 Amazon Gift Card","description":"Digital voucher redeemable on Amazon.com","coinCost":1000,"imageUrl":"https://example.com/amazon-card.png","stock":50,"isActive":true}'
```

</details>

---

### `GET` /api/projects/{projectId}/gift-cards

**Summary**: List all available gift cards in this project  
**Operation ID**: `GiftCardsController_listGiftCards`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/gift-cards" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `POST` /api/projects/{projectId}/gift-cards/{id}/redeem

**Summary**: Member redeems a gift card using project coin balance  
**Description**: Validates coin balance, deducts coins, decreases inventory, and creates a redemption request.  
**Operation ID**: `GiftCardsController_redeem`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `id` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`RedeemGiftCardDto`](#schema-redeemgiftcarddto)

```json
{
  "memberId": "6605df93a40498b0f19c32de"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{projectId}/gift-cards/{id}/redeem" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"6605df93a40498b0f19c32de"}'
```

</details>

---

### `GET` /api/projects/{projectId}/gift-cards/redemptions

**Summary**: List all gift card redemption requests for this project  
**Operation ID**: `GiftCardsController_listRedemptions`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/gift-cards/redemptions" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `GET` /api/projects/{projectId}/gift-cards/redemptions/member/{memberId}

**Summary**: List redemption history for a specific member  
**Operation ID**: `GiftCardsController_getMemberRedemptions`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `memberId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/gift-cards/redemptions/member/{memberId}" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `PUT` /api/projects/{projectId}/gift-cards/redemptions/{redemptionId}/fulfill

**Summary**: Approve, deliver, or reject a redemption request  
**Description**: If rejected, coins are automatically refunded back to the member.  
**Operation ID**: `GiftCardsController_fulfillRedemption`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |
| `redemptionId` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`FulfillRedemptionDto`](#schema-fulfillredemptiondto)

```json
{
  "status": "DELIVERED",
  "voucherCode": "AMZN-XXXX-YYYY-ZZZZ",
  "adminNote": "Processed and sent via email"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X PUT "http://localhost:3000/api/projects/{projectId}/gift-cards/redemptions/{redemptionId}/fulfill" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"status":"DELIVERED","voucherCode":"AMZN-XXXX-YYYY-ZZZZ","adminNote":"Processed and sent via email"}'
```

</details>

---

## 6. Universal Coupons (Shared Across Projects)

Endpoints for creating global shared promo codes that can be redeemed once per member in any project.

### `POST` /api/coupons

**Summary**: Create a universal coupon (shared across all projects)  
**Description**: Creates a universal promo code that can be used by members of any project to earn that project coins.  
**Operation ID**: `CouponsController_createCoupon`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`CreateCouponDto`](#schema-createcoupondto)

```json
{
  "code": "WELCOME100",
  "rewardCoins": 100,
  "maxGlobalUses": 500,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "description": "New Year universal campaign",
  "isActive": true
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | Universal coupon created | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/coupons" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME100","rewardCoins":100,"maxGlobalUses":500,"expiresAt":"2026-12-31T23:59:59.000Z","description":"New Year universal campaign","isActive":true}'
```

</details>

---

### `GET` /api/coupons

**Summary**: List all universal coupons  
**Operation ID**: `CouponsController_listCoupons`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/coupons" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `GET` /api/coupons/{code}

**Summary**: Get details of a universal coupon by code  
**Operation ID**: `CouponsController_getCouponByCode`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `code` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/coupons/{code}" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

### `POST` /api/projects/{projectId}/coupons/redeem

**Summary**: Redeem a universal coupon into a project member wallet  
**Description**: Validates the universal coupon and credits coins to the member project wallet. Each member can only redeem this coupon once per project.  
**Operation ID**: `CouponsController_redeemCoupon`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`RedeemCouponDto`](#schema-redeemcoupondto)

```json
{
  "couponCode": "WELCOME100",
  "memberId": "6605df93a40498b0f19c32de"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | Coupon redeemed successfully | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/projects/{projectId}/coupons/redeem" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"couponCode":"WELCOME100","memberId":"6605df93a40498b0f19c32de"}'
```

</details>

---

### `GET` /api/projects/{projectId}/coupons/redemptions

**Summary**: List all coupon redemptions for a specific project  
**Operation ID**: `CouponsController_listProjectRedemptions`  
**Authentication**: `api-key` OR `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `projectId` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/projects/{projectId}/coupons/redemptions" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "x-api-key: <PROJECT_API_KEY>"
```

</details>

---

## 7. External / Partner Coupons (Gostatus & Feedico)

Endpoints for querying and synchronizing external affiliate / partner coupons from Gostatus & Feedico Supabase backend.

### `GET` /api/api/gostatus-coupons

**Summary**: List & Search Synced Gostatus / Feedico Coupons  
**Description**: Browse all external coupons stored in the local database with brand search, country filters, and pagination.  
**Operation ID**: `GostatusCouponsController_listCoupons`  
**Authentication**: None (Public)  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `search` | `query` | `string` | No | Search keyword across brand name and title | `nike` |
| `brand` | `query` | `string` | No | Filter by specific brand name | `Fable Home US` |
| `country` | `query` | `string` | No | Filter by 2-letter country code (e.g. IN, US) | `US` |
| `limit` | `query` | `number` | No | Number of coupons per page (max 100) | - |
| `page` | `query` | `number` | No | Page number for pagination | - |
| `sort` | `query` | `string` | No | Sorting criteria | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | Paginated list of coupons | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/api/gostatus-coupons"
```

</details>

---

### `GET` /api/api/gostatus-coupons/{id}

**Summary**: Get Coupon Details by ID  
**Description**: Retrieve a single synced coupon by its MongoDB ObjectId or external Feedico coupon ID.  
**Operation ID**: `GostatusCouponsController_getCoupon`  
**Authentication**: None (Public)  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `id` | `path` | `string` | **Yes** | MongoDB ObjectId or numeric externalId (e.g. 64895) | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | Coupon details | - |
| `404` | Coupon not found | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/api/gostatus-coupons/{id}"
```

</details>

---

### `POST` /api/api/gostatus-coupons/sync

**Summary**: Trigger Immediate Sync from Gostatus / Feedico Supabase API  
**Description**: Fetches the latest coupons from Gostatus Supabase and bulk upserts them into MongoDB. (Also runs automatically every day at 03:00 UTC via Cron).  
**Operation ID**: `GostatusCouponsController_triggerSync`  
**Authentication**: `JWT-Auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `country` | `query` | `string` | No | Optional 2-letter country code filter (e.g. US, IN) | - |
| `maxPages` | `query` | `number` | No | Max pages to fetch (100 coupons per page, default 50) | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | Sync execution result with totals and duration | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/api/gostatus-coupons/sync"
```

</details>

---

## 8. My Account (End-User & Mobile App)

Self-service endpoints for mobile app end-users to check their profile, wallet balance, transaction ledger, referral codes, and redeem gift cards or coupons.

### `GET` /api/me/profile

**Summary**: Get current member profile and coin balance  
**Operation ID**: `MeController_getProfile`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | [`MemberProfileDto`](#schema-memberprofiledto) |

<details>
<summary><b>Example Response (200)</b></summary>

```json
{
  "_id": "6605df93a40498b0f19c32de",
  "projectId": "6605df93a40498b0f19c32df",
  "externalUserId": "user_12345",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "coinBalance": 100,
  "totalEarnedCoins": 100,
  "totalSpentCoins": 0,
  "referralCode": "POCK9A3F12",
  "referredBy": "POCK559443"
}
```

</details>

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/profile" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `GET` /api/me/transactions

**Summary**: Get current member coin transaction ledger history  
**Operation ID**: `MeController_getTransactions`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/transactions" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `GET` /api/me/referrals

**Summary**: Get current member referral code, stats, and invited friends list  
**Operation ID**: `MeController_getReferrals`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/referrals" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `POST` /api/me/referral

**Summary**: Claim a referral code later for onboarding bonus  
**Description**: Applies an invitation referral code to the current member account within the allowed time window, rewarding both the referee and referrer.  
**Operation ID**: `MeController_claimReferral`  
**Authentication**: `JWT-auth`  

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`ClaimReferralDto`](#schema-claimreferraldto)

```json
{
  "referralCode": "ARRO91199F"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | [`ClaimReferralResponseDto`](#schema-claimreferralresponsedto) |
| `400` | Own code used or loop detected | - |
| `403` | Referral window has expired | - |
| `404` | Invalid referral code | - |
| `409` | Referral code already used | - |

<details>
<summary><b>Example Response (200)</b></summary>

```json
{
  "member": {
    "_id": "6605df93a40498b0f19c32de",
    "projectId": "6605df93a40498b0f19c32df",
    "externalUserId": "user_12345",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "coinBalance": 100,
    "totalEarnedCoins": 100,
    "totalSpentCoins": 0,
    "referralCode": "POCK9A3F12",
    "referredBy": "POCK559443"
  },
  "refereeCoinsAwarded": 25,
  "referrerCoinsAwarded": 50
}
```

</details>

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/me/referral" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"ARRO91199F"}'
```

</details>

---

### `GET` /api/me/gift-cards

**Summary**: Get available gift cards catalog for current project  
**Operation ID**: `MeController_getGiftCards`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/gift-cards" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `POST` /api/me/gift-cards/{id}/redeem

**Summary**: Redeem a gift card using current member coin balance  
**Operation ID**: `MeController_redeemGiftCard`  
**Authentication**: `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `id` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `201` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/me/gift-cards/{id}/redeem" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `GET` /api/me/gift-cards/redemptions

**Summary**: Get current member gift card redemption history  
**Operation ID**: `MeController_getRedemptions`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/gift-cards/redemptions" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `POST` /api/me/coupons/redeem

**Summary**: Redeem a universal coupon code for current member  
**Operation ID**: `MeController_redeemCoupon`  
**Authentication**: `JWT-auth`  

#### Request Body

- **Status**: **Required**
- **Content-Type**: `application/json`

**Schema**: [`RedeemMyCouponDto`](#schema-redeemmycoupondto)

```json
{
  "couponCode": "WELCOME100"
}
```

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/me/coupons/redeem" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"couponCode":"WELCOME100"}'
```

</details>

---

### `GET` /api/me/gostatus-coupons

**Summary**: Browse available Gostatus / Feedico partner coupons  
**Description**: List coupons with search, brand filtering, country filter, and coin cost sorting.  
**Operation ID**: `MeController_listGostatusCoupons`  
**Authentication**: `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `search` | `query` | `string` | No | Search keyword across brand name and title | `nike` |
| `brand` | `query` | `string` | No | Filter by specific brand name | `Fable Home US` |
| `country` | `query` | `string` | No | Filter by 2-letter country code (e.g. IN, US) | `US` |
| `limit` | `query` | `number` | No | Number of coupons per page (max 100) | - |
| `page` | `query` | `number` | No | Page number for pagination | - |
| `sort` | `query` | `string` | No | Sorting criteria | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/gostatus-coupons" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `POST` /api/me/gostatus-coupons/{id}/redeem

**Summary**: Redeem a partner coupon using current member coins  
**Description**: Deducts costCoins from member wallet and unlocks the coupon promo code & redemption details.  
**Operation ID**: `MeController_redeemGostatusCoupon`  
**Authentication**: `JWT-auth`  

#### Parameters

| Name | In | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `id` | `path` | `string` | **Yes** | - | - |

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X POST "http://localhost:3000/api/me/gostatus-coupons/{id}/redeem" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

### `GET` /api/me/gostatus-coupons/my-coupons

**Summary**: Get all partner coupons redeemed by current member  
**Description**: Returns list of redeemed partner coupons with unlocked promo codes and URLs.  
**Operation ID**: `MeController_getMyGostatusCoupons`  
**Authentication**: `JWT-auth`  

#### Responses

| Status Code | Description | Schema |
|---|---|---|
| `200` | - | - |

<details>
<summary><b>Example cURL Request</b></summary>

```bash
curl -X GET "http://localhost:3000/api/me/gostatus-coupons/my-coupons" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

</details>

---

## Data Schemas & DTO Reference

Below is the detailed specification of all Data Transfer Objects (DTOs) and models utilized across request bodies and responses.

### <a id="schema-registerdto"></a>`RegisterDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `email` | string | **Yes** | User email | `"alex@example.com"` |
| `password` | string | **Yes** | User password (minimum 6 characters) | `"Pass1234!"` |
| `name` | string | **Yes** | User display name | `"Alex Morgan"` |

**Example Object**:
```json
{
  "email": "alex@example.com",
  "password": "Pass1234!",
  "name": "Alex Morgan"
}
```

---

### <a id="schema-userprofileresponsedto"></a>`UserProfileResponseDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `_id` | string | **Yes** | - | `"6605df93a40498b0f19c32de"` |
| `email` | string | **Yes** | - | `"alex@example.com"` |
| `name` | string | **Yes** | - | `"Alex Morgan"` |
| `roles` | Array<string> | **Yes** | - | `["user"]` |
| `createdAt` | string | **Yes** | - | `"2026-10-12T10:00:00.000Z"` |
| `updatedAt` | string | **Yes** | - | `"2026-10-12T10:00:00.000Z"` |

**Example Object**:
```json
{
  "_id": "6605df93a40498b0f19c32de",
  "email": "alex@example.com",
  "name": "Alex Morgan",
  "roles": [
    "user"
  ],
  "createdAt": "2026-10-12T10:00:00.000Z",
  "updatedAt": "2026-10-12T10:00:00.000Z"
}
```

---

### <a id="schema-authresponsedto"></a>`AuthResponseDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `accessToken` | string | **Yes** | JWT Access Token | `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` |
| `user` | [`UserProfileResponseDto`](#schema-userprofileresponsedto) | **Yes** | - | - |

**Example Object**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6605df93a40498b0f19c32de",
    "email": "alex@example.com",
    "name": "Alex Morgan",
    "roles": [
      "user"
    ],
    "createdAt": "2026-10-12T10:00:00.000Z",
    "updatedAt": "2026-10-12T10:00:00.000Z"
  }
}
```

---

### <a id="schema-logindto"></a>`LoginDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `email` | string | **Yes** | Registered email address | `"alex@example.com"` |
| `password` | string | **Yes** | User account password | `"Pass1234!"` |

**Example Object**:
```json
{
  "email": "alex@example.com",
  "password": "Pass1234!"
}
```

---

### <a id="schema-projectsettingsdto"></a>`ProjectSettingsDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `referralRewardCoins` | number | No | Coins given to referrer | `50` |
| `refereeRewardCoins` | number | No | Coins given to referee | `25` |
| `welcomeCoins` | number | No | Coins given upon registration | `10` |
| `currencyName` | string | No | Name of the currency | `"Coins"` |
| `referralClaimWindowHours` | number | No | Window in hours after registration during which a member can claim a referral code (default: 168 = 7 days) | `168` |
| `maxReferralsPerMember` | number | No | Maximum number of rewarded referrals allowed per member (null / undefined for unlimited) | `10` |

**Example Object**:
```json
{
  "referralRewardCoins": 50,
  "refereeRewardCoins": 25,
  "welcomeCoins": 10,
  "currencyName": "Coins",
  "referralClaimWindowHours": 168,
  "maxReferralsPerMember": 10
}
```

---

### <a id="schema-createprojectdto"></a>`CreateProjectDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `name` | string | **Yes** | Project display name | `"PocketLog"` |
| `code` | string | **Yes** | Unique project identifier code | `"POCKETLOG"` |
| `description` | string | No | - | `"Reward app for expense tracking users"` |
| `settings` | [`ProjectSettingsDto`](#schema-projectsettingsdto) | No | - | - |

**Example Object**:
```json
{
  "name": "PocketLog",
  "code": "POCKETLOG",
  "description": "Reward app for expense tracking users",
  "settings": {
    "referralRewardCoins": 50,
    "refereeRewardCoins": 25,
    "welcomeCoins": 10,
    "currencyName": "Coins",
    "referralClaimWindowHours": 168,
    "maxReferralsPerMember": 10
  }
}
```

---

### <a id="schema-updateprojectdto"></a>`UpdateProjectDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `name` | string | No | - | `"PocketLog Updated"` |
| `description` | string | No | - | `"Updated description"` |
| `isActive` | boolean | No | - | `true` |
| `settings` | [`ProjectSettingsDto`](#schema-projectsettingsdto) | No | - | - |

**Example Object**:
```json
{
  "name": "PocketLog Updated",
  "description": "Updated description",
  "isActive": true,
  "settings": {
    "referralRewardCoins": 50,
    "refereeRewardCoins": 25,
    "welcomeCoins": 10,
    "currencyName": "Coins",
    "referralClaimWindowHours": 168,
    "maxReferralsPerMember": 10
  }
}
```

---

### <a id="schema-memberlogindto"></a>`MemberLoginDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `externalUserId` | string | **Yes** | Unique user identifier from your client app (e.g. Firebase UID, device ID, user ID) | `"user_12345"` |
| `name` | string | No | Display name | `"Alice Smith"` |
| `email` | string | No | Email address | `"alice@example.com"` |
| `referralCode` | string | No | Optional referral code used during onboarding for referral bonus | `"POCK9A3F12"` |

**Example Object**:
```json
{
  "externalUserId": "user_12345",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "referralCode": "POCK9A3F12"
}
```

---

### <a id="schema-memberprofiledto"></a>`MemberProfileDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `_id` | string | **Yes** | - | `"6605df93a40498b0f19c32de"` |
| `projectId` | string | **Yes** | - | `"6605df93a40498b0f19c32df"` |
| `externalUserId` | string | **Yes** | - | `"user_12345"` |
| `name` | string | **Yes** | - | `"Alice Smith"` |
| `email` | string | **Yes** | - | `"alice@example.com"` |
| `coinBalance` | number | **Yes** | Current spendable coin balance | `100` |
| `totalEarnedCoins` | number | **Yes** | Lifetime earned coins | `100` |
| `totalSpentCoins` | number | **Yes** | Lifetime spent coins | `0` |
| `referralCode` | string | **Yes** | Member personal referral code | `"POCK9A3F12"` |
| `referredBy` | string | No | Referral code of inviter | `"POCK559443"` |

**Example Object**:
```json
{
  "_id": "6605df93a40498b0f19c32de",
  "projectId": "6605df93a40498b0f19c32df",
  "externalUserId": "user_12345",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "coinBalance": 100,
  "totalEarnedCoins": 100,
  "totalSpentCoins": 0,
  "referralCode": "POCK9A3F12",
  "referredBy": "POCK559443"
}
```

---

### <a id="schema-memberauthresponsedto"></a>`MemberAuthResponseDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `accessToken` | string | **Yes** | JWT Bearer token for authenticating member /api/me requests | `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` |
| `member` | [`MemberProfileDto`](#schema-memberprofiledto) | **Yes** | - | - |

**Example Object**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": {
    "_id": "6605df93a40498b0f19c32de",
    "projectId": "6605df93a40498b0f19c32df",
    "externalUserId": "user_12345",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "coinBalance": 100,
    "totalEarnedCoins": 100,
    "totalSpentCoins": 0,
    "referralCode": "POCK9A3F12",
    "referredBy": "POCK559443"
  }
}
```

---

### <a id="schema-registermemberdto"></a>`RegisterMemberDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `externalUserId` | string | **Yes** | Unique user identifier from your client app | `"user_12345"` |
| `name` | string | No | Display name | `"Alice Smith"` |
| `email` | string | No | Email address | `"alice@example.com"` |
| `referralCode` | string | No | Optional referral code used during onboarding | `"REF1234"` |

**Example Object**:
```json
{
  "externalUserId": "user_12345",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "referralCode": "REF1234"
}
```

---

### <a id="schema-adjustcoinsdto"></a>`AdjustCoinsDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `amount` | number | **Yes** | Amount of coins to credit (positive) or debit (negative) | `100` |
| `description` | string | **Yes** | Reason for the adjustment | `"Bonus campaign reward"` |

**Example Object**:
```json
{
  "amount": 100,
  "description": "Bonus campaign reward"
}
```

---

### <a id="schema-creategiftcarddto"></a>`CreateGiftCardDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `title` | string | **Yes** | Gift card name | `"$10 Amazon Gift Card"` |
| `description` | string | No | - | `"Digital voucher redeemable on Amazon.com"` |
| `coinCost` | number | **Yes** | Required coin cost to redeem | `1000` |
| `imageUrl` | string | No | Image URL | `"https://example.com/amazon-card.png"` |
| `stock` | number | No | Available inventory (-1 for infinite) | `50` |
| `isActive` | boolean | No | Active state | `true` |

**Example Object**:
```json
{
  "title": "$10 Amazon Gift Card",
  "description": "Digital voucher redeemable on Amazon.com",
  "coinCost": 1000,
  "imageUrl": "https://example.com/amazon-card.png",
  "stock": 50,
  "isActive": true
}
```

---

### <a id="schema-redeemgiftcarddto"></a>`RedeemGiftCardDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `memberId` | string | **Yes** | Project member ID redeeming the card | `"6605df93a40498b0f19c32de"` |

**Example Object**:
```json
{
  "memberId": "6605df93a40498b0f19c32de"
}
```

---

### <a id="schema-fulfillredemptiondto"></a>`FulfillRedemptionDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `status` | string | **Yes** | Updated redemption status | `"DELIVERED"` |
| `voucherCode` | string | No | Digital gift card code or voucher secret | `"AMZN-XXXX-YYYY-ZZZZ"` |
| `adminNote` | string | No | Admin review note | `"Processed and sent via email"` |

**Example Object**:
```json
{
  "status": "DELIVERED",
  "voucherCode": "AMZN-XXXX-YYYY-ZZZZ",
  "adminNote": "Processed and sent via email"
}
```

---

### <a id="schema-createcoupondto"></a>`CreateCouponDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `code` | string | **Yes** | Universal promo code (shared across all projects) | `"WELCOME100"` |
| `rewardCoins` | number | **Yes** | Coins awarded to the redeeming member in their project | `100` |
| `maxGlobalUses` | number | No | Total global redemptions allowed across all projects (-1 for unlimited) | `500` |
| `expiresAt` | string | No | Optional expiration timestamp | `"2026-12-31T23:59:59.000Z"` |
| `description` | string | No | Description of the campaign | `"New Year universal campaign"` |
| `isActive` | boolean | No | Active status | `true` |

**Example Object**:
```json
{
  "code": "WELCOME100",
  "rewardCoins": 100,
  "maxGlobalUses": 500,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "description": "New Year universal campaign",
  "isActive": true
}
```

---

### <a id="schema-redeemcoupondto"></a>`RedeemCouponDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `couponCode` | string | **Yes** | Universal coupon code to redeem | `"WELCOME100"` |
| `memberId` | string | **Yes** | Member ID in this project receiving the reward | `"6605df93a40498b0f19c32de"` |

**Example Object**:
```json
{
  "couponCode": "WELCOME100",
  "memberId": "6605df93a40498b0f19c32de"
}
```

---

### <a id="schema-claimreferraldto"></a>`ClaimReferralDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `referralCode` | string | **Yes** | Referral code to claim for onboarding bonus (4 to 16 characters) | `"ARRO91199F"` |

**Example Object**:
```json
{
  "referralCode": "ARRO91199F"
}
```

---

### <a id="schema-claimreferralresponsedto"></a>`ClaimReferralResponseDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `member` | [`MemberProfileDto`](#schema-memberprofiledto) | **Yes** | - | - |
| `refereeCoinsAwarded` | number | **Yes** | Coins awarded to referee | `25` |
| `referrerCoinsAwarded` | number | **Yes** | Coins awarded to referrer | `50` |

**Example Object**:
```json
{
  "member": {
    "_id": "6605df93a40498b0f19c32de",
    "projectId": "6605df93a40498b0f19c32df",
    "externalUserId": "user_12345",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "coinBalance": 100,
    "totalEarnedCoins": 100,
    "totalSpentCoins": 0,
    "referralCode": "POCK9A3F12",
    "referredBy": "POCK559443"
  },
  "refereeCoinsAwarded": 25,
  "referrerCoinsAwarded": 50
}
```

---

### <a id="schema-redeemmycoupondto"></a>`RedeemMyCouponDto`

| Field | Type | Required | Description | Example |
|---|---|---|---|---|---|
| `couponCode` | string | **Yes** | Universal promo code to redeem for your wallet | `"WELCOME100"` |

**Example Object**:
```json
{
  "couponCode": "WELCOME100"
}
```

---

## Standard Error Responses & Status Codes

All API errors follow the standard NestJS exception payload format:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Status Code | Meaning | Common Causes |
|---|---|---|
| `200 OK` | Success | Request succeeded and returned data. |
| `201 Created` | Resource Created | New entity (user, project, member, coupon, etc.) successfully created. |
| `400 Bad Request` | Validation Error | Request body failed DTO validation rules or required parameters missing. |
| `401 Unauthorized` | Authentication Failure | Missing or invalid Bearer JWT token or API Key. |
| `403 Forbidden` | Permission Denied | Authenticated user lacks required roles or access to resource. |
| `404 Not Found` | Resource Not Found | Target ID, code, member, project, or coupon does not exist. |
| `409 Conflict` | Conflict | Duplicate resource (e.g. email or coupon code already registered, coupon already redeemed). |
| `500 Internal Server Error` | Server Exception | Unhandled internal exception occurred. |

## Integration Workflows & Best Practices

### Workflow 1: Admin Quickstart
1. **Register Admin**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` and obtain `accessToken`.
3. **Create Project**: `POST /api/projects` specifying project code (e.g. `POCKETLOG`), custom currency name (`Coins`), welcome bonus (`100`), and referral rewards (`50` / `25`). Note the returned `apiKey`.
4. **Create Gift Cards**: `POST /api/projects/{projectId}/gift-cards` to populate the rewards catalog.
5. **Create Universal Coupons**: `POST /api/coupons` to create cross-project shared promotion codes.

### Workflow 2: Mobile App End-User Integration
1. **Member Login / Onboarding**:
   - The mobile app calls `POST /api/projects/{projectId}/members/login` passing header `x-api-key: <PROJECT_API_KEY>` and body with `externalUserId` (e.g., Firebase UID or device ID) and optional `referralCode`.
   - If new, the member is registered, awarded welcome coins, linked to referrer, and receives a JWT `accessToken`.
2. **Authenticated Member Requests**:
   - For subsequent requests, the app sends header `Authorization: Bearer <accessToken>` to `/api/me/*` endpoints:
     - `GET /api/me/profile` -> view current spendable coins and stats.
     - `GET /api/me/transactions` -> view transaction ledger.
     - `GET /api/me/referrals` -> view referral code and invited friends list.
     - `GET /api/me/gift-cards` -> view available gift card catalog.
     - `POST /api/me/gift-cards/{id}/redeem` -> spend coins to redeem a gift card.
     - `POST /api/me/coupons/redeem` -> redeem universal promo codes.
     - `GET /api/me/gostatus-coupons` & `POST /api/me/gostatus-coupons/{id}/redeem` -> browse and redeem partner coupons.

### Workflow 3: Gift Card Fulfillment
1. Member redeems card: Coins are debited and a `PENDING` redemption request is created.
2. Admin lists redemptions: `GET /api/projects/{projectId}/gift-cards/redemptions`.
3. Admin fulfills: `PUT /api/projects/{projectId}/gift-cards/redemptions/{redemptionId}/fulfill` with `status: "DELIVERED"` and `voucherCode`.
4. If rejected: Admin sets `status: "REJECTED"`, which automatically refunds the coin balance back to the member wallet.

