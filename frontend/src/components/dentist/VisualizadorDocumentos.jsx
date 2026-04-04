import React, { useEffect, useMemo, useState } from 'react';
import { obtenerUrlDocumento } from '../../services/documentos.service';
import './VisualizadorDocumentos.css';

const esImagen = (mimeType = '') => mimeType.startsWith('image/');
const esPdf = (mimeType = '') => mimeType === 'application/pdf';

const VisualizadorDocumentos = ({
  open,
  documentos = [],
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex || 0);
      setZoom(1);
      setRotation(0);
      setCompareMode(false);
      setCompareIndex(null);
    }
  }, [open, initialIndex]);

  const documentoActual = useMemo(() => {
    if (!documentos.length) return null;
    return documentos[currentIndex] || null;
  }, [documentos, currentIndex]);

  const documentoComparado = useMemo(() => {
    if (compareIndex === null) return null;
    return documentos[compareIndex] || null;
  }, [documentos, compareIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % documentos.length);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + documentos.length) % documentos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, documentos.length, onClose]);

  if (!open || !documentoActual) return null;

  const siguiente = () => {
    setCurrentIndex((prev) => (prev + 1) % documentos.length);
  };

  const anterior = () => {
    setCurrentIndex((prev) => (prev - 1 + documentos.length) % documentos.length);
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const resetVista = () => {
    setZoom(1);
    setRotation(0);
  };
  const rotar = () => setRotation((prev) => prev + 90);

  const abrirComparativa = () => {
    if (!esImagen(documentoActual.mime_type)) return;

    const otroIndex = documentos.findIndex(
      (doc, idx) => idx !== currentIndex && esImagen(doc.mime_type)
    );

    if (otroIndex === -1) return;

    setCompareMode(true);
    setCompareIndex(otroIndex);
  };

  const cerrarComparativa = () => {
    setCompareMode(false);
    setCompareIndex(null);
  };

  const renderDocumento = (doc) => {
    const url = obtenerUrlDocumento(doc.url || doc.ruta_archivo);
    const transform = `scale(${zoom}) rotate(${rotation}deg)`;

    if (esImagen(doc.mime_type)) {
      return (
        <div className="viewer-media-wrap">
          <img
            src={url}
            alt={doc.nombre_original}
            className="viewer-image"
            style={{ transform }}
          />
        </div>
      );
    }

    if (esPdf(doc.mime_type)) {
      return (
        <div className="viewer-pdf-wrap">
          <iframe
            src={url}
            title={doc.nombre_original}
            className="viewer-pdf"
          />
        </div>
      );
    }

    return (
      <div className="viewer-file-placeholder">
        <i className="fas fa-file"></i>
        <p>No hay vista previa disponible para este archivo.</p>
      </div>
    );
  };

  const puedeComparar =
    esImagen(documentoActual.mime_type) &&
    documentos.some((doc, idx) => idx !== currentIndex && esImagen(doc.mime_type));

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <div className="viewer-header-info">
            <h3>{documentoActual.nombre_original}</h3>
            <p>
              {documentoActual.extension?.toUpperCase() || 'FILE'}
            </p>
          </div>

          <button type="button" className="viewer-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="viewer-toolbar">
          <button type="button" onClick={anterior}>
            <i className="fas fa-chevron-left"></i> Anterior
          </button>

          <button type="button" onClick={siguiente}>
            Siguiente <i className="fas fa-chevron-right"></i>
          </button>

          <button type="button" onClick={zoomOut}>
            <i className="fas fa-search-minus"></i>
          </button>

          <button type="button" onClick={zoomIn}>
            <i className="fas fa-search-plus"></i>
          </button>

          <button type="button" onClick={rotar}>
            <i className="fas fa-redo"></i> Rotar
          </button>

          <button type="button" onClick={resetVista}>
            <i className="fas fa-sync-alt"></i> Reset
          </button>

          {puedeComparar && !compareMode && (
            <button type="button" onClick={abrirComparativa}>
              <i className="fas fa-columns"></i> Comparar
            </button>
          )}

          {compareMode && (
            <button type="button" onClick={cerrarComparativa}>
              <i className="fas fa-times-circle"></i> Salir comparativa
            </button>
          )}
        </div>

        {!compareMode ? (
          <div className="viewer-body">
            {renderDocumento(documentoActual)}
          </div>
        ) : (
          <div className="viewer-compare-layout">
            <div className="viewer-compare-panel">
              <div className="viewer-compare-title">Documento actual</div>
              {renderDocumento(documentoActual)}
            </div>

            <div className="viewer-compare-panel">
              <div className="viewer-compare-header">
                <div className="viewer-compare-title">Comparar con</div>
                <select
                  value={compareIndex ?? ''}
                  onChange={(e) => setCompareIndex(Number(e.target.value))}
                >
                  {documentos
                    .map((doc, idx) => ({ doc, idx }))
                    .filter(
                      ({ doc, idx }) =>
                        idx !== currentIndex && esImagen(doc.mime_type)
                    )
                    .map(({ doc, idx }) => (
                      <option key={doc.id || idx} value={idx}>
                        {doc.nombre_original}
                      </option>
                    ))}
                </select>
              </div>

              {documentoComparado ? (
                renderDocumento(documentoComparado)
              ) : (
                <div className="viewer-file-placeholder">
                  <i className="fas fa-images"></i>
                  <p>Selecciona otra imagen para comparar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="viewer-footer">
          <span>
            {currentIndex + 1} de {documentos.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VisualizadorDocumentos;