const { Op } = require("sequelize");
const { Material } = require("../models");

const parseBooleanState = (estado) => {
  if (!estado) return null;
  const value = String(estado).trim().toLowerCase();
  if (value === "activo" || value === "activos") return "activo";
  if (value === "inactivo" || value === "inactivos") return "inactivo";
  return null;
};

const listarMateriales = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, categoria, estado } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo: { [Op.like]: `%${search}%` } },
      ];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    const estadoFiltro = parseBooleanState(estado);
    if (estadoFiltro && Object.prototype.hasOwnProperty.call(Material.rawAttributes, "estado")) {
      where.estado = estadoFiltro;
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    const { rows, count } = await Material.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [["nombre", "ASC"]],
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: pageNumber,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error("MATERIALES listarMateriales:", error.parent?.sqlMessage || error.message);
    next(error);
  }
};

const crearMaterial = async (req, res, next) => {
  try {
    const {
      codigo,
      nombre,
      categoria,
      stockMinimo,
      unidadMedida,
      proveedor,
      precio,
      cantidad,
      cantidad_actual,
    } = req.body;

    if (!codigo || !codigo.toString().trim()) {
      return res.status(400).json({ message: "El código del insumo es obligatorio" });
    }

    if (!nombre || !nombre.toString().trim()) {
      return res.status(400).json({ message: "El nombre del insumo es obligatorio" });
    }

    const stockMinimoValue = Number(stockMinimo) || 0;
    const cantidadInicial = Number(cantidad ?? cantidad_actual ?? 0) || 0;
    const costoPromedio = Number(precio) || 0;

    const nuevoMaterial = await Material.create({
      codigo: codigo.toString().trim(),
      nombre: nombre.toString().trim(),
      categoria: categoria || null,
      proveedor_principal: proveedor || null,
      stock_minimo: stockMinimoValue,
      unidad_medida: unidadMedida || null,
      cantidad_actual: cantidadInicial,
      costo_promedio: costoPromedio,
      ultima_entrada: cantidadInicial > 0 ? new Date() : null,
    });

    res.status(201).json({
      message: "Insumo creado correctamente",
      data: nuevoMaterial,
    });
  } catch (error) {
    console.error("MATERIALES crearMaterial:", error.parent?.sqlMessage || error.message);
    next(error);
  }
};

const actualizarMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      categoria,
      stockMinimo,
      unidadMedida,
      proveedor,
      precio,
      cantidad,
      cantidad_actual,
    } = req.body;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    const updatePayload = {};

    if (codigo !== undefined) updatePayload.codigo = codigo;
    if (nombre !== undefined) updatePayload.nombre = nombre;
    if (categoria !== undefined) updatePayload.categoria = categoria;
    if (proveedor !== undefined) updatePayload.proveedor_principal = proveedor;
    if (stockMinimo !== undefined) updatePayload.stock_minimo = Number(stockMinimo) || 0;
    if (unidadMedida !== undefined) updatePayload.unidad_medida = unidadMedida;
    if (cantidad !== undefined) updatePayload.cantidad_actual = Number(cantidad) || 0;
    if (cantidad_actual !== undefined) updatePayload.cantidad_actual = Number(cantidad_actual) || 0;
    if (precio !== undefined) updatePayload.costo_promedio = Number(precio) || 0;

    await material.update(updatePayload);

    res.json({
      message: "Insumo actualizado correctamente",
      data: material,
    });
  } catch (error) {
    console.error("MATERIALES actualizarMaterial:", error.parent?.sqlMessage || error.message);
    next(error);
  }
};

module.exports = {
  listarMateriales,
  crearMaterial,
  actualizarMaterial,
};
