# 💇‍♀️ Salón de Citas - Publicador / Suscriptor 📨

Este es un proyecto de arquitectura de software implementado con el patrón **Publicador-Suscriptor**, utilizando **RabbitMQ** para el envío de notificaciones entre interfaces de un salón de belleza.
La interfaz fue desarrollada en **Electron**, funcionando como una aplicación de escritorio multiplataforma.

---

## 🧩 Funcionalidad

- **Publicador**: Crea citas con los datos del cliente, servicio, fecha y hora.
- **Suscriptor Cliente**: Recibe una notificación de confirmación cuando se asigna una cita.
- **Suscriptor Estilista**: Recibe notificación para preparar el servicio correspondiente.

Cada uno se ejecuta en una **ventana independiente**, y las notificaciones se propagan automáticamente mediante RabbitMQ.

---

## 📦 Tecnologías utilizadas

- Node.js
- Electron
- RabbitMQ
- amqplib
- HTML, CSS y JavaScript

---

## ✍️ Autores
👩‍💻 Valentina Aguiar Morales - @Val-AM

👨‍💻 Jineth Rivera Moreno - @JinRivera

👩‍💻 Maria Paula Rodriguez - @Cutemalyx
