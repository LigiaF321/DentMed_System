# 📅 Implementación: Drag & Drop para Reprogramación de Citas

## 🎯 Objetivo
Permitir que los dentistas puedan arrastrar y soltar citas en el calendario para reprogramarlas a otra fecha/hora, mostrando un modal de confirmación con motivo de reprogramación.

---

## ✅ Cambios Implementados

### 1️⃣ Backend (Node.js + Express)

#### Archivo: `backend/src/controllers/citas.controller.js`
**Nueva función:** `reprogramarCita`

```javascript
const reprogramarCita = async (req, res) => {
  // Parámetros:
  // - id: ID de la cita a reprogramar
  // - fecha: Nueva fecha (YYYY-MM-DD)
  // - hora: Nueva hora (HH:MM)
  // - duracion: Duración en minutos
  // - motivo_reprogramacion: Razón del cambio

  // Validaciones:
  // ✓ Cita existe y no está cancelada
  // ✓ Nueva fecha/hora no tiene bloqueos del dentista
  // ✓ No hay conflicto con otras citas
  // ✓ No hay conflicto con consultorio (si tiene asignado)
  
  // Actualiza:
  // - fecha_hora → nueva fecha/hora
  // - duracion_estimada → nueva duración
  // - estado → "Reprogramada"
  // - motivo → motivo de reprogramación
}
```

#### Archivo: `backend/src/routes/citas.routes.js`
**Nueva ruta:**
```
PATCH /citas/:id/reprogramar
Protegida: Requiere autenticación (Bearer token)
```

### 2️⃣ Frontend React + FullCalendar

#### Archivo: `frontend/src/components/dentist/ReprogramarCitaModal.jsx`
**Nuevo componente modal** con:
- Comparación visual: Cita Actual ↔ Nueva Programación
- Selector de motivo con predefinidos:
  1. Cambio de horario del paciente
  2. Cambio de disponibilidad del dentista
  3. Mantenimiento del consultorio
  4. Otra ubicación disponible
  5. Solicitud del paciente
  6. Cambio de duración estimada
  7. Otro

- Estados: confirmando, error, éxito
- Botones: Confirmar o Cancelar

#### Archivo: `frontend/src/components/styles/ReprogramarCitaModal.css`
Estilos modernos y responsive:
- Cards de información (actual vs nueva)
- Colores consistentes con el sistema
- Animaciones suaves
- Soporte para mobile

#### Modificaciones: `frontend/src/components/dentist/DentistDashboard.jsx`

**Importaciones agregadas:**
```javascript
import ReprogramarCitaModal from './ReprogramarCitaModal';
import { reprogramarCita } from '../../services/citas.service';
```

**Nuevos estados:**
```javascript
const [showReprogramarModal, setShowReprogramarModal] = useState(false);
const [reprogramarData, setReprogramarData] = useState({
  cita: null,
  nuevaFecha: null,
  nuevaHora: null,
});
```

**Handlers agregados:**
```javascript
const handleEventDrop = async (info) => {
  // Se dispara cuando se arrastra y suelta un evento
  // Valida que no sea un bloqueo
  // Extrae nueva fecha/hora
  // Muestra el modal de confirmación
}

const handleReprogramarConfirm = async (citaActualizada) => {
  // Se dispara al confirmar en el modal
  // Actualiza citas en el estado
  // Muestra notificación de éxito
}

const handleReprogramarCancel = () => {
  // Cancela el modal y limpia datos
}
```

**Propiedades de FullCalendar actualizadas:**
```javascript
editable={true}        // Habilita drag & drop
eventDrop={handleEventDrop}  // Manejador de drop
```

#### Archivo: `frontend/src/services/citas.service.js`
**Nueva función:**
```javascript
export const reprogramarCita = async (idCita, payload) => {
  // POST a /citas/{idCita}/reprogramar
  // Payload: { fecha, hora, duracion, motivo_reprogramacion }
}
```

---

## 🔄 Flujo de Ejecución

```
1. Usuario arrastra un evento en el calendario
          ↓
2. FullCalendar dispara eventDrop
          ↓
3. Validar que no sea un bloqueo
          ↓
4. Revertir cambio temporalmente
          ↓
5. Abrir ReprogramarCitaModal con datos
          ↓
6. Usuario selecciona motivo y confirma
          ↓
7. Enviar PATCH a /citas/:id/reprogramar
          ↓
8. Backend valida y actualiza cita
          ↓
9. Actualizar estado en frontend
          ↓
10. Mostrar notificación de éxito
          ↓
11. Calendario se actualiza automáticamente
```

