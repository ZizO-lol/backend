# E-Commerce System - Deployment Guide

## 1. Executive Summary

This document provides comprehensive deployment instructions for the E-Commerce System across different environments, including infrastructure setup, deployment processes, monitoring, and rollback procedures.

## 2. Environment Overview

### 2.1 Environment Types

| Environment | Purpose | URL | Access |
|-------------|---------|-----|--------|
| Development | Local development | http://localhost:3000 | Developers |
| Staging | Pre-production testing | https://staging.ecommerce.com | Internal team |
| Production | Live system | https://ecommerce.com | Public |

### 2.2 Environment Configuration

**Development**:
- Local MongoDB instance
- Local Redis
- Mock payment gateway
- Debug logging enabled

**Staging**:
- MongoDB Atlas (staging cluster)
- Redis Cloud
- Test payment gateway
- Verbose logging

**Production**:
- MongoDB Atlas (production cluster)
- Redis Cloud (production)
- Live payment gateway
- Error logging only
- High availability setup

---

## 3. Prerequisites

### 3.1 Software Requirements

**Required Software**:
- Node.js v18+ (LTS)
- npm v9+ or pnpm v8+
- Docker v24+
- Docker Compose v2+
- Git v2.40+

**Optional Tools**:
- Kubernetes CLI (kubectl)
- AWS CLI
- Terraform (for infrastructure as code)

### 3.2 Access Requirements

**Required Access**:
- Git repository access
- Cloud provider console access (AWS/Azure/GCP)
- Database access credentials
- SSL certificates
- Domain DNS management
- Payment gateway credentials
- Email service credentials

### 3.3 Infrastructure Requirements

**Minimum Server Specifications**:
- CPU: 2 vCPUs
- RAM: 4 GB
- Storage: 50 GB SSD
- Network: 1 Gbps

**Recommended Production Specifications**:
- CPU: 4 vCPUs (auto-scaling)
- RAM: 8 GB (auto-scaling)
- Storage: 100 GB SSD
- Network: 10 Gbps
- Load Balancer
- CDN

---

## 4. Local Development Setup

### 4.1 Clone Repository

```bash
git clone https://github.com/your-org/ecommerce-backend.git
cd ecommerce-backend
```

### 4.2 Install Dependencies

```bash
npm install
# or
pnpm install
```

### 4.3 Environment Configuration

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with local settings:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_dev_secret_key_here
JWT_EXPIRE=24h

# Payment (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Email (Development)
EMAIL_SERVICE=console
EMAIL_FROM=noreply@localhost

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Logging
LOG_LEVEL=debug
```

### 4.4 Start Local Services

**Option 1: Docker Compose**
```bash
docker-compose up -d
```

**Option 2: Manual Setup**
```bash
# Start MongoDB
mongod --dbpath ./data/db

# Start Redis
redis-server

# Start application
npm run dev
```

### 4.5 Verify Installation

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-23T11:22:00.000Z"}
```

---

## 5. Docker Deployment

### 5.1 Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "dist/index.js"]
```

### 5.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ecommerce
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    networks:
      - ecommerce-network

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    restart: unless-stopped
    networks:
      - ecommerce-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - ecommerce-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - ecommerce-network

volumes:
  mongodb-data:
  redis-data:

networks:
  ecommerce-network:
    driver: bridge
```

### 5.3 Build and Run

```bash
# Build image
docker build -t ecommerce-backend:latest .

# Run container
docker run -d \
  --name ecommerce-api \
  -p 3000:3000 \
  --env-file .env.production \
  ecommerce-backend:latest

# Or use docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## 6. Cloud Deployment

### 6.1 AWS Deployment

#### 6.1.1 AWS Infrastructure Setup

**Services Used**:
- **EC2**: Application servers
- **RDS**: Managed database (optional)
- **ElastiCache**: Redis cache
- **ALB**: Application Load Balancer
- **S3**: File storage
- **CloudFront**: CDN
- **Route 53**: DNS management
- **ACM**: SSL certificates

**Infrastructure as Code** (Terraform):
```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ecommerce-vpc"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ecommerce-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public.*.id

  tags = {
    Name = "ecommerce-alb"
  }
}

