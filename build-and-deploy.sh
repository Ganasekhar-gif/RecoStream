#!/bin/bash

# RecoStream Build and Deployment Script
# This script helps you build and deploy the RecoStream application using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p data logs backups nginx/ssl nginx/logs
    print_success "Directories created"
}

# Function to copy environment file
setup_environment() {
    if [ ! -f .env ]; then
        if [ -f .env.docker ]; then
            print_status "Copying .env.docker to .env..."
            cp .env.docker .env
            print_warning "Please edit .env file with your actual configuration values"
        else
            print_error ".env.docker template not found. Please create environment configuration."
            exit 1
        fi
    else
        print_success "Environment file (.env) already exists"
    fi
}

# Function to build the application
build_app() {
    print_status "Building RecoStream application..."
    docker-compose build --no-cache
    print_success "Application built successfully"
}

# Function to start services in development mode
start_dev() {
    print_status "Starting RecoStream in development mode..."
    docker-compose up -d postgres redis
    print_status "Waiting for database to be ready..."
    sleep 10
    docker-compose up recostream-app
}

# Function to start services in production mode
start_prod() {
    print_status "Starting RecoStream in production mode..."
    docker-compose -f docker-compose.prod.yml up -d
    print_success "RecoStream started in production mode"
    print_status "Application will be available at:"
    print_status "  - HTTP: http://localhost"
    print_status "  - Direct API: http://localhost:8000"
}

# Function to stop services
stop_services() {
    print_status "Stopping RecoStream services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    local service=${1:-recostream-app}
    print_status "Showing logs for $service..."
    docker-compose logs -f $service
}

# Function to backup database
backup_database() {
    local backup_name="recostream_backup_$(date +%Y%m%d_%H%M%S).sql"
    print_status "Creating database backup: $backup_name"
    docker-compose exec postgres pg_dump -U recostream_user recostream > "backups/$backup_name"
    print_success "Database backup created: backups/$backup_name"
}

# Function to restore database
restore_database() {
    local backup_file=$1
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file to restore"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_status "Restoring database from: $backup_file"
    docker-compose exec -T postgres psql -U recostream_user recostream < "$backup_file"
    print_success "Database restored successfully"
}

# Function to show help
show_help() {
    echo "RecoStream Build and Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker images"
    echo "  dev         Start in development mode"
    echo "  prod        Start in production mode"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs [svc]  Show logs (optional service name)"
    echo "  backup      Backup database"
    echo "  restore     Restore database from backup"
    echo "  clean       Clean up Docker images and containers"
    echo "  status      Show service status"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 dev    # Build and start in development"
    echo "  $0 prod               # Start in production mode"
    echo "  $0 logs recostream-app # Show application logs"
    echo "  $0 backup             # Create database backup"
}

# Function to clean up Docker resources
clean_docker() {
    print_status "Cleaning up Docker resources..."
    docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans 2>/dev/null || true
    docker system prune -f
    print_success "Docker cleanup completed"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    echo ""
    print_status "Production Service Status:"
    docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "No production services running"
}

# Main script logic
main() {
    local command=${1:-help}
    
    case $command in
        "build")
            check_docker
            create_directories
            setup_environment
            build_app
            ;;
        "dev")
            check_docker
            create_directories
            setup_environment
            start_dev
            ;;
        "prod")
            check_docker
            create_directories
            setup_environment
            start_prod
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_prod
            ;;
        "logs")
            show_logs $2
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database $2
            ;;
        "clean")
            clean_docker
            ;;
        "status")
            show_status
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
