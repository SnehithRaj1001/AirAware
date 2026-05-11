# AirAware Deployment Guide

## Pre-Deployment Checklist

### Security Review
- [ ] Change JWT_SECRET to a strong random string (min 32 characters)
- [ ] Review all environment variables
- [ ] Verify database credentials are strong
- [ ] Check CORS configuration
- [ ] Review error messages (no sensitive info exposed)

### Code Review
- [ ] No hardcoded secrets in code
- [ ] All dependencies are up-to-date
- [ ] No console.log() statements in production code
- [ ] Error handling is comprehensive
- [ ] SQL queries are parameterized (protected against injection)

### Testing
- [ ] All auth flows tested
- [ ] Dashboard displays correctly
- [ ] Error handling verified
- [ ] Performance is acceptable
- [ ] No memory leaks in frontend

### Documentation
- [ ] README.md is complete
- [ ] API documentation is clear
- [ ] Setup instructions are accurate
- [ ] Troubleshooting guide is available

---

## Deployment Steps

### Step 1: Prepare Environment

#### Backend Environment File (`.env`)
```
# Database Configuration
DB_USER=production_user
DB_HOST=your-database-host
DB_NAME=AirAware_prod
DB_PASSWORD=strong-password-here
DB_PORT=5432

# JWT Configuration
JWT_SECRET=generate-strong-random-string-min-32-chars
JWT_EXPIRY=7d

# Server Configuration
NODE_ENV=production
PORT=4000

# CORS Configuration
CORS_ORIGIN=https://your-domain.com
```

**Generate Strong JWT_SECRET:**
```bash
# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend Environment File (`.env`)
```
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_ENV=production
```

### Step 2: Build Applications

#### Backend Build
```bash
cd Backend
npm install
npm run start  # Test it works
```

#### Frontend Build
```bash
cd Frontend
npm install
npm run build  # Creates dist/ folder
```

### Step 3: Database Migration

```sql
-- Connect to production database
psql -U postgres -h production-host -d AirAware_prod

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM stations;
SELECT COUNT(*) FROM aqi_data;

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_stations_name ON stations(LOWER(station_name));
CREATE INDEX idx_aqi_station_date ON aqi_data(station_id, date);
```

### Step 4: Deploy Backend

#### Option A: Docker Deployment

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY Backend/package*.json ./

RUN npm ci --only=production

COPY Backend/ ./

EXPOSE 4000

CMD ["node", "server.js"]
```

**Build and Run:**
```bash
docker build -t airaware-backend .
docker run -d \
  -p 4000:4000 \
  --env-file .env \
  --name airaware-backend \
  airaware-backend
```

#### Option B: Traditional Server Deployment

```bash
# Copy backend files to server
scp -r Backend/ user@your-server:/var/www/airaware-backend/

# SSH into server
ssh user@your-server

# Install dependencies
cd /var/www/airaware-backend
npm install --production

# Create systemd service file
sudo nano /etc/systemd/system/airaware-backend.service
```

**Create `/etc/systemd/system/airaware-backend.service`:**
```ini
[Unit]
Description=AirAware Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/airaware-backend
EnvironmentFile=/var/www/airaware-backend/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and Start Service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable airaware-backend
sudo systemctl start airaware-backend
sudo systemctl status airaware-backend
```

### Step 5: Deploy Frontend

#### Option A: Static Hosting (Recommended)

```bash
# Build production files
cd Frontend
npm run build

# Upload dist folder to hosting service
# AWS S3, Netlify, Vercel, GitHub Pages, etc.

# Example: AWS S3
aws s3 sync dist/ s3://your-bucket-name/
```

#### Option B: Nginx Serving

**Copy files to server:**
```bash
scp -r Frontend/dist/* user@your-server:/var/www/airaware-frontend/
```

**Create Nginx config file:**
```nginx
# /etc/nginx/sites-available/airaware-frontend
server {
    listen 80;
    listen [::]:80;
    
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/airaware-frontend;
    index index.html;
    
    # For React Router SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Disable caching for index.html
    location = /index.html {
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }
}
```

**Enable Nginx config:**
```bash
sudo ln -s /etc/nginx/sites-available/airaware-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL/HTTPS Setup

**Using Let's Encrypt (Recommended):**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Update Nginx config for HTTPS:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}
```

### Step 7: Configure CORS

**Backend (`server.js`):**
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 8: Setup Monitoring

