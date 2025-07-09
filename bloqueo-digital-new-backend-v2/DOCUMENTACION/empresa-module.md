# Módulo de Empresa - Sistema de Bloqueo Digital

## Descripción

El módulo de empresa implementa un sistema completo de gestión de empresas siguiendo las mejores prácticas de Clean Code y principios SOLID. Incluye CRUD completo, validaciones, paginación, filtros y estadísticas.

## Estructura del Módulo

```
src/empresa/
├── empresa.types.ts      # Tipos, interfaces y DTOs
├── empresa.model.ts      # Modelo de Mongoose con validaciones
├── empresa.service.ts    # Lógica de negocio
├── empresa.controller.ts # Controladores HTTP
├── empresa.routes.ts     # Definición de rutas
└── index.ts             # Exportaciones del módulo
```

## Características Principales

### 🔧 Funcionalidades

- ✅ CRUD completo de empresas
- ✅ Validación de RUT chileno
- ✅ Paginación y filtros avanzados
- ✅ Búsqueda por múltiples campos
- ✅ Gestión de estados (activa, inactiva, suspendida)
- ✅ Validación de datos con mensajes descriptivos
- ✅ Soft delete para eliminación segura
- ✅ Estadísticas y métricas
- ✅ Documentación Swagger completa

### 🏗️ Arquitectura

- **Separación de responsabilidades**: Controlador, Servicio, Modelo
- **Principios SOLID**: Cada clase tiene una responsabilidad específica
- **Clean Code**: Código limpio y legible
- **Validaciones robustas**: Validación en modelo y servicio
- **Manejo de errores**: Gestión centralizada de errores
- **DTOs tipados**: Interfaces claras para requests/responses

## Endpoints Disponibles

### Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/empresas` | Crear nueva empresa |
| `GET` | `/empresas` | Obtener todas las empresas (paginado) |
| `GET` | `/empresas/:id` | Obtener empresa por ID |
| `GET` | `/empresas/rut/:rut` | Obtener empresa por RUT |
| `PUT` | `/empresas/:id` | Actualizar empresa |
| `DELETE` | `/empresas/:id` | Eliminar empresa (soft delete) |
| `PATCH` | `/empresas/:id/status` | Cambiar estado de empresa |

### Endpoints Adicionales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/empresas/search` | Búsqueda simplificada |
| `GET` | `/empresas/stats` | Estadísticas de empresas |
| `GET` | `/empresas/sector/:sector` | Obtener empresas por sector |
| `GET` | `/empresas/:id/exists` | Verificar existencia |
| `GET` | `/empresas/:id/employees/count` | Contar empleados |

## Ejemplos de Uso

### 1. Crear una Empresa

```bash
POST /empresas
Content-Type: application/json

{
  "nombre": "Empresa Ejemplo SA",
  "rut": "12345678-9",
  "razonSocial": "Empresa Ejemplo Sociedad Anónima",
  "sector": "tecnologia",
  "descripcion": "Empresa de desarrollo de software",
  "direccion": {
    "calle": "Av. Providencia",
    "numero": "1234",
    "ciudad": "Santiago",
    "region": "Metropolitana",
    "codigoPostal": "7500000",
    "pais": "Chile"
  },
  "contactoPrincipal": {
    "nombre": "Juan Pérez",
    "cargo": "Gerente General",
    "email": "juan.perez@empresa.cl",
    "telefono": "+56912345678"
  },
  "telefono": "+56912345678",
  "email": "contacto@empresa.cl",
  "sitioWeb": "https://empresa.cl",
  "numeroEmpleados": 50,
  "certificaciones": ["ISO 9001", "ISO 27001"]
}
```

### 2. Obtener Empresas con Filtros

```bash
GET /empresas?page=1&limit=10&sector=tecnologia&status=activa&search=software&sortBy=nombre&sortOrder=asc
```

### 3. Actualizar Estado de Empresa

```bash
PATCH /empresas/507f1f77bcf86cd799439011/status
Content-Type: application/json

{
  "status": "suspendida"
}
```

### 4. Buscar Empresas

```bash
GET /empresas/search?q=tecnologia
```

