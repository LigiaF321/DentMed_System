import DentistForm from "./DentistForm";
import "./admin.css";

export default function CreateDentistScreen() {
  return (
    <div className="adm-page">
      <div className="adm-hero">
        <div className="adm-hero-ico">
          <i className="fa-solid fa-user-plus" />
        </div>

        <h1 className="adm-hero-title">Crear cuenta de dentista</h1>
        <p className="adm-hero-sub">
          Formulario para registrar nuevos dentistas en el sistema.
        </p>
      </div>

      {/*AQUÍ : EL FORMULARIO */}
      <div className="adm-form-wrap">
        <DentistForm />
      </div>
    </div>
  );
}
