#!/bin/bash

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "====================================="
echo "  CONFIGURACIÓN DE TÓTEM"
echo "  Sistema de Gestión de Equipos"
echo "====================================="
echo -e "${NC}"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado. Por favor, instale Docker antes de continuar.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado. Por favor, instale Docker Compose antes de continuar.${NC}"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ No se encontró archivo .env, creando uno nuevo...${NC}"
    touch .env
fi

# Solicitar información
echo -e "${BLUE}Por favor, proporcione la siguiente información:${NC}"

# IP del servidor
read -p "IP del servidor WebSocket (ej. 192.168.1.100): " server_ip
if [ -z "$server_ip" ]; then
    echo -e "${RED}❌ La IP del servidor es obligatoria.${NC}"
    exit 1
fi

# ID del tótem
read -p "ID único para este tótem [auto]: " totem_id
totem_id=${totem_id:-auto}

# Ubicación
read -p "Ubicación de este tótem [Sin ubicación]: " location
location=${location:-"Sin ubicación"}

# Configurar variables de entorno
echo "SOCKET_SERVER_IP=http://${server_ip}:3003" > .env
echo "TOTEM_ID=${totem_id}" >> .env
echo "LOCATION_NAME=${location}" >> .env

echo -e "${GREEN}✅ Archivo .env creado con éxito.${NC}"
cat .env

# Preguntar si se debe construir e iniciar el contenedor
echo
echo -e "${YELLOW}¿Desea iniciar el tótem ahora? (s/n)${NC}"
read start_now

if [[ "$start_now" == "s" || "$start_now" == "S" || "$start_now" == "y" || "$start_now" == "Y" ]]; then
    echo -e "${BLUE}Iniciando el tótem...${NC}"
    
    # Verificar si la carpeta dist existe
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}⚠️ La carpeta 'dist' no existe. ¿Desea construir la aplicación? (s/n)${NC}"
        read build_app
        
        if [[ "$build_app" == "s" || "$build_app" == "S" || "$build_app" == "y" || "$build_app" == "Y" ]]; then
            echo -e "${BLUE}Construyendo la aplicación...${NC}"
            npm install && npm run build
            
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ Error al construir la aplicación.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ No se puede iniciar el tótem sin la carpeta 'dist'.${NC}"
            exit 1
        fi
    fi
    
    # Iniciar contenedor
    docker-compose -f docker-compose-totem.yml down
    docker-compose -f docker-compose-totem.yml up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ El tótem se ha iniciado correctamente.${NC}"
        echo -e "${GREEN}✅ Puede acceder a la aplicación en http://localhost${NC}"
    else
        echo -e "${RED}❌ Error al iniciar el tótem.${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}Puede iniciar el tótem manualmente con:${NC}"
    echo -e "${YELLOW}docker-compose -f docker-compose-totem.yml up -d${NC}"
fi

echo
echo -e "${GREEN}Configuración completada con éxito.${NC}"
echo -e "${BLUE}==============================================${NC}" 