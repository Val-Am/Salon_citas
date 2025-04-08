const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindows() {
  // Ventana del Publicador
  const publicadorWindow = new BrowserWindow({
    width: 400,
    height: 580,
    x: 100, // Posición en X
    y: 100, // Posición en Y
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Ventana del Cliente
  const clienteWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: 550, // Cambia X para que no se superpongan
    y: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Ventana del Estilista
  const estilistaWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: 1000, // Otra posición
    y: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  publicadorWindow.loadFile(path.join(__dirname, 'publicador', 'index.html'));
  clienteWindow.loadFile(path.join(__dirname, 'suscriptor-cliente', 'index.html'));
  estilistaWindow.loadFile(path.join(__dirname, 'suscriptor-estilista', 'index.html'));
}

app.whenReady().then(createWindows);
