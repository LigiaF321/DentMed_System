const msg = document.getElementById("message");
let backupSeleccionado = null;

// 1. Verificar Seguridad
async function verificarSeguridad() {
    const pass = document.getElementById("specialPassword").value;
    try {
        const res = await fetch("http://localhost:3000/api/restauracion/verificar-credenciales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: 1, password_especial: pass })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById("section-auth").classList.add("hidden");
            document.getElementById("section-main").classList.remove("hidden");
            cargarBackups();
        } else {
            msg.textContent = data.error;
            msg.style.color = "red";
        }
    } catch (err) {
        msg.textContent = "Error de conexión con el servidor.";
    }
}

// 2. Cargar lista de backups
async function cargarBackups() {
    const res = await fetch("http://localhost:3000/api/restauracion/backups");
    const backups = await res.json();
    const body = document.getElementById("backupsBody");
    body.innerHTML = "";

    backups.forEach(b => {
        body.innerHTML += `
            <tr>
                <td>${new Date(b.fecha_backup).toLocaleString()}</td>
                <td>${b.tamaño}</td>
                <td>${b.estado}</td>
                <td><button onclick="prepararRestauracion(${b.id})" class="btn-restore">🔄 Seleccionar</button></td>
            </tr>
        `;
    });
}

// 3. Simular Impacto
async function prepararRestauracion(id) {
    backupSeleccionado = id;
    const res = await fetch("http://localhost:3000/api/restauracion/simular", { method: "POST" });
    const data = await res.json();

    const details = document.getElementById("impactDetails");
    details.innerHTML = "<ul>" + data.impacto.map(i => `<li><b>${i.tabla}</b>: ${i.registros} registros afectados</li>`).join("") + "</ul>";
    
    document.getElementById("section-impact").classList.remove("hidden");
    msg.textContent = "Backup seleccionado. Revise el impacto antes de continuar.";
    msg.style.color = "#3498db";
}

// 4. Ejecución final
async function ejecutarRestauracion() {
    const confirm = document.getElementById("confirmText").value;
    if (confirm !== "RESTAURAR") {
        alert("Debe escribir RESTAURAR en mayúsculas.");
        return;
    }

    const res = await fetch("http://localhost:3000/api/restauracion/ejecutar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacion: confirm, usuario_id: 1, backup_id: backupSeleccionado })
    });
    const data = await res.json();

    if (data.success) {
        alert(data.mensaje);
        window.location.reload();
    }
}