---

## 📋 Especificaciones Técnicas

### Request Backend
```json
{
  "fecha": "2026-04-10",
  "hora": "10:30",
  "duracion": 30,
  "motivo_reprogramacion": "Cambio de horario del paciente"
}
```

### Response Backend (Success)
```json
{
  "ok": true,
  "message": "Cita reprogramada correctamente",
  "data": {
    "id": 123,
    "id_paciente": 456,
    "id_dentista": 789,
    "fecha_hora": "2026-04-10T10:30:00Z",
    "estado": "reprogramada",
    "motivo": "Cambio de horario del paciente",
    "duracion_estimada": 30,
    "paciente": {
      "id": 456,
      "nombre": "Juan Pérez"
    }
  }
}
```

---

## 🎨 Estados Visuales

| Estado | Color | Código |
|--------|-------|--------|
| Confirmada | Verde | #28a745 |
| Completada | Gris | #6c757d |
| Cancelada | Rojo | #dc3545 |
| Pendiente | Azul claro | #17a2b8 |
| Programada | Azul | #2563eb |
| **Reprogramada** | **Amarillo** | **#ffc107** |
| Bloqueado | Púrpura rayado | #9b59b6 |

---

## ⚠️ Validaciones Implementadas

### Backend
✓ Cita debe existir  
✓ Cita no debe estar cancelada  
✓ Nueva fecha/hora debe estar disponible  
✓ No puede haber bloqueos en la hora destino  
✓ No puede haber conflicto con otra cita  
✓ No puede haber conflicto en consultorio asignado  

### Frontend
✓ No permitir drag & drop de bloqueos  
✓ Motivo de reprogramación (selector o validación)  
✓ Mostrar errores del servidor  

---

## 🧪 Cómo Probar

### Paso 1: Iniciar Servidores
```bash
# Backend
cd backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm run dev
```

### Paso 2: Acceder como Dentista
- Login como dentista
- Ver el calendario con citas programadas

### Paso 3: Probar Drag & Drop
1. **Arrastrar** → Selecciona una cita en el calendario
2. **Soltar** → Arrastra a otra fecha/hora
3. **Modal** → Se debe mostrar ReprogramarCitaModal
4. **Confirmar** → Selecciona motivo y confirma
5. **Ver Resultado** → La cita debe estar reprogramada en el calendario

### Paso 4: Validar Errores
- Intentar soltar en hora bloqueada
- Intentar soltar en hora con otra cita
- Cancelar la reprogramación y verificar que no se actualiza

---

## 📞 Endpoints

### Crear Cita
```
POST /api/citas
Headers: Authorization: Bearer {token}
Body: { id_paciente, fecha, hora, duracion, motivo, id_consultorio? }
```

### Cancelar Cita
```
PATCH /api/citas/:id/cancelar
Headers: Authorization: Bearer {token}
```

### **Reprogramar Cita** (NUEVO)
```
PATCH /api/citas/:id/reprogramar
Headers: Authorization: Bearer {token}
Body: { fecha, hora, duracion, motivo_reprogramacion }
```

### Cambiar Consultorio Cita
```
PUT /api/citas/:id/consultorio
Headers: Authorization: Bearer {token}
Body: { id_consultorio }
```

---

## 🐛 Posibles Problemas y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| No se puede arrastrar | Editable no habilitado | Verificar `editable={true}` en FullCalendar |
| Modal no aparece | Evento es bloqueo | Backend no debe permitir drag de bloques |
| Error "Cita no encontrada" | ID incorrecto | Verificar que eventDrop use `event.id` correltamente |
| Validación falla | Bloqueos no de ese día | Backend busca bloqueos del día completo |

---

## 📌 Próximas Mejoras (Fase 2)

- [ ] Redimensionar eventos para cambiar duración
- [ ] Cancelación de cita (implementar UI en modal)
- [ ] Notificaciones al paciente cuando se reprograman
- [ ] Historial de cambios de citas
- [ ] Multi-select de citas para reprogramar múltiples
- [ ] Plantillas de razones de cambio personalizadas

