# AeroEdge-X Local Authentication Architecture

## Overview
Authentication in the current AeroEdge-X desktop POC is local to the workstation and does not require internet connectivity.
AWS synchronization is independent of authentication and is not required to sign in or perform an inspection.
This ensures the primary goal of an OFFLINE-FIRST application remains intact.

## Authentication Flow
1. **First-Run Setup**: On initial launch, if the database has zero users, the UI guides the user to create a local `ADMIN` account. Once this account exists, the setup flow is permanently disabled.
2. **Login**: The user enters their username and password. The request goes strictly to the `localhost` Flask backend over HTTP/IPC.
3. **Session Issuance**: Upon successful validation, the backend generates a cryptographically secure token using Python's `secrets` module, stores a SHA-256 hash of this token in the `sessions` table, and returns the raw token to the frontend.
4. **Subsequent API Requests**: The frontend stores the token in `localStorage` and attaches it as a `Bearer` token in the `Authorization` header for all protected API calls.

## Password Storage
- Plaintext passwords are NEVER stored.
- AeroEdge-X uses Flask's built-in `werkzeug.security` module which implements secure password hashing (PBKDF2/scrypt by default) with uniquely generated salts per user.

## Session Model
- Sessions are stored in the SQLite `sessions` table.
- Contains `id`, `user_id`, `token_hash`, `created_at`, `last_seen_at`, `expires_at`, and `revoked_at`.
- Tokens are transmitted as Bearer tokens. Only the SHA-256 hash of the token is retained in the database. 
- Logout simply updates the `revoked_at` timestamp.

## Role Model
- **TECHNICIAN**: Default role. Can perform inspections, generate reports, and view inspection histories.
- **SUPERVISOR**: Can view broader analytical data and history.
- **ADMIN**: Can manage users, reset passwords, disable accounts, and perform system-level management.

## Protected Endpoints
- The `@login_required` and `@role_required` decorators are applied to sensitive endpoints: `/analyze`, `/history`, `/search`, `/sync/status`, `/report/<id>`, etc.
- The `/health` endpoint remains publicly accessible to allow Electron to verify backend availability before rendering the login screen.

## Audit Logging
- Security-sensitive events such as `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `USER_CREATED`, and `LOGOUT` are stored in the `audit_logs` table.
- A user ID (if available) is associated with the event.
- Passwords and tokens are completely excluded from logs.

## Offline Behavior
- No authentication-related API attempts to contact AWS, Cognito, Keycloak, or any external UMS.
- Disconnecting Wi-Fi or Ethernet will not log the user out or prevent new logins.

## Security Limitations
- Because the backend is running on `127.0.0.1` and not exposed to the public internet, no TLS/HTTPS is used between the React UI and the Flask backend in the desktop deployment. This is standard for local Electron apps.
- Token lifetime is hardcoded to 7 days.

## Future Cloud/Enterprise Authentication Option
- In a production cloud scenario, the `auth.py` module could be swapped to validate tokens issued by AWS Cognito or a corporate Identity Provider (SSO), bridging the offline and online IAM environments.
