import React, { useState, useEffect } from "react";
import "./CatalogoInsumosScreen.css";
import RegistroInsumoScreen from "./RegistroInsumoScreen";
import EditarInsumoScreen from "./EditarInsumoScreen";

export default function CatalogoInsumosScreen() {
  const [insumosNuevos, setInsumosNuevos] = useState([]);
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

  // Datos de ejemplo - estos NUNCA se duplican
  const insumosFijos = [
    { id: 1, codigo: "AN001", nombre: "Anestesia Lidocaína 2%", categoria: "Anestesia", stock: 50, stockMinimo: 10, precio: 25.00, proveedor: "DentalCorp", estado: "activo" },
    { id: 2, codigo: "CO001", nombre: "Composite Resina Filtek", categoria: "Composites", stock: 30, stockMinimo: 15, precio: 45.00, proveedor: "3M Honduras", estado: "activo" },
    { id: 3, codigo: "CE001", nombre: "Cemento Fotopolimerizable", categoria: "Cementos", stock: 8, stockMinimo: 10, precio: 35.00, proveedor: "DentalCorp", estado: "activo" },
    { id: 4, codigo: "EN001", nombre: "Lima Endodóntica #15", categoria: "Endodoncia", stock: 100, stockMinimo: 50, precio: 12.00, proveedor: "Endotech", estado: "activo" },
    { id: 5, codigo: "HI001", nombre: "Pasta Dental Colgate", categoria: "Higiene", stock: 5, stockMinimo: 20, precio: 18.00, proveedor: "Procter&Gamble", estado: "alerta" },
    { id: 6, codigo: "AN002", nombre: "Anestesia Articaína 4%", categoria: "Anestesia", stock: 45, stockMinimo: 10, precio: 28.00, proveedor: "DentalCorp", estado: "activo" },
    { id: 7, codigo: "SU001", nombre: "Sutura de Seda 3-0", categoria: "Suturas", stock: 3, stockMinimo: 20, precio: 15.00, proveedor: "MedicalSupplies", estado: "critico" },
    { id: 8, codigo: "GA001", nombre: "Gasa Esteril 10x10", categoria: "Gasa y Algodón", stock: 200, stockMinimo: 100, precio: 8.00, proveedor: "DentalCorp", estado: "activo" },
    { id: 9, codigo: "DI001", nombre: "Desinfectante Glutaraldehído 2%", categoria: "Desinfección", stock: 15, stockMinimo: 8, precio: 42.00, proveedor: "ChemSupply", estado: "activo" },
    { id: 10, codigo: "IM001", nombre: "Alginato de Sodio", categoria: "Impresión", stock: 25, stockMinimo: 10, precio: 32.00, proveedor: "DentalCorp", estado: "activo" },
    { id: 11, codigo: "OR001", nombre: "Bracket Metálico Standard", categoria: "Ortodoncia", stock: 0, stockMinimo: 50, precio: 85.00, proveedor: "OrthoTech", estado: "inactivo" },
    { id: 12, codigo: "BL001", nombre: "Gel Blanqueador 35% HP", categoria: "Blanqueamiento", stock: 12, stockMinimo: 5, precio: 65.00, proveedor: "WhiteningPro", estado: "activo" },
    { id: 13, codigo: "HE001", nombre: "Hemostático Colágeno", categoria: "Hemostáticos", stock: 18, stockMinimo: 10, precio: 28.00, proveedor: "MedicalSupplies", estado: "activo" },
    { id: 14, codigo: "IR001", nombre: "Hipoclorito de Sodio 5.25%", categoria: "Irrigación", stock: 7, stockMinimo: 15, precio: 22.00, proveedor: "Endotech", estado: "alerta" },
  ];

  // Combinar fijos + nuevos (no se duplican al cambiar página)
  const listaInsumos = [...insumosFijos, ...insumosNuevos];

  const insumosFiltrados = listaInsumos.filter(insumo => {
    if (filtro) {
      const texto = filtro.toLowerCase();
      if (!insumo.nombre.toLowerCase().includes(texto) && 
          !insumo.codigo.toLowerCase().includes(texto) &&
          !insumo.categoria.toLowerCase().includes(texto)) {
        return false;
      }
    }
    if (filtroCategoria !== "todas" && insumo.categoria !== filtroCategoria) return false;
    if (filtroEstado !== "todos" && insumo.estado !== filtroEstado) return false;
    return true;
  });

  const insumosOrdenados = [...insumosFiltrados].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "codigo": comparison = a.codigo.localeCompare(b.codigo); break;
      case "nombre": comparison = a.nombre.localeCompare(b.nombre); break;
      case "categoria": comparison = a.categoria.localeCompare(b.categoria); break;
      default: comparison = 0;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalRegistros = insumosOrdenados.length;
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const insumosPaginados = insumosOrdenados.slice(indiceInicio, indiceFin);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtro, filtroCategoria, filtroEstado, registrosPorPagina]);

  const getNivelStock = (stock, stockMinimo) => {
    if (stock <= stockMinimo) return "critico";
    if (stock <= stockMinimo * 1.5) return "alerta";
    return "ok";
  };

  const formatearPrecio = (precio) => `L. ${precio.toFixed(2)}`;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleToggleEstado = (insumo) => {
    setInsumoCambioEstado(insumo);
    setMostrarModalEstado(true);
  };

  const confirmarCambioEstado = () => {
    if (!insumoCambioEstado) return;
    
    const nuevoEstado = insumoCambioEstado.estado === "activo" ? "inactivo" : "activo";
    const esFijo = insumosFijos.some(i => i.id === insumoCambioEstado.id);
    
    if (!esFijo) {
      setInsumosNuevos(prev => 
        prev.map(i => i.id === insumoCambioEstado.id ? { ...i, estado: nuevoEstado } : i)
      );
    }
    
    setMostrarModalEstado(false);
    setInsumoCambioEstado(null);
  };

  const cancelarCambioEstado = () => {
    setMostrarModalEstado(false);
    setInsumoCambioEstado(null);
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdowns = document.querySelectorAll('.filtro-dropdown');
      let clickedInside = false;
      dropdowns.forEach(dropdown => {
        if (dropdown && dropdown.contains(e.target)) clickedInside = true;
      });
      if (!clickedInside) {
        setMostrarDropdownCategoria(false);
        setMostrarDropdownEstado(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleNuevoInsumo = () => {
    setMostrarFormulario(true);
  };

  const handleGuardarInsumo = (nuevoInsumo) => {
    const insumoNuevo = {
      id: Date.now(),
      codigo: nuevoInsumo.codigo,
      nombre: nuevoInsumo.nombre,
      categoria: nuevoInsumo.categoria,
      stock: 0,
      stockMinimo: parseInt(nuevoInsumo.stockMinimo),
      precio: parseFloat(nuevoInsumo.precio) || 0,
      proveedor: nuevoInsumo.proveedor || "",
      estado: nuevoInsumo.estado || "activo"
    };
    setInsumosNuevos([...insumosNuevos, insumoNuevo]);
    setMostrarFormulario(false);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
  };

  const handleEditarInsumo = (insumo) => {
    setInsumoEditando(insumo);
    setModoEdicion(true);
  };

  const handleGuardarEdicion = (datosEditados) => {
    const esFijo = insumosFijos.some(i => i.id === insumoEditando.id);
    
    if (!esFijo) {
      setInsumosNuevos(prev => 
        prev.map(i => i.id === insumoEditando.id ? { ...i, ...datosEditados } : i)
      );
    }
    
    setModoEdicion(false);
    setInsumoEditando(null);
  };

  const handleCancelarEdicion = () => {
    setModoEdicion(false);
    setInsumoEditando(null);
  };

  const handleGuardarDuplicado = (datosDuplicado) => {
    const insumoNuevo = {
      id: Date.now(),
      codigo: datosDuplicado.codigo,
      nombre: datosDuplicado.nombre,
      categoria: datosDuplicado.categoria,
      stock: 0,
      stockMinimo: parseInt(datosDuplicado.stockMinimo),
      precio: parseFloat(datosDuplicado.precio) || 0,
      proveedor: datosDuplicado.proveedor || "",
      estado: datosDuplicado.estado || "activo"
    };
    setInsumosNuevos([...insumosNuevos, insumoNuevo]);
    setModoDuplicacion(false);
    setInsumoDuplicando(null);
  };

  const handleCancelarDuplicado = () => {
    setModoDuplicacion(false);
    setInsumoDuplicando(null);
  };

  if (modoEdicion && insumoEditando) {
    return (
      <EditarInsumoScreen
        insumo={insumoEditando}
        onGuardar={handleGuardarEdicion}
        onCancelar={handleCancelarEdicion}
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

  const handleImportar = () => console.log("Importar");
  const handleExportar = () => console.log("Exportar");
  const handleBuscar = () => console.log("Buscar");
  const handleLimpiarFiltros = () => {
    setFiltro("");
    setFiltroCategoria("todas");
    setFiltroEstado("todos");
  };

  const getLabelEstado = (estado) => {
    switch(estado) {
      case 'activos': return 'ACTIVOS';
      case 'inactivos': return 'INACTIVOS';
      default: return 'TODOS';
    }
  };

  const generarBotonesPaginas = () => {
    const botones = [];
    const maxBotones = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
    
    if (fin - inicio + 1 < maxBotones) {
      inicio = Math.max(1, fin - maxBotones + 1);
    }

    if (inicio > 1) {
      botones.push(<button key={1} className="pagina-btn" onClick={() => setPaginaActual(1)}>1</button>);
      if (inicio > 2) botones.push(<span key="ellipsis1" className="pagina-ellipsis">...</span>);
    }

    for (let i = inicio; i <= fin; i++) {
      botones.push(
        <button 
          key={i} 
          className={`pagina-btn ${paginaActual === i ? 'active' : ''}`}
          onClick={() => setPaginaActual(i)}
        >
          {i}
        </button>
      );
    }

    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) botones.push(<span key="ellipsis2" className="pagina-ellipsis">...</span>);
      botones.push(<button key={totalPaginas} className="pagina-btn" onClick={() => setPaginaActual(totalPaginas)}>{totalPaginas}</button>);
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
                <p className="catalogo-subtitulo">Gestión de materiales, medicamentos e instrumental</p>
              </div>
            </div>
            <div className="catalogo-acciones">
              <div className="acciones-principales">
                <button className="btn btn-primary" onClick={handleNuevoInsumo}>
                  <i className="fa-solid fa-plus"></i> NUEVO INSUMO
                </button>
              </div>
              <div className="acciones-secundarias">
                <button className="btn btn-outline" onClick={handleImportar}>
                  <i className="fa-solid fa-download"></i> IMPORTAR
                </button>
                <button className="btn btn-outline" onClick={handleExportar}>
                  <i className="fa-solid fa-upload"></i> EXPORTAR
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="catalogo-filtros">
          <div className="filtro-busqueda">
            <i className="fa-solid fa-search"></i>
            <input type="text" placeholder="Buscar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            {filtro && <button className="btn-limpiar" onClick={() => setFiltro("")}><i className="fa-solid fa-times"></i></button>}
          </div>

          <div className="filtro-dropdown" onClick={(e) => { e.stopPropagation(); setMostrarDropdownCategoria(!mostrarDropdownCategoria); setMostrarDropdownEstado(false); }}>
            <button className="btn-dropdown">
              <i className="fa-solid fa-tag"></i>
              <span>{filtroCategoria === 'todas' ? 'TODAS' : filtroCategoria}</span>
              <i className="fa-solid fa-chevron-down"></i>
            </button>
            {mostrarDropdownCategoria && (
              <div className="dropdown-menu">
                <div className={`dropdown-item ${filtroCategoria === 'todas' ? 'active' : ''}`} onClick={() => { setFiltroCategoria('todas'); setMostrarDropdownCategoria(false); }}>TODAS</div>
                {categorias.map(cat => (
                  <div key={cat} className={`dropdown-item ${filtroCategoria === cat ? 'active' : ''}`} onClick={() => { setFiltroCategoria(cat); setMostrarDropdownCategoria(false); }}>{cat}</div>
                ))}
              </div>
            )}
          </div>

          <div className="filtro-dropdown" onClick={(e) => { e.stopPropagation(); setMostrarDropdownEstado(!mostrarDropdownEstado); setMostrarDropdownCategoria(false); }}>
            <button className="btn-dropdown">
              <i className="fa-solid fa-filter"></i>
              <span>{getLabelEstado(filtroEstado)}</span>
              <i className="fa-solid fa-chevron-down"></i>
            </button>
            {mostrarDropdownEstado && (
              <div className="dropdown-menu">
                {estados.map(est => (
                  <div key={est} className={`dropdown-item ${filtroEstado === est ? 'active' : ''}`} onClick={() => { setFiltroEstado(est); setMostrarDropdownEstado(false); }}>{getLabelEstado(est)}</div>
                ))}
              </div>
            )}
          </div>

          <div className="filtros-acciones">
            <button className="btn btn-primary" onClick={handleBuscar}><i className="fa-solid fa-search"></i> BUSCAR</button>
            <button className="btn btn-outline" onClick={handleLimpiarFiltros}><i className="fa-solid fa-times"></i> LIMPIAR</button>
          </div>
        </div>

        <div className="catalogo-contenido">
          {loading ? (
            <div className="catalogo-loading">Cargando...</div>
          ) : insumosFiltrados.length === 0 ? (
            <div className="catalogo-placeholder">
              <i className="fa-solid fa-box-open"></i>
              <p>No se encontraron insumos</p>
            </div>
          ) : (
            <>
              <div className="tabla-contenedor">
                <table className="tabla-insumos">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("codigo")} className="sortable-header">
                        Código {sortField === "codigo" && <i className={`fa-solid fa-sort-${sortDirection === "asc" ? "up" : "down"}`}></i>}
                      </th>
                      <th onClick={() => handleSort("nombre")} className="sortable-header">
                        Nombre {sortField === "nombre" && <i className={`fa-solid fa-sort-${sortDirection === "asc" ? "up" : "down"}`}></i>}
                      </th>
                      <th onClick={() => handleSort("categoria")} className="sortable-header">
                        Categoría {sortField === "categoria" && <i className={`fa-solid fa-sort-${sortDirection === "asc" ? "up" : "down"}`}></i>}
                      </th>
                      <th>Stock</th>
                      <th>Precio</th>
                      <th>Proveedor</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosPaginados.map(insumo => {
                      const nivelStock = getNivelStock(insumo.stock, insumo.stockMinimo);
                      return (
                        <tr key={insumo.id} className={selectedInsumo === insumo.id ? 'seleccionado' : ''} onClick={() => setSelectedInsumo(selectedInsumo === insumo.id ? null : insumo.id)}>
                          <td className="codigo-cell">{insumo.codigo}</td>
                          <td className="nombre-cell">{insumo.nombre}</td>
                          <td><span className="categoria-badge">{insumo.categoria}</span></td>
                          <td className="stock-cell">
                            <div className="stock-info">
                              <span className={`stock-indicator ${nivelStock}`}></span>
                              <span>{insumo.stock}</span>
                              <small>/{insumo.stockMinimo} Mínimo</small>
                            </div>
                          </td>
                          <td className="precio-cell">{formatearPrecio(insumo.precio)}</td>
                          <td className="proveedor-cell">{insumo.proveedor}</td>
                          <td><span className={`estado-badge ${insumo.estado}`}>{insumo.estado === 'activo' ? 'Activo' : insumo.estado === 'inactivo' ? 'Inactivo' : 'Alerta'}</span></td>
                          <td className="acciones-cell">
                            <button className="btn-accion" title="Editar" onClick={(e) => { e.stopPropagation(); handleEditarInsumo(insumo); }}><i className="fa-solid fa-pen"></i></button>
                            <button className="btn-accion" title="Duplicar" onClick={(e) => { e.stopPropagation(); handleDuplicarInsumo(insumo); }}><i className="fa-solid fa-copy"></i></button>
                            <button className="btn-accion" title={insumo.estado === "activo" ? "Inactivar" : "Activar"} onClick={(e) => { e.stopPropagation(); handleToggleEstado(insumo); }}>
<i className={`fa-solid fa-${insumo.estado === "activo" ? "xmark" : "check"}`}></i>
                            </button>
                            <button className="btn-accion btn-accion-delete" title="Eliminar" onClick={(e) => { e.stopPropagation(); }}><i className="fa-solid fa-trash"></i></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="paginacion-container">
                <div className="paginacion-info">
                  Mostrando {indiceInicio + 1}-{Math.min(indiceFin, totalRegistros)} de {totalRegistros} insumos
                </div>
                <div className="paginacion-controles">
                  <button className="pagina-btn" onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))} disabled={paginaActual === 1}>
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  {generarBotonesPaginas()}
                  <button className="pagina-btn" onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))} disabled={paginaActual === totalPaginas}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
                <div className="paginacion-registros">
                  <span>Registros por página:</span>
                  <select value={registrosPorPagina} onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación para cambio de estado */}
      {mostrarModalEstado && insumoCambioEstado && (
        <div className="modal-overlay" onClick={cancelarCambioEstado}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{insumoCambioEstado.estado === "activo" ? "Inactivar insumo" : "Activar insumo"}</h3>
            </div>
            <div className="modal-body">
              <p>
                {insumoCambioEstado.estado === "activo" 
                  ? `¿Está seguro que desea INACTIVAR el insumo '${insumoCambioEstado.nombre}'? Los insumos inactivos no aparecerán en búsquedas por defecto.`
                  : `¿Está seguro que desea ACTIVAR el insumo '${insumoCambioEstado.nombre}'?`
                }
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-cancelar" 
                onClick={cancelarCambioEstado}
              >
                Cancelar
              </button>
              <button 
                className={`btn ${insumoCambioEstado.estado === "activo" ? "btn-danger" : "btn-success"}`}
                onClick={confirmarCambioEstado}
              >
                {insumoCambioEstado.estado === "activo" ? "Sí, inactivar" : "Sí, activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

