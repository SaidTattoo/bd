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
echo "  CONFIGURACIÓN DEL SERVIDOR CENTRAL"
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

# Obtener la información de red
echo -e "${BLUE}Información de red:${NC}"

# Obtener direcciones IP
echo "Direcciones IP disponibles:"
ip_addresses=""

# Para Linux
if command -v ip &> /dev/null; then
    ip_addresses=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1')
# Para macOS
elif command -v ifconfig &> /dev/null; then
    ip_addresses=$(ifconfig | grep "inet " | grep -v '127.0.0.1' | awk '{print $2}')
# Para Windows usando ipconfig
elif command -v ipconfig &> /dev/null; then
    ip_addresses=$(ipconfig | grep -i "IPv4" | grep -oP '\d+(\.\d+){3}')
fi

if [ -z "$ip_addresses" ]; then
    echo -e "${YELLOW}⚠️ No se pudieron detectar direcciones IP automáticamente.${NC}"
    read -p "Introduzca manualmente la dirección IP de esta máquina: " manual_ip
    ip_addresses=$manual_ip
else
    # Mostrar direcciones IP disponibles
    i=1
    IFS=$'\n'
    for ip in $ip_addresses; do
        echo "  $i) $ip"
        i=$((i+1))
    done
    
    # Si hay más de una dirección IP, preguntar cuál usar
    ip_count=$(echo "$ip_addresses" | wc -l)
    if [ $ip_count -gt 1 ]; then
        echo -e "${YELLOW}Se detectaron múltiples direcciones IP. Por favor, seleccione la que usarán los tótems:${NC}"
        read -p "Seleccione el número (1-$ip_count): " ip_selection
        
        if [[ $ip_selection =~ ^[0-9]+$ ]] && [ $ip_selection -ge 1 ] && [ $ip_selection -le $ip_count ]; then
            selected_ip=$(echo "$ip_addresses" | sed -n "${ip_selection}p")
        else
            echo -e "${RED}❌ Selección inválida. Usando la primera dirección IP.${NC}"
            selected_ip=$(echo "$ip_addresses" | head -n 1)
        fi
    else
        selected_ip=$ip_addresses
    fi
    
    echo -e "${GREEN}✅ Usando dirección IP: $selected_ip${NC}"
fi

# Preguntar si se debe iniciar el servidor
echo
echo -e "${YELLOW}¿Desea iniciar el servidor ahora? (s/n)${NC}"
read start_now

if [[ "$start_now" == "s" || "$start_now" == "S" || "$start_now" == "y" || "$start_now" == "Y" ]]; then
    echo -e "${BLUE}Iniciando el servidor...${NC}"
    
    # Detener contenedores existentes
    docker-compose down
    
    # Iniciar servidor
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ El servidor se ha iniciado correctamente en http://$selected_ip:3003${NC}"
        echo
        echo -e "${YELLOW}====== INFORMACIÓN PARA TÓTEMS ======${NC}"
        echo -e "URL del servidor WebSocket: ${GREEN}http://$selected_ip:3003${NC}"
        echo -e "Use esta dirección para configurar los tótems cliente."
        echo -e "${YELLOW}===================================${NC}"
    else
        echo -e "${RED}❌ Error al iniciar el servidor.${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}Puede iniciar el servidor manualmente con:${NC}"
    echo -e "${YELLOW}docker-compose up -d${NC}"
fi

echo
echo -e "${GREEN}Configuración completada con éxito.${NC}"
echo -e "${BLUE}==============================================${NC}" 