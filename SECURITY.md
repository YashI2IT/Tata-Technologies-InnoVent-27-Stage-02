# Security Policy — AeroEdge-X

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly
by contacting the project maintainers directly. Do not open a public
GitHub issue for security vulnerabilities.

## Supported Versions

| Version | Supported |
|---------|-----------|
| v2.6.x (current) | ✅ |
| < v2.6.0 | ❌ |

## Security Architecture

### Desktop Application (Electron + Flask)

- **Network Isolation**: Flask API binds to `127.0.0.1` only — not exposed to network
- **Session Security**: HttpOnly, SameSite=Lax cookies
- **CORS**: Restricted to configured frontend origins
- **Upload Validation**: File type whitelist (PNG, JPG, JPEG), 16 MB max
- **Input Sanitization**: `werkzeug.utils.secure_filename` on all uploads
- **Secret Key**: Production config enforces unique SECRET_KEY
- **Single Instance**: Electron enforces single-instance lock
- **Security Headers**: X-Content-Type-Options, X-XSS-Protection, Referrer-Policy

### Web Demonstration (Vercel)

- **No Secrets in Client**: Browser application never receives private credentials
- **Environment Variables**: Sensitive configuration stored in Vercel Project Settings
- **Demo Mode**: Public demonstration uses safe sample data
- **No Persistent Storage**: No writable filesystem or database on Vercel

### AI Model Security

- **Local Execution**: All AI inference runs locally — no data sent to external services
- **Ollama Runtime**: LLM runs through local Ollama — no cloud API calls
- **Model Integrity**: YOLOv11 weights loaded from verified local path

## Environment Variables

Never commit `.env` files. Use `.env.example` as a template.

Secrets that must never be committed:
- `SECRET_KEY`
- Database credentials (if any)
- API keys
- AWS credentials (when implemented)
- Authentication tokens

## Dependencies

Run `pip audit` and `npm audit` periodically to check for known vulnerabilities.
