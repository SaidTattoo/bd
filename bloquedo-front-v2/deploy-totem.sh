#!/bin/bash

# Script de despliegue para tótems en red local
# Uso: ./deploy-totem.sh [SOCKET_SERVER_IP] [TOTEM_ID]

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}     DESPLIEGUE DE TÓTEM EN LAN      ${NC}"
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

# Configuración predeterminada
SOCKET_SERVER_IP=${1:-"localhost"}
TOTEM_ID=${2:-"totem-$(hostname | md5sum | head -c 6)"}
LOCATION_NAME=${3:-"$(hostname)"}

echo -e "${GREEN}Configuración del tótem:${NC}"
echo -e "  - Servidor WebSocket: ${YELLOW}http://$SOCKET_SERVER_IP:3003${NC}"
echo -e "  - ID del Tótem: ${YELLOW}$TOTEM_ID${NC}"
echo -e "  - Ubicación: ${YELLOW}$LOCATION_NAME${NC}"
echo ""

# Confirmar configuración
read -p "¿Es correcta esta configuración? (s/n): " confirm
if [[ $confirm != "s" && $confirm != "S" ]]; then
    echo -e "${YELLOW}Cancelando despliegue.${NC}"
    exit 0
fi

# Crear archivo de variables de entorno
echo "SOCKET_SERVER_IP=http://$SOCKET_SERVER_IP:3003" > .env
echo "TOTEM_ID=$TOTEM_ID" >> .env
echo "LOCATION_NAME=$LOCATION_NAME" >> .env

echo -e "${GREEN}Iniciando contenedor del tótem...${NC}"

# Detener contenedores existentes si los hay
docker-compose down 2>/dev/null

# Iniciar solo el servicio de tótem (no el servidor WebSocket)
docker-compose up -d totem-app

echo -e "${GREEN}El tótem se ha iniciado correctamente.${NC}"
echo -e "Puedes ver los logs con: ${YELLOW}docker-compose logs -f totem-app${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Accede a http://localhost${NC}"
echo -e "${BLUE}======================================${NC}"

exit 0 