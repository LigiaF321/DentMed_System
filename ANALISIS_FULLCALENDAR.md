# Análisis Detallado de FullCalendar en DentMed System

## 📍 1. ARCHIVOS PRINCIPALES

### Componente Principal
- **[frontend/src/components/dentist/DentistDashboard.jsx](DentistDashboard.jsx)**
  - Componente raíz que implementa FullCalendar
  - ~1100 líneas de código
  - Gestiona citas, bloques y vista de calendario
  - Contiene la lógica de navegación y cambio de vista

### Componentes Secundarios
- **[frontend/src/components/dentist/AppointmentsList.jsx](AppointmentsList.jsx)**
  - Lista de citas del lado derecho del calendario
  - Muestra citas ordenadas por hora para la fecha seleccionada
  - Permite cancelar citas y cambiar consultorio

- **[frontend/src/components/dentist/NuevaCitaModal.jsx](NuevaCitaModal.jsx)**
  - Modal para crear nuevas citas
  - Vinculado a través de handleNuevaCitaCreada

### Servicios
- **[frontend/src/services/citas.service.js](citas.service.js)**
  - Endpoint: `GET /api/citas/dentista` - Obtiene citas del dentista
  - Endpoint: `PATCH /api/citas/{id}/cancelar` - Cancela cita
  - Endpoint: `PUT /api/citas/{id}/consultorio` - Cambia consultorio
  
- **bloquesService**
  - Endpoint: `GET /api/bloques/{dentistaId}` - Obtiene bloques de horario
  - Endpoint: `POST /api/bloques` - Crea nuevo bloqueo

---

## ⚙️ 2. CONFIGURACIÓN DEL CALENDARIO

### Plugins Utilizados
```javascript
plugins={[
  dayGridPlugin,        // Vista mes (dayGridMonth)
  timeGridPlugin,       // Vistas día/semana (timeGridDay, timeGridWeek)
  interactionPlugin,    // Interacción con eventos y fechas
  listPlugin            // Vista lista
]}
```

### Propiedades de Configuración

| Propiedad | Valor | Descripción |
|-----------|-------|-------------|
| `headerToolbar` | `false` | Toolbar personalizada (no usa la de FullCalendar) |
| `initialView` | `currentView` | Vista inicial (timeGridWeek) |
| `events` | `eventsToDisplay` | Array de eventos computado (citas + bloques) |
| `slotMinTime` | `startHour` | Hora de inicio (06:00-10:00 configurable) |
| `slotMaxTime` | `20:00:00` | Hora final (8 PM) |
| `allDaySlot` | `false` | Sin zona de "Todo el día" |
| `slotDuration` | `00:30:00` | Duración de slots: 30 minutos |
| `height` | `auto` | Alto automático |
| `contentHeight` | `450` | Alto del contenido |
| `locale` | `es` | Idioma español |
| `firstDay` | `1` | Semana comienza el lunes |

### Vistas Disponibles
- **DÍA** (`timeGridDay`) - Vista de un día completo
- **SEMANA** (`timeGridWeek`) - Vista de 7 días con horas
- **MES** (`dayGridMonth`) - Vista mensual

### Selector de Horas
Disponibles: `06:00`, `07:00`, `08:00`, `09:00`, `10:00`
- Permite ajustar la hora de inicio del calendario
- Útil para dentistas que abren a diferentes horas

---

## 📌 3. HANDLERS Y EVENTOS

### Eventos Implementados

#### ✅ `eventClick` - Click en evento
```javascript
const handleEventClick = (info) => {
  const isBloqueo = info.event.extendedProps.isBloqueo;
  setSelectedEvent(info.event);
  setShowModal(true);
  
  if (!isBloqueo) {
    const cita = citas.find((c) => String(c.id) === String(info.event.id));
    if (cita) handleSelectCita(cita);
  }
};
```
**Comportamiento:**
- Abre modal con detalles de cita o bloqueo
- Si es cita: también selecciona la cita en la agenda derecha
- Si es bloqueo: muestra modal de detalles del bloqueo

#### ✅ `dateClick` - Click en fecha
```javascript
const handleDateClick = (info) => {
  setAgendaDate(new Date(info.date));
};
```
**Comportamiento:**
- Cambia la fecha visualizada en la agenda (derecha)
- Actualiza la lista de citas para ese día

#### ❌ `eventDrop` - Drag & Drop
**ESTADO**: NO IMPLEMENTADO

No existe handler para `eventDrop`, por lo que:
- ✗ No se puede arrastrar citas a otras horas
- ✗ No se puede cambiar la hora de una cita directamente
- ✗ Los cambios requieren cancelar y crear nueva cita

