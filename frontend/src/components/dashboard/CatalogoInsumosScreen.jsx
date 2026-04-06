import React, { useState, useEffect } from "react";
import "./CatalogoInsumosScreen.css";
import RegistroInsumoScreen from "./RegistroInsumoScreen";
import EditarInsumoScreen from "./EditarInsumoScreen";
import materialService from "../../services/material.service";

export default function CatalogoInsumosScreen() {
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [mostrarDropdownCategoria, setMostrarDropdownCategoria] = useState(false);
  const [mostrarDropdownEstado, setMostrarDropdownEstado] = useState(false);
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState(null);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [insumoCambioEstado, setInsumoCambioEstado] = useState(null);

  const [insumos, setInsumos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const categorias = [
    "Anestesia", "Antibióticos", "Binders y Adhesivos", "Blanqueamiento",
    "Cementos", "Cirugía", "Composites", "Desinfección", "Endodoncia",
    "Escayolas", "Filtrado", "Fluoruro", "Gasa y Algodón", "Hemostáticos",
    "Higiene", "Impresión", "Instrumental", "Irrigación", "Jeringas",
    "Láminas de matrices", "Lubricantes", "Medicamentos", "Oclusión",
    "Ortodoncia", "Oxido de Zinc", "Pasta dental", "Pinzes", "Profilaxis",
    "Rayos X", "Resinas", "Retracción Gingival", "Selladores", "Suturas",
    "Uniformes", "Varios"
  ];

  const estados = ["todos", "activos", "inactivos"];

  // Función reutilizable para cargar insumos
  const cargarInsumos = async (page = paginaActual) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: registrosPorPagina,
        search: filtro || undefined,
        categoria: filtroCategoria === 'todas' ? undefined : filtroCategoria,
        estado: filtroEstado === 'todos' ? undefined : filtroEstado
      };
      const response = await materialService.listar(params);
      setInsumos(response.data || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error cargando insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch insumos desde la API
  useEffect(() => {
    cargarInsumos(paginaActual);
  }, [paginaActual, registrosPorPagina, filtro, filtroCategoria, filtroEstado]);

  // Lógica de visualización (Ordenamiento)
  const insumosOrdenados = [...insumos].sort((a, b) => {
    const valA = a[sortField] ? String(a[sortField]).toLowerCase() : "";
    const valB = b[sortField] ? String(b[sortField]).toLowerCase() : "";
    
    const comparison = valA.localeCompare(valB);
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPaginas = Math.ceil(totalCount / registrosPorPagina);

  // Resetear página al filtrar
  useEffect(() => {
    setPaginaActual(1);
  }, [filtro, filtroCategoria, filtroEstado, registrosPorPagina]);

  const getNivelStock = (stock, stockMinimo) => {
    if (stock <= stockMinimo) return "critico";
    if (stock <= stockMinimo * 1.5) return "alerta";
    return "ok";
  };

  const formatearPrecio = (precio) => `L. ${Number(precio || 0).toFixed(2)}`;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Manejo de clicks externos para cerrar dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.filtro-dropdown')) {
        setMostrarDropdownCategoria(false);
        setMostrarDropdownEstado(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handlers de UI
  const handleNuevoInsumo = () => setMostrarFormulario(true);
  const handleCancelarFormulario = () => setMostrarFormulario(false);
  const handleGuardarInsumo = async () => {
    setMostrarFormulario(false);
    // Recargar insumos inmediatamente sin esperar cambio de página
    await cargarInsumos(1);
  };

  const handleEditarInsumo = (insumo) => {
    setInsumoEditando(insumo);
    setModoEdicion(true);
  };

  const handleEliminarInsumo = async (insumo) => {
    try {
      await materialService.eliminar(insumo.id);
      await cargarInsumos(paginaActual);
    } catch (error) {
      alert("Error al eliminar el insumo");
    }
  };

  const handleToggleEstado = (insumo) => {
    setInsumoCambioEstado(insumo);
    setMostrarModalEstado(true);
  };

  const confirmarCambioEstado = async () => {
    try {
        const nuevoEstado = insumoCambioEstado.estado === "activo" ? "inactivo" : "activo";
        await materialService.actualizar(insumoCambioEstado.id, { estado: nuevoEstado });
        // Refrescar datos inmediatamente
        await cargarInsumos(paginaActual);
        setMostrarModalEstado(false);
    } catch (error) {
        alert("Error al cambiar estado");
    }
  };

  if (modoEdicion && insumoEditando) {
    return (
      <EditarInsumoScreen
        insumo={insumoEditando}
        onGuardar={() => { 
          setModoEdicion(false); 
          cargarInsumos(paginaActual);
        }}
        onCancelar={() => setModoEdicion(false)}
      />
    );
  }

  if (mostrarFormulario) {
    return (
      <RegistroInsumoScreen 
        onGuardar={handleGuardarInsumo} 
        onCancelar={handleCancelarFormulario} 
      />
    );
  }

  const getLabelEstado = (estado) => {
    switch(estado) {
      case 'activos': return 'ACTIVOS';
      case 'inactivos': return 'INACTIVOS';
      default: return 'TODOS';
    }
  };

  const generarBotonesPaginas = () => {
    const botones = [];
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
            botones.push(
                <button 
                  key={i} 
                  className={`pagina-btn ${paginaActual === i ? 'active' : ''}`}
                  onClick={() => setPaginaActual(i)}
                >
                  {i}
                </button>
            );
        } else if (i === paginaActual - 2 || i === paginaActual + 2) {
            botones.push(<span key={i}>...</span>);
        }
    }
    return botones;
  };

  return (
    <div className="dm2-page">
      <div className="catalogo-insumos-container">
        <div className="catalogo-header">
          <div className="catalogo-header-content">
            <div className="catalogo-titulo-wrapper">
              <i className="fa-solid fa-boxes-stacked catalogo-icono"></i>
              <div className="catalogo-titulos">
                <h1 className="catalogo-titulo">Catálogo de Insumos Dentales</h1>
                <p className="catalogo-subtitulo">Gestión de materiales e inventario</p>
              </div>
            </div>
            <div className="catalogo-acciones">
              <button className="btn btn-primary" onClick={handleNuevoInsumo}>
                <i className="fa-solid fa-plus"></i> NUEVO INSUMO
              </button>
            </div>
          </div>
        </div>

        <div className="catalogo-filtros">
          <div className="filtro-busqueda">
            <i className="fa-solid fa-search"></i>
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)} 
            />
          </div>

          <div className="filtro-dropdown">
            <button className="btn-dropdown" onClick={() => setMostrarDropdownCategoria(!mostrarDropdownCategoria)}>
              <i className="fa-solid fa-tag"></i>
              <span>{filtroCategoria === 'todas' ? 'CATEGORÍA: TODAS' : filtroCategoria}</span>
            </button>
            {mostrarDropdownCategoria && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setFiltroCategoria('todas'); setMostrarDropdownCategoria(false); }}>TODAS</div>
                {categorias.map(cat => (
                  <div key={cat} className="dropdown-item" onClick={() => { setFiltroCategoria(cat); setMostrarDropdownCategoria(false); }}>{cat}</div>
                ))}
              </div>
            )}
          </div>

          <div className="filtro-dropdown">
            <button className="btn-dropdown" onClick={() => setMostrarDropdownEstado(!mostrarDropdownEstado)}>
              <i className="fa-solid fa-filter"></i>
              <span>ESTADO: {getLabelEstado(filtroEstado)}</span>
            </button>
            {mostrarDropdownEstado && (
              <div className="dropdown-menu">
                {estados.map(est => (
                  <div key={est} className="dropdown-item" onClick={() => { setFiltroEstado(est); setMostrarDropdownEstado(false); }}>{getLabelEstado(est)}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="catalogo-contenido">
          {loading ? (
            <div className="catalogo-loading">Cargando inventario...</div>
          ) : insumosOrdenados.length === 0 ? (
            <div className="catalogo-placeholder">
              <i className="fa-solid fa-box-open"></i>
              <p>No se encontraron resultados</p>
            </div>
          ) : (
            <>
              <div className="tabla-contenedor">
                <table className="tabla-insumos">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("codigo")} className="sortable-header">Código</th>
                      <th onClick={() => handleSort("nombre")} className="sortable-header">Nombre</th>
                      <th>Categoría</th>
                      <th>Stock</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosOrdenados.map(insumo => (
                      <tr key={insumo.id}>
                        <td>{insumo.codigo}</td>
                        <td>{insumo.nombre}</td>
                        <td><span className="categoria-badge">{insumo.categoria}</span></td>
                        <td>
                          <div className="stock-info">
                            <span className={`stock-indicator ${getNivelStock(insumo.cantidad_actual, insumo.stock_minimo)}`}></span>
                            {insumo.cantidad_actual} / {insumo.stock_minimo}
                          </div>
                        </td>
                        <td>{formatearPrecio(insumo.costo_promedio)}</td>
                        <td>
                            <span className={`estado-badge ${insumo.estado}`}>
                                {insumo.estado}
                            </span>
                        </td>
                        <td className="acciones-cell">
                          <button className="btn-accion" onClick={() => handleEditarInsumo(insumo)}><i className="fa-solid fa-pen"></i></button>
                          <button 
                            className={`toggle-estado ${insumo.estado}`}
                            onClick={() => handleToggleEstado(insumo)}
                            title={insumo.estado === "activo" ? "Desactivar" : "Activar"}
                          >
                            <span className="toggle-circle"></span>
                          </button>
                          <button className="btn-accion btn-accion-delete" onClick={() => handleEliminarInsumo(insumo)} title="Eliminar">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="paginacion-container">
                <div className="paginacion-controles">
                  <button className="pagina-btn" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1}>
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  {generarBotonesPaginas()}
                  <button className="pagina-btn" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
                <select className="select-registros" value={registrosPorPagina} onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}>
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n} por página</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Estado */}
      {mostrarModalEstado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Cambio</h3>
            <p>¿Deseas cambiar el estado de {insumoCambioEstado?.nombre}?</p>
            <div className="modal-footer">
              <button className="btn btn-cancelar" onClick={() => setMostrarModalEstado(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarCambioEstado}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}