const { BrowserWindow, app, Menu, ipcMain, dialog } = require("electron");
const fs = require("fs-extra");
const { FileManager } = require("./lib/FileManager");
const path = require("path")
let fileManager;

app.on("ready", build_app);

async function build_app() {
  const app_window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'logo.png')
  });

  app_window.loadFile("asset/index.html");

  fileManager = new FileManager(app_window);
  await createMenu(fileManager);
}
  async function createMenu(fileManager) {
    Menu.setApplicationMenu(null);
    const allPaths = await fileManager.readHistory();
    let submenuOfOpenRecent = [];
  
    if (allPaths && allPaths.paths) {
      allPaths.paths.forEach((path) => {
        submenuOfOpenRecent.push({ label: path, click: () => fileManager.openRecentFile(path) });
        submenuOfOpenRecent.push({ type: 'separator' });
      });
    }
  
    let menu_list = [
      {
        label: "File",
        submenu: [
          {
            label: "Otevřít soubor...",
            accelerator: "CmdOrCtrl+O",
            click: () => fileManager.openFileWindow(),
          },
          {
            label: "Otevřít poslední...",
            submenu: submenuOfOpenRecent,
          },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Uložení",
            accelerator: "CmdOrCtrl+S",
          }
        ],
      }
    ];
  
    const menu_design = Menu.buildFromTemplate(menu_list);
    Menu.setApplicationMenu(menu_design);
  }
  

  ipcMain.on("save-data", (e, arg) => {
    fs.writeFile(arg.path, arg.file, async (err) => {
      if (err) {
        console.error("Chyba při zápisu souboru:", err);
        return;
      }
      console.log("Data uložena do", arg.path);
      await createMenu(fileManager);
    });
  });

  ipcMain.on("newdata", (e, arg) => {
  
    if (!arg.path.trim()) {
      dialog.showSaveDialog({
        title: 'Uložit soubor',
        buttonLabel: 'Uložit',
        filters: [{ name: 'Textové soubory', extensions: ['txt'] }]
      }).then(result => {
        if (!result.canceled && result.filePath) {
          fs.writeFile(result.filePath, arg.file, async (err) => {
            if (err) {
              console.error("Chyba při zápisu souboru:", err);
              return;
            }
            console.log("Data uložena do", result.filePath);
            await fileManager.saveHistory(result.filePath);
            await createMenu(fileManager);
            fileManager.openRecentFile(result.filePath);
          });
        }
      }).catch(err => {
        console.error("Chyba při zobrazení dialogu pro uložení:", err);
      });
    } else {
      fs.writeFile(arg.path, arg.file, async (err) => {
        if (err) {
          console.error("Chyba při zápisu souboru:", err);
          return;
        }
        console.log("Data uložena do", arg.path);
        await createMenu(fileManager);
      });
    }
  });

