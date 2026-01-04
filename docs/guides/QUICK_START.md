# 🚀 Quick Setup Instructions

## You're Almost There!

The backend code is complete and ready to run. You just need to set up MongoDB Atlas (free tier):

### Option 1: Set Up MongoDB Atlas (Recommended - 5 minutes)

1. **Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
2. **Sign up** for free account
3. **Create a free cluster** (M0 Sandbox)
4. **Create a database user**:
   - Username: `yourtown_admin`
   - Password: Create a strong password
5. **Add IP to whitelist**: Click "Allow Access from Anywhere" (0.0.0.0/0)
6. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password
   - Replace `<database>` with `yourtown-delivery`

7. **Update `.env` file**:
   ```bash
   MONGODB_URI=mongodb+srv://yourtown_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/yourtown-delivery?retryWrites=true&w=majority
   ```

8. **Run these commands**:
   ```bash
   cd server
   npm run seed    # Seeds database with initial data
   npm run dev     # Starts the server
   ```

### Option 2: Use Docker MongoDB (Local Development)

```bash
# Start MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Update .env
MONGODB_URI=mongodb://localhost:27017/yourtown-delivery

# Seed and run
npm run seed
npm run dev
```

### Option 3: Test Without Database (Demo Mode)

I can show you the server structure without connecting to MongoDB, but you won't be able to test the full functionality.

---

## 🔑 After MongoDB Setup

**Default Login Credentials:**
- Admin: `admin` / (check console output after running seed script)
- Manager: `manager` / `manager456`
- Driver: `driver` / `driver789`

**Test the API:**
- Health Check: http://localhost:3000/api/health
- Products: http://localhost:3000/api/products
- Login: POST to http://localhost:3000/api/auth/login

---

## ⚡ Quick Start

Once MongoDB is configured:

```bash
cd server
npm run seed     # First time only
npm run dev      # Start development server
```

Server will be available at: **http://localhost:3000**

---

## 📞 Need Help?

1. MongoDB Atlas not working? Check:
   - IP whitelist includes 0.0.0.0/0
   - Database user has "Read and write" permissions
   - Connection string password is correct
   - No spaces in connection string

2. Still stuck? The full deployment guide has detailed screenshots:
   - See: `DEPLOYMENT_GUIDE.md` Phase 1

---

**Ready when you are! Set up MongoDB Atlas and let's run your backend! 🚀**