---

## 📅 4. ESTRUCTURA DE DATOS DE EVENTOS

### Objeto Evento en FullCalendar
```javascript
{
  id: String(cita.id),                    // ID único
  title: obtenerPacienteNombre(cita),     // Nombre del paciente
  start: cita.fecha_hora,                 // ISO datetime
  end: obtenerFechaFin(cita),             // Hora fin calculada
  backgroundColor: estadoColores[estado].background,
  borderColor: estadoColores[estado].border,
  textColor: '#ffffff',
  extendedProps: {                        // Propiedades extendidas
    estado: estado,                       // confirmada, pendiente, etc.
    motivo: cita.motivo,                  // Razón de la cita
    paciente: cita.paciente,              // Objeto paciente completo
    isBloqueo: false                      // Indicador de bloqueo
  }
}
```

### Objeto Bloqueo en FullCalendar
```javascript
{
  id: `bloque-${bloque.id}`,
  title: `BLOQUEO: ${bloque.tipo.toUpperCase()}`,
  start: bloque.fecha_inicio,
  end: bloque.fecha_fin,
  className: 'event-bloqueo',
  backgroundColor: '#9b59b6',
  borderColor: '#8e44ad',
  textColor: '#ffffff',
  extendedProps: {
    isBloqueo: true,
    idOriginal: bloque.id,
    descripcion: bloque.descripcion,
    tipo: bloque.tipo
  }
}
```

### Transformación de Citas a Eventos
```javascript
const eventsToDisplay = useMemo(() => {
  const eventosCitas = (Array.isArray(citas) ? citas : [])
    .map((cita) => {
      const estado = normalizarEstado(cita.estado);
      return {
        // ... mapeo a evento
      };
    });

  const eventosBloques = (Array.isArray(bloques) ? bloques : [])
    .map((bloque) => ({ /* ... */ }));

  return [...eventosCitas, ...eventosBloques];
}, [citas, bloques]);
```

**Nota**: Usa `useMemo` para optimizar el cálculo

---

## 🎨 5. ESTRUCTURA VISUAL PARA DENTISTAS

### Layout Principal
```
┌─────────────────────────────────────────────────┐
│ TOPBAR (Nombre, Botones: Bloquear | Nueva Cita)│
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────═
│ METRIC CARDS (Citas Hoy | Vistos | Próxima | ...)│
└──────────────────────────────────────────────────┘

┌─────────────────────────────────┬───────────────┐
│  COLUMNA IZQUIERDA              │ COLUMNA DERECHA
│  (Flex: 2)                      │ (Flex: 1)
│                                 │
│ ┌──────────────────────────────┐│ ┌────────────┐
│ │ CONTROLES CALENDARIO         ││ │APPOINTMENTS
│ │ - Navegación (< HOY >)        ││ │ LIST
│ │ - Botones vista (DÍA|SEM|MES) ││ │ (para fecha
│ │ - Selector hora (06:00-10:00) ││ │  selecciona
│ │                              ││ │  da)
│ └──────────────────────────────┘│
│                                 │
│ ┌──────────────────────────────┐│ ┌────────────┐
│ │ CALENDARIO FULLCALENDAR      ││ │ODONTOGRAMA
│ │ - Eventos (citas + bloques)  ││ │
│ │ - Click = Modal detalles     ││ │
│ │ - 450px height               ││ │
│ └──────────────────────────────┘│ └────────────┘
│                                 │
│                                 │ ┌────────────┐
│                                 │ │PATIENT TABS
│                                 │ │ (Documentos
│                                 │ │  Historial)
│                                 │ └────────────┘
└─────────────────────────────────┴───────────────┘
```

### Componentes de la Columna Derecha
1. **AppointmentsList** - Lista de citas del día
2. **Odontograma** - Visualización de dientes
3. **PatientTabs** - Tabs con paciente seleccionado

### Vistas Disponibles en Sidebar
- **Agenda** (Actual) - Vista de calendario con citas
- **Mis Pacientes** - Buscar y seleccionar pacientes
- **Tratamientos** - Historial de tratamientos
- **Notas** - En desarrollo
- **Perfil** - En desarrollo
- **Configuración** - En desarrollo

---

## 🎨 6. ESTILOS Y COLORES

