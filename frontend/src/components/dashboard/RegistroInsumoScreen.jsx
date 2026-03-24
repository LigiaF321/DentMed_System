import React, { useState, useEffect } from "react";
import "./RegistroInsumoScreen.css";

export default function RegistroInsumoScreen({ onGuardar, onCancelar, datosPrecargados = null, titulo }) {
  // Estado inicial: usar datos precargados si existen, sino vacío
  const getInitialData = () => {
    if (datosPrecargados) {
      return {
        nombre: datosPrecargados.nombre || "",
        codigo: datosPrecargados.codigo || "",
        categoria: datosPrecargados.categoria || "",
        stockMinimo: datosPrecargados.stockMinimo?.toString() || "",
        unidadMedida: datosPrecargados.unidadMedida || "",
        proveedor: datosPrecargados.proveedor || "",
        estado: datosPrecargados.estado || "activo",
        descripcion: datosPrecargados.descripcion || "",
        precio: datosPrecargados.precio?.toString() || ""
      };
    }
    return {
      nombre: "",
      codigo: "",
      categoria: "",
      stockMinimo: "",
      unidadMedida: "",
      proveedor: "",
      estado: "activo",
      descripcion: "",
      precio: ""
    };
  };

  const [formData, setFormData] = useState(getInitialData);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Determinar si es modo duplicación
  const esDuplicacion = !!datosPrecargados && !titulo;
  const displayTitulo = titulo || (esDuplicacion ? "Duplicar Insumo" : "Registrar Nuevo Insumo");
  const esModoEditar = !!titulo && titulo.includes("Editando");
  const esSoloNuevo = !datosPrecargados && !titulo;

  const categorias = [
    "Insumos quirúrgicos",
    "Medicamentos",
    "Instrumental",
    "Protección personal",
    "Material de curación",
    "Equipos",
    "Papelería",
    "Otros"
  ];

  const unidadesMedida = [
    "Unidad",
    "Caja",
    "Paquete",
    "Frasco",
    "Tubo",
    "Par",
    "Juego",
    "Botella",
    "Sobre",
    "Rollo"
  ];

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Nombre
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }

    // Código
    if (!formData.codigo.trim()) {
      nuevosErrores.codigo = "El código es obligatorio";
    }

    // Categoría
    if (!formData.categoria) {
      nuevosErrores.categoria = "La categoría es obligatoria";
    }

    // Stock mínimo
    if (!formData.stockMinimo || parseInt(formData.stockMinimo) <= 0) {
      nuevosErrores.stockMinimo = "El stock mínimo debe ser mayor a 0";
    }

    // Unidad de medida
    if (!formData.unidadMedida) {
      nuevosErrores.unidadMedida = "La unidad de medida es obligatoria";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario escribe
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);

    try {
      // Simulación de guardado - aquí iría la llamada al backend
      console.log("Guardando insumo:", formData);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onGuardar) {
        onGuardar(formData);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setErrores({ general: "Error al guardar el insumo" });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (onCancelar) {
      onCancelar();
    }
  };

  return (
    <div className="dm2-page">
      <div className="registro-insumo-container">
        {/* Header */}
        <div className="registro-header">
          <button className="btn-volver" onClick={handleCancelar}>
            <i className="fa-solid fa-arrow-left" /> Volver
          </button>
          <h1 className="registro-titulo">{displayTitulo}</h1>
        </div>

        {/* Formulario */}
        <form className="registro-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Nombre del insumo */}
            <div className="form-group">
              <label htmlFor="nombre">
                Nombre del insumo <span className="campo-obligatorio">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Guantes de látex, Mascarillas N95"
                className={errores.nombre ? "input-error" : ""}
              />
              {errores.nombre && <span className="error-mensaje">{errores.nombre}</span>}
            </div>

            {/* Código interno */}
            <div className="form-group">
              <label htmlFor="codigo">
                Código interno <span className="campo-obligatorio">*</span>
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ej: G-001, M-045"
                className={errores.codigo ? "input-error" : ""}
              />
              {errores.codigo && <span className="error-mensaje">{errores.codigo}</span>}
              <small className="help-text">Formato sugerido: letra-número (ej: G-001)</small>
            </div>

            {/* Categoría */}
            <div className="form-group">
              <label htmlFor="categoria">
                Categoría <span className="campo-obligatorio">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className={errores.categoria ? "input-error" : ""}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errores.categoria && <span className="error-mensaje">{errores.categoria}</span>}
            </div>

            {/* Unidad de medida */}
            <div className="form-group">
              <label htmlFor="unidadMedida">
                Unidad de medida <span className="campo-obligatorio">*</span>
              </label>
              <select
                id="unidadMedida"
                name="unidadMedida"
                value={formData.unidadMedida}
                onChange={handleChange}
                className={errores.unidadMedida ? "input-error" : ""}
              >
                <option value="">Seleccionar unidad</option>
                {unidadesMedida.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
              {errores.unidadMedida && <span className="error-mensaje">{errores.unidadMedida}</span>}
            </div>

            {/* Stock mínimo */}
            <div className="form-group">
              <label htmlFor="stockMinimo">
                Stock mínimo <span className="campo-obligatorio">*</span>
              </label>
              <input
                type="number"
                id="stockMinimo"
                name="stockMinimo"
                value={formData.stockMinimo}
                onChange={handleChange}
                placeholder="Ej: 10"
                min="1"
                className={errores.stockMinimo ? "input-error" : ""}
              />
              {errores.stockMinimo && <span className="error-mensaje">{errores.stockMinimo}</span>}
              <small className="help-text">Cantidad mínima antes de generar alerta</small>
            </div>

            {/* Proveedor principal */}
            <div className="form-group">
              <label htmlFor="proveedor">
                Proveedor principal
              </label>
              <input
                type="text"
                id="proveedor"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Ej: DentalPro, MedSupply"
              />
            </div>

            {/* Precio */}
            <div className="form-group">
              <label htmlFor="precio">
                Precio unitario (L)
              </label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                placeholder="Ej: 25.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción adicional del insumo..."
                rows={1}
              />
            </div>

            {/* Estado */}
            <div className="form-group">
              <label>Estado</label>
              <div className="estado-switch">
                <label className="switch-label">
                  <input
                    type="radio"
                    name="estado"
                    value="activo"
                    checked={formData.estado === "activo"}
                    onChange={handleChange}
                  />
                  <span className="switch-radio">
                    <span className="radio-dot"></span>
                  </span>
                  <span className="radio-label">Activo</span>
                </label>
                {!esSoloNuevo && (
                  <label className="switch-label">
                    <input
                      type="radio"
                      name="estado"
                      value="inactivo"
                      checked={formData.estado === "inactivo"}
                      onChange={handleChange}
                    />
                    <span className="switch-radio">
                      <span className="radio-dot"></span>
                    </span>
                    <span className="radio-label">Inactivo</span>
                  </label>
                )}
                {esSoloNuevo && <small className="help-text">Nuevo insumo siempre activo</small>}
              </div>
            </div>
          </div>

          {/* Error general */}
          {errores.general && (
            <div className="error-general">{errores.general}</div>
          )}

          {/* Botones */}
          <div className="form-botones">
            <button type="button" className="btn btn-cancelar" onClick={handleCancelar}>
              <i className="fa-solid fa-times" /> CANCELAR
            </button>
            <button type="submit" className="btn btn-guardar" disabled={guardando}>
              {guardando ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> GUARDANDO...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-save" /> GUARDAR
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

