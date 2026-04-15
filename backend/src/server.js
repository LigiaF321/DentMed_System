const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const http = require("http"); 
const { Server } = require("socket.io"); 
const app = require("./app");
const { iniciarCronAlertas } = require("./services/alertasCron.service"); 
const limpiarReservas = require("./scripts/limpiarReservas");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado al socket de DentMed");

  socket.on("actualizar_disponibilidad", (data) => {
    socket.broadcast.emit("notificar_cambio_consultorio", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Usuario desconectado");
  });
});    


server.listen(PORT, async () => {
  console.log("🚀 Servidor DentMed ejecutándose en el puerto " + PORT);
  console.log("📡 Health check: http://localhost:" + PORT + "/health");

 
  try {
    await iniciarCronAlertas();
    console.log("⏰ Cron de alertas iniciado correctamente");
  } catch (error) {
    console.error("❌ No se pudo iniciar el cron de alertas:", error.message);
  }

  setInterval(async () => {
    try {
      await limpiarReservas();
    } catch (error) {
      console.error("❌ Error en el intervalo de limpieza de reservas:", error.message);
    }
  }, 3600000);
});

app.set("socketio", io);