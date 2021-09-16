const { io } = require("../server/server");
const bot = require("../server/pricebot");

// SOCKETS MANAGEMENT
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('sendScreenshot', (data, callback) => {

    let persona = usuarios.getPersona(client.id);

    let mensaje = crearMensaje(persona.nombre, data.mensaje);
    socket.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

    callback(mensaje);

  });

});
