import React, { useState, useEffect } from "react";

export default function RestauracionScreen({ userData }) {
  const [pass, setPass] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [backups, setBackups] = useState([]);
  const [attempts, setAttempts] = useState(0); // Regla de los 3 intentos
  
  const [view, setView] = useState('list');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [isSimulated, setIsSimulated] = useState(true);
  const [percent, setPercent] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("");

  useEffect(() => {
    if (isAuth) {
      setBackups([
        { id: 1, fecha: "21/02/2026 03:00", tamano: "2.5 GB", tipo: "Completo", estado: "Válido" },
        { id: 2, fecha: "20/02/2026 03:00", tamano: "2.4 GB", tipo: "Completo", estado: "Válido" },
        { id: 3, fecha: "19/02/2026 03:00", tamano: "1.1 GB", tipo: "Incremental", estado: "Incompleto" }
      ]);
    }
  }, [isAuth]);

  const handleVerify = () => {
    if (attempts >= 2) {
      alert("SISTEMA BLOQUEADO: Demasiados intentos fallidos. Contacte a soporte técnico.");
      return;
    }

    if (pass === "Seguridad2026!") {
      setIsAuth(true);
    } else {
      setAttempts(prev => prev + 1);
      alert(`Contraseña incorrecta. Intento ${attempts + 1} de 3.`);
    }
  };

  const startRestoration = () => {
    if (confirmText !== "RESTAURAR") return;
    setShowConfirm(false);
    setView('progress');
    
    const steps = [
      { p: 15, t: "Generando backup de seguridad en /backups/pre_restauracion/..." },
      { p: 40, t: "Bloqueando accesos concurrentes al DentMed_System..." },
      { p: 65, t: "Limpiando tablas e inyectando registros..." },
      { p: 90, t: "Ejecutando auditoría de la operación..." },
      { p: 100, t: "Operación finalizada con éxito." }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPercent(step.p);
        setCurrentStepText(step.t);
        if (step.p === 100) setTimeout(() => setView('report'), 1000);
      }, (index + 1) * 1200);
    });
  };

  // --- 1. PANTALLA DE VERIFICACIÓN (Con contador de intentos) ---
  if (!isAuth) {
    return (
      <div className="dm2-page">
        <div className="dm2-card" style={{ border: '2px solid #e74c3c', maxWidth: '400px', margin: 'auto' }}>
          <div className="dm2-card-head" style={{ background: '#fff5f5' }}>
            <div className="dm2-card-title" style={{ color: '#e74c3c' }}>🔒 ÁREA RESTRINGIDA</div>
          </div>
          <div className="dm2-card-body">
            <p className="dm2-muted" style={{textAlign:'center'}}>Autenticación adicional requerida.</p>
            <input type="password" disabled={attempts >= 3} className="dm2-search-input" style={{width:'100%', marginBottom:'10px'}} placeholder="Contraseña Especial" value={pass} onChange={e=>setPass(e.target.value)} />
            <button className="dm2-updateBtn" style={{background: attempts >= 3 ? '#ccc' : '#e74c3c', width:'100%', justifyContent:'center'}} onClick={handleVerify}>
              {attempts >= 3 ? "ACCESO BLOQUEADO" : "VERIFICAR CREDENCIALES"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. VISTA DE PROGRESO (Bloqueo de sistema) ---
  if (view === 'progress') {
    return (
      <div className="dm2-page">
        <div className="dm2-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div className="dm2-card-title" style={{ color: '#e74c3c', marginBottom: '30px' }}>
            <i className="fa-solid fa-sync fa-spin" /> {isSimulated ? "SIMULANDO PROCESO..." : "RESTAURANDO SISTEMA..."}
          </div>
          <div style={{ background: '#eee', borderRadius: '10px', height: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#e74c3c', width: `${percent}%`, height: '100%', borderRadius: '10px', transition: 'width 0.4s' }} />
          </div>
          <div className="dm2-strong">{percent}%</div>
          <p className="dm2-muted">{currentStepText}</p>
        </div>
      </div>
    );
  }

  // --- 3. VISTA DE REPORTE (Completa según el diagrama TXT) ---
  if (view === 'report') {
    return (
      <div className="dm2-page">
        <div className="dm2-card" style={{ borderTop: '5px solid #27ae60' }}>
          <div className="dm2-card-head">
            <div className="dm2-card-title">✅ REPORTE FINAL DE RESTAURACIÓN</div>
          </div>
          <div className="dm2-card-body">
            <div className="dm2-table">
              <div className="dm2-thead">
                <div>TABLA</div>
                <div>OPERACIÓN</div>
                <div className="dm2-tcenter">REGISTROS AFECTADOS</div>
              </div>
              <div className="dm2-trow"><div>USUARIOS</div><div>Eliminados</div><div className="dm2-tcenter">3</div></div>
              <div className="dm2-trow"><div>DENTISTAS</div><div>Eliminados</div><div className="dm2-tcenter">1</div></div>
              <div className="dm2-trow"><div>PACIENTES</div><div>Eliminados</div><div className="dm2-tcenter">44</div></div>
              <div className="dm2-trow"><div>CITAS</div><div>Eliminados</div><div className="dm2-tcenter">111</div></div>
              <div className="dm2-trow"><div>INSUMOS</div><div>Eliminados</div><div className="dm2-tcenter">2</div></div>
              <div className="dm2-trow" style={{background: '#f9f9f9'}}>
                <div className="dm2-strong">AUDITORIA</div>
                <div>Nuevos registros</div>
                <div className="dm2-tcenter dm2-strong">1</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p style={{margin:0}}><strong>BACKUP DE SEGURIDAD CREADO:</strong> pre_restauracion_20260221_1145.sql</p>
              <p style={{margin:0}} className="dm2-muted"><strong>Ubicación:</strong> /backups/pre_restauracion/</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button className="dm2-updateBtn" style={{ flex: 1, background: '#3498db', justifyContent:'center' }}>📥 DESCARGAR REPORTE</button>
              <button className="dm2-updateBtn" style={{ flex: 1, background: '#27ae60', justifyContent:'center' }} onClick={() => window.location.reload()}>🔄 REINICIAR SESIÓN</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. VISTA DE LISTA (Principal) ---
  return (
    <div className="dm2-page">
      <div className="dm2-card" style={{ borderTop: '4px solid #e74c3c' }}>
        <div className="dm2-card-head">
          <div className="dm2-card-title">🔄 Restauración Guiada de Información</div>
        </div>
        <div className="dm2-card-body">
          <div style={{ background: '#fff5f5', padding: '10px', color: '#e74c3c', marginBottom: '20px', borderRadius: '5px', fontWeight: 'bold' }}>
            ⚠️ USE ESTA HERRAMIENTA SOLO EN CASOS DE EMERGENCIA
          </div>
          <div className="dm2-table">
            <div className="dm2-thead">
              <div>Fecha y Hora</div>
              <div className="dm2-tcenter">Tamaño</div>
              <div className="dm2-tcenter">Acciones</div>
            </div>
            {backups.map(b => (
              <div key={b.id} className="dm2-trow">
                <div className="dm2-strong">{b.fecha}</div>
                <div className="dm2-tcenter">{b.tamano}</div>
                <div className="dm2-tcenter">
                  <button 
                    className="dm2-linkBtn" 
                    disabled={b.estado === 'Incompleto'}
                    style={{color: b.estado === 'Incompleto' ? '#ccc' : '#e74c3c'}}
                    onClick={() => { setSelectedBackup(b); setShowConfirm(true); setConfirmText(""); }}
                  >
                    <i className="fa-solid fa-clock-rotate-left" /> Restaurar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="dm2-card" style={{ width: '480px' }}>
            <div className="dm2-card-head" style={{ background: '#e74c3c', color: 'white' }}>
              <div className="dm2-card-title">CONFIRMAR RESTAURACIÓN</div>
            </div>
            <div className="dm2-card-body">
              <p>¿Desea restaurar el backup del {selectedBackup?.fecha}?</p>
              <label style={{display:'flex', alignItems:'center', marginBottom:'15px', cursor:'pointer'}}>
                <input type="checkbox" checked={isSimulated} onChange={e=>setIsSimulated(e.target.checked)} style={{marginRight:'10px'}} /> 
                Ejecutar en Modo Simulación
              </label>
              <p style={{fontSize:'0.8rem', color:'#e74c3c'}}>Escriba <strong>RESTAURAR</strong> para confirmar:</p>
              <input type="text" className="dm2-search-input" style={{width:'100%', textAlign:'center'}} value={confirmText} onChange={e=>setConfirmText(e.target.value.toUpperCase())} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="dm2-updateBtn" style={{ flex: 1, background: '#ccc' }} onClick={() => setShowConfirm(false)}>CANCELAR</button>
                <button className="dm2-updateBtn" style={{ flex: 1, background: confirmText === "RESTAURAR" ? '#e74c3c' : '#fab1a0' }} disabled={confirmText !== "RESTAURAR"} onClick={startRestoration}>EJECUTAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}