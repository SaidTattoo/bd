#!/bin/sh

# Script que genera el archivo de configuración con variables de entorno en tiempo de ejecución

# Ubicación del archivo a modificar
CONFIG_FILE="/usr/share/nginx/html/env-config.js"

# Crear el archivo de configuración
echo "window.ENV_WEBSOCKET_URL = '${ENV_WEBSOCKET_URL}';" > $CONFIG_FILE
echo "window.ENV_API_URL = '${ENV_API_URL}';" >> $CONFIG_FILE
echo "window.TOTEM_ID = '${TOTEM_ID:-}';" >> $CONFIG_FILE
echo "window.LOCATION_NAME = '${LOCATION_NAME:-}';" >> $CONFIG_FILE

echo "Variables de entorno inyectadas en $CONFIG_FILE:"
echo "- WebSocket URL: ${ENV_WEBSOCKET_URL}"
echo "- API URL: ${ENV_API_URL}"
echo "- Tótem ID: ${TOTEM_ID:-No configurado}"
echo "- Ubicación: ${LOCATION_NAME:-No configurada}"

# Asegurarse de que el archivo tiene los permisos correctos
chmod 644 $CONFIG_FILE

exit 0 