-- Migración: Agregar campo estado a la tabla materiales
ALTER TABLE materiales ADD COLUMN estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo' AFTER costo_promedio;
