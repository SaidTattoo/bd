#!/bin/sh

# Script para inyectar variables de entorno en la aplicación Angular
# Este script se ejecutará cuando se inicie el contenedor

# Crear archivo JavaScript con variables de entorno
CONFIG_FILE=/usr/share/nginx/html/env-config.js

# Asegurar que podemos acceder a los otros servicios
echo "Verificando conectividad con los servicios..."
echo "- Backend ($(ping -c 1 backend || echo 'No accesible'))"
echo "- WebSocket Server ($(ping -c 1 server || echo 'No accesible'))"

# Crear el archivo de configuración con las variables de entorno
echo "console.log('Cargando configuración de entorno...');" > $CONFIG_FILE
echo "window.ENV_API_URL = '${ENV_API_URL}';" >> $CONFIG_FILE
echo "window.ENV_WEBSOCKET_URL = '${ENV_WEBSOCKET_URL}';" >> $CONFIG_FILE
echo "window.TOTEM_ID = '${TOTEM_ID:-}';" >> $CONFIG_FILE
echo "window.LOCATION_NAME = '${LOCATION_NAME:-Principal}';" >> $CONFIG_FILE

# Añadir el script al index.html
sed -i '/<head>/a\    <script src="env-config.js"></script>' /usr/share/nginx/html/index.html

# Mostrar la configuración aplicada
echo "Configuración del entorno aplicada:"
echo "- API URL: ${ENV_API_URL}"
echo "- WebSocket URL: ${ENV_WEBSOCKET_URL}"
echo "- Tótem ID: ${TOTEM_ID:-No configurado}"
echo "- Ubicación: ${LOCATION_NAME:-Principal}"

# Añadir información de depuración al archivo de configuración
echo "/* DEBUG INFO */" >> $CONFIG_FILE
echo "console.log('API URL:', window.ENV_API_URL);" >> $CONFIG_FILE
echo "console.log('WebSocket URL:', window.ENV_WEBSOCKET_URL);" >> $CONFIG_FILE
echo "console.log('Tótem ID:', window.TOTEM_ID);" >> $CONFIG_FILE

exec "$@" 