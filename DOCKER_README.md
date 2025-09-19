# RecoStream Docker Deployment Guide

This guide explains how to build and deploy the RecoStream application using Docker and Docker Compose.

## 📋 Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (included with Docker Desktop)
- **Git** (to clone the repository)
- At least **4GB RAM** and **10GB disk space**

## 🚀 Quick Start

### Windows Users

```batch
# Build and start in development mode
build-and-deploy.bat build
build-and-deploy.bat dev

# Or start in production mode
build-and-deploy.bat prod
```

### Linux/Mac Users

```bash
# Make script executable
chmod +x build-and-deploy.sh

# Build and start in development mode
./build-and-deploy.sh build
./build-and-deploy.sh dev

# Or start in production mode
./build-and-deploy.sh prod
```

## 📁 Project Structure

```
RecoStream/
├── Dockerfile                 # Multi-stage build for the application
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
├── .env.docker               # Environment template
├── nginx.conf                # Nginx configuration
├── init.sql                  # Database initialization
├── build-and-deploy.sh       # Linux/Mac deployment script
├── build-and-deploy.bat      # Windows deployment script
├── frontend/                 # React frontend
├── backend/                  # FastAPI backend
└── requirements.txt          # Python dependencies
```

## 🔧 Configuration

### 1. Environment Setup

Copy the environment template and customize it:

```bash
cp .env.docker .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
POSTGRES_DB=recostream
POSTGRES_USER=recostream_user
POSTGRES_PASSWORD=your_secure_password_here

# Application Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=30

# TMDB API Configuration
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### 2. Security Configuration

**Important**: Change these values in production:
- `POSTGRES_PASSWORD`: Use a strong, unique password
- `SECRET_KEY`: Generate a secure 32+ character key
- `REDIS_PASSWORD`: Set a strong Redis password

## 🏗️ Building the Application

### Development Build

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

### Production Build

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🌐 Accessing the Application

Once deployed, the application will be available at:

- **Frontend**: http://localhost (via Nginx)
- **API Documentation**: http://localhost/docs
- **Direct API**: http://localhost:8000 (development only)
- **Database**: localhost:5432 (if exposed)

## 📊 Service Management

### Using the Deployment Scripts

#### Windows (`build-and-deploy.bat`)

```batch
# Available commands
build-and-deploy.bat build      # Build Docker images
build-and-deploy.bat dev        # Start development environment
build-and-deploy.bat prod       # Start production environment
build-and-deploy.bat stop       # Stop all services
build-and-deploy.bat restart    # Restart services
build-and-deploy.bat logs       # Show application logs
build-and-deploy.bat backup     # Backup database
build-and-deploy.bat status     # Show service status
build-and-deploy.bat clean      # Clean up Docker resources
build-and-deploy.bat help       # Show help
```

#### Linux/Mac (`build-and-deploy.sh`)

```bash
# Available commands
./build-and-deploy.sh build     # Build Docker images
./build-and-deploy.sh dev       # Start development environment
./build-and-deploy.sh prod      # Start production environment
./build-and-deploy.sh stop      # Stop all services
./build-and-deploy.sh restart   # Restart services
./build-and-deploy.sh logs      # Show application logs
./build-and-deploy.sh backup    # Backup database
./build-and-deploy.sh status    # Show service status
./build-and-deploy.sh clean     # Clean up Docker resources
./build-and-deploy.sh help      # Show help
```

### Manual Docker Commands

```bash
# Build and start development environment
docker-compose up -d --build

# Build and start production environment
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose logs -f recostream-app

# Stop services
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down --volumes --remove-orphans
```

## 🗄️ Database Management

### Backup Database

```bash
# Using deployment script
./build-and-deploy.sh backup

# Manual backup
docker-compose exec postgres pg_dump -U recostream_user recostream > backup.sql
```

### Restore Database

```bash
# Using deployment script
./build-and-deploy.sh restore backup.sql

# Manual restore
docker-compose exec -T postgres psql -U recostream_user recostream < backup.sql
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U recostream_user -d recostream
```

## 🔍 Monitoring and Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f recostream-app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Check Service Status

```bash
# Service status
docker-compose ps

# Resource usage
docker stats
```

### Debug Application

```bash
# Execute commands in running container
docker-compose exec recostream-app bash

# Check application health
curl http://localhost:8000/health
```

## 🚀 Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd RecoStream

# Setup environment
cp .env.docker .env
# Edit .env with production values

# Deploy
./build-and-deploy.sh prod
```

### 3. SSL Configuration (Optional)

For HTTPS, add SSL certificates to `nginx/ssl/` directory:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

Update `nginx.conf` to enable SSL.

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :8000
   # Kill the process or change port in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   # Verify environment variables
   docker-compose exec recostream-app env | grep DATABASE
   ```

3. **Frontend Build Fails**
   ```bash
   # Check Node.js version in Dockerfile
   # Ensure package.json is valid
   # Check build logs
   docker-compose logs recostream-app
   ```

4. **Permission Issues (Linux)**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x build-and-deploy.sh
   ```

### Performance Optimization

1. **Increase Docker Resources**
   - Docker Desktop: Settings → Resources → Advanced
   - Increase CPU and Memory allocation

2. **Database Optimization**
   ```sql
   -- Connect to database and run
   VACUUM ANALYZE;
   REINDEX DATABASE recostream;
   ```

3. **Clean Up Docker**
   ```bash
   # Remove unused images and containers
   docker system prune -a
   ```

## 📈 Scaling

### Horizontal Scaling

```yaml
# In docker-compose.prod.yml
services:
  recostream-app:
    deploy:
      replicas: 3
    # ... other configuration
```

### Load Balancing

Update `nginx.conf` to add multiple backend servers:

```nginx
upstream recostream_backend {
    server recostream-app-1:8000;
    server recostream-app-2:8000;
    server recostream-app-3:8000;
}
```

## 🛡️ Security Best Practices

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **Use Strong Secrets**: Generate secure keys for JWT and database
3. **Enable Firewall**: Restrict access to necessary ports only
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **SSL/TLS**: Use HTTPS in production
6. **Backup Strategy**: Implement regular automated backups

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment configuration
3. Ensure Docker has sufficient resources
4. Check network connectivity
5. Review this documentation

For additional help, please check the main project README or create an issue in the repository.

---

**Happy Deploying! 🚀**
