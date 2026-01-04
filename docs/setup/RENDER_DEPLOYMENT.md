# 🚀 Render Deployment Guide - Yourtown Delivery

## Prerequisites

Before deploying, make sure you have:

1. ✅ A [Render account](https://render.com) (free tier available)
2. ✅ A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account with a cluster set up
3. ✅ Your GitHub repository pushed (already done!)
4. ✅ A [Stripe account](https://stripe.com) with API keys (optional for payments)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't already)
3. Click **Database Access** → **Add New Database User**
   - Username: `yourtowndelivery`
   - Password: Generate a secure password
   - Role: `Read and write to any database`
4. Click **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
5. Click **Database** → **Connect** → **Connect your application**
6. Copy the connection string. It should look like:
   ```
   mongodb+srv://yourtowndelivery:<password>@cluster0.xxxxx.mongodb.net/yourtown-delivery?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual password

---

## Step 2: Deploy Backend API to Render

### Option A: Using Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository: `Mrcodin/yourtown-delivery`
4. Render will detect the `render.yaml` file in the `/server` directory
5. Click **Apply**

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository: `Mrcodin/yourtown-delivery`
4. Configure the service:

   **Basic Settings:**
   - Name: `yourtown-delivery-api`
   - Region: Choose closest to your users (e.g., Oregon)
   - Branch: `main`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

   **Environment Variables:**
   Add these environment variables:
   
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://yourtowndelivery:<password>@cluster0.xxxxx.mongodb.net/yourtown-delivery
   JWT_SECRET=USE_COMMAND_TO_GENERATE_SEE_BELOW
   JWT_EXPIRE=8h
   CORS_ORIGIN=https://yourtown-delivery.onrender.com
   ```

   Optional (for Stripe payments):
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

5. Click **Create Web Service**

---

## Step 3: Deploy Frontend to Render

### Option 1: Deploy as Static Site (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Static Site**
3. Connect your GitHub repository: `Mrcodin/yourtown-delivery`
4. Configure:
   - Name: `yourtown-delivery`
   - Branch: `main`
   - Root Directory: `.` (leave empty or use root)
   - Build Command: `echo "No build needed"`
   - Publish Directory: `.` (root)

5. **Environment Variables:**
   ```
   API_URL=https://yourtown-delivery-api.onrender.com
   ```

6. Click **Create Static Site**

### Option 2: Use Render CDN with the backend

Alternatively, you can serve the frontend from the backend:

1. Move all frontend files to `/server/public` folder
2. In `server.js`, add:
   ```javascript
   app.use(express.static('public'));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });
   ```

---

## Step 4: Update API URLs (if using separate frontend)

If you deployed frontend separately, update `api.js`:

```javascript
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://yourtown-delivery-api.onrender.com/api',
    
    SOCKET_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://yourtown-delivery-api.onrender.com'
};
```

---

## Step 5: Seed the Database

After backend is deployed, seed your database with initial data:

### Method 1: Via Render Shell

1. Go to your backend service on Render
2. Click **Shell** tab
3. Run: `npm run seed`

### Method 2: Trigger via API

Once deployed, you can create an admin user manually via API call:

```bash
curl -X POST https://yourtown-delivery-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "hometown123",
    "name": "Admin User",
    "role": "admin",
    "email": "admin@yourtown.com"
  }'
```

---

## Step 6: Test Your Deployment

1. **Frontend URL**: `https://yourtown-delivery.onrender.com`
2. **Backend API**: `https://yourtown-delivery-api.onrender.com/api`

### Test Backend Health:
```bash
curl https://yourtown-delivery-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T...",
  "database": "connected"
}
```

### Test Login:
```bash
curl -X POST https://yourtown-delivery-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"hometown123"}'
```

---

## Step 7: Configure Custom Domain (Optional)

1. Go to your Render service settings
2. Click **Custom Domain**
3. Add your domain (e.g., `app.yourdelivery.com`)
4. Update DNS records as instructed
5. Update `CORS_ORIGIN` environment variable to your custom domain

---

## 🔒 Security Checklist

Before going live, ensure:

- [ ] Change default admin password immediately after first login
- [ ] Use strong JWT_SECRET (minimum 32 characters, random)
- [ ] MongoDB user has limited permissions
- [ ] MongoDB IP whitelist is properly configured
- [ ] CORS is configured for your domain only
- [ ] Environment variables are set correctly
- [ ] Stripe webhook secret is configured (if using Stripe)
- [ ] Rate limiting is enabled (already configured)
- [ ] HTTPS is enabled (Render does this automatically)

---

## 📊 Monitoring & Logs

### View Logs:
1. Go to your service on Render
2. Click **Logs** tab
3. Monitor real-time logs

### Set up Alerts:
1. Go to service settings
2. Click **Notifications**
3. Add email/Slack notifications for:
   - Deployment failures
   - Service crashes
   - High CPU/memory usage

---

## 🔄 Continuous Deployment

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect the push
2. Run build command
3. Deploy new version
4. Run health checks
5. Switch traffic to new version

---

## 💰 Free Tier Limitations

Render free tier includes:
- ✅ 750 hours/month of runtime
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ Cold starts take ~30-60 seconds

To keep service running 24/7:
- Upgrade to Starter plan ($7/month)
- Or use a service like UptimeRobot to ping every 10 minutes

---

## 🐛 Troubleshooting

### Service won't start:
- Check logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct
- Check MongoDB IP whitelist includes Render's IPs

### Database connection errors:
- Verify MONGODB_URI is correct
- Check MongoDB Atlas network access
- Ensure database user has proper permissions

### CORS errors:
- Update CORS_ORIGIN environment variable
- Ensure frontend URL is correct
- Check browser console for specific error

### API calls failing:
- Verify API_URL in frontend is correct
- Check backend logs for errors
- Test API endpoints with curl

---

## 📞 Support

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Socket.io Docs: https://socket.io/docs/v4/

---

## 🎉 You're Live!

Your application is now deployed! Share your URL:
- **Customer App**: https://yourtown-delivery.onrender.com
- **Admin Panel**: https://yourtown-delivery.onrender.com/admin-login.html

Default admin credentials:
- Username: `admin`
- Password: `hometown123` (CHANGE THIS IMMEDIATELY!)
