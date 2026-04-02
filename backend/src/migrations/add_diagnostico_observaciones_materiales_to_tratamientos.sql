-- Migración: Agregar campos diagnostico, observaciones y materiales a la tabla Tratamientos
ALTER TABLE "Tratamientos"
ADD COLUMN diagnostico TEXT,
ADD COLUMN observaciones TEXT,
ADD COLUMN materiales TEXT; -- Se guardará como JSON.stringify(array) para materiales usados
