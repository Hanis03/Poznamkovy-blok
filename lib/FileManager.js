const os = require("os");
const fs = require("fs-extra");
const { dialog } = require("electron");

class FileManager {
  constructor(app_window) {
    const { homedir } = os.userInfo();
    this.homedir = homedir;
    this.historyPath = this.homedir + "/.config/history/info.json";
    this.app_window = app_window;
  }

  saveHistory(path) {
    const dirPath = this.homedir + "/.config/history";

    // Ensure that the directory exists
    fs.ensureDir(dirPath)
      .then(() => fs.ensureFile(this.historyPath))
      .then(() => fs.readJson(this.historyPath, { throws: false }))
      .then((r) => {
        if (r === null) {
          const obj = {
            paths: [path],
          };
          return fs.writeJson(this.historyPath, obj);
        } else {
          if (!r.paths.includes(path)) {
            r.paths.push(path);
            return fs.writeJson(this.historyPath, r);
          }
        }
      })
      .catch((err) => {
        console.error("Chyba při ukládání historie:", err);
        throw err;
      });
  }

  readHistory() {
    return fs
      .readJson(this.historyPath, { throws: false })
      .then((res) => {
        if (res === null) {
          console.log(null);
        } else {
          return res;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  openFileWindow() {
    dialog
      .showOpenDialog(this.app_window, { 
        properties: ["openFile"],
        filters: [{ name: 'Textové soubory', extensions: ['txt'] }]})
      .then((res) => {
        if (!res.canceled) {
          fs.readFile(res.filePaths[0], "utf-8", (err, data) => {
            if (err) {
                console.error("Chyba při čtení:", err);
                throw err;
            }
            this.saveHistory(res.filePaths[0]);
            this.app_window.webContents.send("filedata", {
              data: data,
              path: res.filePaths[0],
            });
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  openRecentFile(path) {
    fs.readFile(path, "utf-8", (err, data) => {
      if (err) {
          console.error("Chyba při čtení:", err);
          throw err;
      }
      this.saveHistory(path);
      this.app_window.webContents.send("filedata", { data: data, path: path });
    });
  }
  ensureJsonFileExists() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.config', 'history');
    const jsonFilePath = path.join(configDir, 'info.json');
  
    fs.ensureDir(configDir)
      .then(() => {
        return fs.pathExists(jsonFilePath);
      })
      .then((exists) => {
        if (!exists) {
          return fs.writeJson(jsonFilePath, { paths: [] });
        } else {
          console.log('info.json existuje');
        }
      })
      .then(() => {
        console.log('info.json je připraveno k použití.');
      })
      .catch(err => {
        console.error('Chyba: ', err);
      });
  }
}

module.exports = {
  FileManager,
};
