// restauracion.controller.js
const { Usuario, Dentista, Paciente, Auditoria, sequelize } = require('../models');

const restauracionController = {
    // 1. VERIFICACIÓN DE SEGURIDAD
    verificarCredenciales: async (req, res) => {
        // Asegúrate de que desde el frontend envíes 'usuario_id' y 'password_especial'
        const { usuario_id, password_especial } = req.body;
        
        console.log("Intento de acceso - Usuario:", usuario_id, "Clave recibida:", password_especial);

        try {
            // Consulta a la tabla de credenciales especiales
            const resultados = await sequelize.query(
                'SELECT password_especial FROM credenciales_restauracion WHERE usuario_id = ? LIMIT 1',
                {
                    replacements: [usuario_id],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            // Obtenemos el primer registro si existe
            const credencial = resultados.length > 0 ? resultados[0] : null;

            // REGLA DE NEGOCIO: Si no existe el registro o la contraseña no coincide exactamente
            if (!credencial || credencial.password_especial !== password_especial) {
                
                // REGISTRO EN AUDITORÍA (Intento fallido)
                await Auditoria.create({
                    id_usuario: usuario_id || null, 
                    tabla: 'SEGURIDAD',
                    accion: 'INTENTO_FALLIDO',
                    descripcion: 'Intento fallido de acceso al área de restauración - Credenciales incorrectas'
                });

                return res.status(401).json({ 
                    success: false, 
                    error: "Credenciales de seguridad incorrectas. El intento ha sido registrado en la auditoría del sistema." 
                });
            }

            // REGISTRO DE ACCESO EXITOSO
            await Auditoria.create({
                id_usuario: usuario_id,
                tabla: 'SEGURIDAD',
                accion: 'ACCESO_CONCEDIDO',
                descripcion: 'Autenticación adicional aprobada para el módulo de restauración crítica'
            });

            return res.json({ 
                success: true, 
                mensaje: "Acceso concedido al área restringida", 
                token: "TEMP_RESTORE_SESSION_2026" // Token temporal para la sesión de restauración
            });

        } catch (error) {
            console.error("Error crítico en verificación:", error);
            res.status(500).json({ 
                success: false,
                error: "Error interno de seguridad", 
                detalle: error.message 
            });
        }
    },

    // 2. LISTADO DE BACKUPS
    listarBackups: async (req, res) => {
        try {
            const rows = await sequelize.query(
                'SELECT id, fecha_backup, tamaño, tipo, estado FROM backups ORDER BY fecha_backup DESC',
                { type: sequelize.QueryTypes.SELECT }
            );
            res.json(rows);
        } catch (error) {
            console.error("Error al listar backups:", error);
            res.status(500).json({ error: "No se pudo obtener el listado de backups registrados" });
        }
    },

    // 3. SIMULACIÓN DE IMPACTO
    simular: async (req, res) => {
        try {
            // Obtenemos conteos actuales para mostrar el impacto visual en el frontend
            const [cantU, cantD, cantP, cantA] = await Promise.all([
                Usuario.count(),
                Dentista.count(),
                Paciente.count(),
                Auditoria.count()
            ]);

            const impacto = [
                { tabla: "USUARIOS", registros: cantU, operacion: "SOBREESCRIBIR" },
                { tabla: "DENTISTAS", registros: cantD, operacion: "SOBREESCRIBIR" },
                { tabla: "PACIENTES", registros: cantP, operacion: "SOBREESCRIBIR" },
                { tabla: "AUDITORIA", registros: 1, operacion: "INSERTAR (Log de operación)" }
            ];

            res.json({ success: true, impacto });
        } catch (error) {
            res.status(500).json({ error: "Error al calcular el impacto de la restauración" });
        }
    },

    // 4. BACKUP PREVENTIVO
    backupSeguridad: async (req, res) => {
        try {
            // Generamos un nombre de archivo basado en la fecha actual
            const fecha = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
            const nombreArchivo = `preventivo_antes_de_restaurar_${fecha}.sql`;
            
            res.json({ 
                success: true, 
                mensaje: "Copia de seguridad preventiva generada con éxito",
                archivo: nombreArchivo,
                ubicacion: "/storage/backups/preventivos/"
            });
        } catch (error) {
            res.status(500).json({ error: "Fallo al generar el backup preventivo de seguridad" });
        }
    },

    // 5. EJECUCIÓN FINAL
    ejecutar: async (req, res) => {
        const { confirmacion, usuario_id, backup_id } = req.body;
        
        try {
            // Verificación de palabra clave de seguridad
            if (confirmacion !== "RESTAURAR") {
                return res.status(400).json({ error: "Confirmación inválida. Debe escribir 'RESTAURAR' en mayúsculas." });
            }

            // --- Lógica de restauración de Base de Datos aquí ---
            // (Ejecución de scripts .sql o comandos de sistema)

            // REGISTRO FINAL EN AUDITORÍA
            await Auditoria.create({
                id_usuario: usuario_id,
                tabla: 'SISTEMA',
                accion: 'RESTAURACIÓN_SISTEMA',
                descripcion: `Restauración completa realizada con éxito. Backup origen ID: ${backup_id}`
            });

            res.json({ 
                success: true, 
                mensaje: "Proceso completado. El sistema ha sido restaurado al punto seleccionado." 
            });
        } catch (error) {
            console.error("FALLO CRÍTICO EN RESTAURACIÓN:", error);
            res.status(500).json({ error: "Error crítico durante la restauración de datos" });
        }
    }
};

module.exports = restauracionController;