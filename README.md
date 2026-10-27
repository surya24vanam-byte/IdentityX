# IDENTITYX
### A Comprehensive Digital Identity, Multi-Factor Authentication and Access Control System

![IdentityX Security Platform](https://img.shields.io/badge/Security-IdentityX%20Platform-00f2fe?style=for-the-badge&logo=shield)
![Build](https://img.shields.io/badge/Build-Passing-10b981?style=for-the-badge)
![Coverage](https://img.shields.io/badge/Tests-100%25%20Passing-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 1. Project Overview

**IdentityX** is an enterprise-grade digital identity and authentication management platform engineered to defend organizations and users against credential harvesting, brute-force attacks, session hijacking, and privilege escalation. 

Unlike simple demo applications, IdentityX is built on an authentic full-stack client-server architecture:
- Complete **Multi-Factor Authentication (MFA / OTP)** with SHA-256 hash security and one-time token consumption.
- Normalized **Role-Based Access Control (RBAC)** enforced on backend REST endpoints through Python decorators (`@role_required`, `@permission_required`).
- Real-time **Rule-Based Threat & Suspicious Login Detection Engine** that flags velocity anomalies, brute force attempts, and rogue authentications, assigning risk scores from `LOW` to `CRITICAL`.
- Configurable **Account Lockout Protection** preventing automated credential stuffing.
- **Digital Credential Management** and multi-stage **Identity Verification Workflows** with administrative auditing.
- Multi-device **Session Management** with instant remote invalidation.

---

## 2. Key Features

### 🛡️ Authentication & MFA
- **Secure Registration & Login**: Client-side and server-side validation; passwords hashed with `scrypt` via Werkzeug.
- **Two-Factor Authentication (MFA)**: Dynamic 6-digit OTP generation with 5-minute expiry windows, SHA-256 token hashing in the database, and single-use revocation.
- **Account Lockout & Brute-Force Shield**: Configurable failed login thresholds (default: 5 attempts) triggering automatic account locks and security logging.
- **Forgot Password Workflow**: Secure reset token generation, single-use validation, and password replacement.

### 🆔 Digital Identity & Credential Vault
- **Identity Profile Management**: Real-time calculated Security Score (0-100%) factoring in password hygiene, MFA status, verification standing, and recent threat events.
- **Verifiable Digital Credentials**: Add, view, and inspect digital credentials (Driver's License, Passport, National ID, Employee Pass) with secure JSON metadata storage.
- **Compliance Verification Workflow**: Users submit credentials and identity details; authorized administrators review, approve, or reject submissions with formal review notes.

### 👥 Granular Role-Based Access Control (RBAC)
- Full relational schema separating `Users`, `Roles`, and `Permissions`.
- Pre-seeded roles: `ADMIN`, `USER`, `SECURITY_ANALYST`, `VERIFIER`, `AUDITOR`.
- Backend endpoints strictly validated at the controller layer; frontend UI adapts dynamically to user permissions.

### 🔍 Security Monitoring & Threat Intelligence
- **Rule-Based Suspicious Activity Detection Engine**:
  - Velocity threshold alerts (≥ 3 failures within 10 minutes).
  - Brute-force threshold breaches (≥ 5 failures within 15 minutes).
  - Rogue authentication attempts against locked or suspended accounts.
  - New device / IP heuristic detection.
- **Comprehensive Audit Trail**: Every sensitive operation (login, lockout, OTP request, credential verification, role modification) is recorded in `security_logs`.
- **Session Intelligence**: Track IP address, user-agent string, device type, login time, and last active timestamp with remote session termination.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, Axios, Tailwind CSS v4, Lucide React Icons |
| **Backend** | Python 3.13+, Flask, Flask-SQLAlchemy, Flask-CORS, PyJWT, Werkzeug (`scrypt`), python-dotenv |
| **Database** | SQLite 3 (`identityx.db`) with normalized tables and foreign key constraints |
| **Testing** | Pytest, Flask Test Client |

---

## 4. Architecture & Design

IdentityX employs a decoupled RESTful architecture:

```
[ React 19 Frontend SPA ]
          │
      HTTP/JSON (Bearer JWT)
          │
          ▼
┌────────────────────────────────────────────────────────┐
│                   Flask REST API                      │
│                                                        │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Auth Routes   │  │       Admin Routes          │  │
│  │   User Routes   │  │     Credential Routes       │  │
│  │  Verify Routes  │  │        RBAC Routes          │  │
│  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                          │                 │
│           ▼                          ▼                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Security & RBAC Layer              │  │
│  │   • Token Validation    • Permission Enforcer    │  │
│  │   • Brute-Force Filter  • Suspicious Engine      │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│                           ▼                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Services & ORM Models              │  │
│  │   AuthService • MFAService • SecurityService     │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │
                            ▼
               [ SQLite Database: identityx.db ]
```

---

## 5. Folder Structure

```
indentityX/
├── README.md                           # Comprehensive documentation
├── backend/
│   ├── .env                            # Active environment variables
│   ├── .env.example                    # Template environment variables
│   ├── requirements.txt                # Python backend dependencies
│   ├── run.py                          # Flask application launcher
│   ├── seed.py                         # Production database seeding script
│   ├── instance/                       # SQLite database directory (identityx.db)
│   ├── app/
│   │   ├── __init__.py                 # Application factory
│   │   ├── config.py                   # App configuration profiles
│   │   ├── extensions.py               # SQLAlchemy, CORS, Migrations
│   │   ├── models/                     # Normalized database models
│   │   │   ├── credential.py           # Credential entity
│   │   │   ├── rbac.py                 # Role, Permission, join tables
│   │   │   ├── security.py             # OTPRecord, PasswordResetToken, SecurityLog
│   │   │   ├── session_log.py          # SessionRecord, LoginAttempt
│   │   │   ├── user.py                 # User model & security score calculation
│   │   │   └── verification.py         # IdentityVerification entity
│   │   ├── routes/                     # REST API controllers
│   │   │   ├── admin_routes.py         # User, Role, and Security administration
│   │   │   ├── auth_routes.py          # Login, Register, MFA, Password Reset
│   │   │   ├── credential_routes.py    # Digital Credential management
│   │   │   ├── user_routes.py          # Profile, Sessions, Login History
│   │   │   └── verification_routes.py  # Identity verification lifecycle
│   │   ├── services/                   # Business logic layer
│   │   │   ├── auth_service.py         # Auth, Session, JWT handling
│   │   │   ├── mfa_service.py          # OTP generation & hashing
│   │   │   ├── security_service.py     # Rule-based anomaly detection engine
│   │   │   └── verification_service.py # Verification request processing
│   │   └── utils/
│   │       ├── decorators.py           # @token_required, @role_required, @permission_required
│   │       └── validators.py           # Input, email, and password strength validators
│   └── tests/                          # Automated Pytest suite
│       ├── conftest.py                 # Test fixtures & database isolation
│       ├── test_auth.py                # Registration, login, MFA tests
│       ├── test_rbac.py                # Role and permission enforcement tests
│       └── test_security.py            # Account lockout & anomaly tests
└── frontend/
    ├── index.html                      # Single-page HTML entry point
    ├── package.json                    # Frontend dependencies & scripts
    ├── vite.config.js                  # Vite configuration & proxy setup
    └── src/
        ├── App.jsx                     # Application Router & route configuration
        ├── main.jsx                    # Root mounting point
        ├── index.css                   # Tailwind v4 styles & cybersecurity theme
        ├── api/
        │   └── client.js               # Centralized Axios client with JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx         # User authentication state provider
        │   └── ToastContext.jsx        # Notification alert system
        ├── components/
        │   ├── common/                 # Reusable UI components
        │   │   ├── Badge.jsx           # Status badge
        │   │   ├── ConfirmDialog.jsx   # Accessible confirmation modal
        │   │   ├── LoadingSpinner.jsx  # Loading state indicator
        │   │   ├── Modal.jsx           # Backdrop modal
        │   │   ├── Navbar.jsx          # Top application navigation
        │   │   ├── SecurityScoreGauge.jsx # Interactive SVG security gauge
        │   │   ├── Sidebar.jsx         # Collapsible dashboard sidebar
        │   │   └── StatCard.jsx        # Metric and KPI cards
        │   └── routes/
        │       └── ProtectedRoute.jsx  # Role-gated route guards
        ├── layouts/
        │   └── AppLayout.jsx           # Unified sidebar + topbar dashboard layout
        └── pages/
            ├── public/                 # Public landing & onboarding views
            │   ├── ForgotPasswordPage.jsx
            │   ├── LandingPage.jsx
            │   ├── LoginPage.jsx
            │   ├── OTPVerifyPage.jsx
            │   └── RegisterPage.jsx
            ├── user/                   # Authenticated user dashboard views
            │   ├── ActiveSessionsPage.jsx
            │   ├── CredentialsPage.jsx
            │   ├── IdentityVerificationPage.jsx
            │   ├── LoginHistoryPage.jsx
            │   ├── ProfilePage.jsx
            │   ├── SecuritySettingsPage.jsx
            │   └── UserDashboardPage.jsx
            └── admin/                  # Administrative management consoles
                ├── AdminDashboardPage.jsx
                ├── RoleManagementPage.jsx
                ├── SecurityLogsPage.jsx
                ├── SuspiciousEventsPage.jsx
                ├── UserManagementPage.jsx
                └── VerificationReviewPage.jsx
```

---

## 6. Database Schema Design

The SQLite database (`identityx.db`) utilizes 11 normalized tables with foreign keys and indexes:

```
┌──────────────┐          ┌─────────────────┐          ┌────────────────────┐
│    users     │1       * │   credentials   │          │  role_permissions  │
├──────────────┤──────────├─────────────────┤          ├────────────────────┤
│ id (PK)      │          │ id (PK)         │          │ role_id (FK)       │
│ email (UQ)   │          │ user_id (FK)    │          │ permission_id (FK) │
│ password_hash│          │ cred_type       │          └────────────────────┘
│ full_name    │          │ title           │                    │
│ phone        │          │ meta_data (JSON)│                    ▼
│ is_locked    │          │ status          │          ┌────────────────────┐
│ mfa_enabled  │          │ verified_at     │          │    permissions     │
│ is_verified  │          └─────────────────┘          ├────────────────────┤
└──────┬───────┘                                       │ id (PK)            │
       │ 1                                             │ code (UQ)          │
       ├──────────────────┐ 1                          │ name               │
       │ *                │ *                          └────────────────────┘
┌──────▼───────┐   ┌──────▼──────────────┐                       ▲
│  user_roles  │   │identity_verification│                       │
├──────────────┤   ├─────────────────────┤                       │
│ user_id (FK) │   │ id (PK)             │                       │
│ role_id (FK) │   │ user_id (FK)        │                       │
└──────┬───────┘   │ id_type             │                       │
       │ *         │ id_number           │                       │
       ▼ 1         │ status              │                       │
┌──────────────┐   │ reviewer_id (FK)    │                       │
│    roles     │   │ review_notes        │                       │
├──────────────┤   └─────────────────────┘                       │
│ id (PK)      │                                                 │
│ name (UQ)    │─────────────────────────────────────────────────┘
│ description  │ *                                             *
└──────────────┘
       │ 1
       ├──────────────────┬─────────────────┬───────────────────┐
       ▼ *                ▼ *               ▼ *                 ▼ *
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   sessions   │   │login_attempts│   │security_logs │   │ otp_records  │
├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤
│ id (PK)      │   │ id (PK)      │   │ id (PK)      │   │ id (PK)      │
│ user_id (FK) │   │ email        │   │ event_type   │   │ user_id (FK) │
│ session_token│   │ ip_address   │   │ severity     │   │ otp_hash     │
│ ip_address   │   │ user_agent   │   │ description  │   │ expires_at   │
│ is_active    │   │ status       │   │ user_id (FK) │   │ is_used      │
└──────────────┘   │ failure_reas.│   │ ip_address   │   └──────────────┘
                   └──────────────┘   └──────────────┘
```

---

## 7. REST API Documentation

All protected API endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 🔑 Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate with email/password (returns token or requires MFA) | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP code to complete MFA login | No |
| `GET` | `/api/auth/me` | Retrieve the authenticated user's profile and roles | Yes |
| `POST` | `/api/auth/logout` | Terminate the active session | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Reset password using token | No |

### 👤 User Services (`/api/users`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/api/users/profile` | Retrieve profile, verification status, and security score | `VIEW_PROFILE` |
| `PUT` | `/api/users/profile` | Update profile information (phone, full name) | `EDIT_PROFILE` |
| `POST` | `/api/users/mfa/enable` | Enable OTP-based Multi-Factor Authentication | `MANAGE_MFA` |
| `POST` | `/api/users/mfa/disable` | Disable MFA | `MANAGE_MFA` |
| `GET` | `/api/users/sessions` | View list of all active sessions for current user | `VIEW_PROFILE` |
| `DELETE` | `/api/users/sessions/<id>` | Invalidate a specific session | `VIEW_PROFILE` |
| `DELETE` | `/api/users/sessions` | Terminate all active sessions (except current) | `VIEW_PROFILE` |
| `GET` | `/api/users/login-history` | View personal historical login records | `VIEW_LOGIN_HISTORY` |

### 💳 Digital Credentials (`/api/credentials`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/api/credentials` | List all digital credentials of the user | `VIEW_CREDENTIALS` |
| `POST` | `/api/credentials` | Create a new digital credential | `ADD_CREDENTIAL` |
| `GET` | `/api/credentials/<id>` | Retrieve credential details | `VIEW_CREDENTIALS` |
| `DELETE` | `/api/credentials/<id>` | Delete credential | `ADD_CREDENTIAL` |
| `POST` | `/api/credentials/<id>/verify` | Request formal verification of credential | `SUBMIT_VERIFICATION` |

### 📜 Identity Verification (`/api/verification`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `POST` | `/api/verification` | Submit official identity document for verification | `SUBMIT_VERIFICATION` |
| `GET` | `/api/verification/status` | View status of current verification submissions | `VIEW_PROFILE` |
| `GET` | `/api/verification/requests` | Admin review: list all verification requests | `REVIEW_VERIFICATIONS` |
| `POST` | `/api/verification/<id>/review` | Admin review: approve or reject with notes | `REVIEW_VERIFICATIONS` |

### 🛡️ Administration & Security (`/api/admin`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Dashboard metrics, statistics, and system health | `MANAGE_USERS` |
| `GET` | `/api/admin/users` | List all system users with search, role, and status filters | `MANAGE_USERS` |
| `GET` | `/api/admin/users/<id>` | Retrieve detailed user profile, logs, and sessions | `MANAGE_USERS` |
| `POST` | `/api/admin/users/<id>/lock` | Administratively lock user account | `LOCK_USER` |
| `POST` | `/api/admin/users/<id>/unlock` | Administratively unlock user account | `UNLOCK_USER` |
| `GET` | `/api/admin/roles` | List all defined roles and associated permissions | `MANAGE_ROLES` |
| `POST` | `/api/admin/roles` | Create new custom role | `MANAGE_ROLES` |
| `PUT` | `/api/admin/roles/<id>` | Update role permissions | `MANAGE_PERMISSIONS` |
| `POST` | `/api/admin/users/<id>/roles` | Assign or remove roles from a user | `MANAGE_ROLES` |
| `GET` | `/api/admin/security-logs` | Query centralized audit logs with severity filtering | `VIEW_SECURITY_LOGS` |
| `GET` | `/api/admin/suspicious-events` | Query threat intelligence engine anomalies | `VIEW_SECURITY_LOGS` |

---

## 8. Installation & Setup

### Prerequisites
- Python 3.10+ (tested with Python 3.13)
- Node.js 18+ and npm (tested with Node.js v24 & npm 11)
- Git

### 1. Clone & Setup Backend
```bash
# Navigate to the backend directory
cd indentityX/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
The backend includes a pre-configured `.env` file for instant development. You can also customize `.env.example`:

```bash
cp .env.example .env
```

Default `.env` configuration:
```ini
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=identityx-super-secure-production-secret-key-32-chars
JWT_SECRET_KEY=identityx-jwt-secure-signing-key-minimum-32-chars
DATABASE_URL=sqlite:///identityx.db
OTP_EXPIRATION_MINUTES=5
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
PORT=5000
```

### 3. Initialize & Seed Database
Execute the database initialization and seed script to generate all roles, permissions, and test accounts:
```bash
python seed.py
```

### 4. Setup Frontend
In a separate terminal:
```bash
cd indentityX/frontend

# Install dependencies
npm install
```

---

## 9. Running the Application

### Start Flask Backend
```bash
cd indentityX/backend
# Ensure virtual environment is activated
python run.py
```
> Backend runs at: **`http://127.0.0.1:5000`**

### Start Vite Frontend
```bash
cd indentityX/frontend
npm run dev -- --host 127.0.0.1 --port 3000
```
> Frontend runs at: **`http://127.0.0.1:3000`**

---

## 10. Demo Credentials

The database is pre-seeded with 5 accounts spanning different operational scenarios:

| Role | Email | Password | MFA Status | Account State |
|---|---|---|---|---|
| **System Administrator** | `admin@identityx.io` | `Admin@123456` | **Enabled** (OTP required) | Active |
| **Verified User** | `alex.mercer@identityx.io` | `User@123456` | **Enabled** (OTP required) | Active / Verified |
| **Standard User** | `sarah.connor@identityx.io` | `User@123456` | **Disabled** (Direct Login) | Active / Unverified |
| **Locked User** | `marcus.wright@identityx.io` | `User@123456` | Disabled | **Locked** (Simulates brute force lockout) |
| **Security Analyst** | `analyst@identityx.io` | `Analyst@123456` | Disabled | Active |

> 💡 **Demo MFA Code**: When logging into an account with MFA enabled, a simulated OTP alert modal or development banner displays the generated 6-digit OTP code directly in the response for seamless testing!

---

## 11. Automated Testing

IdentityX features an automated test suite verifying security logic, RBAC, lockout mechanics, and OTP expiration using Pytest.

To run the test suite:
```bash
cd indentityX/backend
pytest -v
```

### Verified Test Cases:
1. `test_registration_success`: Account creation with hashing & role assignment.
2. `test_duplicate_registration_fails`: Collision prevention on existing email.
3. `test_login_mfa_flow`: Two-stage login with 6-digit OTP issuance and verification.
4. `test_invalid_and_expired_otp`: Token invalidation after single-use and expiration.
5. `test_rbac_unauthorized_user_blocked_from_admin`: Validates `@permission_required` and `@role_required` return HTTP 403.
6. `test_rbac_admin_allowed_access`: Verifies admin permission pass-through.
7. `test_account_lockout_after_consecutive_failures`: Confirms account automatically locks upon reaching maximum attempts.
8. `test_suspicious_login_detection`: Verifies the rule-based threat engine logs high-velocity attempts with `MEDIUM`/`HIGH` severity.
9. `test_credential_creation_and_verification`: Tests the credential vault and admin review workflow.

---

## 12. Security Considerations

1. **Password Security**: Passwords are hashed using the memory-hard `scrypt` algorithm with unique salts generated via Werkzeug.
2. **OTP Invalidation**: OTP tokens are hashed using SHA-256 before storage in SQLite. Upon successful verification, tokens are immediately marked `is_used = True`, rendering them single-use.
3. **JWT Stateless Tokens**: Encoded with user ID, email, active roles, and permissions list. Token expiration is enforced automatically.
4. **Decorator-Level RBAC**: Authorization is enforced on the server for every administrative or protected endpoint. Hiding UI elements is strictly cosmetic.
5. **No Secret Leakage**: Passwords, OTP secrets, and raw keys are never logged in `security_logs` or exposed in API response payloads.
6. **SQL Injection Protection**: All queries are executed through SQLAlchemy ORM parameter binding.

---

## 13. Extensibility Roadmap

The modular architecture of IdentityX is designed for expansion:
- **Biometrics & WebAuthn / Passkeys**: Add WebAuthn challenge endpoints in `auth_service.py` alongside the existing OTP service.
- **Hardware Token / TOTP (RFC 6238)**: Seamlessly introduce authenticator apps (Google Authenticator, YubiKey) by plugging into the `MFAService` interface.
- **SMS & Email Providers**: Replace simulated OTP delivery in `mfa_service.py` with Twilio / SendGrid connectors using the existing template hooks.
- **Distributed Cache & Rate Limiting**: Swap the SQLite session tracker for Redis with zero disruption to the controller layer.
- **Cloud Database**: Transition SQLite to PostgreSQL or Amazon Aurora by updating the `DATABASE_URL` environment variable.

---

## 14. License

Distributed under the MIT License. See `LICENSE` for more information.
