// Datos mockeados para desarrollo frontend
export const mockAlerts = [
  {
    id: 1,
    tipo_alerta: 'intentos_fallidos',
    prioridad: 'critica',
    descripcion: '8 intentos fallidos desde IP 192.168.1.45',
    detalle: 'Usuarios intentados: admin, doctor01, doctor05',
    ip_origen: '192.168.1.45',
    usuario_id: null,
    usuario_nombre: null,
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 15 * 60000), // Hace 15 min
    estado: 'activa',
    silenciada_hasta: null,
    silenciada_por: null,
    justificacion_silencio: null,
    metadatos: {
      usuarios: ['admin', 'doctor01', 'doctor05'],
      total: 8,
      ventana_minutos: 15,
    },
  },
  {
    id: 2,
    tipo_alerta: 'acceso_fuera_horario',
    prioridad: 'advertencia',
    descripcion: 'Usuario doctor05 accedió fuera de horario laboral',
    detalle: 'Acceso a las 02:15 AM (Horario normal: 8:00 AM - 8:00 PM)',
    ip_origen: '10.0.0.45',
    usuario_id: 5,
    usuario_nombre: 'Dr. Carlos López',
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 45 * 60000), // Hace 45 min
    estado: 'activa',
    silenciada_hasta: null,
    silenciada_por: null,
    justificacion_silencio: null,
    metadatos: {
      hora_acceso: '02:15',
      horario_normal: '08:00-20:00',
      primer_acceso_fuera_horario: true,
    },
  },
  {
    id: 3,
    tipo_alerta: 'cuenta_bloqueada',
    prioridad: 'advertencia',
    descripcion: 'Cuenta usuario carlos.d bloqueada por intentos fallidos',
    detalle: 'Bloqueado hasta 2026-02-22 09:20 AM por 5 intentos fallidos',
    ip_origen: '192.168.1.78',
    usuario_id: 3,
    usuario_nombre: 'carlos.d',
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 90 * 60000), // Hace 90 min
    estado: 'activa',
    silenciada_hasta: null,
    silenciada_por: null,
    justificacion_silencio: null,
    metadatos: {
      intentos: 5,
      duracion_bloqueo: '24 horas',
      bloqueado_hasta: new Date(Date.now() + 24 * 3600000),
    },
  },
  {
    id: 4,
    tipo_alerta: 'ip_sospechosa',
    prioridad: 'advertencia',
    descripcion: 'IP 10.0.0.87 con múltiples intentos fallidos',
    detalle: 'Intentó acceder a 3 usuarios diferentes: admin, admin2, root',
    ip_origen: '10.0.0.87',
    usuario_id: null,
    usuario_nombre: null,
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 120 * 60000), // Hace 2 horas
    estado: 'silenciada',
    silenciada_hasta: new Date(Date.now() + 24 * 3600000),
    silenciada_por: 1,
    justificacion_silencio: 'IP de proveedor externo autorizado',
    metadatos: {
      usuarios: ['admin', 'admin2', 'root'],
      total_intentos: 5,
      ventana_minutos: 5,
    },
  },
  {
    id: 5,
    tipo_alerta: 'cambio_clave_inusual',
    prioridad: 'advertencia',
    descripcion: 'Usuario maria.l realizó 2 cambios de contraseña en 1 hora',
    detalle: 'Posible robo de cuenta o cambio forzado',
    ip_origen: '10.0.0.132',
    usuario_id: 6,
    usuario_nombre: 'Dra. María López',
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 180 * 60000), // Hace 3 horas
    estado: 'revisada',
    silenciada_hasta: null,
    silenciada_por: null,
    justificacion_silencio: null,
    metadatos: {
      cambios_en_periodo: 2,
      periodo_horas: 1,
      hora_primer_cambio: '15:30',
      hora_segundo_cambio: '16:15',
    },
  },
  {
    id: 6,
    tipo_alerta: 'nuevo_dispositivo',
    prioridad: 'informativa',
    descripcion: 'Usuario ana.g accedió desde nuevo dispositivo',
    detalle: 'IP: 10.0.0.132 | Navegador: Chrome 121 | SO: Windows 11',
    ip_origen: '10.0.0.132',
    usuario_id: 7,
    usuario_nombre: 'Dra. Ana González',
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 200 * 60000), // Hace ~3.3 horas
    estado: 'activa',
    silenciada_hasta: null,
    silenciada_por: null,
    justificacion_silencio: null,
    metadatos: {
      navegador: 'Chrome 121',
      sistema_operativo: 'Windows 11',
      primer_acceso_dispositivo: true,
    },
  },
  {
    id: 7,
    tipo_alerta: 'intentos_fallidos',
    prioridad: 'critica',
    descripcion: '12 intentos fallidos desde IP 172.16.0.50',
    detalle: 'Intentos concentrados en últimos 5 minutos',
    ip_origen: '172.16.0.50',
    usuario_id: null,
    usuario_nombre: null,
    foto_usuario: null,
    fecha_alerta: new Date(Date.now() - 240 * 60000), // Hace 4 horas
    estado: 'resuelta',
    silenciada_hasta: null,
    silenciada_por: null,
    justificacion_silencio: null,
    metadatos: {
      usuarios: ['admin', 'dentista01', 'paciente02', 'asistente'],
      total: 12,
      ventana_minutos: 5,
    },
  },
];

export const mockConfiguracion = {
  id: 1,
  intentos_fallidos_umbral: 5,
  ventana_minutos: 10,
  bloqueo_intentos: 3,
  hora_inicio: 8,
  hora_fin: 20,
  dias_laborales: [1, 2, 3, 4, 5], // Lunes a Viernes (0-6, donde 0 es Domingo)
  ip_sospechosa_umbral: 3,
  cambios_clave_umbral: 2,
  ventana_cambios_clave_horas: 1,
  enviar_email_criticas: true,
  enviar_reporte_semanal: true,
  mostrar_notificaciones_dashboard: true,
  correos_adicionales: 'supervisor@dentmed.com, seguridad@dentmed.com',
};

export const mockResumen = {
  total_criticas: 2,
  total_advertencias: 4,
  total_informativas: 1,
  alertas_hoy: 7,
  alertas_semana: 24,
  ultimas_alertas: mockAlerts.slice(0, 5),
};

export const mockReporteSemanal = {
  periodo: {
    inicio: new Date(2026, 1, 15), // 15 febrero
    fin: new Date(2026, 1, 21),    // 21 febrero
  },
  resumen: {
    total_alertas: 47,
    criticas: 8,
    advertencias: 32,
    informativas: 7,
  },
  estadisticas: {
    ips_top: [
      { ip: '192.168.1.45', intentos: 15 },
      { ip: '10.0.0.87', intentos: 9 },
      { ip: '172.16.0.50', intentos: 8 },
      { ip: '10.0.0.132', intentos: 6 },
      { ip: '192.168.2.10', intentos: 5 },
    ],
    accesos_fuera_horario: [
      { usuario: 'doctor05', accesos: 3, horas: ['02:15', '03:30', '01:45'] },
      { usuario: 'asistente01', accesos: 2, horas: ['21:30', '22:00'] },
    ],
    nuevos_dispositivos: 5,
    cuentas_bloqueadas: 2,
  },
  por_dia: [
    { dia: 'Lun 15', alertas: 8 },
    { dia: 'Mar 16', alertas: 7 },
    { dia: 'Mié 17', alertas: 6 },
    { dia: 'Jue 18', alertas: 9 },
    { dia: 'Vie 19', alertas: 11 },
    { dia: 'Sáb 20', alertas: 4 },
    { dia: 'Dom 21', alertas: 2 },
  ],
};
