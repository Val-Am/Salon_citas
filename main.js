// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mysql = require('mysql2/promise'); // Usamos mysql2 con soporte para promesas

// Configuración de la base de datos MySQL
let dbConnection;
async function inicializarBaseDeDatos() {
  try {
    dbConnection = await mysql.createConnection({
      host: 'localhost',      // o la dirección de tu servidor MySQL
      user: 'root',     // tu usuario de MySQL
      password: '', // tu contraseña
      database: 'citas' // nombre de la base de datos
    });
    
    console.log('Conectado a MySQL');
    
    // Crear tabla si no existe
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS citas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente VARCHAR(100) NOT NULL,
        servicio VARCHAR(100) NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error al conectar con MySQL:', err);
    throw err; // Relanzar el error para manejo superior
  }
}

// Manejadores de IPC para operaciones de base de datos
function configurarManejadoresDB() {
  // Obtener todas las citas (con formato de fecha correcto)
  ipcMain.handle('obtener-citas', async () => {
    try {
      const [rows] = await dbConnection.execute(`
        SELECT 
          id, 
          cliente, 
          servicio, 
          DATE(fecha) as fecha, 
          TIME_FORMAT(hora, '%H:%i') as hora 
        FROM citas 
        ORDER BY fecha, hora
      `);
      return rows;
    } catch (err) {
      console.error('Error al obtener citas:', err);
      throw err;
    }
  });

  // Obtener una cita por ID (con formato de fecha correcto)
  ipcMain.handle('obtener-cita-por-id', async (event, id) => {
    try {
      const [rows] = await dbConnection.execute(`
        SELECT 
          id, 
          cliente, 
          servicio, 
          DATE(fecha) as fecha, 
          TIME_FORMAT(hora, '%H:%i') as hora 
        FROM citas 
        WHERE id = ?
      `, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error al obtener cita por ID:', err);
      throw err;
    }
  });

  // Agregar una nueva cita
  ipcMain.handle('agregar-cita', async (event, cita) => {
    try {
      const [result] = await dbConnection.execute(
        "INSERT INTO citas (cliente, servicio, fecha, hora) VALUES (?, ?, ?, ?)",
        [cita.cliente, cita.servicio, cita.fecha, cita.hora]
      );
      return { id: result.insertId, ...cita };
    } catch (err) {
      console.error('Error al agregar cita:', err);
      throw err;
    }
  });

  // Actualizar una cita existente
  ipcMain.handle('actualizar-cita', async (event, cita) => {
    try {
      await dbConnection.execute(
        "UPDATE citas SET cliente = ?, servicio = ?, fecha = ?, hora = ? WHERE id = ?",
        [cita.cliente, cita.servicio, cita.fecha, cita.hora, cita.id]
      );
      return cita;
    } catch (err) {
      console.error('Error al actualizar cita:', err);
      throw err;
    }
  });

  // Eliminar una cita
  ipcMain.handle('eliminar-cita', async (event, id) => {
    try {
      const [result] = await dbConnection.execute(
        "DELETE FROM citas WHERE id = ?", 
        [id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error al eliminar cita:', err);
      throw err;
    }
  });
}

// Crear ventanas de la aplicación
function createWindows() {
  // Ventana principal del Publicador (gestor de citas)
  const publicadorWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    title: 'Gestor de Citas - Salón de Belleza'
  });

  // Ventana del Cliente
  const clienteWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: 550,
    y: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Cliente - Salón de Belleza'
  });

  // Ventana del Estilista
  const estilistaWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: 1000,
    y: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Estilista - Salón de Belleza'
  });

  // Cargar las páginas HTML
  publicadorWindow.loadFile(path.join(__dirname, 'publicador', 'index.html'));
  clienteWindow.loadFile(path.join(__dirname, 'suscriptor-cliente', 'index.html'));
  estilistaWindow.loadFile(path.join(__dirname, 'suscriptor-estilista', 'index.html'));

  // Abrir herramientas de desarrollo (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    publicadorWindow.webContents.openDevTools();
  }
}

// Inicializar la aplicación
app.whenReady().then(async () => {
  try {
    await inicializarBaseDeDatos();
    configurarManejadoresDB();
    createWindows();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindows();
    });
  } catch (err) {
    console.error('Error al iniciar la aplicación:', err);
    app.quit();
  }
});

// Manejar el cierre de la aplicación
app.on('window-all-closed', async () => {
  if (dbConnection) {
    try {
      await dbConnection.end();
      console.log('Conexión a MySQL cerrada');
    } catch (err) {
      console.error('Error al cerrar la conexión a MySQL:', err);
    }
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});