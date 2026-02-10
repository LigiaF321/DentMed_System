const form = document.getElementById("dentistForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const payload = {
    nombre: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("phone").value.trim(),
    especialidad: document.getElementById("specialty").value.trim(),
  };

  if (!payload.nombre || !payload.email) {
    message.textContent = "Nombre y correo son obligatorios.";
    message.style.color = "red";
    return;
  }

  message.textContent = "Creando dentista...";
  message.style.color = "#2c3e50";

  try {
    const res = await fetch("http://localhost:3000/api/admin/dentistas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // opcional: simular id del admin si quieres que auditoría guarde un id
        // "x-user-id": "1"
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.status === 409) {
      message.textContent = "Ese correo ya está registrado.";
      message.style.color = "red";
      return;
    }

    if (!res.ok) {
      message.textContent = data?.error || "Error al crear el dentista.";
      message.style.color = "red";
      return;
    }

    message.textContent = "Dentista creado exitosamente.";
    message.style.color = "green";
    form.reset();
  } catch (err) {
    console.error(err);
    message.textContent = "No se pudo conectar con el servidor.";
    message.style.color = "red";
  }
});

