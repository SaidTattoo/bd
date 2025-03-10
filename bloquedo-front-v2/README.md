# Sistema de Gestión de Actividades y Casilleros

## Reglas de Negocio para Bloqueo de Actividades

### Validación de Energía Cero
1. No se puede validar energía cero si la actividad no tiene equipos asignados
2. La validación de energía cero debe ser igual a 0 para poder bloquear la actividad
3. La validación requiere autenticación del usuario y completar un cuestionario

### Gestión de Casilleros
1. Solo se puede tener un casillero abierto por actividad
2. El estado del casillero persiste entre recargas de página
3. Al bloquear la actividad, el casillero pasa automáticamente a estado "ocupado"
4. No se pueden abrir casilleros si la actividad está bloqueada
5. Los casilleros en mantenimiento no pueden ser seleccionados

### Bloqueo de Actividad
Para bloquear una actividad se deben cumplir todas estas condiciones:
1. La actividad debe tener equipos asignados
2. Debe existir una validación de energía cero
3. El valor de la validación de energía debe ser 0
4. Debe haber un casillero seleccionado y abierto
5. Se requiere autenticación del usuario

### Estados de los Casilleros
- **Disponible**: Casillero libre para ser utilizado
- **Abierto**: Casillero seleccionado y en uso
- **Ocupado**: Casillero con equipos asignados y actividad bloqueada
- **Mantenimiento**: Casillero no disponible para uso

### Flujo de Trabajo
1. Asignar equipos a la actividad
2. Seleccionar un casillero (pasa a estado "abierto")
3. Realizar validación de energía cero
4. Bloquear la actividad (casillero pasa a "ocupado")

### Restricciones Adicionales
- No se pueden modificar equipos cuando la actividad está bloqueada
- Solo se puede tener un casillero abierto a la vez
- La validación de energía cero es permanente una vez realizada
- Se requiere autenticación para todas las operaciones críticas
# db
