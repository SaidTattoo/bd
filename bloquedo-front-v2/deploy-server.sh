#!/bin/bash

# Script de despliegue para servidor central de WebSocket
# Uso: ./deploy-server.sh

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   DESPLIEGUE DE SERVIDOR CENTRAL    ${NC}"
echo -e "${BLUE}======================================${NC}"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado.${NC}"
    echo -e "Por favor instala Docker primero: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose no está instalado.${NC}"
    echo -e "Por favor instala Docker Compose primero: https://docs.docker.com/compose/install/"
    exit 1
fi

# Obtener la dirección IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}Configuración del servidor central:${NC}"
echo -e "  - Dirección IP: ${YELLOW}$SERVER_IP${NC}"
echo -e "  - Puerto WebSocket: ${YELLOW}3003${NC}"
echo ""

# Confirmar configuración
read -p "¿Es correcta esta configuración? (s/n): " confirm
if [[ $confirm != "s" && $confirm != "S" ]]; then
    echo -e "${YELLOW}Cancelando despliegue.${NC}"
    exit 0
fi

echo -e "${GREEN}Iniciando servidor central...${NC}"

# Detener contenedores existentes si los hay
docker-compose down websocket-server 2>/dev/null

# Iniciar solo el servicio del servidor WebSocket
docker-compose up -d websocket-server

echo -e "${GREEN}El servidor se ha iniciado correctamente.${NC}"
echo -e "Puedes ver los logs con: ${YELLOW}docker-compose logs -f websocket-server${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Servidor WebSocket disponible en: http://$SERVER_IP:3003${NC}"
echo -e "${BLUE}======================================${NC}"

echo -e "${YELLOW}IMPORTANTE: Utilice esta dirección IP ($SERVER_IP) al desplegar los tótems:${NC}"
echo -e "${YELLOW}./deploy-totem.sh $SERVER_IP [TOTEM_ID] [UBICACION]${NC}"

exit 0 