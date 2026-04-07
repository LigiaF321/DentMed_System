-- Agregar columna notificar_paciente a la tabla citas
ALTER TABLE citas 
ADD COLUMN notificar_paciente BOOLEAN NOT NULL DEFAULT TRUE AFTER duracion_estimada;
