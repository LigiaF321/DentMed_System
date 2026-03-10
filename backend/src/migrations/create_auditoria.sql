-- Migración SQL para tabla auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fecha_hora DATETIME NOT NULL,
  usuario_id INT NULL,
  usuario_nombre VARCHAR(100) NOT NULL,
  usuario_rol ENUM('admin','dentista','sistema') NOT NULL,
  accion VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  resultado ENUM('exito','fallido','bloqueado','advertencia') NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  detalle TEXT NULL,
  metadatos JSON NULL,
  session_id VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha_hora),
  INDEX idx_usuario (usuario_id, fecha_hora),
  INDEX idx_accion (accion, fecha_hora),
  INDEX idx_modulo (modulo, fecha_hora),
  INDEX idx_ip (ip, fecha_hora),
  INDEX idx_busqueda (usuario_nombre, accion, modulo)
);
