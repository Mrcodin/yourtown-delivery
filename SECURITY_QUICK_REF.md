# 🔒 Security Quick Reference

## 🚀 Quick Commands

### Generate Secrets
```bash
cd server
npm run generate-secrets        # Generate both JWT secret and password
npm run generate-secrets jwt    # Generate only JWT secret
npm run generate-secrets password # Generate only password
```

### Seed Database with Secure Password
```bash
cd server
npm run seed
# ⚠️ Save the admin password from console output!
```

### Test Login
```bash
cd server
node test-login.js YOUR_PASSWORD
```

## 📋 First-Time Setup Checklist

1. [ ] Clone repository
2. [ ] Run `cd server && npm install`
3. [ ] Copy `.env.example` to `.env`
4. [ ] Run `npm run generate-secrets`
5. [ ] Add JWT_SECRET to `.env`
6. [ ] Add MONGODB_URI to `.env`
7. [ ] Run `npm run seed`
8. [ ] **Save admin password** from console
9. [ ] Test login at http://localhost:3000

## 🔐 Environment Variables Template

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Authentication (generate with: npm run generate-secrets)
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE

# Stripe (optional for testing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ORIGIN=http://localhost:5500
```

## ⚠️ Security Rules

### ❌ NEVER:
- Commit `.env` file
- Share passwords in chat/email
- Use `hometown123` in production
- Commit JWT secrets
- Use same password across environments

### ✅ ALWAYS:
- Generate random passwords
- Store passwords in password manager
- Use unique JWT secrets per environment
- Enable HTTPS in production
- Whitelist specific IPs in production MongoDB

## 🆘 Emergency Procedures

### If Admin Password Lost:
```bash
# Option 1: Reseed database
cd server
npm run seed

# Option 2: Manual reset (requires MongoDB access)
# Connect to MongoDB shell and run:
# db.users.updateOne(
#   { username: "admin" },
#   { $set: { password: "hashed_password_here" } }
# )
```

### If JWT Secret Compromised:
1. Generate new secret: `npm run generate-secrets jwt`
2. Update `.env` file
3. Restart server
4. All users must re-login

## 📖 Full Documentation

- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Complete security documentation
- **[SECURITY_UPDATE.md](SECURITY_UPDATE.md)** - Recent security changes
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment

## 🎯 Production Checklist

Before deploying to production:

- [ ] Use strong, randomly generated passwords
- [ ] Set unique JWT_SECRET (not in docs)
- [ ] Enable HTTPS
- [ ] Restrict MongoDB IP whitelist
- [ ] Set CORS_ORIGIN to production domain
- [ ] Enable rate limiting
- [ ] Remove console.log statements
- [ ] Run `npm audit fix`
- [ ] Set NODE_ENV=production
- [ ] Enable error logging
- [ ] Set up database backups

## 📞 Support

For security issues:
1. Review [SECURITY_GUIDE.md](SECURITY_GUIDE.md)
2. Check [SECURITY_UPDATE.md](SECURITY_UPDATE.md)
3. Contact development team (not public issues)

---

**Last Updated:** December 29, 2025
