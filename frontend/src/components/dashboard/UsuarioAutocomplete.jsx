import React from 'react';
import AsyncSelect from 'react-select/async';

export default function UsuarioAutocomplete({ usuarios, value, onChange }) {

  const options = usuarios.map(u => ({
    value: u.usuario_id,
    label: u.usuario_nombre + (u.nombre_completo ? ' - ' + u.nombre_completo : '')
  }));

  // Filtro para búsqueda
  const filterOptions = (inputValue) => {
    return options.filter(i =>
      i.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  // Carga las opciones de forma asíncrona
  const loadOptions = (inputValue, callback) => {
    callback(filterOptions(inputValue));
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions={options}
      loadOptions={loadOptions}
      value={options.find(o => o.value === value) || null}
      onChange={opt => onChange(opt ? opt.value : '')}
      placeholder="Buscar usuario..."
      isClearable
    />
  );
}
