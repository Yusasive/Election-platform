# Faculty of Physical Sciences Election Platform

A comprehensive digital voting platform built with Next.js, MongoDB, and TypeScript.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/election-platform

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# JWT Secret (Generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Database

Visit `http://localhost:3000/setup` after starting the development server to initialize the database.

### 4. Start Development Server

```bash
npm run dev
```

### 5. Add Candidates

1. Go to `/admin` and login
2. Navigate to "Candidate Management"
3. Create positions and add candidates with full details

## 📋 Setup Checklist

- [ ] MongoDB database created
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database initialized via `/setup` page
- [ ] Admin login tested (`/admin`)
- [ ] Candidates added through admin dashboard
- [ ] Student voting flow tested

## 🔧 Configuration

### MongoDB Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Add it to `.env.local` as `MONGODB_URI`

### Admin Access

- **URL**: `/admin`
- **Username**: `admin` (or set via `ADMIN_USERNAME`)
- **Password**: `admin123` (or set via `ADMIN_PASSWORD`)

## 🎯 Key Features

- **Fresh Candidate Entry**: Admin creates all candidates from scratch
- **Rich Candidate Profiles**: Name, nickname, image, department, level
- **Real-time Voting**: Live status updates and countdown timers
- **Admin Dashboard**: Complete election management
- **Secure Authentication**: JWT-based admin auth
- **Vote Analytics**: Real-time statistics and reporting
- **Mobile Responsive**: Works on all devices
- **Toast Notifications**: Better user feedback

## 🔍 Troubleshooting

### Database Connection Issues

1. Check your MongoDB URI in `.env.local`
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Verify database user permissions

### Admin Dashboard Not Working

1. Visit `/setup` to initialize the database
2. Check admin credentials in `.env.local`
3. Clear browser localStorage and try again

### No Candidates Showing

1. Ensure database is properly initialized via `/setup`
2. Add candidates through Admin Dashboard → Candidate Management
3. Check that positions are created first

### Voting Not Reflecting

1. Ensure candidates are added through admin dashboard
2. Check admin time settings
3. Verify voting is enabled in admin panel

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── vote/              # Voting interface
│   └── setup/             # Database setup
├── components/            # React components
├── lib/                   # Utilities and database
├── models/                # MongoDB schemas
└── hooks/                 # Custom React hooks
```

## 🛠 Development Workflow

### 1. Initial Setup
1. Run `/setup` to initialize database
2. Login to admin dashboard
3. Create election positions
4. Add candidates with full details

### 2. Adding Candidates
1. Go to Admin Dashboard → Candidate Management
2. Create positions first (if not already created)
3. Add candidates with:
   - Full Name (required)
   - Nickname (optional)
   - Image upload
   - Department
   - Level (e.g., 100L, 200L)

### 3. Managing Elections
1. Set voting times in Time Management
2. Enable/disable voting as needed
3. Monitor votes in real-time

### 4. Viewing Results
1. Go to Admin Dashboard → Voting Analytics
2. Export data as CSV if needed
3. Monitor real-time vote counts

## 🚀 Deployment

1. Deploy to Vercel/Netlify
2. Set environment variables in deployment platform
3. Ensure MongoDB is accessible from production
4. Run database setup on first deployment
5. Add candidates through admin dashboard

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify environment setup
3. Check browser console for errors
4. Ensure candidates are added through admin dashboard (not JSON)