### 5. Obtener Estadísticas

```bash
GET /empresas/stats
```

**Respuesta:**
```json
{
  "mensaje": "Estadísticas obtenidas exitosamente",
  "data": {
    "totalEmpresas": 150,
    "empresasActivas": 130,
    "empresasInactivas": 15,
    "empresasSuspendidas": 5,
    "empresasPorSector": {
      "tecnologia": 45,
      "mineria": 30,
      "construccion": 25,
      "servicios": 20,
      "manufactura": 15,
      "energia": 10,
      "salud": 5
    },
    "totalEmpleados": 5000
  }
}
```

## Validaciones

### Validaciones de Campos

- **RUT**: Formato válido (12345678-9) y dígito verificador correcto
- **Email**: Formato válido de email
- **Teléfono**: Formato internacional válido
- **Sector**: Debe ser uno de los sectores predefinidos
- **Estado**: Debe ser activa, inactiva o suspendida
- **Nombre**: Mínimo 2 caracteres, máximo 200
- **Sitio Web**: Formato de URL válido
- **Logo**: URL de imagen válida

### Validaciones de Negocio

- **RUT único**: No puede existir otra empresa con el mismo RUT
- **Email único**: No puede existir otra empresa con el mismo email
- **Máximo contactos**: Hasta 10 contactos adicionales
- **Máximo certificaciones**: Hasta 20 certificaciones
- **Fecha fundación**: No puede ser futura

## Estructura de Respuestas

### Respuesta Exitosa

```json
{
  "mensaje": "Operación realizada exitosamente",
  "data": {
    // Datos de la empresa o resultado
  }
}
```

### Respuesta con Paginación

```json
{
  "mensaje": "Empresas obtenidas exitosamente",
  "data": {
    "empresas": [...],
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Respuesta de Error

```json
{
  "error": "Error al crear empresa",
  "mensaje": "Ya existe una empresa con este RUT"
}
```

## Integración con Swagger

El módulo incluye documentación completa de Swagger accesible en `/api-docs`. Incluye:

- Esquemas de datos completos
- Descripción de todos los endpoints
- Ejemplos de requests y responses
- Códigos de estado HTTP
- Parámetros de consulta y rutas

## Uso en Código

### Importar el Módulo

```typescript
import { 
  EmpresaService, 
  Empresa, 
  CreateEmpresaDTO, 
  UpdateEmpresaDTO 
} from './empresa';
```

### Usar el Servicio

```typescript
const empresaService = new EmpresaService();

// Crear empresa
const nuevaEmpresa = await empresaService.create(empresaData);

// Obtener con filtros
const empresas = await empresaService.findAll({ 
  sector: 'tecnologia', 
  status: 'activa' 
});

// Obtener por ID
const empresa = await empresaService.findById(id);
```

## Principios Implementados

### Clean Code
- Nombres descriptivos y significativos
- Funciones pequeñas y especializadas
- Comentarios donde es necesario
- Código autoexplicativo

### SOLID
- **S**ingle Responsibility: Cada clase tiene una responsabilidad
- **O**pen/Closed: Extensible sin modificar código existente
- **L**iskov Substitution: Interfaces bien definidas
- **I**nterface Segregation: Interfaces específicas y pequeñas
- **D**ependency Inversion: Dependencias abstraídas

### Beneficios
- Código mantenible y escalable
- Fácil testing y debugging
- Separación clara de responsabilidades
- Reutilización de código
- Documentación automática

## Consideraciones de Seguridad

- Validación de entrada en múltiples capas
- Sanitización de datos
- Soft delete para auditoria
- Validación de tipos TypeScript
- Manejo seguro de errores (sin exposición de detalles internos)

## Rendimiento

- Índices de MongoDB optimizados
- Consultas paginadas
- Agregaciones eficientes para estadísticas
- Validaciones en el modelo para evitar consultas innecesarias

## Extensibilidad

El módulo está diseñado para ser fácilmente extensible:

- Agregar nuevos campos al modelo
- Implementar nuevos endpoints
- Agregar validaciones personalizadas
- Integrar con otros módulos
- Implementar cache o logging 