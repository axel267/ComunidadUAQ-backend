-- Enums para los estados
CREATE TYPE nivel_urgencia AS ENUM ('BAJA', 'MEDIA', 'ALTA');
CREATE TYPE estado_moderacion AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');
CREATE TYPE estado_foro AS ENUM ('ABIERTA', 'CERRADA', 'RESUELTA');

-- Tablas independientes
CREATE TABLE Facultades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    abreviatura VARCHAR(50)
);

CREATE TABLE Roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    permisos JSONB
);

-- Usuarios
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    expediente VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    facultad_id INT REFERENCES Facultades(id),
    rol_id INT REFERENCES Roles(id),
    estado_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Avisos
CREATE TABLE Avisos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT,
    urgencia nivel_urgencia NOT NULL,
    imagenes_portada_url VARCHAR(255),
    facultad_id INT REFERENCES Facultades(id),
    autor_id INT REFERENCES Usuarios(id),
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_publicacion estado_moderacion DEFAULT 'PENDIENTE',
    observaciones_ia TEXT
);

-- Lecturas Avisos
CREATE TABLE Lecturas_Avisos (
    aviso_id INT REFERENCES Avisos(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES Usuarios(id) ON DELETE CASCADE,
    fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (aviso_id, usuario_id)
);

-- Foro Preguntas
CREATE TABLE Foro_Preguntas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT,
    imagenes_url VARCHAR(255),
    autor_id INT REFERENCES Usuarios(id),
    asignatura_id INT, -- Dejado como INT según el diagrama
    votos INT DEFAULT 0,
    estado estado_foro DEFAULT 'ABIERTA',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foro Respuestas
CREATE TABLE Foro_Respuestas (
    id SERIAL PRIMARY KEY,
    pregunta_id INT REFERENCES Foro_Preguntas(id) ON DELETE CASCADE,
    autor_id INT REFERENCES Usuarios(id),
    imagenes_url VARCHAR(255),
    contenido TEXT,
    es_verificada BOOLEAN DEFAULT FALSE,
    votos INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guias Tramites
CREATE TABLE Guias_Tramites (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    autor_id INT REFERENCES Usuarios(id),
    facultad_id INT REFERENCES Facultades(id),
    imagen_url VARCHAR(255)
);

-- Pasos Guia
CREATE TABLE Pasos_Guia (
    id SERIAL PRIMARY KEY,
    guia_id INT REFERENCES Guias_Tramites(id) ON DELETE CASCADE,
    orden_paso INT,
    imagenes_url VARCHAR(255),
    titulo_paso VARCHAR(255),
    descripcion_detallada TEXT,
    imagen_ilustrativa_url VARCHAR(255)
);

-- Datos semilla básicos para poder empezar
INSERT INTO Roles (nombre, permisos) VALUES 
('Administrador', '{"all": true}'),
('Estudiante', '{"read_avisos": true, "post_foro": true}');

INSERT INTO Facultades (nombre, abreviatura) VALUES 
('Facultad de Informática', 'FIF'),
('Facultad de Ingeniería', 'FI');
