# Security Implementation Documentation

## Overview
This document describes the security measures implemented in the Subarifas application.

## 1. JWT Expiration

**Implementation**: `backend/src/middleware/auth.ts`, `backend/src/routes/admin.ts`

### Features
- JWT tokens expire after 24 hours
- Token validation on every protected endpoint
- Automatic rejection of expired tokens

### Configuration
```typescript
jwt({
  secret: process.env.JWT_SECRET,
  exp: '24h'
})
```

### Environment Variables
- `JWT_SECRET` - Secret key for JWT signing (required in production)

---

## 2. CSRF Protection

**Implementation**: `backend/src/middleware/csrf.ts`

### Features
- CSRF tokens for all state-changing operations (POST, PUT, PATCH, DELETE)
- Token expiration after 1 hour
- Session-based token validation
- Automatic token cleanup

### How It Works
1. Client requests CSRF token from `/api/csrf-token`
2. Server generates token and associates it with session ID
3. Client includes token in headers for state-changing requests:
   - `X-CSRF-Token`: Token value
   - `X-Session-Id`: Session identifier
4. Server validates token before processing request

### Exemptions
Public endpoints are exempt from CSRF validation:
- `/api/selections` (raffle number selection)
- `/api/receipts` (receipt uploads)
- `/api/admin/login` (login)
- `/api/admin/init` (initial admin creation)

### Frontend Integration
The frontend automatically fetches and includes CSRF tokens via Axios interceptors.

---

## 3. Input Sanitization

**Implementation**: 
- `backend/src/utils/sanitize.ts`
- `backend/src/middleware/sanitization.ts`

### Features
- **HTML Sanitization**: Strips all HTML tags to prevent XSS attacks
- **String Sanitization**: Trims whitespace and removes malicious content
- **Object Sanitization**: Recursively sanitizes nested objects and arrays
- **Query Sanitization**: Removes MongoDB operators from user input

### Functions
```typescript
sanitizeHtml(dirty: string): string
sanitizeString(input: string): string
sanitizeObject<T>(obj: T): T
sanitizeMongoQuery(query: any): any
```

### Automatic Application
All request bodies and query parameters are automatically sanitized via middleware before reaching route handlers.

---

## 4. Query Sanitization (NoSQL Injection Prevention)

**Implementation**: `backend/src/middleware/sanitization.ts`

### Features
- Removes MongoDB operators (`$gt`, `$gte`, `$in`, `$ne`, etc.)
- Uses `express-mongo-sanitize` library
- Replaces dangerous characters with underscore
- Applied to both request body and query parameters

### Protected Against
- `{ username: { $gt: "" } }` → `{ username_gt: "" }`
- `{ $where: "malicious code" }` → `{ _where: "malicious code" }`

---

## 5. Security Headers

**Implementation**: `backend/src/middleware/security-headers.ts`

### Headers Applied

#### X-Frame-Options
```
X-Frame-Options: DENY
```
Prevents clickjacking attacks by disabling iframe embedding.

#### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME type sniffing.

#### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
Enables XSS filtering in older browsers.

#### Content-Security-Policy
```
default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```
Restricts resource loading to prevent XSS and data injection attacks.

#### Permissions-Policy
```
camera=(), microphone=(), geolocation=()
```
Restricts access to sensitive browser features.

#### Strict-Transport-Security (Production Only)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Forces HTTPS connections for 1 year.

#### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controls referrer information sent with requests.

---

## 6. Audit Logging

**Implementation**: 
- `backend/src/db/models/AuditLog.ts`
- `backend/src/middleware/audit.ts`
- `backend/src/utils/audit.ts`

### Features
- Comprehensive logging of all state-changing operations
- Tracks user actions, IP addresses, and user agents
- Before/after change tracking
- Indexed for efficient querying

### Logged Information
```typescript
{
  action: string,          // e.g., 'create', 'update', 'delete', 'login'
  resource: string,        // e.g., 'raffle', 'receipt', 'admin'
  resourceId: string,      // ID of affected resource
  userId: string,          // User who performed action
  username: string,        // Username
  ipAddress: string,       // IP address
  userAgent: string,       // Browser/client info
  method: string,          // HTTP method
  path: string,           // Request path
  statusCode: number,     // Response status
  changes: {              // Optional before/after values
    before: any,
    after: any
  },
  metadata: object,       // Additional context
  timestamp: Date         // When action occurred
}
```

### Logged Actions
- **Admin**: login, logout, init_admin
- **Raffles**: create, update, delete, status_change, view_winner
- **Receipts**: upload_receipt, status_change
- **Selections**: create

