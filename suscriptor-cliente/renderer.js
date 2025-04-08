// suscriptor_cliente/renderer.js
const amqp = require('amqplib');

async function recibirNotificacion() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const exchange = 'salon_citas';

    await channel.assertExchange(exchange, 'fanout', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true });

    channel.bindQueue(q.queue, exchange, '');

    channel.consume(q.queue, (msg) => {
      const cita = JSON.parse(msg.content.toString());
      const mensaje = `📩 Recordatorio para ${cita.cliente}: Tu cita de ${cita.servicio} es el ${cita.fecha} a las ${cita.hora}.`;
      document.getElementById('notificacion').innerText = mensaje;
    }, { noAck: true });

  } catch (err) {
    console.error("❌ Error en suscriptor cliente:", err);
    document.getElementById('notificacion').innerText =
      "❌ Error al conectar con RabbitMQ. ¿Está corriendo?";
  }
}

recibirNotificacion();
