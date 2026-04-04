import React, { useEffect, useRef, useState } from 'react';
import {
  listarDocumentosPaciente,
  subirDocumentoPaciente,
  eliminarDocumento,
  descargarDocumento,
  obtenerUrlDocumento,
} from '../../services/documentos.service';
import VisualizadorDocumentos from './VisualizadorDocumentos';
import ConfirmDialog from './ConfirmDialog';
import './DocumentosTab.css';

const TIPOS_DOCUMENTO = [
  { value: 'todos', label: 'Todos' },
  { value: 'radiografia', label: 'Radiografías' },
  { value: 'presupuesto', label: 'Presupuestos' },
  { value: 'consentimiento', label: 'Consentimientos' },
  { value: 'otro', label: 'Otros' },
];

const obtenerPacienteId = (paciente) => {
  if (!paciente) return null;

  if (paciente.id_paciente && !Number.isNaN(Number(paciente.id_paciente))) {
    return Number(paciente.id_paciente);
  }

  if (paciente.paciente?.id && !Number.isNaN(Number(paciente.paciente.id))) {
    return Number(paciente.paciente.id);
  }

  if (paciente.Paciente?.id && !Number.isNaN(Number(paciente.Paciente.id))) {
    return Number(paciente.Paciente.id);
  }

  if (paciente.pacienteId && !Number.isNaN(Number(paciente.pacienteId))) {
    return Number(paciente.pacienteId);
  }

  if (paciente.idPaciente && !Number.isNaN(Number(paciente.idPaciente))) {
    return Number(paciente.idPaciente);
  }

  if (paciente.id && !Number.isNaN(Number(paciente.id))) {
    return Number(paciente.id);
  }

  return null;
};

const obtenerNombrePaciente = (paciente, pacienteId) => {
  if (!paciente) return 'Paciente seleccionado';

  const nombre =
    paciente.nombre_completo ||
    paciente.nombre ||
    paciente.paciente?.nombre_completo ||
    paciente.paciente?.nombre ||
    paciente.Paciente?.nombre_completo ||
    paciente.Paciente?.nombre ||
    '';

  const apellido =
    paciente.apellido ||
    paciente.paciente?.apellido ||
    paciente.Paciente?.apellido ||
    '';

  if (nombre && apellido) return `${nombre} ${apellido}`;
  if (nombre) return nombre;

  return pacienteId ? `Paciente #${pacienteId}` : 'Paciente seleccionado';
};

const normalizarTipo = (tipo) => String(tipo || '').trim().toLowerCase();
const esImagen = (mimeType = '') => mimeType.startsWith('image/');
const esPdf = (mimeType = '') => mimeType === 'application/pdf';

