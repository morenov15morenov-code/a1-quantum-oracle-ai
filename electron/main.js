const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = path.join(process.resourcesPath, "app", "next-standalone", "server.js");
  serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: "3001", NODE_ENV: "production" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", (data) => console.log(`[server] ${data}`));
  serverProcess.stderr.on("data", (data) => console.error(`[server] ${data}`));
  return new Promise((resolve) => {
    serverProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Listening on")) resolve();
    });
    setTimeout(resolve, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Atlas Oracle",
    icon: path.join(__dirname, "..", "frontend", "assets", "icons", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const url = isDev
    ? "http://localhost:3000"
    : "http://localhost:3001";

  mainWindow.loadURL(url);

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  if (!isDev) {
    await startServer();
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