# EC2 Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "ecommerce-asg"
  vpc_zone_identifier = aws_subnet.private.*.id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  
  min_size         = 2
  max_size         = 10
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ecommerce-instance"
    propagate_at_launch = true
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "storage" {
  bucket = "ecommerce-storage"

  tags = {
    Name = "ecommerce-storage"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ecommerce-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
}
```

#### 6.1.2 Deploy to AWS EC2

```bash
# 1. Create EC2 instance (or use auto-scaling group)

# 2. SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 3. Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Clone repository
git clone https://github.com/your-org/ecommerce-backend.git
cd ecommerce-backend

# 6. Set up environment
nano .env.production

# 7. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 8. Verify
curl http://localhost:3000/health
```

### 6.2 Azure Deployment

#### 6.2.1 Azure App Service

```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login to Azure
az login

# 3. Create resource group
az group create --name ecommerce-rg --location eastus

# 4. Create App Service plan
az appservice plan create \
  --name ecommerce-plan \
  --resource-group ecommerce-rg \
  --sku B1 \
  --is-linux

# 5. Create Web App
az webapp create \
  --resource-group ecommerce-rg \
  --plan ecommerce-plan \
  --name ecommerce-api \
  --deployment-container-image-name ecommerce-backend:latest

# 6. Configure environment variables
az webapp config appsettings set \
  --resource-group ecommerce-rg \
  --name ecommerce-api \
  --settings \
    NODE_ENV=production \
    MONGODB_URI=$MONGODB_URI \
    REDIS_URL=$REDIS_URL

# 7. Deploy code
az webapp deployment source config \
  --name ecommerce-api \
  --resource-group ecommerce-rg \
  --repo-url https://github.com/your-org/ecommerce-backend \
  --branch main \
  --manual-integration
```

### 6.3 Google Cloud Platform Deployment

#### 6.3.1 GCP Cloud Run

```bash
# 1. Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 2. Initialize gcloud
gcloud init

# 3. Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/ecommerce-backend

# 4. Deploy to Cloud Run
gcloud run deploy ecommerce-api \
  --image gcr.io/PROJECT_ID/ecommerce-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=$MONGODB_URI

# 5. Get service URL
gcloud run services describe ecommerce-api --region us-central1 --format 'value(status.url)'
```

---

## 7. Kubernetes Deployment

### 7.1 Kubernetes Manifests

**Deployment**:
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
  labels:
    app: ecommerce-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-api
  template:
    metadata:
      labels:
        app: ecommerce-api
    spec:
      containers:
      - name: api
        image: ecommerce-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-api-service
spec:
  selector:
    app: ecommerce-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

**ConfigMap**:
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ecommerce-config
data:
  NODE_ENV: "production"
  PORT: "3000"
```

**Secrets**:
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ecommerce-secrets
type: Opaque
stringData:
  mongodb-uri: "mongodb+srv://user:password@cluster.mongodb.net/ecommerce"
  redis-url: "redis://redis-service:6379"
  jwt-secret: "your-secret-key"
```

### 7.2 Deploy to Kubernetes

```bash
# 1. Create namespace
kubectl create namespace ecommerce

# 2. Apply configurations
kubectl apply -f k8s/configmap.yaml -n ecommerce
kubectl apply -f k8s/secrets.yaml -n ecommerce
kubectl apply -f k8s/deployment.yaml -n ecommerce

# 3. Verify deployment
kubectl get pods -n ecommerce
kubectl get services -n ecommerce

# 4. View logs
kubectl logs -f deployment/ecommerce-api -n ecommerce

# 5. Scale deployment
kubectl scale deployment ecommerce-api --replicas=5 -n ecommerce

# 6. Update deployment (rolling update)
kubectl set image deployment/ecommerce-api api=ecommerce-backend:v2 -n ecommerce

# 7. Rollback if needed
kubectl rollout undo deployment/ecommerce-api -n ecommerce
```

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run linter
        run: npm run lint
        
      - name: Security audit
        run: npm audit --audit-level=moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/ecommerce-backend
            docker-compose pull
            docker-compose up -d
            docker system prune -af
            
      - name: Health check
        run: |
          sleep 30
          curl -f https://api.ecommerce.com/health || exit 1
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 9. Database Migration

### 9.1 Migration Strategy

**Before Deployment**:
```bash
# 1. Backup database
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)

# 2. Run migrations
npm run migrate

# 3. Verify migrations
npm run migrate:status
```

**Migration Script**:
```typescript
// migrations/001_add_user_preferences.ts
export async function up(db: Db) {
  await db.collection('users').updateMany(
    { preferences: { $exists: false } },
    {
      $set: {
        preferences: {
          newsletter: true,
          notifications: true,
          language: 'en',
          currency: 'USD'
        }
      }
    }
  );
}

export async function down(db: Db) {
  await db.collection('users').updateMany(
    {},
    { $unset: { preferences: '' } }
  );
}
```

---

## 10. SSL/TLS Configuration

### 10.1 Obtain SSL Certificate

**Using Let's Encrypt**:
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d api.ecommerce.com

# Certificates will be saved to:
# /etc/letsencrypt/live/api.ecommerce.com/fullchain.pem
# /etc/letsencrypt/live/api.ecommerce.com/privkey.pem
```