const DocumentosTab = ({ paciente }) => {
  const pacienteId = obtenerPacienteId(paciente);
  const nombrePaciente = obtenerNombrePaciente(paciente, pacienteId);

  const inputFileRef = useRef(null);

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const [tipoSubida, setTipoSubida] = useState('radiografia');
  const [etiquetasInput, setEtiquetasInput] = useState('');

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const limpiarMensajes = () => {
    setMensaje('');
    setError('');
  };

  const parsearEtiquetas = (texto) =>
    String(texto || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const cargarDocumentos = async () => {
    if (pacienteId === null || Number.isNaN(pacienteId)) {
      setDocumentos([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const respuesta = await listarDocumentosPaciente(pacienteId, {
        tipo: tipoFiltro === 'todos' ? '' : tipoFiltro,
        q: busqueda.trim(),
      });

      const docs = Array.isArray(respuesta?.data) ? respuesta.data : [];

      setDocumentos(
        docs.map((doc) => ({
          ...doc,
          tipo_documento: normalizarTipo(doc.tipo_documento),
        }))
      );
    } catch (err) {
      console.error('Error cargando documentos:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'No se pudieron cargar los documentos'
      );
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pacienteId === null || Number.isNaN(pacienteId)) return;
    cargarDocumentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  useEffect(() => {
    if (pacienteId === null || Number.isNaN(pacienteId)) return;

    const timer = setTimeout(() => {
      cargarDocumentos();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFiltro, busqueda, pacienteId]);

  const procesarArchivo = async (archivo) => {
    if (!archivo) {
      setError('No se recibió ningún archivo');
      return;
    }

    if (pacienteId === null || Number.isNaN(pacienteId)) {
      setError('No hay un paciente válido seleccionado');
      return;
    }

    try {
      limpiarMensajes();
      setSubiendo(true);

      const etiquetas = parsearEtiquetas(etiquetasInput);

      await subirDocumentoPaciente(pacienteId, {
        archivo,
        tipo_documento: tipoSubida,
        etiquetas,
      });

      setMensaje('Documento subido correctamente');
      await cargarDocumentos();

      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
    } catch (err) {
      console.error('Error subiendo documento:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Error al subir documento'
      );
    } finally {
      setSubiendo(false);
      setDragActive(false);
    }
  };

  const handleInputFileChange = async (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) {
      setError('No se seleccionó ningún archivo');
      return;
    }

    await procesarArchivo(archivo);
  };

  const handleAbrirSelector = (e) => {
    e.preventDefault();
    e.stopPropagation();
    limpiarMensajes();
    inputFileRef.current?.click();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const archivo = e.dataTransfer.files?.[0];

    if (!archivo) {
      setError('No se detectó ningún archivo al arrastrar');
      return;
    }

    await procesarArchivo(archivo);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleEliminar = (documento) => {
    setDocumentoAEliminar(documento);
    setShowDeleteDialog(true);
  };

  const confirmarEliminarDocumento = async () => {
    if (!documentoAEliminar) return;

    try {
      limpiarMensajes();
      setEliminando(true);

      await eliminarDocumento(documentoAEliminar.id);

      setMensaje('Documento eliminado correctamente');
      setShowDeleteDialog(false);
      setDocumentoAEliminar(null);

      await cargarDocumentos();
    } catch (err) {
      console.error('Error eliminando documento:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'No se pudo eliminar el documento'
      );
    } finally {
      setEliminando(false);
    }
  };

  const handleDescargar = async (documento) => {
    try {
      limpiarMensajes();
      await descargarDocumento(
        documento.id,
        documento.nombre_original || 'documento'
      );
    } catch (err) {
      console.error('Error descargando documento:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'No se pudo descargar el documento'
      );
    }
  };

  const handleAbrir = (documento) => {
    const index = documentos.findIndex((doc) => doc.id === documento.id);
    setViewerIndex(index >= 0 ? index : 0);
    setShowViewer(true);
  };

  return (
    <div className="documentos-tab">
      <div className="documentos-topbar">
        <div>
          <h3 className="documentos-title">Documentos del paciente</h3>
          <p className="documentos-subtitle">{nombrePaciente}</p>
        </div>
      </div>

      <div className="documentos-panel documentos-subida-config">
        <div className="documentos-campo">
          <label>Tipo de documento</label>
          <select
            value={tipoSubida}
            onChange={(e) => setTipoSubida(e.target.value)}
          >
            <option value="radiografia">Radiografía</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="consentimiento">Consentimiento</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="documentos-campo documentos-campo-etiquetas">
          <label>Etiquetas</label>
          <input
            type="text"
            value={etiquetasInput}
            onChange={(e) => setEtiquetasInput(e.target.value)}
            placeholder="Ejemplo: molar, abril, control"
          />
        </div>
      </div>

      <div
        className={`documentos-dropzone ${dragActive ? 'active' : ''} ${subiendo ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputFileRef}
          type="file"
          className="documentos-hidden-input"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleInputFileChange}
        />

        <i className="fas fa-cloud-upload-alt"></i>

        <h4>
          {subiendo
            ? 'Subiendo documento...'
            : 'Arrastra un archivo aquí o selecciónalo'}
        </h4>

        <p>Formatos permitidos: JPG, PNG, WEBP y PDF</p>

        <button
          type="button"
          className="documentos-select-btn"
          onClick={handleAbrirSelector}
          disabled={subiendo}
        >
          Seleccionar archivo
        </button>
      </div>

      {mensaje ? <div className="documentos-alert success">{mensaje}</div> : null}
      {error ? <div className="documentos-alert error">{error}</div> : null}

      <div className="documentos-panel documentos-filtros">
        <div className="documentos-campo">
          <label>Filtrar por tipo</label>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="documentos-campo documentos-campo-busqueda">
          <label>Buscar por nombre o etiqueta</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar documento..."
          />
        </div>
      </div>

      <div className="documentos-resumen">
        <span>
          {loading ? 'Cargando documentos...' : `${documentos.length} documento(s)`}
        </span>
      </div>

      {loading ? (
        <div className="documentos-empty">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando documentos...</p>
        </div>
      ) : documentos.length === 0 ? (
        <div className="documentos-empty">
          <i className="fas fa-folder-open"></i>
          <p>No hay documentos para mostrar.</p>
        </div>
      ) : (
        <div className="documentos-grid">
          {documentos.map((doc) => {
            const urlPreview = obtenerUrlDocumento(
              doc.miniatura_url || doc.url || doc.ruta_archivo
            );

            return (
              <div key={doc.id} className="documento-card">
                <div
                  className="documento-preview"
                  onClick={() => handleAbrir(doc)}
                >
                  {esImagen(doc.mime_type) ? (
                    <img src={urlPreview} alt={doc.nombre_original} />
                  ) : esPdf(doc.mime_type) ? (
                    <div className="documento-preview-placeholder pdf">
                      <i className="fas fa-file-pdf"></i>
                      <span>PDF</span>
                    </div>
                  ) : (
                    <div className="documento-preview-placeholder">
                      <i className="fas fa-file"></i>
                      <span>Archivo</span>
                    </div>
                  )}
                </div>

                <div className="documento-body">
                  <div className="documento-tipo">
                    {normalizarTipo(doc.tipo_documento) || 'otro'}
                  </div>

                  <h4 className="documento-nombre" title={doc.nombre_original}>
                    {doc.nombre_original}
                  </h4>

                  <div className="documento-meta">
                    <span>{doc.extension?.toUpperCase() || 'FILE'}</span>
                    <span>•</span>
                    <span>
                      {doc.tamano_bytes
                        ? `${Math.round(doc.tamano_bytes / 1024)} KB`
                        : '—'}
                    </span>
                  </div>

                  {Array.isArray(doc.etiquetas) && doc.etiquetas.length > 0 && (
                    <div className="documento-tags">
                      {doc.etiquetas.map((tag, index) => (
                        <span
                          key={`${doc.id}-${tag}-${index}`}
                          className="documento-tag"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="documento-actions">
                    <button type="button" onClick={() => handleAbrir(doc)}>
                      <i className="fas fa-eye"></i> Abrir
                    </button>

                    <button type="button" onClick={() => handleDescargar(doc)}>
                      <i className="fas fa-download"></i> Descargar
                    </button>

                    {doc.puedeEliminar && (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleEliminar(doc)}
                      >
                        <i className="fas fa-trash"></i> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VisualizadorDocumentos
        open={showViewer}
        documentos={documentos}
        initialIndex={viewerIndex}
        onClose={() => setShowViewer(false)}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar documento"
        message={
          documentoAEliminar
            ? `¿Deseas eliminar "${documentoAEliminar.nombre_original}"? Esta acción no se puede deshacer.`
            : '¿Deseas eliminar este documento?'
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={eliminando}
        onConfirm={confirmarEliminarDocumento}
        onCancel={() => {
          if (eliminando) return;
          setShowDeleteDialog(false);
          setDocumentoAEliminar(null);
        }}
      />
    </div>
  );
};

export default DocumentosTab;