import React, { useState, useEffect } from "react";

export default function RestauracionScreen() {
  // --- ESTADOS DE CONTROL DE FLUJO ---
  const [view, setView] = useState('auth'); // auth, list, step1, step2, step3, step4, step5, progress, report
  const [pass, setPass] = useState("");
  const [attempts, setAttempts] = useState(0);

  // --- DATOS DEL SISTEMA ---
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreType, setRestoreType] = useState("completa"); 
  const [confirmText, setConfirmText] = useState("");
  const [percent, setPercent] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("");

  // --- SELECCION DE TABLAS (PASO 2) ---
  const [tablasSeleccionadas, setTablasSeleccionadas] = useState({
    USUARIOS: true, DENTISTAS: true, PACIENTES: true, CITAS: true,
    INSUMOS: true, INVENTARIO: true, CONFIGURACION: true, AUDITORIA: false
  });

  // Carga de datos iniciales segun documentacion
  useEffect(() => {
    setBackups([
      { id: 1, fecha: "21/02/2026 03:00", tamano: "2.5 GB", tipo: "Completo", estado: "Valido" },
      { id: 2, fecha: "20/02/2026 03:00", tamano: "2.4 GB", tipo: "Completo", estado: "Valido" },
      { id: 3, fecha: "19/02/2026 03:00", tamano: "2.4 GB", tipo: "Completo", estado: "Valido" },
      { id: 4, fecha: "18/02/2026 03:00", tamano: "2.3 GB", tipo: "Incremental", estado: "Incompleto" },
      { id: 5, fecha: "15/02/2026 12:30", tamano: "500 MB", tipo: "Selectivo", estado: "Valido" }
    ]);
  }, []);

  // --- LOGICA DE PROCESOS ---
  const handleVerify = () => {
    if (pass === "Seguridad2026!") {
      setView('list');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) alert("ACCESO BLOQUEADO: Se ha superado el limite de intentos.");
      else alert(`Contrasena incorrecta. Intento ${newAttempts} de 3.`);
    }
  };

  const startFinalProcess = () => {
    if (confirmText !== "RESTAURAR") return;
    setView('progress');
    const steps = [
      { p: 10, t: "Verificando integridad del archivo de respaldo..." },
      { p: 30, t: "Paso 1/4: Restaurando estructura de tablas... OK" },
      { p: 60, t: "Paso 2/4: Restaurando registros de base de datos... (60%)" },
      { p: 85, t: "Paso 3/4: Verificando consistencia de llaves foraneas..." },
      { p: 95, t: "Paso 4/4: Finalizando y reconstruyendo indices..." },
      { p: 100, t: "Proceso finalizado exitosamente." }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPercent(step.p);
        setCurrentStepText(step.t);
        if (step.p === 100) setTimeout(() => setView('report'), 1000);
      }, (index + 1) * 1200);
    });
  };

  // --- VISTAS DEL COMPONENTE ---

  // 0. Autenticacion Especial
  if (view === 'auth') return (
    <div className="dm2-page">
      <div className="dm2-card" style={{maxWidth:'500px', margin:'60px auto', borderTop:'5px solid #c0392b'}}>
        <div className="dm2-card-head" style={{background:'#fdf2f2'}}><div className="dm2-card-title" style={{color:'#c0392b'}}>AREA RESTRINGIDA - AUTENTICACION ADICIONAL</div></div>
        <div className="dm2-card-body" style={{textAlign:'center'}}>
          <p className="dm2-muted">Esta area permite restaurar informacion del sistema. Solo personal autorizado.</p>
          <div style={{margin:'25px 0'}}>
             <label className="dm2-strong">Usuario: admin</label>
             <input type="password" placeholder="Ingrese contrasena especial" className="dm2-search-input" style={{width:'100%', marginTop:'12px', textAlign:'center'}} value={pass} onChange={e=>setPass(e.target.value)} />
          </div>
          <button className="dm2-updateBtn" style={{width:'100%', background:'#c0392b', color:'white', justifyContent:'center'}} onClick={handleVerify} disabled={attempts>=3}>
            {attempts >= 3 ? "ACCESO DENEGADO" : "VERIFICAR CREDENCIALES"}
          </button>
        </div>
      </div>
    </div>
  );

  // 1. Seleccion de Backup
  if (view === 'list') return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head"><div className="dm2-card-title">RESTAURACION GUIADA: BACKUPS DISPONIBLES</div></div>
        <div className="dm2-card-body">
          <div className="dm2-table">
            <div className="dm2-thead">
              <div>FECHA Y HORA</div><div>TAMANO</div><div>TIPO</div><div>ESTADO</div><div className="dm2-tcenter">ACCIONES</div>
            </div>
            {backups.map(b => (
              <div key={b.id} className="dm2-trow">
                <div className="dm2-strong">{b.fecha}</div>
                <div>{b.tamano}</div>
                <div>{b.tipo}</div>
                <div style={{color: b.estado === 'Valido' ? '#27ae60' : '#e67e22'}}>{b.estado === 'Valido' ? 'Valido' : 'Parcial'}</div>
                <div className="dm2-tcenter">
                  <button className="dm2-linkBtn" onClick={() => { setSelectedBackup(b); setView('step1'); }}>Restaurar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 2. Paso 1: Tipo de Restauracion
  if (view === 'step1') return (
    <div className="dm2-page">
      <div className="dm2-card" style={{borderTop:'4px solid #2980b9'}}>
        <div className="dm2-card-head"><div className="dm2-card-title">PASO 1: SELECCIONAR TIPO DE RESTAURACION</div></div>
        <div className="dm2-card-body">
          <p className="dm2-strong">Respaldo: {selectedBackup.fecha} - {selectedBackup.tipo}</p>
          <div className="dm2-card" style={{padding:'15px', cursor:'pointer', marginTop:'15px', border: restoreType==='completa'?'2px solid #2980b9':'1px solid #ddd'}} onClick={()=>setRestoreType('completa')}>
            <div className="dm2-strong">RESTAURACION COMPLETA</div>
            <p className="dm2-muted">Reemplaza toda la base de datos y archivos con la version del backup.</p>
          </div>
          <div className="dm2-card" style={{padding:'15px', cursor:'pointer', marginTop:'10px', border: restoreType==='selectiva'?'2px solid #2980b9':'1px solid #ddd'}} onClick={()=>setRestoreType('selectiva')}>
            <div className="dm2-strong">RESTAURACION SELECTIVA</div>
            <p className="dm2-muted">Permite elegir tablas especificas (Usuarios, Pacientes, Citas, etc.).</p>
          </div>
          <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
            <button className="dm2-updateBtn" style={{background:'#95a5a6'}} onClick={()=>setView('list')}>CANCELAR</button>
            <button className="dm2-updateBtn" style={{background:'#2980b9', color:'white'}} onClick={()=>setView(restoreType==='selectiva'?'step2':'step3')}>SIGUIENTE</button>
          </div>
        </div>
      </div>
    </div>
  );

  // 3. Paso 2: Tablas
  if (view === 'step2') return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head"><div className="dm2-card-title">PASO 2: SELECCIONAR TABLAS ESPECIFICAS</div></div>
        <div className="dm2-card-body">
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px'}}>
            {Object.keys(tablasSeleccionadas).map(t => (
              <label key={t} style={{padding:'12px', border:'1px solid #eee', borderRadius:'4px', display:'flex', alignItems:'center', cursor:'pointer'}}>
                <input type="checkbox" checked={tablasSeleccionadas[t]} onChange={e => setTablasSeleccionadas({...tablasSeleccionadas, [t]: e.target.checked})} style={{marginRight:'10px'}} />
                {t}
              </label>
            ))}
          </div>
          <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
            <button className="dm2-updateBtn" style={{background:'#95a5a6'}} onClick={()=>setView('step1')}>ANTERIOR</button>
            <button className="dm2-updateBtn" style={{background:'#2980b9', color:'white'}} onClick={()=>setView('step3')}>SIGUIENTE</button>
          </div>
        </div>
      </div>
    </div>
  );

  // 4. Paso 3: Simulacion de Impacto
  if (view === 'step3') return (
    <div className="dm2-page">
      <div className="dm2-card" style={{borderTop:'4px solid #f39c12'}}>
        <div className="dm2-card-head"><div className="dm2-card-title">PASO 3: MODO SIMULACION - IMPACTO ESTIMADO</div></div>
        <div className="dm2-card-body">
          <div style={{background:'#fffcf0', padding:'12px', border:'1px solid #f1c40f', color:'#856404', borderRadius:'4px', marginBottom:'20px'}}>
            ADVERTENCIA: Los registros creados despues del backup se perderan permanentemente.
          </div>
          <div className="dm2-table">
            <div className="dm2-thead"><div>TABLA</div><div>ACTUAL</div><div>BACKUP</div><div>DIFERENCIA</div></div>
            <div className="dm2-trow"><div>USUARIOS</div><div>248</div><div>245</div><div style={{color:'#c0392b', fontWeight:'bold'}}>-3 registros</div></div>
            <div className="dm2-trow"><div>PACIENTES</div><div>1,289</div><div>1,245</div><div style={{color:'#c0392b', fontWeight:'bold'}}>-44 registros</div></div>
            <div className="dm2-trow"><div>CITAS</div><div>3,678</div><div>3,567</div><div style={{color:'#c0392b', fontWeight:'bold'}}>-111 registros</div></div>
          </div>
          <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
            <button className="dm2-updateBtn" style={{background:'#95a5a6'}} onClick={()=>setView('step1')}>ANTERIOR</button>
            <button className="dm2-updateBtn" style={{background:'#f39c12', color:'white'}} onClick={()=>setView('step4')}>CONTINUAR A RESTAURACION REAL</button>
          </div>
        </div>
      </div>
    </div>
  );

  // 5. Paso 4: Backup de Seguridad
  if (view === 'step4') return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head"><div className="dm2-card-title">PASO 4: GENERAR RESPALDO PREVENTIVO</div></div>
        <div className="dm2-card-body">
          <p>Antes de proceder, el sistema creara una copia de seguridad del estado actual para permitir una reversion en caso de error.</p>
          <div style={{background:'#f4f7f6', padding:'20px', borderRadius:'6px', border:'1px solid #d1d8d7', margin:'20px 0'}}>
            <p className="dm2-strong">Detalles del Respaldo Actual:</p>
            <p>Archivo: pre_restauracion_20260310_1025.sql</p>
            <p>Tamano estimado: 2.5 GB</p>
            <p>Ruta: /backups/pre_restauracion/</p>
          </div>
          <button className="dm2-updateBtn" style={{width:'100%', background:'#27ae60', color:'white', justifyContent:'center'}} onClick={()=>setView('step5')}>
            GENERAR RESPALDO Y CONTINUAR
          </button>
        </div>
      </div>
    </div>
  );

  // 6. Paso 5: Confirmacion Final
  if (view === 'step5') return (
    <div className="dm2-page">
      <div className="dm2-card" style={{borderTop:'5px solid #c0392b'}}>
        <div className="dm2-card-head"><div className="dm2-card-title" style={{color:'#c0392b'}}>PASO 5: CONFIRMACION FINAL IRREVERSIBLE</div></div>
        <div className="dm2-card-body">
          <p>Usted esta a punto de restaurar el sistema al estado del <strong>{selectedBackup.fecha}</strong>.</p>
          <div style={{margin:'25px 0', padding:'20px', background:'#fff5f5', border:'1px solid #fac1c1', borderRadius:'4px'}}>
            <label className="dm2-strong">Escriba la palabra RESTAURAR para proceder:</label>
            <input type="text" className="dm2-search-input" style={{width:'100%', textAlign:'center', marginTop:'10px', textTransform:'uppercase'}} value={confirmText} onChange={e=>setConfirmText(e.target.value.toUpperCase())} placeholder="RESTAURAR" />
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button className="dm2-updateBtn" style={{flex:1, background:'#95a5a6'}} onClick={()=>setView('list')}>CANCELAR</button>
            <button className="dm2-updateBtn" disabled={confirmText!=='RESTAURAR'} style={{flex:2, background:confirmText==='RESTAURAR'?'#c0392b':'#e6b0aa', color:'white', justifyContent:'center'}} onClick={startFinalProcess}>
              CONFIRMAR Y EJECUTAR RESTAURACION
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 7. Pantalla de Progreso
  if (view === 'progress') return (
    <div className="dm2-page">
      <div className="dm2-card" style={{textAlign:'center', padding:'50px'}}>
        <div className="dm2-card-title" style={{color:'#2980b9', marginBottom:'25px'}}>EJECUTANDO RESTAURACION DEL SISTEMA</div>
        <div style={{background:'#ecf0f1', height:'30px', borderRadius:'15px', overflow:'hidden', marginBottom:'20px', border:'1px solid #bdc3c7'}}>
          <div style={{width:`${percent}%`, background:'#2980b9', height:'100%', transition:'width 0.6s ease'}}></div>
        </div>
        <div className="dm2-strong" style={{fontSize:'1.2rem'}}>{percent}%</div>
        <p className="dm2-muted" style={{marginTop:'15px'}}>{currentStepText}</p>
        <p style={{fontSize:'0.85rem', color:'#7f8c8d', marginTop:'20px'}}>Por favor, no cierre el navegador ni apague el equipo.</p>
      </div>
    </div>
  );

  // 8. Reporte Final
  if (view === 'report') return (
    <div className="dm2-page">
      <div className="dm2-card" style={{borderTop:'5px solid #27ae60'}}>
        <div className="dm2-card-head"><div className="dm2-card-title" style={{color:'#27ae60'}}>REPORTE DE RESTAURACION COMPLETADA</div></div>
        <div className="dm2-card-body">
          <div style={{marginBottom:'20px'}}>
            <p className="dm2-strong">Estado: Operacion Exitosa</p>
            <p>Fecha de ejecucion: 10/03/2026 10:25 AM</p>
            <p>Backup origen: {selectedBackup.fecha}</p>
          </div>
          <div className="dm2-table">
            <div className="dm2-thead"><div>TABLA</div><div>OPERACION</div><div>REGISTROS AFECTADOS</div></div>
            <div className="dm2-trow"><div>USUARIOS</div><div>Eliminados</div><div>3</div></div>
            <div className="dm2-trow"><div>PACIENTES</div><div>Eliminados</div><div>44</div></div>
            <div className="dm2-trow"><div>CITAS</div><div>Eliminados</div><div>111</div></div>
            <div className="dm2-trow" style={{background:'#f0fff4'}}><div className="dm2-strong">AUDITORIA</div><div>Nuevo registro</div><div>1 (Log de Restauracion)</div></div>
          </div>
          <div style={{display:'flex', gap:'15px', marginTop:'30px'}}>
            <button className="dm2-updateBtn" style={{background:'#34495e', color:'white'}}>DESCARGAR REPORTE PDF</button>
            <button className="dm2-updateBtn" style={{background:'#27ae60', color:'white'}} onClick={()=>window.location.reload()}>FINALIZAR Y REINICIAR</button>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}