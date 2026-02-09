-- Crear base de datos (ya se crea automáticamente por docker-compose, pero por si acaso)
CREATE DATABASE IF NOT EXISTS dentmed_db;
USE dentmed_db;

-- Tabla de ejemplo (pacientes) - Esto es solo una estructura inicial
CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo (opcional)
INSERT INTO pacientes (nombre, email, telefono, fecha_nacimiento) 
VALUES 
    ('Juan Pérez', 'juan@email.com', '12345678', '1985-05-15'),
    ('María García', 'maria@email.com', '87654321', '1990-08-22');

    -- Tabla de horarios de atención
CREATE TABLE IF NOT EXISTS horarios_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dia VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    es_feriado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--Tabla Horario
CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dia VARCHAR(20) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL
);
