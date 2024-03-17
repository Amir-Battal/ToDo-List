const { app , BrowserWindow, Menu, ipcMain, dialog, Notification, Tray } = require("electron");
const fs = require("fs");
const path = require("path");
const appPath = app.getPath("userData");

let mainWindow;
let addWindow;
let addTimedWindow;
let addImagedWindow;
let tray = null;

process.env.NODE_ENV = "production";


app.on("ready", function(){
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile("index.html");

    mainWindow.on("closed", function(){
        app.quit();
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on("minimize", function(event){
        event.preventDefault();
        mainWindow.hide();
        tray = createTray();
    });

    mainWindow.on("restore", function(event){
        mainWindow.show();
        tray.destroy();
    }); 
});

function createTray(){
    let iconPath = path.join(__dirname, "./assets/images/image.png");
    let appIcon = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate(iconMenuTemplate);
    appIcon.on("double-click", function(event){
        mainWindow.show();
    });

    appIcon.setToolTip("تطبيق إدارة المهام");
    appIcon.setContextMenu(contextMenu);
    return appIcon; 
}

const iconMenuTemplate = [
    {
        label: "فتح",
        click(){
            mainWindow.show();
        },
    },
    {
        label: "إغلاق",
        click(){
            app.quit();
        }
    }
]

const mainMenuTemplate = [
    {
        label: "القائمة",
        submenu: [
            {
                label: "إضافة مهمة",
                click(){
                    initAddWindow();
                }
            },
            {
                label: "إضافة مهمة مؤقتة",
                click(){
                    createTimeWindow();
                }
            },
            {
                label: "إضافة مهمة مع صورة",
                click(){
                    createImagedWindow();
                }
            },
            {
                label: "خروج",
                accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
                click(){
                    app.quit();
                }
            }
        ]
    },
]

// if(process.platform === "darwin"){
//     mainMenuTemplate.unshift({});
// }

if(process.env.NODE_ENV !== "production"){
    mainMenuTemplate.push(
        {
            label: "ادوات المطور",
            submenu: [
                {
                    label: "فتح وإغلاق ادوات المطور",
                    accelerator: process.platform === "darwin" ? "Cmd+D" : "Ctrl+D",
                    click(){
                        mainWindow.toggleDevTools();
                    }
                },
                {
                    label: "اعادة تحميل التطبيق",
                    role: "reload"
                }
            ]
        }
    )
}


// Normal Notes
ipcMain.on("new-normal", function(){
    initAddWindow();
});

function initAddWindow(){
    addWindow = new BrowserWindow({
        width: 400,
        height: 250,
        title: "إضافة مهمة جديدة",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    addWindow.loadFile("./views/normalTask.html");

    addWindow.on("closed", () => {
        e.preventDefault();
        addWindow = null;
    });

    addWindow.removeMenu();
}

ipcMain.on("add-normal-task", function(e, item){
    mainWindow.webContents.send("add-normal-task", item);
    addWindow.close();  
})


ipcMain.on("create-txt", function(e, note){
    let dest = Date.now() + "-task.txt";
    dialog.showSaveDialog({
        title: "اختار مكان حفظ الملف",
        defaultPath: path.join(__dirname, "./" + dest),
        buttonLabel: "Save",
        filters: [
            {
                name: "Text Filter",
                extensions: ["txt"]
            }
        ]
    }).then(file => {
        if(!file.canceled){
            fs.writeFile(file.filePath.toString(), note, function(){
                if(err) throw err;
            })
        }
    }).catch(err => {
        console.log(err)
    });
});


// Timed Notes
ipcMain.on("new-timed", function(e){
    createTimeWindow();
});

function createTimeWindow(){
    addTimedWindow = new BrowserWindow({
        width: 400,
        height: 400,
        title: "إضافة مهمة جديدة",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    addTimedWindow.loadFile(path.join(__dirname,"./views/timedTask.html"));

    addTimedWindow.on("closed", (e) => {
        e.preventDefault();
        addTimedWindow = null;
    });
    
    addTimedWindow.removeMenu();
}

ipcMain.on("add-timed-note", function(e, note, notificationTime){
    mainWindow.webContents.send("add-timed-note", note, notificationTime);
    addTimedWindow.close();
});

ipcMain.on("notify", function(e, taskValue){
    new Notification({
        title: "لديك تنبيه من مهامك",
        body: taskValue,
        icon: path.join(__dirname, "./assets/images/image.png")
    }).show();
});


// Imaged Notes
ipcMain.on("new-imaged", function (e) {
    createImagedWindow();
});

function createImagedWindow(){
    addImagedWindow = new BrowserWindow({
        width: 400,
        height: 420,
        title: "إضافة مهمة جديدة",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    addImagedWindow.loadFile(path.join(__dirname, "./views/imagedTask.html"));

    addImagedWindow.on("closed", (e) => {
        e.preventDefault();
        addImagedWindow = null;
    });

    addImagedWindow.removeMenu();
}

ipcMain.on("upload-image", function (event) {
    dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
        ]
    }).then(result => {
        event.sender.send('open-file', result.filePaths, appPath);
    })
});

ipcMain.on("add-imaged-task", function (e, note, imgURI) {
    mainWindow.webContents.send("add-imaged-task", note, imgURI);
    addImagedWindow.close();
});