### Estados de Citas y Colores
```javascript
const estadoColores = {
  confirmada:    { bg: '#28a745', border: '#1e7e34', text: 'Confirmada' },
  completada:    { bg: '#6c757d', border: '#545b62', text: 'Completada' },
  cancelada:     { bg: '#dc3545', border: '#a71d2a', text: 'Cancelada' },
  reprogramada:  { bg: '#ffc107', border: '#e0a800', text: 'Reprogramada' },
  pendiente:     { bg: '#17a2b8', border: '#117a8b', text: 'Pendiente' },
  bloqueado:     { bg: '#9b59b6', border: '#8e44ad', text: 'Bloqueado' },
  programada:    { bg: '#2563eb', border: '#1d4ed8', text: 'Programada' }
};
```

### CSS del Evento Bloqueo
```css
.event-bloqueo {
  background-color: #9b59b6;
  background-image: linear-gradient(45deg, ...); /* Patrón rayado */
  background-size: 15px 15px;
  border: 1px solid #8e44ad;
  color: white;
  font-weight: bold;
}
```

---

## 🔄 7. FLUJOS DE DATOS

### Obtención de Citas
```
useEffect → fetch('/api/citas/dentista')
    ↓
setCitas() + calcularMetricas()
    ↓
Si es hoy: setSelectedCita() [primera cita no cancelada]
    ↓
eventsToDisplay (useMemo)
```

### Creación de Cita
```
NuevaCitaModal → handleNuevaCitaCreada()
    ↓
setCitas([...prev, nuevaCita])
    ↓
calendar.gotoDate() + changeView('timeGridDay')
```

### Cancelación de Cita
```
AppointmentsList → cancelarCita()
    ↓
setCitas() - cita cancelada
setSelectedEvent() - limpia modal
mostrarToast()
```

### Cambio de Consultorio
```
CambioConsultorioModal → handleCambio()
    ↓
validarCambio() [conflictos, estado consultorio]
    ↓
actualizarConsultorioCita()
    ↓
setCitas() - actualiza cita
mostrarToast()
```

---

## ⚡ 8. OPTIMIZACIONES

### useMemo para eventsToDisplay
```javascript
const eventsToDisplay = useMemo(() => {
  // Mapeo de citas a eventos
  // Mapeo de bloques a eventos
  return [...eventosCitas, ...eventosBloques];
}, [citas, bloques]); // Se recalcula solo si citas o bloques cambian
```

### Estados Derivados
- `ordenarCitasPorFecha()` - Ordena siempre al obtener
- `calcularMetricas()` - Recalcula cuando citas cambian
- `normalizarEstado()` - Normaliza estados para comparación

---

## 🐛 9. LIMITACIONES ACTUALES

### Sin Drag & Drop
- ❌ No hay `eventDrop` handler
- ❌ No se pueden rearrastrar eventos
- ❌ Los cambios de hora requieren cancelación + nueva cita

### Sin Validación Real-time
- ❌ Los eventos no se validan mientras se arrastran
- ❌ No hay preview de conflictos

### Sin Extensibilidad de Eventos
- ❌ No se puede redimensionar eventos
- ❌ No se puede editar en línea

---

## 📋 10. CHECKLIST DE CARACTERÍSTICAS IMPLEMENTADAS

| Característica | Estado | Ubicación |
|---|---|---|
| Cargar citas del API | ✅ | DentistDashboard.jsx:~660 |
| Mostrar en calendario | ✅ | FullCalendar component |
| Click en evento | ✅ | handleEventClick |
| Cambiar vista (día/semana/mes) | ✅ | handleViewChange |
| Navegar fechas (prev/next/today) | ✅ | handlePrev, handleNext, handleToday |
| Selector hora inicio | ✅ | startHour state + slotMinTime |
| Crear cita | ✅ | NuevaCitaModal |
| Cancelar cita | ✅ | AppointmentsList |
| Cambiar consultorio | ✅ | CambioConsultorioModal |
| Bloquear horario | ✅ | BloqueoModal |
| Drag & drop citas | ❌ | NO IMPLEMENTADO |
| Redimensionar eventos | ❌ | NO IMPLEMENTADO |
| Editar evento en línea | ❌ | NO IMPLEMENTADO |
| Crear evento con click+drag | ❌ | NO IMPLEMENTADO |

---

## 📚 REFERENCIAS

### Versión de FullCalendar: 6.1.20
- Plugins instalados:
  - @fullcalendar/daygrid
  - @fullcalendar/timegrid
  - @fullcalendar/interaction
  - @fullcalendar/list
  - @fullcalendar/react

### Documentación oficial
- https://fullcalendar.io/docs/react (versión 6.x)
- Para implementar eventDrop: https://fullcalendar.io/docs/eventDrop

