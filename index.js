const { BrowserWindow, app, Menu, ipcMain, dialog } = require("electron");
const fs = require("fs-extra");
const { FileManager } = require("./lib/FileManager");
const path = require("path")


app.on("ready", build_app);

async function build_app() {
  const app_window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'logo.png')
  });

  app_window.loadFile("asset/index.html");

  const fileManager = new FileManager(app_window);

  let submenuOfOpenRecent = [];
  let paths = fileManager.readHistory();
  const allPaths = await paths;
  if (allPaths !== undefined) {
      allPaths.paths.map((path) => {
          submenuOfOpenRecent.push({ label: path, click: function () { fileManager.openRecentFile(path) } }, { type: 'separator' });
      })
  }

  let menu_list = [
    {
      label: "Soubor",
      submenu: [
        {
          label: "Otevřít soubor...",
          click: function () {
            fileManager.openFileWindow();
          },
        },
        {
          label: "Otevřít poslední...",
          submenu: submenuOfOpenRecent,
        },
        {
          label: "Uložit",
          click: function () {
            app_window.webContents.send('trigger-save');
          }
        }
      ],
    },
  ];

  const menu_design2 = Menu.buildFromTemplate(menu_list);
  Menu.setApplicationMenu(menu_design2);

  ipcMain.on("save-data", (e, arg) => {
    fs.writeFile(arg.path, arg.file, (err) => {
      if (err) {
        console.error("Chyba při zápisu souboru:", err);
        return;
      }
      console.log("Data uložena do", arg.path);
    });
  });

  const menu_design = Menu.buildFromTemplate(menu_list);
  Menu.setApplicationMenu(menu_design);

  ipcMain.on("newdata", (e, arg) => {
    console.log(arg);
  
    if (!arg.path.trim()) {
      dialog.showSaveDialog({
        title: 'Uložit soubor',
        buttonLabel: 'Uložit',
        filters: [{ name: 'Textové soubory', extensions: ['txt'] }]
      }).then(result => {
        if (!result.canceled && result.filePath) {
          fs.writeFile(result.filePath, arg.file, (err) => {
            if (err) {
              console.error("Chyba při zápisu souboru:", err);
              return;
            }
            console.log("Data uložena do", result.filePath);
          });
        }
      }).catch(err => {
        console.error("Chyba při zobrazení dialogu pro uložení:", err);
      });
    } else {
      fs.writeFile(arg.path, arg.file, (err) => {
        if (err) {
          console.error("Chyba při zápisu souboru:", err);
          return;
        }
        console.log("Data uložena do", arg.path);
      });
    }
  });
}
