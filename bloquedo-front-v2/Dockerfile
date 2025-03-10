# Etapa de construcción
FROM node:18 as build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install --force

# Copia el resto de los archivos de la aplicación
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copia el archivo de configuración de NGINX personalizado
COPY nginx.conf /etc/nginx/nginx.conf

# Copia los archivos generados en el contenedor de build
COPY --from=build /app/dist/bloquedo-front-v2/browser /usr/share/nginx/html/

# Script para inyectar variables de entorno en tiempo de ejecución
COPY env-config.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/env-config.sh

# Exponer el puerto 80 para servir la aplicación
EXPOSE 80

# Comando para iniciar NGINX
CMD ["nginx", "-g", "daemon off;"]

# Variables de entorno para la configuración
ENV ENV_WEBSOCKET_URL=http://server:3003
ENV ENV_API_URL=http://backend:12091