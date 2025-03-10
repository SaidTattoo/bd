#!/bin/sh

# Script para inyectar variables de entorno en la aplicación Angular
# Este script se ejecutará cuando se inicie el contenedor

# Crear archivo JavaScript con variables de entorno
CONFIG_FILE=/usr/share/nginx/html/env-config.js

echo "console.log('Cargando configuración de entorno...');" > $CONFIG_FILE
echo "window.ENV_API_URL = '${ENV_API_URL:-http://backend:12091}';" >> $CONFIG_FILE
echo "window.ENV_WEBSOCKET_URL = '${ENV_WEBSOCKET_URL:-http://server:3003}';" >> $CONFIG_FILE
echo "window.TOTEM_ID = '${TOTEM_ID:-}';" >> $CONFIG_FILE
echo "window.LOCATION_NAME = '${LOCATION_NAME:-Principal}';" >> $CONFIG_FILE

# Añadir el script al index.html
sed -i '/<head>/a\    <script src="env-config.js"></script>' /usr/share/nginx/html/index.html

# Mostrar la configuración aplicada
echo "Configuración del entorno aplicada:"
echo "- API URL: ${ENV_API_URL:-http://backend:12091}"
echo "- WebSocket URL: ${ENV_WEBSOCKET_URL:-http://server:3003}"
echo "- Tótem ID: ${TOTEM_ID:-No configurado}"
echo "- Ubicación: ${LOCATION_NAME:-Principal}"

exec "$@" 