#### PM2 Process Manager (Optional)
```bash
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'airaware-api',
      script: './Backend/server.js',
      instances: 'max',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Logging
```bash
# Check logs
pm2 logs airaware-api

# Or journalctl for systemd
journalctl -u airaware-backend -f
```

### Step 9: Setup CI/CD (Optional)

**GitHub Actions Example (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Backend
        run: |
          cd Backend
          npm install
          npm run start &
      
      - name: Build Frontend
        run: |
          cd Frontend
          npm install
          npm run build
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_KEY }}
          script: |
            cd /var/www/airaware
            git pull origin main
            npm install
            npm run build
            systemctl restart airaware-backend
```

### Step 10: Health Check

```bash
# Test API endpoints
curl -X POST https://api.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test frontend
curl https://your-domain.com

# Check database connection
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "SELECT 1;"
```

---

## Post-Deployment Verification

### 1. Frontend Verification
- [ ] Website loads without errors
- [ ] UI renders correctly
- [ ] Assets are cached properly
- [ ] Responsive design works on mobile
- [ ] No console errors

### 2. Backend Verification
- [ ] API responds to requests
- [ ] Authentication works
- [ ] Protected routes require token
- [ ] Database queries are fast
- [ ] Error handling works

### 3. Security Verification
- [ ] HTTPS is enabled
- [ ] HSTS headers are set
- [ ] CORS is restricted to domain
- [ ] Sensitive data not exposed
- [ ] Rate limiting is active

### 4. Performance Verification
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Smooth chart rendering
- [ ] No memory leaks
- [ ] CPU usage normal

### 5. Monitoring Setup
- [ ] Logs are being collected
- [ ] Uptime monitoring is configured
- [ ] Error tracking is active
- [ ] Performance metrics visible
- [ ] Alerts are set up

---

## Scaling Considerations

### Horizontal Scaling
```bash
# Multiple backend instances
# Use load balancer (Nginx, HAProxy, AWS LB)
# Configure sticky sessions for JWT
```

### Database Optimization
```sql
-- Add read replicas
-- Implement connection pooling
-- Archive old data
-- Optimize indexes
```

### Caching Strategy
```javascript
// Redis caching
// Cache station data
// Cache news data
// Cache dashboard aggregations
```

---

## Backup & Recovery

### Database Backups
```bash
# Daily backup
0 2 * * * pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Restore from backup
gunzip < /backups/db-20260420.sql.gz | psql -U $DB_USER -h $DB_HOST $DB_NAME
```

### Application Backups
```bash
# Backup code and config
tar -czf /backups/app-$(date +%Y%m%d).tar.gz \
  /var/www/airaware-backend \
  /var/www/airaware-frontend \
  /var/www/.env
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
journalctl -u airaware-backend -n 50

# Test database connection
psql -U $DB_USER -h $DB_HOST -d $DB_NAME

# Check port availability
netstat -tlnp | grep 4000
```

### Frontend Shows Blank Page
```bash
# Check console errors (DevTools)
# Verify API_BASE_URL matches backend
# Check build output: npm run build
# Verify nginx config: sudo nginx -t
```

### CORS Errors
```bash
# Check backend CORS configuration
# Verify origin matches frontend domain
# Check Authorization header handling
```

### Database Connection Issues
```bash
# Verify credentials
# Check network connectivity
# Verify database exists
psql -U $DB_USER -h $DB_HOST -l | grep AirAware
```

---

## Rollback Procedures

### Quick Rollback
```bash
# Stop services
systemctl stop airaware-backend

# Restore previous version
git checkout previous-tag
npm install
systemctl start airaware-backend

# Verify
systemctl status airaware-backend
```

### Database Rollback
```bash
# Stop application
systemctl stop airaware-backend

# Restore database from backup
gunzip < /backups/db-previous.sql.gz | psql -U $DB_USER -h $DB_HOST $DB_NAME

# Restart application
systemctl start airaware-backend
```

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check system resources
- Verify backups completed

### Weekly
- Review performance metrics
- Check security logs
- Update dependencies

### Monthly
- Security audit
- Database optimization
- Capacity planning

### Quarterly
- Full system review
- Disaster recovery test
- Performance baseline

---

## Support & Emergency Contact

For production issues:
1. Check logs: `journalctl -u airaware-backend -f`
2. Check database: `psql -U $DB_USER -h $DB_HOST -d $DB_NAME`
3. Restart services: `systemctl restart airaware-backend`
4. Contact: [Support email]

---

**Deployment Status: Ready for Production** ✅
