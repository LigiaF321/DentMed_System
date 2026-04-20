import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
// import './components/dentist/styles/dentista-global.css'
// Importa solo en componentes del rol dentista si es necesario

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)