// publicador/renderer.js
const amqp = require('amqplib');

async function enviarCita() {
  const cliente = document.getElementById('cliente').value;
  const servicio = document.getElementById('servicio').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;

  if (!cliente || !servicio || !fecha || !hora) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const message = { cliente, servicio, fecha, hora };

  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const exchange = 'salon_citas';

    await channel.assertExchange(exchange, 'fanout', { durable: false });
    channel.publish(exchange, '', Buffer.from(JSON.stringify(message)));

    document.getElementById('mensajeConfirmacion').innerText =
      `✅ Cita enviada para ${cliente} el ${fecha} a las ${hora}`;

    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (err) {
    console.error("❌ Error al enviar la cita:", err);
    alert("Error al enviar la cita. Revisa que RabbitMQ esté corriendo.");
  }
}
