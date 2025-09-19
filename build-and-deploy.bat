@echo off
REM RecoStream Build and Deployment Script for Windows
REM This script helps you build and deploy the RecoStream application using Docker

setlocal enabledelayedexpansion

REM Function to print status messages
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

REM Function to check if Docker is installed and running
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed. Please install Docker Desktop first."
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker Desktop first."
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not available. Please ensure Docker Desktop is properly installed."
    exit /b 1
)

call :print_success "Docker and Docker Compose are available"
goto :eof

REM Function to create necessary directories
:create_directories
call :print_status "Creating necessary directories..."
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups
if not exist "nginx" mkdir nginx
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "nginx\logs" mkdir nginx\logs
call :print_success "Directories created"
goto :eof

REM Function to setup environment
:setup_environment
if not exist ".env" (
    if exist ".env.docker" (
        call :print_status "Copying .env.docker to .env..."
        copy ".env.docker" ".env" >nul
        call :print_warning "Please edit .env file with your actual configuration values"
    ) else (
        call :print_error ".env.docker template not found. Please create environment configuration."
        exit /b 1
    )
) else (
    call :print_success "Environment file (.env) already exists"
)
goto :eof

REM Function to build the application
:build_app
call :print_status "Building RecoStream application..."
docker-compose build --no-cache
if errorlevel 1 (
    call :print_error "Build failed"
    exit /b 1
)
call :print_success "Application built successfully"
goto :eof

REM Function to start services in development mode
:start_dev
call :print_status "Starting RecoStream in development mode..."
docker-compose up -d postgres redis
call :print_status "Waiting for database to be ready..."
timeout /t 10 /nobreak >nul
docker-compose up recostream-app
goto :eof

REM Function to start services in production mode
:start_prod
call :print_status "Starting RecoStream in production mode..."
docker-compose -f docker-compose.prod.yml up -d
if errorlevel 1 (
    call :print_error "Failed to start production services"
    exit /b 1
)
call :print_success "RecoStream started in production mode"
call :print_status "Application will be available at:"
call :print_status "  - HTTP: http://localhost"
call :print_status "  - Direct API: http://localhost:8000"
goto :eof

REM Function to stop services
:stop_services
call :print_status "Stopping RecoStream services..."
docker-compose down
docker-compose -f docker-compose.prod.yml down 2>nul
call :print_success "Services stopped"
goto :eof

REM Function to show logs
:show_logs
set service=%~1
if "%service%"=="" set service=recostream-app
call :print_status "Showing logs for %service%..."
docker-compose logs -f %service%
goto :eof

REM Function to backup database
:backup_database
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "backup_name=recostream_backup_%YYYY%%MM%%DD%_%HH%%Min%%Sec%.sql"

call :print_status "Creating database backup: %backup_name%"
docker-compose exec -T postgres pg_dump -U recostream_user recostream > "backups\%backup_name%"
if errorlevel 1 (
    call :print_error "Backup failed"
    exit /b 1
)
call :print_success "Database backup created: backups\%backup_name%"
goto :eof

REM Function to show service status
:show_status
call :print_status "Service Status:"
docker-compose ps
echo.
call :print_status "Production Service Status:"
docker-compose -f docker-compose.prod.yml ps 2>nul || echo No production services running
goto :eof

REM Function to clean up Docker resources
:clean_docker
call :print_status "Cleaning up Docker resources..."
docker-compose down --rmi all --volumes --remove-orphans 2>nul
docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans 2>nul
docker system prune -f
call :print_success "Docker cleanup completed"
goto :eof

REM Function to show help
:show_help
echo RecoStream Build and Deployment Script for Windows
echo.
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   build       Build the Docker images
echo   dev         Start in development mode
echo   prod        Start in production mode
echo   stop        Stop all services
echo   restart     Restart all services
echo   logs [svc]  Show logs (optional service name)
echo   backup      Backup database
echo   clean       Clean up Docker images and containers
echo   status      Show service status
echo   help        Show this help message
echo.
echo Examples:
echo   %~nx0 build ^&^& %~nx0 dev    # Build and start in development
echo   %~nx0 prod                    # Start in production mode
echo   %~nx0 logs recostream-app     # Show application logs
echo   %~nx0 backup                  # Create database backup
goto :eof

REM Main script logic
set command=%~1
if "%command%"=="" set command=help

if "%command%"=="build" (
    call :check_docker
    call :create_directories
    call :setup_environment
    call :build_app
) else if "%command%"=="dev" (
    call :check_docker
    call :create_directories
    call :setup_environment
    call :start_dev
) else if "%command%"=="prod" (
    call :check_docker
    call :create_directories
    call :setup_environment
    call :start_prod
) else if "%command%"=="stop" (
    call :stop_services
) else if "%command%"=="restart" (
    call :stop_services
    timeout /t 2 /nobreak >nul
    call :start_prod
) else if "%command%"=="logs" (
    call :show_logs %~2
) else if "%command%"=="backup" (
    call :backup_database
) else if "%command%"=="clean" (
    call :clean_docker
) else if "%command%"=="status" (
    call :show_status
) else (
    call :show_help
)

endlocal
