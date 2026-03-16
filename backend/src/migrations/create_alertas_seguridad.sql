-- Crear tabla ALERTAS_SEGURIDAD
CREATE TABLE IF NOT EXISTS alertas_seguridad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_alerta ENUM('intentos_fallidos', 'acceso_fuera_horario', 'cuenta_bloqueada', 'ip_sospechosa', 'cambio_clave_inusual', 'nuevo_dispositivo') NOT NULL,
    prioridad ENUM('critica', 'advertencia', 'informativa') NOT NULL,
    descripcion TEXT NOT NULL,
    ip_origen VARCHAR(45),
    usuario_id INT,
    usuario_nombre VARCHAR(100),
    metadatos JSON,
    fecha_alerta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa', 'silenciada', 'revisada', 'resuelta') NOT NULL DEFAULT 'activa',
    silenciada_hasta DATETIME NULL,
    silenciada_por INT,
    justificacion_silencio TEXT,
    revisada_por INT,
    fecha_revision DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (silenciada_por) REFERENCES usuarios(id),
    FOREIGN KEY (revisada_por) REFERENCES usuarios(id)
);

-- Crear tabla CONFIGURACION_SEGURIDAD
CREATE TABLE IF NOT EXISTS configuracion_seguridad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(50) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    tipo_dato ENUM('entero', 'texto', 'json') NOT NULL,
    UNIQUE KEY unique_clave (clave)
);

-- Crear tabla INTENTOS_FALLIDOS
CREATE TABLE IF NOT EXISTS intentos_fallidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    usuario_intentado VARCHAR(100) NOT NULL,
    fecha_intento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado ENUM('fallido') NOT NULL DEFAULT 'fallido',
    INDEX idx_ip_fecha (ip, fecha_intento),
    INDEX idx_usuario_fecha (usuario_intentado, fecha_intento)
);

-- Crear tabla ACCESOS_USUARIO
CREATE TABLE IF NOT EXISTS accesos_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    fingerprint VARCHAR(255) NOT NULL,
    fecha_primer_acceso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE KEY unique_usuario_fingerprint (usuario_id, fingerprint),
    INDEX idx_usuario_ultimo (usuario_id, fecha_ultimo_acceso)
);