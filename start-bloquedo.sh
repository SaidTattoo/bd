#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   INICIANDO SERVICIOS DE BLOQUEDO   ${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required dependencies
echo -e "${YELLOW}Verificando dependencias...${NC}"

# Check Docker
if ! command_exists docker; then
    echo -e "${RED}Error: Docker no está instalado${NC}"
    echo "Por favor instale Docker"
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}Error: Node.js no está instalado${NC}"
    echo "Por favor instale Node.js desde: https://nodejs.org/"
    exit 1
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}Error: npm no está instalado${NC}"
    echo "Por favor instale npm"
    exit 1
fi

# Function to start MongoDB
start_mongodb() {
    echo -e "${YELLOW}Verificando MongoDB...${NC}"
    if ! docker ps | grep -q mongodb-sigma; then
        echo -e "${YELLOW}Iniciando contenedor MongoDB...${NC}"
        docker start mongodb-sigma
        sleep 3  # Wait for MongoDB to start
        if docker ps | grep -q mongodb-sigma; then
            echo -e "${GREEN}MongoDB iniciado correctamente${NC}"
        else
            echo -e "${RED}Error al iniciar MongoDB${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}MongoDB ya está en ejecución${NC}"
    fi
}

# Function to start backend
start_backend() {
    echo -e "${YELLOW}Iniciando backend...${NC}"
    cd bloqueo-digital-new-backend-v2 || exit
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependencias del backend..."
        npm install
    fi
    
    # Start backend
    npm start &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}Backend iniciado en http://localhost:12091${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "${YELLOW}Iniciando frontend...${NC}"
    cd bloquedo-front-v2 || exit
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependencias del frontend..."
        npm install
    fi
    
    # Start frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}Frontend iniciado en http://localhost:4200${NC}"
}

# Start all services
start_mongodb
start_backend
start_frontend

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Servicios iniciados:${NC}"
echo -e "MongoDB:  ${YELLOW}localhost:27018${NC}"
echo -e "Frontend: ${YELLOW}http://localhost:4200${NC}"
echo -e "Backend:  ${YELLOW}http://localhost:12091${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}Presione Ctrl+C para detener los servicios${NC}"

# Handle script termination
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' SIGINT SIGTERM

# Keep script running
wait 