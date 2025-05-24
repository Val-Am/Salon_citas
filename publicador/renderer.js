// publicador/renderer.js
const { ipcRenderer } = require('electron');
const amqp = require('amqplib');

// Conexión a RabbitMQ
let channel;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    const exchange = 'salon_citas';
    await channel.assertExchange(exchange, 'fanout', { durable: false });
    console.log("Conectado a RabbitMQ");
  } catch (err) {
    console.error("Error al conectar con RabbitMQ:", err);
  }
}

// Conectar al iniciar
connectRabbitMQ();

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'success') {
  const elemento = document.getElementById('mensaje');
  elemento.textContent = mensaje;
  elemento.className = `mensaje ${tipo}`;
  setTimeout(() => elemento.textContent = '', 3000);
}

// Función para formatear la fecha (elimina la parte de tiempo si existe)
function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  
  // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    return fechaStr;
  }
  
  // Si es un objeto Date, formatearlo
  if (fechaStr instanceof Date) {
    const year = fechaStr.getFullYear();
    const month = String(fechaStr.getMonth() + 1).padStart(2, '0');
    const day = String(fechaStr.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Si incluye tiempo, extraer solo la parte de la fecha
  return fechaStr.split('T')[0];
}

// Función para cargar citas desde la base de datos
async function cargarCitas() {
  try {
    const citas = await ipcRenderer.invoke('obtener-citas');
    const tbody = document.getElementById('citas-body');
    tbody.innerHTML = '';

    citas.forEach(cita => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cita.cliente}</td>
        <td>${cita.servicio}</td>
        <td>${formatearFecha(cita.fecha)}</td>
        <td>${cita.hora}</td>
        <td class="action-buttons">
          <button onclick="editarCita(${cita.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-danger" onclick="eliminarCita(${cita.id})"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar citas:", err);
    mostrarMensaje("Error al cargar citas", "error");
  }
}

// Función para guardar o actualizar una cita
async function guardarCita() {
  const id = document.getElementById('cita-id').value;
  const cliente = document.getElementById('cliente').value;
  const servicio = document.getElementById('servicio').value;
  const fechaInput = document.getElementById('fecha');
  const hora = document.getElementById('hora').value;

  // Validar campos obligatorios
  if (!cliente || !servicio || !fechaInput.value || !hora) {
    mostrarMensaje("Por favor completa todos los campos", "error");
    return;
  }

  // Formatear fecha correctamente
  const fecha = formatearFecha(fechaInput.value);
  
  const cita = { cliente, servicio, fecha, hora };

  try {
    if (id) {
      // Actualizar cita existente
      cita.id = parseInt(id);
      await ipcRenderer.invoke('actualizar-cita', cita);
      mostrarMensaje("Cita actualizada correctamente");
    } else {
      // Crear nueva cita
      await ipcRenderer.invoke('agregar-cita', cita);
      mostrarMensaje("Cita agregada correctamente");
    }

    // Publicar en RabbitMQ
    if (channel) {
      channel.publish('salon_citas', '', Buffer.from(JSON.stringify(cita)));
    }

    // Limpiar formulario y recargar lista
    limpiarFormulario();
    cargarCitas();
  } catch (err) {
    console.error("Error al guardar cita:", err);
    mostrarMensaje("Error al guardar la cita", "error");
  }
}

// Función para editar una cita
async function editarCita(id) {
  try {
    const cita = await ipcRenderer.invoke('obtener-cita-por-id', id);
    
    if (cita) {
      document.getElementById('cita-id').value = cita.id;
      document.getElementById('cliente').value = cita.cliente;
      document.getElementById('servicio').value = cita.servicio;
      document.getElementById('fecha').value = formatearFecha(cita.fecha);
      document.getElementById('hora').value = cita.hora;
      
      document.getElementById('form-title').textContent = "✏️ Editar Cita";
      document.getElementById('btn-submit').textContent = "Actualizar Cita";
      document.getElementById('btn-cancel').classList.remove('hidden');
    }
  } catch (err) {
    console.error("Error al editar cita:", err);
    mostrarMensaje("Error al cargar cita para editar", "error");
  }
}

// Función para eliminar una cita
async function eliminarCita(id) {
  if (confirm("¿Estás seguro de que deseas eliminar esta cita?")) {
    try {
      await ipcRenderer.invoke('eliminar-cita', id);
      mostrarMensaje("Cita eliminada correctamente");
      cargarCitas();
    } catch (err) {
      console.error("Error al eliminar cita:", err);
      mostrarMensaje("Error al eliminar la cita", "error");
    }
  }
}

// Función para buscar citas
async function buscarCitas() {
  const termino = document.getElementById('search').value.toLowerCase();
  try {
    const citas = await ipcRenderer.invoke('obtener-citas');
    const tbody = document.getElementById('citas-body');
    tbody.innerHTML = '';

    const citasFiltradas = citas.filter(cita => 
      cita.cliente.toLowerCase().includes(termino) || 
      cita.servicio.toLowerCase().includes(termino)
    );

    citasFiltradas.forEach(cita => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cita.cliente}</td>
        <td>${cita.servicio}</td>
        <td>${formatearFecha(cita.fecha)}</td>
        <td>${cita.hora}</td>
        <td class="action-buttons">
          <button onclick="editarCita(${cita.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-danger" onclick="eliminarCita(${cita.id})"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al buscar citas:", err);
    mostrarMensaje("Error al buscar citas", "error");
  }
}

// Función para cancelar edición
function cancelarEdicion() {
  limpiarFormulario();
  document.getElementById('form-title').textContent = "☎️ Agendar Nueva Cita";
  document.getElementById('btn-submit').textContent = "Guardar Cita";
  document.getElementById('btn-cancel').classList.add('hidden');
}

// Función para limpiar el formulario
function limpiarFormulario() {
  document.getElementById('cita-id').value = '';
  document.getElementById('cliente').value = '';
  document.getElementById('servicio').value = '';
  document.getElementById('fecha').value = '';
  document.getElementById('hora').value = '';
}

// Cargar citas al iniciar
document.addEventListener('DOMContentLoaded', () => {
  cargarCitas();
  
  // Permitir búsqueda al presionar Enter
  document.getElementById('search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      buscarCitas();
    }
  });

  // Configurar el campo de fecha para que muestre el formato correcto
  const fechaInput = document.getElementById('fecha');
  fechaInput.addEventListener('change', () => {
    fechaInput.value = formatearFecha(fechaInput.value);
  });
});

// Hacer funciones accesibles desde el HTML
window.guardarCita = guardarCita;
window.editarCita = editarCita;
window.eliminarCita = eliminarCita;
window.buscarCitas = buscarCitas;
window.cancelarEdicion = cancelarEdicion;