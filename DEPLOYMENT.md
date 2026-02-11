# Trading Journal - Production Deployment Guide

This guide covers deploying the Trading Journal application to production using Docker.

## Architecture Overview

- **Frontend**: React + Vite (built as static files)
- **Backend**: Express.js + SQLite
- **Deployment**: Docker container serving both frontend and backend

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)
- Domain name (for production deployment)
- SSL certificate (recommended for production)

## Quick Start with Docker

### 1. Create Production Environment File

Copy the example environment file and configure it:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set your values:

```env
# CRITICAL: Generate a secure JWT secret
JWT_SECRET=your_secure_random_string_here

# Set your production domain or use localhost for testing
CLIENT_URL=http://localhost:5000

NODE_ENV=production
PORT=5000
```

**Generate a secure JWT_SECRET:**
```bash
openssl rand -hex 32
```

### 2. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose --env-file .env.production up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:5000`

### 3. Alternative: Build and Run with Docker Only

```bash
# Build the image
docker build -t trading-journal:latest .

# Run the container
docker run -d \
  --name trading-journal \
  -p 5000:5000 \
  -e JWT_SECRET="your_secure_jwt_secret_here" \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e CLIENT_URL=http://localhost:5000 \
  -v trading-journal-db:/app/server/database \
  --restart unless-stopped \
  trading-journal:latest

# View logs
docker logs -f trading-journal

# Stop and remove container
docker stop trading-journal
docker rm trading-journal
```

## Production Deployment Checklist

### Security

- [ ] Generate a strong JWT_SECRET (minimum 32 characters)
- [ ] Set up HTTPS/SSL certificates (use Let's Encrypt, Cloudflare, etc.)
- [ ] Configure firewall rules
- [ ] Set up proper CORS allowed origins
- [ ] Review and configure Helmet.js CSP settings in [server.js](server/src/server.js)
- [ ] Enable rate limiting (already configured in the app)

### Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Generated via `openssl rand -hex 32` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `CLIENT_URL` | Frontend URL for CORS | `https://yourdomain.com` |

### Data Persistence

The SQLite database is stored in `/app/server/database` inside the container. Use Docker volumes to persist data:

```bash
# Using named volume (recommended)
-v trading-journal-db:/app/server/database

# Using bind mount (for backups)
-v /path/on/host/database:/app/server/database
```

### Database Backups

```bash
# Create backup
docker exec trading-journal-app cp /app/server/database/trading-journal.db /app/server/database/backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp trading-journal-app:/app/server/database/backup-YYYYMMDD.db ./backup.db

# Restore from backup
docker cp ./backup.db trading-journal-app:/app/server/database/trading-journal.db
docker restart trading-journal-app
```

## Reverse Proxy Setup (Nginx Example)

For production, use a reverse proxy like Nginx with SSL:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then update your `CLIENT_URL` environment variable:
```env
CLIENT_URL=https://yourdomain.com
```

## Health Checks

The application provides a health check endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Monitoring and Logs

```bash
# View real-time logs
docker logs -f trading-journal-app

# View last 100 lines
docker logs --tail 100 trading-journal-app

# Check container status
docker ps -a | grep trading-journal

# Check resource usage
docker stats trading-journal-app
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose --env-file .env.production up -d --build

# Or with docker directly
docker stop trading-journal
docker rm trading-journal
docker build -t trading-journal:latest .
docker run -d [... same options as before ...]
```

## Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker logs trading-journal-app

# Common issues:
# - JWT_SECRET not set or too short
# - Port 5000 already in use
# - Database permissions
```

### Database issues

```bash
# Check database file permissions
docker exec trading-journal-app ls -la /app/server/database/

# Reset database (WARNING: deletes all data)
docker exec trading-journal-app rm /app/server/database/trading-journal.db
docker restart trading-journal-app
```

### CORS errors

Ensure `CLIENT_URL` matches your frontend URL exactly:
- For local Docker testing: `http://localhost:5000`
- For production: `https://yourdomain.com` (no trailing slash)

## Performance Optimization

### For High Traffic

1. **Use a process manager**: Consider using PM2 inside the container
2. **Scale horizontally**: Run multiple containers behind a load balancer
3. **Use PostgreSQL**: For better concurrent write performance (requires code changes)
4. **Enable caching**: Add Redis for session/data caching
5. **CDN**: Serve static assets via CDN

### SQLite Limitations

SQLite is great for:
- Low to medium traffic applications
- Single server deployments
- Development and testing

Consider PostgreSQL/MySQL if you need:
- High concurrent writes
- Multi-server deployments
- Large datasets (>1GB)

## Security Best Practices

1. **Keep secrets out of version control**: Never commit `.env` files
2. **Regularly update dependencies**: Run `npm audit` and update packages
3. **Use HTTPS in production**: Always encrypt traffic
4. **Implement backup strategy**: Regular automated backups
5. **Monitor logs**: Set up log aggregation and monitoring
6. **Limit container resources**: Use Docker resource constraints

```bash
# Example with resource limits
docker run -d \
  --memory="512m" \
  --cpus="1.0" \
  [... other options ...]
```

## Support and Maintenance

### Regular Maintenance Tasks

- [ ] Weekly: Check logs for errors
- [ ] Weekly: Verify backups are working
- [ ] Monthly: Update dependencies and rebuild
- [ ] Monthly: Review security advisories
- [ ] Quarterly: Test disaster recovery procedures

### Getting Help

If you encounter issues:
1. Check the logs: `docker logs trading-journal-app`
2. Verify environment variables are set correctly
3. Ensure the health check endpoint responds
4. Check database file permissions and disk space

## Architecture Details

### Docker Build Process

The Dockerfile uses a multi-stage build:

1. **Stage 1 (client-builder)**: Builds the React frontend
2. **Stage 2 (server-builder)**: Installs server dependencies
3. **Stage 3 (production)**: Creates the final minimal image

### Directory Structure in Container

```
/app/
├── server/
│   ├── src/
│   │   └── server.js (main application)
│   ├── database/ (mounted volume)
│   │   └── trading-journal.db
│   ├── public/ (built frontend files)
│   │   ├── index.html
│   │   └── assets/
│   └── node_modules/
```

### How It Works

1. Server starts on port 5000
2. API routes are served under `/api/*`
3. Static frontend files are served from `/server/public`
4. All non-API routes serve `index.html` (SPA routing support)
5. Database is automatically initialized on first run
6. Health check available at `/api/health`

## Next Steps

After successful deployment:

1. Set up monitoring (e.g., Uptime Robot, DataDog)
2. Configure automated backups
3. Set up SSL/TLS certificates
4. Configure domain DNS
5. Test disaster recovery
6. Document your specific deployment configuration
