#!/bin/bash

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=3003

echo -e "${BLUE}Buscando procesos que estén usando el puerto ${PORT}...${NC}"

# Para Windows (Git Bash o similar)
if command -v netstat &> /dev/null && command -v findstr &> /dev/null; then
    echo "Ejecutando en Windows..."
    
    # Encontrar PID usando netstat
    pid=$(netstat -ano | findstr :${PORT} | findstr LISTENING | awk '{print $5}' | head -n 1)
    
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Proceso encontrado con PID: ${pid}${NC}"
        echo -e "${RED}¿Desea detener este proceso? (s/n)${NC}"
        read stop_process
        
        if [[ "$stop_process" == "s" || "$stop_process" == "S" ]]; then
            echo "Intentando detener el proceso..."
            taskkill /F /PID $pid
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Proceso detenido correctamente.${NC}"
            else
                echo -e "${RED}❌ Error al detener el proceso. Puede intentar cerrarlo manualmente desde el Administrador de tareas.${NC}"
            fi
        else
            echo "Operación cancelada."
        fi
    else
        echo -e "${GREEN}No se encontraron procesos escuchando en el puerto ${PORT}.${NC}"
        
        # Verificar si hay procesos intentando conectarse al puerto
        connecting_processes=$(netstat -ano | findstr :${PORT})
        if [ -n "$connecting_processes" ]; then
            echo -e "${YELLOW}Hay procesos intentando conectarse al puerto ${PORT}:${NC}"
            echo "$connecting_processes"
            
            echo -e "${YELLOW}Estos procesos pueden estar esperando a que el servidor esté disponible.${NC}"
        fi
    fi
    
# Para Linux/macOS
elif command -v lsof &> /dev/null; then
    echo "Ejecutando en Linux/macOS..."
    
    # Encontrar PID usando lsof
    pid=$(lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | head -n 1)
    
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Proceso encontrado con PID: ${pid}${NC}"
        echo -e "${RED}¿Desea detener este proceso? (s/n)${NC}"
        read stop_process
        
        if [[ "$stop_process" == "s" || "$stop_process" == "S" ]]; then
            echo "Intentando detener el proceso..."
            kill -9 $pid
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Proceso detenido correctamente.${NC}"
            else
                echo -e "${RED}❌ Error al detener el proceso.${NC}"
            fi
        else
            echo "Operación cancelada."
        fi
    else
        echo -e "${GREEN}No se encontraron procesos escuchando en el puerto ${PORT}.${NC}"
    fi
else
    echo -e "${RED}No se encontraron herramientas necesarias para buscar procesos (netstat, lsof).${NC}"
    exit 1
fi

echo
echo -e "${BLUE}Verificando si los contenedores Docker están usando el puerto...${NC}"

if command -v docker &> /dev/null; then
    # Comprobar si hay contenedores usando el puerto
    container=$(docker ps | grep :${PORT})
    
    if [ -n "$container" ]; then
        echo -e "${YELLOW}Contenedores Docker usando el puerto ${PORT}:${NC}"
        echo "$container"
        
        echo -e "${RED}¿Desea detener estos contenedores? (s/n)${NC}"
        read stop_containers
        
        if [[ "$stop_containers" == "s" || "$stop_containers" == "S" ]]; then
            docker-compose down
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Contenedores detenidos correctamente.${NC}"
            else
                echo -e "${RED}❌ Error al detener los contenedores.${NC}"
            fi
        else
            echo "Operación cancelada."
        fi
    else
        echo -e "${GREEN}No se encontraron contenedores Docker usando el puerto ${PORT}.${NC}"
    fi
else
    echo -e "${YELLOW}Docker no está disponible. No se pueden verificar los contenedores.${NC}"
fi

echo
echo -e "${BLUE}==============================================${NC}" 