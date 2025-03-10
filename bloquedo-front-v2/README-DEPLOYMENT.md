# Guía de Despliegue para Red Local de Tótems

Esta guía explica cómo configurar el sistema de gestión de equipos en una red local donde los tótems estarán conectados por Ethernet sin acceso a Internet.

## Arquitectura del Sistema

- **Servidor Central**: Una máquina que ejecuta el servidor WebSocket principal
- **Tótems Clientes**: Dispositivos individuales que se conectan al servidor central
- **Red Local**: Todos los dispositivos conectados a través de Ethernet

## Requisitos

- Docker y Docker Compose instalados en todas las máquinas
- Red Ethernet configurada entre todos los dispositivos
- Conocimiento de las direcciones IP locales de cada dispositivo

## Paso 1: Configurar el Servidor Central

1. Clone este repositorio en la máquina que actuará como servidor central
2. Ejecute el servidor WebSocket:

```bash
docker-compose up -d
```

3. Verifique que el servidor esté funcionando correctamente:

```bash
docker logs sigma-socket-server
```

4. **Importante**: Anote la dirección IP local de este servidor (necesaria para configurar los tótems)

```bash
# En Windows
ipconfig

# En Linux
ip addr show
```

## Paso 2: Configurar cada Tótem Cliente

En cada uno de los dispositivos tótem:

1. Clone este repositorio
2. Cree un archivo `.env` con la siguiente configuración:

```
SOCKET_SERVER_IP=http://192.168.1.100:3003  # Reemplazar con la IP real del servidor central
TOTEM_ID=totem1                             # ID único para este tótem específico
LOCATION_NAME=Área1                         # Ubicación del tótem
```

3. Construya la aplicación Angular (si aún no lo ha hecho):

```bash
npm run build
```

4. Inicie el contenedor del tótem:

```bash
docker-compose -f docker-compose-totem.yml up -d
```

5. Verifique el funcionamiento del tótem:

```bash
docker logs sigma-totem
```

## Verificación del Sistema

Para verificar que todo el sistema está funcionando correctamente:

1. Abra un navegador en cualquier tótem y acceda a `http://localhost`
2. Debería ver la interfaz de usuario con información de conexión al servidor
3. En los logs del servidor central, debería ver los mensajes de conexión de los tótems

## Solución de Problemas

### Problemas de Conexión

Si un tótem no puede conectarse al servidor central:

1. Verifique que ambas máquinas estén en la misma red
2. Compruebe si la IP del servidor es accesible desde el tótem:
   ```bash
   ping 192.168.1.100  # Reemplazar con la IP real
   ```
3. Asegúrese de que el puerto 3003 esté abierto en el servidor:
   ```bash
   # En el servidor
   netstat -tulpn | grep 3003
   ```
4. Revise los logs del servidor para errores:
   ```bash
   docker logs sigma-socket-server
   ```

### Error "address already in use"

Si aparece el error "address already in use" (EADDRINUSE) en el servidor:

1. Identifique el proceso que usa el puerto:
   ```bash
   # En Windows
   netstat -ano | findstr 3003
   
   # En Linux
   sudo lsof -i :3003
   ```

2. Detenga el proceso o cambie el puerto en el archivo `docker-compose.yml`

## Notas Importantes

- Cada tótem debe tener un ID único (TOTEM_ID) para evitar conflictos
- El servidor central debe iniciarse antes que los tótems
- Si cambia la IP del servidor central, debe actualizar la configuración en todos los tótems
- En caso de reinicio del servidor, los tótems intentarán reconectarse automáticamente 