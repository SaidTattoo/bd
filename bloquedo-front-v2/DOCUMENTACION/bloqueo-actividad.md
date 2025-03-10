# Flujo de Bloqueo de Actividad

## Descripción General
El proceso de bloqueo de actividad es un flujo crítico que involucra múltiples validaciones y pasos secuenciales para garantizar la seguridad del proceso.

## Componentes Involucrados
- `ListActivityComponent`: Componente principal que lista las actividades
- `ActividadesComponent`: Componente de detalle de actividad
- `ValidacionComponent`: Modal de validación de usuario
- `ActivityService`: Servicio de gestión de actividades
- `TotemService`: Servicio de gestión de casilleros

## Flujo de Funciones

### 1. Validación Inicial de Bloqueo
```typescript
bloquearActividad() {
  // Validaciones previas:
  - Verifica existencia de equipos
  - Verifica validación de energía cero
  - Verifica valor de energía igual a 0
  - Verifica casillero seleccionado
```

### 2. Proceso de Validación de Usuario
```typescript
const dialogRef = this.dialog.open(ValidacionComponent);
dialogRef.afterClosed().subscribe(result => {
  // Procesa resultado de validación
});
```

### 3. Asignación de Equipos al Casillero
```typescript
totemService.assignLocker({
  equipos: activity.equipments.map(eq => eq._id),
  activityId: activity._id,
  status: 'abierto'
}, totemId, casilleroId);
```

### 4. Asignación de Dueño de Energía
```typescript
activityService.asignarDuenoDeEnergia(activityId, { userId: result.user._id });
```

## Secuencia de Eventos

1. **Inicio del Bloqueo**
   - Usuario hace clic en "Bloquear Actividad"
   - Se ejecutan validaciones iniciales

2. **Validaciones Previas**
   - Verificación de equipos (`activity.equipments.length > 0`)
   - Verificación de validación de energía cero (`activity.zeroEnergyValidation`)
   - Verificación de valor de energía (`zeroEnergyValidation.energyValue === 0`)
   - Verificación de casillero seleccionado (`selectedLocker`)

3. **Proceso de Validación**
   - Apertura del modal de validación
   - Captura de huella digital
   - Verificación de permisos del usuario

4. **Asignación de Equipos**
   - Mapeo de equipos
   - Asignación al casillero
   - Actualización de estado del casillero

5. **Finalización del Bloqueo**
   - Asignación de dueño de energía
   - Actualización de estado de la actividad
   - Actualización de UI
   - Mensaje de confirmación

## Estados de la Actividad

- **Pre-bloqueo**: Actividad normal con equipos asignados
- **Durante bloqueo**: Proceso de validación y asignación
- **Bloqueada**: Actividad con dueño de energía asignado y casillero ocupado

## Mensajes de Error

- "Debe agregar equipos a la actividad"
- "Debe validar la energía cero"
- "La energía debe ser igual a 0"
- "Debe seleccionar un casillero"
- "No se pudo bloquear la actividad"

## Consideraciones de Seguridad

- Solo usuarios autorizados pueden bloquear actividades
- Se requiere validación biométrica
- El proceso es irreversible hasta el desbloqueo
- Se mantiene registro de todas las operaciones 

## Proceso de Finalización de Actividad

### 1. Desbloqueo y Apertura de Casillero
```typescript
unlockActivity(activityId: string) {
  // 1. Validación de usuario mediante huella digital
  const dialogRef = this.dialog.open(ValidacionComponent);
  dialogRef.afterClosed().subscribe(result => {
    if(result.perfil === 'duenoDeEnergia') {
      // 2. Desbloqueo de actividad
      activityService.unlockActivity(activityId, result).subscribe({
        next: (response) => {
          // 3. Reinicio de estado de equipos
          resetEquipmentStatus();
          // 4. Limpieza del casillero
          clearLockerAfterUnlock();
          // 5. Actualización de UI
          refreshActivities();
        }
      });
    }
  });
}
```

### 2. Limpieza del Casillero
```typescript
clearLockerAfterUnlock(activityId: string) {
  // El casillero se limpia y vuelve a estado disponible:
  - Se eliminan todos los equipos asociados
  - Se cambia el estado a 'disponible'
  - Se elimina la referencia a la actividad
}
```

### 3. Reinicio de Estado de Equipos
```typescript
resetEquipmentStatus() {
  activity.equipments.forEach(equipment => {
    equipment.zeroEnergyValidated = false;
  });
}
```

### Secuencia de Finalización

1. **Inicio del Desbloqueo**
   - Usuario solicita desbloquear la actividad
   - Validación biométrica del dueño de energía

2. **Proceso de Desbloqueo**
   - Desbloqueo de la actividad en el sistema
   - Reinicio del estado de validación de energía de los equipos
   - Limpieza automática del casillero asociado

3. **Limpieza del Casillero**
   - Remoción de equipos del casillero
   - Cambio de estado a "disponible"
   - Eliminación de referencias a la actividad

4. **Actualización de Estados**
   - Los equipos vuelven a estado `zeroEnergyValidated = false`
   - El casillero queda completamente limpio y disponible
   - La actividad se marca como desbloqueada

5. **Validaciones Post-Finalización**
   - Verificación de limpieza exitosa del casillero
   - Confirmación de reinicio de estados de equipos
   - Actualización de registros en el sistema 