### Viewing Audit Logs
Admin endpoint: `GET /api/admin/audit-logs`

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 50)
- `resource` - Filter by resource type
- `action` - Filter by action type
- `userId` - Filter by user

### Data Retention
Configure retention policies in your database or implement automatic cleanup based on your compliance requirements.

---

## 7. Additional Security Measures

### Password Security
- Bcrypt hashing with 10 salt rounds
- Passwords never stored in plain text
- No password in responses or logs

### CORS Configuration
- Restricted to configured frontend URL
- Credentials support enabled
- No wildcard origins

### Environment Variables
All sensitive configuration in environment variables:
- `JWT_SECRET` - JWT signing key
- `MONGODB_URI` - Database connection
- `FRONTEND_URL` - Allowed CORS origin

### Error Handling
- Sensitive headers redacted in logs
- Generic error messages to clients
- Request body logging configurable via `LOG_REQUEST_SHAPES` env var
- 4KB limit on logged request bodies

### Data Privacy
- Winner contact information redacted in public endpoints
- User data sanitized before audit logging
- Password fields automatically redacted from logs

---

## Best Practices for Production

### Required
1. Set strong `JWT_SECRET` in environment
2. Use HTTPS/TLS for all connections
3. Set `NODE_ENV=production`
4. Configure proper CORS origins
5. Set up MongoDB authentication
6. Regular security audits of logs
7. Implement rate limiting (recommended: use nginx or load balancer)

### Recommended
1. Use secrets management service (AWS Secrets Manager, Azure Key Vault)
2. Enable MongoDB encryption at rest
3. Regular backup of audit logs
4. Set up intrusion detection
5. Monitor failed login attempts
6. Implement account lockout after failed attempts
7. Add 2FA for admin accounts
8. Regular dependency updates

### Monitoring
1. Review audit logs daily
2. Alert on suspicious patterns
3. Monitor failed authentication attempts
4. Track unusual access patterns
5. Set up error rate monitoring

---

## API Changes

### New Endpoints

#### Get CSRF Token
```
GET /api/csrf-token
Response: { csrfToken: string, sessionId: string }
```

#### Get Audit Logs (Admin Only)
```
GET /api/admin/audit-logs?page=1&limit=50&resource=raffle
Response: {
  logs: AuditLog[],
  pagination: { page, limit, total, pages }
}
```

### Modified Headers

#### Required for State-Changing Requests
```
X-CSRF-Token: <token>
X-Session-Id: <session-id>
Authorization: Bearer <jwt-token>
```

---

## Testing

### Test CSRF Protection
```bash
# Should fail without CSRF token
curl -X POST http://localhost:3000/api/raffles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Should succeed with CSRF token
curl -X POST http://localhost:3000/api/raffles \
  -H "Authorization: Bearer <token>" \
  -H "X-CSRF-Token: <token>" \
  -H "X-Session-Id: <session-id>" \
  -H "Content-Type: application/json"
```

### Test JWT Expiration
Tokens expire after 24 hours. Test by setting a shorter expiration time in development.

### Test Input Sanitization
```bash
# Attempt XSS
curl -X POST http://localhost:3000/api/raffles \
  -d '{"title": "<script>alert(1)</script>"}'

# Attempt NoSQL injection
curl -X GET http://localhost:3000/api/raffles?title[$gt]=
```

---

## Troubleshooting

### CSRF Token Errors
- Ensure frontend fetches token before state-changing operations
- Check that session ID is consistent across requests
- Verify token hasn't expired (1 hour lifetime)

### JWT Expiration Issues
- Check server time synchronization
- Verify JWT_SECRET is consistent
- Ensure exp claim is properly set

### Audit Log Performance
- Ensure indexes are created on timestamp, userId, resource
- Consider archiving old logs to separate collection
- Use pagination when querying large datasets

---

## Compliance

This implementation helps meet requirements for:
- **OWASP Top 10**: XSS, Injection, Broken Authentication
- **GDPR**: Audit logging, data minimization
- **PCI DSS**: Audit trails, access control
- **SOC 2**: Logging, monitoring, access control

---

## Future Enhancements

Consider implementing:
1. Rate limiting per IP/user
2. Account lockout after failed login attempts
3. Two-factor authentication (2FA)
4. Password strength requirements
5. Password rotation policies
6. Session management with Redis
7. Real-time security monitoring
8. Automated security scanning
9. File upload virus scanning
10. Anomaly detection in audit logs
