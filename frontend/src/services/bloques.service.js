import api from './api'; 
const bloquesService = {
    
    /**
     * Tarea F6 / B3: Crear un nuevo bloqueo de horario
     * @param {Object} datos - { id_dentista, tipo, fecha_inicio, fecha_fin, recurrencia, descripcion }
     * @returns {Promise<Object>} Respuesta del servidor con el nuevo bloque creado
     */
    crearBloqueo: async (datos) => {
        try {
            const response = await api.post('/bloques', datos);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * @param {Number|String} id_dentista - ID del dentista (Obligatorio)
     * @param {String} fecha_inicio - Formato YYYY-MM-DD (Opcional)
     * @param {String} fecha_fin - Formato YYYY-MM-DD (Opcional)
     * @returns {Promise<Object>} Arreglo de bloques activos
     */
    obtenerBloques: async (id_dentista, fecha_inicio = '', fecha_fin = '') => {
        try {
            // Construcción de Query Params tal cual pide la Tarea B2
            let url = `/bloques?id_dentista=${id_dentista}`;
            
            if (fecha_inicio) url += `&fecha_inicio=${fecha_inicio}`;
            if (fecha_fin) url += `&fecha_fin=${fecha_fin}`;

            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * @param {Number|String} id - ID del bloque a eliminar
     * @returns {Promise<Object>} Mensaje de confirmación
     */
    eliminarBloque: async (id) => {
        try {
            const response = await api.delete(`/bloques/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    verificarDisponibilidad: async (params) => {
        try {
            // params: { fecha, hora, duracion, id_dentista }
            const response = await api.get('/citas/verificar-disponibilidad', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default bloquesService;