FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias incluyendo las de desarrollo
RUN npm install

# Copiar código fuente
COPY . .

# Puerto a exponer (este será el puerto que el servidor escuchará)
EXPOSE 3003

# Variables de entorno con valores por defecto
ENV PORT=3003
ENV HOST=0.0.0.0
ENV ALLOWED_ORIGINS=*
ENV NODE_ENV=development

# Comando para iniciar el servidor con Nodemon en desarrollo
CMD ["npm", "run", "dev"] 