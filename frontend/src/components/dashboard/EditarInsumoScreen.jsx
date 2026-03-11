import React, { useState, useEffect } from "react";
import "./RegistroInsumoScreen.css";

export default function EditarInsumoScreen({ insumo, onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    categoria: "",
    stockMinimo: "",
    unidadMedida: "",
    proveedor: "",
    estado: "activo",
    descripcion: "",
    precio: ""
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Cargar datos del insumo al iniciar
  useEffect(() => {
    if (insumo) {
      setFormData({
        nombre: insumo.nombre || "",
        codigo: insumo.codigo || "",
        categoria: insumo.categoria || "",
        stockMinimo: insumo.stockMinimo?.toString() || "",
        unidadMedida: insumo.unidadMedida || "",
        proveedor: insumo.proveedor || "",
        estado: insumo.estado || "activo",
        descripcion: insumo.descripcion || "",
        precio: insumo.precio?.toString() || ""
      });
    }
  }, [insumo]);

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

  const validarFormulario = (todosLosInsumos) => {
    const nuevosErrores = {};

    // Nombre
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else {
      // Validar que no exista otro insumo con ese nombre
      const existeOtro = todosLosInsumos.some(i => 
        i.nombre.toLowerCase() === formData.nombre.trim().toLowerCase() && 
        i.id !== insumo.id
      );
      if (existeOtro) {
        nuevosErrores.nombre = "Ya existe otro insumo con ese nombre";
      }
    }

    // Código (solo lectura, no se valida)
    
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
    
    // Necesitamos pasar la lista completa de insumos para validar nombre único
    // Por ahora validamos solo los campos obligatorios
    if (!validarFormulario([])) {
      return;
    }

    setGuardando(true);

    try {
      console.log("Actualizando insumo:", formData);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onGuardar) {
        onGuardar(formData);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setErrores({ general: "Error al actualizar el insumo" });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (onCancelar) {
      onCancelar();
    }
  };

  // Título dinámico
  const titulo = `Editando: ${insumo?.nombre || ""} (${insumo?.codigo || ""})`;

  return (
    <div className="dm2-page">
      <div className="registro-insumo-container">
        {/* Header */}
        <div className="registro-header">
          <button className="btn-volver" onClick={handleCancelar}>
            <i className="fa-solid fa-arrow-left" /> Volver
          </button>
          <h1 className="registro-titulo">{titulo}</h1>
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

            {/* Código interno - Solo lectura */}
            <div className="form-group">
              <label htmlFor="codigo">
                Código interno <span className="campo-obligatorio">*</span>
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                readOnly
                className="input-readonly"
              />
              <small className="help-text">El código no puede ser modificado</small>
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
            <div className="form-group form-group-full">
              <label htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción adicional del insumo..."
                rows={3}
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
                  <i className="fa-solid fa-save" /> GUARDAR CAMBIOS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

