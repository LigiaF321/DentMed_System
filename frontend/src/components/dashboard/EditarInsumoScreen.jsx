import React, { useState, useEffect } from "react";
import "./RegistroInsumoScreen.css";
import RegistroInsumoScreen from "./RegistroInsumoScreen";

export default function EditarInsumoScreen({ insumo, onGuardar, onCancelar }) {
  const datosPrecargados = insumo;

  const titulo = `Editando: ${insumo?.nombre || ""} (${insumo?.codigo || ""})`;

  return (
    <RegistroInsumoScreen 
      datosPrecargados={datosPrecargados}
      onGuardar={onGuardar}
      onCancelar={onCancelar}
      titulo={titulo}
    />
  );
}

