-- Migración SQL para tabla auditoria_cambios
CREATE TABLE IF NOT EXISTS auditoria_cambios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id BIGINT NOT NULL,
  tabla_afectada VARCHAR(50) NOT NULL,
  registro_id INT NOT NULL,
  campo VARCHAR(50) NOT NULL,
  valor_anterior TEXT NULL,
  valor_nuevo TEXT NULL,
  FOREIGN KEY (auditoria_id) REFERENCES auditoria(id)
);