### 10.2 NGINX Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name api.ecommerce.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.ecommerce.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.ecommerce.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ecommerce.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to backend
    location / {
        proxy_pass http://localhost:3000;
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

---

## 11. Monitoring and Logging

### 11.1 Application Monitoring

**Health Check Endpoint**:
```typescript
// src/routes/health.ts
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: checkDatabaseConnection(),
      redis: checkRedisConnection(),
      memory: checkMemoryUsage()
    }
  };
  
  res.status(200).json(healthcheck);
});
```

**Logging Configuration**:
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### 11.2 Monitoring Tools Setup

**New Relic**:
```bash
# Install New Relic agent
npm install newrelic

# Add to application entry point
require('newrelic');
```

**DataDog**:
```bash
# Install DataDog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<API_KEY> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Start agent
sudo systemctl start datadog-agent
```

---

## 12. Backup and Recovery

### 12.1 Database Backup

**Automated Backup Script**:
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
RETENTION_DAYS=30

# Create backup
mongodump \
  --uri="$MONGODB_URI" \
  --out="$BACKUP_DIR/backup_$DATE" \
  --gzip

# Upload to S3
aws s3 sync "$BACKUP_DIR/backup_$DATE" s3://ecommerce-backups/mongodb/backup_$DATE/

# Clean old backups
find $BACKUP_DIR -type d -mtime +$RETENTION_DAYS -exec rm -rf {} +

# Log backup
echo "Backup completed: backup_$DATE" >> /var/log/mongodb-backup.log
```

**Cron Job**:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup.sh
```

### 12.2 Restore Procedure

```bash
# 1. Download backup from S3
aws s3 sync s3://ecommerce-backups/mongodb/backup_20251023/ /tmp/restore/

# 2. Restore database
mongorestore \
  --uri="$MONGODB_URI" \
  --gzip \
  /tmp/restore/

# 3. Verify restoration
mongo "$MONGODB_URI" --eval "db.stats()"

# 4. Clean up
rm -rf /tmp/restore/
```

---

## 13. Rollback Procedure

### 13.1 Quick Rollback

**Docker Deployment**:
```bash
# 1. Stop current version
docker-compose down

# 2. Pull previous version
docker pull ecommerce-backend:previous-tag

# 3. Update docker-compose.yml with previous tag
# 4. Start previous version
docker-compose up -d

# 5. Verify
curl https://api.ecommerce.com/health
```

**Kubernetes Deployment**:
```bash
# Rollback to previous revision
kubectl rollout undo deployment/ecommerce-api -n ecommerce

# Rollback to specific revision
kubectl rollout undo deployment/ecommerce-api --to-revision=3 -n ecommerce

# Check rollout status
kubectl rollout status deployment/ecommerce-api -n ecommerce
```

### 13.2 Database Rollback

```bash
# 1. Stop application
docker-compose down

# 2. Restore database from backup
mongorestore --uri="$MONGODB_URI" --drop /backups/mongodb/backup_YYYYMMDD/

# 3. Start application
docker-compose up -d
```

---

## 14. Troubleshooting

### 14.1 Common Issues

**Issue: Application won't start**
```bash
# Check logs
docker logs ecommerce-api

# Check environment variables
docker exec ecommerce-api env

# Verify database connection
docker exec ecommerce-api node -e "require('./dist/config/db').testConnection()"
```

**Issue: High memory usage**
```bash
# Check memory stats
docker stats ecommerce-api

# Restart application
docker-compose restart app

# If problem persists, scale up
docker-compose up -d --scale app=3
```

**Issue: Database connection errors**
```bash
# Test connection
mongo "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Check firewall rules
# Check authentication credentials
# Verify network connectivity
```

### 14.2 Debug Mode

```bash
# Enable debug logging
NODE_ENV=development LOG_LEVEL=debug npm start

# Or in Docker
docker run -e LOG_LEVEL=debug ecommerce-backend:latest
```

---

## 15. Post-Deployment Checklist

- [ ] Application health check passes
- [ ] Database connectivity verified
- [ ] Redis cache working
- [ ] SSL certificate valid
- [ ] DNS configured correctly
- [ ] Monitoring alerts configured
- [ ] Backup jobs running
- [ ] Log aggregation working
- [ ] Performance metrics baseline established
- [ ] Security scan completed
- [ ] Load balancer health checks passing
- [ ] CDN configured (if applicable)
- [ ] Email service working
- [ ] Payment gateway tested
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## 16. Scaling Guidelines

### 16.1 Horizontal Scaling

**When to Scale**:
- CPU usage > 70% for 5+ minutes
- Memory usage > 80%
- Response time > 1 second
- Error rate > 2%

**Scaling Actions**:
```bash
# Docker Swarm
docker service scale ecommerce-api=5

# Kubernetes
kubectl scale deployment ecommerce-api --replicas=5

# AWS Auto Scaling (configured in terraform)
# Automatically scales based on CloudWatch metrics
```

### 16.2 Vertical Scaling

**Upgrade Server Resources**:
1. Schedule maintenance window
2. Create snapshot/backup
3. Stop application
4. Resize server instance
5. Start application
6. Verify functionality
7. Monitor performance

---

## 17. Security Hardening

### 17.1 Server Hardening

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban
sudo apt-get install fail2ban -y
sudo systemctl enable fail2ban
```

### 17.2 Application Security

- [ ] Environment variables secured
- [ ] Secrets managed properly
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Regular security audits

---

## 18. Conclusion

This deployment guide provides comprehensive instructions for deploying the E-Commerce System across various environments and platforms. Regular reviews and updates to deployment procedures will ensure smooth operations and minimize downtime.

For additional support, contact the DevOps team or refer to the troubleshooting section.

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-23  
**Next Review Date**: 2026-01-23  
**Document Owner**: DevOps Lead / Platform Engineer
