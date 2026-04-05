CREATE TABLE IF NOT EXISTS equipos_consultorio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_consultorio INT NOT NULL,
  nombre_equipo VARCHAR(100) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'disponible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_equipos_consultorio_consultorio
    FOREIGN KEY (id_consultorio) REFERENCES consultorios(id)
    ON DELETE CASCADE
);