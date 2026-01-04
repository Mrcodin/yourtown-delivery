# 🔍 Sentry Error Tracking Setup Guide

Complete guide to setting up error tracking for Yourtown Delivery with Sentry.

## 📋 Table of Contents
- [What is Sentry?](#what-is-sentry)
- [Why Use Error Tracking?](#why-use-error-tracking)
- [Quick Setup](#quick-setup)
- [Detailed Configuration](#detailed-configuration)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)

---

## What is Sentry?

Sentry is a powerful error tracking and monitoring platform that helps you:
- **Track Errors**: Catch and monitor all errors in real-time
- **Debug Faster**: See full context, stack traces, and user actions
- **Monitor Performance**: Track slow API calls and page loads
- **Stay Informed**: Get alerts when critical errors occur

**Free Tier**: 5,000 events/month (perfect for small to medium projects)

---

## Why Use Error Tracking?

### Without Error Tracking:
- ❌ You only know about errors when users report them
- ❌ Hard to reproduce bugs
- ❌ No visibility into production issues
- ❌ Lost customers due to unnoticed problems

### With Sentry:
- ✅ Know about errors before users report them
- ✅ Full context: stack traces, user actions, environment
- ✅ Prioritize fixes based on impact
- ✅ Catch issues in production immediately

---

## Quick Setup

### 1. Create Sentry Account

1. Go to https://sentry.io
2. Click "Get Started" and sign up (free)
3. Choose a project name: "Yourtown Delivery"

### 2. Create Projects

Create **two projects** (recommended):

**Backend Project:**
- Platform: Node.js / Express
- Name: "Yourtown Delivery Backend"
- Copy the DSN (looks like: `https://abc123@o123.ingest.sentry.io/456`)

**Frontend Project:**
- Platform: JavaScript
- Name: "Yourtown Delivery Frontend"
- Copy the DSN

### 3. Configure Backend

Add to `server/.env`:
```bash
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
```

### 4. Configure Frontend

Add to your HTML pages (in the `<head>` section):
```html
<meta name="sentry-dsn" content="https://your-frontend-dsn@sentry.io/project-id">
<script type="module" src="sentry-frontend.js"></script>
```

### 5. Restart Server

```bash
cd server
npm start
```

You should see:
```
✅ Sentry error tracking initialized
   Environment: development
   Sample Rate: 100%
```

---

## Detailed Configuration

### Backend Configuration

The backend Sentry config is in `server/config/sentry.js`.

**Key Features:**
- Automatic error capture
- Request/response tracing
- Performance monitoring
- Sensitive data filtering (passwords, tokens)

**Sample Rate:**
- Development: 100% (track everything)
- Production: 10% (reduce quota usage)

**Customization:**

```javascript
// server/config/sentry.js
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // Adjust as needed
    
    // Add custom tags
    beforeSend(event) {
        // Custom filtering logic
        return event;
    },
});
```

### Frontend Configuration

The frontend config is in `sentry-frontend.js`.

**Key Features:**
- JavaScript error tracking
- Unhandled promise rejections
- Network request tracing
- User action breadcrumbs
- Performance monitoring

**Integration in HTML:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta name="sentry-dsn" content="your-dsn-here">
    <script type="module">
        import { initSentry, trackPageView } from './sentry-frontend.js';
        initSentry();
        trackPageView('Home Page');
    </script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

### Environment Variables

**server/.env:**
```bash
# Required
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional - adjust based on needs
NODE_ENV=production
```

**Production vs Development:**

| Setting | Development | Production |
|---------|-------------|------------|
| Sample Rate | 100% | 10% |
| Stack Traces | Full | Full |
| Breadcrumbs | All | All |
| Quota Usage | High | Low |

---

## Testing

### Automated Testing

Open the test page:
```
http://localhost:5500/test-files/test-sentry.html
```

**Frontend Tests:**
- ✅ JavaScript Error
- ✅ Promise Rejection
- ✅ API Error
- ✅ Manual Exception
- ✅ Breadcrumbs

**Backend Tests:**
- ✅ Server Error
- ✅ 404 Error
- ✅ Validation Error

### Manual Testing

**Test Backend Error:**
```bash
curl http://localhost:3000/api/products/invalid-id-format
```

**Test Frontend Error:**
```javascript
// In browser console
throw new Error('Test error');
```

**Check Sentry:**
1. Go to https://sentry.io
2. Select your project
3. Click "Issues" to see errors

---

## Monitoring

### Sentry Dashboard

**Key Views:**

1. **Issues**
   - See all errors
   - Filter by severity, environment, user
   - View error frequency and impact

2. **Performance**
   - Track slow API calls
   - Monitor page load times
   - Identify bottlenecks

3. **Releases**
   - Track errors by version
   - See regression when new code is deployed

4. **Alerts**
   - Get notified of new errors
   - Set thresholds for critical errors

### Setting Up Alerts

1. Go to **Settings** → **Alerts**
2. Create new alert rule
3. Configure conditions:
   - When: New issue is first seen
   - If: Environment is production
   - Then: Send email notification

**Recommended Alerts:**
- New error first seen (immediate)
- Error spike (>100 events in 1 hour)
- Slow transaction (>2 seconds)
- High error rate (>5% of requests)

---

## Best Practices

### 1. Use Environments

Separate development and production errors:

```bash
# Development
NODE_ENV=development
SENTRY_DSN=https://dev-dsn@sentry.io/123

# Production
NODE_ENV=production
SENTRY_DSN=https://prod-dsn@sentry.io/456
```

### 2. Add User Context

Track which users experience errors:

```javascript
// Backend
const { setUser } = require('./config/sentry');

app.use((req, res, next) => {
    if (req.user) {
        setUser({
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
        });
    }
    next();
});
```

```javascript
// Frontend
import { setUser } from './sentry-frontend.js';

// After login
setUser({
    id: user._id,
    email: user.email,
    name: user.name,
});
```

### 3. Add Breadcrumbs

Track user actions before errors:

```javascript
import { addBreadcrumb } from './sentry-frontend.js';

// Track important actions
function addToCart(product) {
    addBreadcrumb('Added item to cart', 'user-action', {
        productId: product._id,
        productName: product.name,
        price: product.price,
    });
    // ... cart logic
}
```

### 4. Filter Sensitive Data

Already configured! But you can customize:

```javascript
// server/config/sentry.js
beforeSend(event) {
    // Remove credit card numbers
    if (event.request && event.request.data) {
        event.request.data = event.request.data.replace(
            /\d{16}/g,
            'XXXX-XXXX-XXXX-XXXX'
        );
    }
    return event;
}
```

### 5. Set Sample Rates

Control quota usage:

```javascript
// Development: Track everything
tracesSampleRate: 1.0,

// Production: Sample 10%
tracesSampleRate: 0.1,

// High-traffic site: Sample 1%
tracesSampleRate: 0.01,
```

### 6. Organize with Tags

Add custom tags for filtering:

```javascript
Sentry.setTag('feature', 'checkout');
Sentry.setTag('payment-method', 'stripe');
```

### 7. Handle Expected Errors

Don't track errors that are normal:

```javascript
try {
    await api.getProduct(id);
} catch (error) {
    if (error.status === 404) {
        // Expected - don't track
        return null;
    }
    // Unexpected error - track it
    captureException(error);
}
```

---

## Advanced Features

### 1. Performance Monitoring

Track slow API calls:

```javascript
// Already enabled! Sentry automatically tracks:
// - HTTP requests
// - Database queries
// - Express middleware

// View in: Sentry → Performance → Transactions
```

### 2. Release Tracking

Track errors by version:

```bash
# When deploying
export SENTRY_RELEASE=v1.2.3

# Or in package.json
{
  "scripts": {
    "deploy": "SENTRY_RELEASE=$(git rev-parse HEAD) npm run build"
  }
}
```

### 3. Source Maps

Debug minified JavaScript:

```bash
# Upload source maps to Sentry
npm install -g @sentry/cli

sentry-cli releases new $VERSION
sentry-cli releases files $VERSION upload-sourcemaps ./dist
sentry-cli releases finalize $VERSION
```

### 4. Custom Integrations

Integrate with other tools:

**Slack:**
- Settings → Integrations → Slack
- Get notified in Slack channel

**GitHub:**
- Link commits to errors
- Create issues automatically

**PagerDuty:**
- Alert on-call engineers

---

## Troubleshooting

### Errors Not Appearing in Sentry

**Check:**
1. ✅ SENTRY_DSN is set correctly
2. ✅ Server restarted after adding DSN
3. ✅ No firewall blocking sentry.io
4. ✅ Error is actually occurring (check browser console)

**Test manually:**
```bash
# Backend
curl http://localhost:3000/api/products/invalid-id

# Should see error in Sentry within 10 seconds
```

### Too Many Events (Quota Exceeded)

**Solutions:**
1. Reduce sample rate: `tracesSampleRate: 0.01`
2. Filter out noisy errors in `beforeSend`
3. Upgrade to paid plan
4. Use rate limiting per error type

### Sensitive Data in Errors

**Already filtered:**
- Passwords
- Auth tokens
- Credit card numbers (if properly validated)

**Add more filters:**
```javascript
beforeSend(event) {
    // Remove social security numbers
    if (event.message) {
        event.message = event.message.replace(
            /\d{3}-\d{2}-\d{4}/g,
            'XXX-XX-XXXX'
        );
    }
    return event;
}
```

---

## Cost Optimization

### Free Tier (5,000 events/month)

**Typical Usage:**
- Small site: 1,000-2,000 events/month
- Medium site: 3,000-5,000 events/month
- Large site: Need paid plan

**Optimization Tips:**

1. **Sample Production Errors** (10%)
   - Still catch 90% of unique errors
   - 10x reduction in quota usage

2. **Filter Noisy Errors**
   - Ignore known external issues
   - Skip error-prone browser extensions

3. **Use Environments Wisely**
   - Full tracking in development
   - Sampled in production

4. **Monitor Quota**
   - Settings → Usage & Billing
   - Set alerts at 80% usage

### Paid Plans (if needed)

| Plan | Events/Month | Cost |
|------|--------------|------|
| Free | 5,000 | $0 |
| Team | 50,000 | $26/mo |
| Business | 100,000 | $80/mo |
| Enterprise | Unlimited | Custom |

---

## Security Considerations

### What Data is Sent to Sentry?

**Automatically Sent:**
- Error messages and stack traces
- Request URL and method
- User agent and IP address
- Breadcrumbs (user actions)

**Filtered Out:**
- Passwords
- Auth tokens
- API keys
- Sensitive headers

### Data Privacy

**GDPR Compliance:**
- Sentry is GDPR compliant
- Data stored in US or EU (configurable)
- User data can be deleted on request

**Best Practices:**
- Don't log PII in error messages
- Review errors before sharing
- Use data scrubbing rules
- Comply with your privacy policy

---

## Next Steps

1. ✅ Set up Sentry account
2. ✅ Add DSN to `.env`
3. ✅ Test with test page
4. ✅ Deploy to production
5. ⬜ Set up alerts
6. ⬜ Integrate with Slack
7. ⬜ Review errors daily
8. ⬜ Set up performance monitoring

---

## Support

**Sentry Documentation:**
- https://docs.sentry.io

**Yourtown Delivery Support:**
- Check test page: `/test-files/test-sentry.html`
- Review logs: Check server console for "Sentry initialized"
- Open GitHub issue if problems persist

---

## Summary

**What You Get:**
- ✅ Real-time error tracking (frontend + backend)
- ✅ Performance monitoring
- ✅ User context and breadcrumbs
- ✅ Sensitive data filtering
- ✅ Email alerts
- ✅ Free for 5,000 events/month

**Time Investment:**
- Setup: 10 minutes
- Configuration: 5 minutes
- Testing: 5 minutes
- **Total: 20 minutes**

**Impact:**
- Catch errors before users report them
- Debug issues 10x faster
- Improve app reliability
- Better user experience

---

**Ready to catch those bugs? 🐛** Add your Sentry DSN and start tracking!
