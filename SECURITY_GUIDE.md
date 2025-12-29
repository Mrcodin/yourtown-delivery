# 🔒 Security Guide

## Overview

This guide covers security best practices for the Yourtown Delivery application.

## Critical Security Updates ✅

### 1. Random Admin Password Generation

The application now generates a **secure random password** for the admin account during database seeding.

**When you run the seed script:**
```bash
cd server
npm run seed
```

**You will see output like:**
```
==================================================
⚠️  IMPORTANT: Save these credentials securely!
==================================================
Admin:   username: admin    | password: a3f7b2e9d1c4f6a8b5e2d9c7a4f1e8b3
```

**⚠️ IMPORTANT:**
- **Save this password immediately** - it will not be displayed again
- Store it in a password manager
- Do not share it publicly
- Do not commit it to version control

### 2. JWT Secret Generation

Your JWT_SECRET should be a cryptographically secure random string.

**Generate a secure JWT secret:**

```bash
# On Linux/Mac:
openssl rand -hex 32

# Or using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# On Windows PowerShell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to your .env file:**
```env
JWT_SECRET=your_generated_secret_here
```

### 3. Environment Variables

**Never commit these to version control:**
- `JWT_SECRET`
- `MONGODB_URI` (contains database password)
- `STRIPE_SECRET_KEY`
- Admin passwords

**Your .env file should contain:**
```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_generated_32_char_random_string

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
CORS_ORIGIN=https://yourfrontend.com
```

## Security Checklist

### Before Going to Production:

- [ ] Change default admin password (automatically done with new seed script)
- [ ] Generate and set strong JWT_SECRET (min 32 characters)
- [ ] Remove all console.log statements from production code
- [ ] Enable rate limiting on authentication endpoints
- [ ] Set up MongoDB IP whitelist (don't use 0.0.0.0/0 in production)
- [ ] Enable HTTPS for all endpoints
- [ ] Set secure CORS_ORIGIN (not *)
- [ ] Enable Stripe webhook signature verification
- [ ] Set up proper error logging (don't expose stack traces)
- [ ] Enable MongoDB authentication
- [ ] Use strong database passwords
- [ ] Regular security updates (npm audit fix)
- [ ] Set up backup strategy for database

### Additional Recommendations:

1. **Two-Factor Authentication (2FA)**
   - Consider implementing 2FA for admin accounts
   - Use packages like `speakeasy` or `otplib`

2. **Password Reset**
   - Implement secure password reset via email
   - Use time-limited tokens
   - Require email verification

3. **Session Management**
   - Implement token refresh mechanism
   - Set reasonable token expiration times
   - Allow users to logout from all devices

4. **Input Validation**
   - Already implemented with middleware/validation.js
   - Keep validation rules strict
   - Sanitize all user inputs

5. **Rate Limiting**
   - Already implemented for login endpoint
   - Consider adding to other sensitive endpoints
   - Monitor for suspicious activity

6. **Monitoring & Logging**
   - Review activity logs regularly
   - Set up alerts for suspicious activity
   - Monitor failed login attempts

## Testing Your Security

### 1. Test Password Strength

Your generated admin password should be:
- At least 32 characters
- Random hexadecimal string
- Never reused

### 2. Test JWT Token

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}' \
  | jq -r '.token')

# Use token to access protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/orders
```

### 3. Test Rate Limiting

```bash
# Try multiple failed logins
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
  echo ""
done
```

After 5 failed attempts, you should be rate limited.

## Incident Response

### If Admin Password is Compromised:

1. **Immediately change password in database:**
   ```javascript
   // Connect to MongoDB and run:
   const user = await User.findOne({ username: 'admin' });
   user.password = 'new-secure-password';
   await user.save();
   ```

2. **Invalidate all active sessions** (restart server or implement token blacklist)

3. **Review activity logs** for unauthorized access

4. **Check for data breaches**

### If JWT Secret is Exposed:

1. **Generate new JWT_SECRET immediately**
2. **Update .env file**
3. **Restart server** (invalidates all tokens)
4. **Force all users to re-login**
5. **Review recent authentication logs**

## Compliance & Best Practices

### OWASP Top 10 Coverage:

✅ **A01: Broken Access Control** - Role-based authorization implemented
✅ **A02: Cryptographic Failures** - Passwords hashed with bcrypt, HTTPS enforced
✅ **A03: Injection** - Input validation and sanitization
✅ **A04: Insecure Design** - Secure architecture with JWT tokens
✅ **A05: Security Misconfiguration** - Security headers with Helmet
✅ **A06: Vulnerable Components** - Regular npm audit
✅ **A07: Authentication Failures** - Secure password hashing, rate limiting
✅ **A08: Data Integrity Failures** - Input validation
✅ **A09: Logging Failures** - Activity logging implemented
✅ **A10: SSRF** - Validated external requests

## Regular Maintenance

### Weekly:
- Review activity logs
- Check for failed login attempts
- Monitor error logs

### Monthly:
- Run `npm audit` and fix vulnerabilities
- Update dependencies
- Review user access permissions
- Backup database

### Quarterly:
- Security audit
- Review and update security policies
- Penetration testing
- Update documentation

## Support

For security issues or concerns:
1. Do not create public GitHub issues
2. Contact the development team directly
3. Report vulnerabilities responsibly

---

**Last Updated:** December 29, 2025
**Version:** 1.0
