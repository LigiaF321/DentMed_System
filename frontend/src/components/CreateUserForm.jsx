import React, { useState, useMemo } from "react";
import "./CreateUserForm.css";

const CreateUserForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    especialidad: "Odontología General",
  });

  // Generar username automáticamente
  const generatedUsername = useMemo(() => {
    if (!formData.nombre || !formData.apellido) return "";
    const user = (formData.nombre + formData.apellido)
      .toLowerCase()
      .replace(/\s+/g, "")
      .substring(0, 12);
    return user;
  }, [formData.nombre, formData.apellido]);

  // Generar contraseña aleatoria
  const generatedPassword = useMemo(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido || !formData.email) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    const userData = {
      ...formData,
      username: generatedUsername,
      password: generatedPassword,
      createdAt: new Date().toISOString(),
    };

    if (typeof onSubmit === "function") {
      onSubmit(userData);
    }

    // Limpiar formulario
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      especialidad: "Odontología General",
    });
  };

  return (
    <div className="cuf-overlay">
      <div className="cuf-modal">
        <div className="cuf-header">
          <h2>Crear Nuevo Usuario</h2>
          <button type="button" className="cuf-close" onClick={onClose}>
            <i className="fa-solid fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cuf-form">
          <div className="cuf-row">
            <div className="cuf-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                required
              />
            </div>
            <div className="cuf-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                required
              />
            </div>
          </div>

          <div className="cuf-row">
            <div className="cuf-group">
              <label htmlFor="email">Correo Electrónico *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@dentmed.hn"
                required
              />
            </div>
            <div className="cuf-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+504 9999-9999"
              />
            </div>
          </div>

          <div className="cuf-group-full">
            <label htmlFor="especialidad">Especialidad</label>
            <select
              id="especialidad"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
            >
              <option value="Odontología General">Odontología General</option>
              <option value="Ortodoncia">Ortodoncia</option>
              <option value="Periodoncia">Periodoncia</option>
              <option value="Endodoncia">Endodoncia</option>
              <option value="Prostodoncia">Prostodoncia</option>
              <option value="Cirugía Oral">Cirugía Oral</option>
              <option value="Odontopediatría">Odontopediatría</option>
            </select>
          </div>

          {/* Datos generados automáticamente */}
          <div className="cuf-generated">
            <div className="cuf-gen-title">Credenciales Generadas</div>
            <div className="cuf-gen-row">
              <div className="cuf-gen-item">
                <label>Nombre de Usuario</label>
                <div className="cuf-gen-value">
                  <span>{generatedUsername || "—"}</span>
                  <button
                    type="button"
                    className="cuf-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedUsername);
                      alert("Usuario copiado");
                    }}
                    disabled={!generatedUsername}
                  >
                    <i className="fa-solid fa-copy" />
                  </button>
                </div>
              </div>
              <div className="cuf-gen-item">
                <label>Contraseña Temporal</label>
                <div className="cuf-gen-value">
                  <span>{generatedPassword}</span>
                  <button
                    type="button"
                    className="cuf-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      alert("Contraseña copiada");
                    }}
                  >
                    <i className="fa-solid fa-copy" />
                  </button>
                </div>
              </div>
            </div>
            <div className="cuf-gen-note">
              <i className="fa-solid fa-info-circle" />
              <span>
                El usuario deberá cambiar su contraseña en el primer inicio de
                sesión
              </span>
            </div>
          </div>

          <div className="cuf-actions">
            <button
              type="button"
              className="cuf-btn cuf-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="cuf-btn cuf-btn-create">
              <i className="fa-solid fa-user-plus me-2" />
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserForm;
