const path = require('path');
const { app, Menu, MenuItem, BrowserWindow } = require('electron');
// Function to create and load a file into a new BrowserWindow
function createWindow(filePath, options = {}) {
  const window = new BrowserWindow({
    width: 987,
    height: 600,
    ...options,
  });

  // Load the file *after* the window is created
  window.loadFile(path.join(__dirname, filePath)); // Load the file

  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load ${filePath}: ${errorDescription} (Error Code: ${errorCode})`);
    // ... (Your error handling code)
  });

  return window;
}
function createTerminalWindow() {
  const terminalWindow = new BrowserWindow({ /* ... options ... */ });
  terminalWindow.loadFile(path.join(__dirname, './terminal.html')); // Charge terminal.html
}
function createMenu() {
  const template = [
    {
        label: 'El',
        submenu: [
          { label: 'Nouveau' },
          { label: 'Ouvrir' },
          { type: 'separator' },
          { label: 'Quitter', role: 'quit' }
        ]
      },
      {
        label: 'Édition',
        submenu: [
          { label: 'Annuler', role: 'undo' },
          { label: 'Rétablir', role: 'redo' },
          { type: 'separator' },
          { label: 'Couper', role: 'cut' },
          { label: 'Copier', role: 'copy' },
          { label: 'Coller', role: 'paste' },
          { label: 'Supprimer', role: 'delete' },
          { label: 'Sélectionner tout', role: 'selectall' },
          { type: 'separator' },
        ]
      },
      {
        label: 'Affichage',
        submenu: [
          { label: 'Recharger', role: 'reload' },
          { label: 'Forcer le rechargement', role: 'forcereload' },
          { label: 'Outils de développement', role: 'toggledevtools' },
          { type: 'separator' },
          { label: 'Zoom +', role: 'zoomin' },
          { label: 'Zoom -', role: 'zoomout' },
          { label: 'Réinitialiser le zoom', role: 'resetzoom' }
        ]
      },
      {
        label: 'Models',
        submenu: [
          {
            label: '💾  Groq',
            role:'system',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '⏐\\ /⏐ Mixtral',
            role:'system',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const GeminiWindow = new BrowserWindow({ /* ... */ });
              GeminiWindow.loadFile('models/gemini.html');
            }
          },
          { type: 'separator' },
          {
            label: '🐳 DeepSeek',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '⏐↪︎ Ollama',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Qwant',
            models:'deepseek-r1-distill-qwen-32b',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          {
            label: '🧑‍🎤 Avatars',
            models:'anonymous-7b-ar',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '📸 Dall-e',
            models:'dall-e-3',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '🤗 GPT',
            models:'gpt-4o',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          }
        ]
      },      ,
      {
        label: 'Data',
        submenu: [
          {
            label: '🧾 Text',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '🎚️ Audio',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '🛣️ Image',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: '🎬 Video',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
        ]
      },
      {
        label: 'Go',
        submenu: [
          {
            label: 'Back',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Page',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Web',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: ' > Google',
            click: () => {
              const googleWindow = new BrowserWindow({ width: 800, height: 600 });
              googleWindow.loadURL('https://www.google.com'); // Charger l'URL de l'iframe
            },
          },
          {
            label: ' > Telegram',
            click: () => {
              const telegramWindow = new BrowserWindow({ width: 800, height: 600 });
              telegramWindow.loadURL('https://t.me'); // Charger l'URL de l'iframe
            },
          },
          {
            label: ' > Youtube',
            click: () => {
              const youtubeWindow = new BrowserWindow({ width: 800, height: 600 });
              youtubeWindow.loadURL('https://www.youtube.com'); // Charger l'URL de l'iframe
            },
          },
          {
            label: ' > Instagram',
            click: () => {
              const instagramWindow = new BrowserWindow({ width: 800, height: 600 });
              instagramWindow.loadURL('https://www.intagram.com'); // Charger l'URL de l'iframe
            },
          },
          {
            label: ' > Facebook',
            click: () => {
              const facebookWindow = new BrowserWindow({ width: 800, height: 600 });
              facebookWindow.loadURL('https://www.facebook.com'); // Charger l'URL de l'iframe
            },
          },
          {
            label: ' > TikTok',
            click: () => {
              const googleWindow = new BrowserWindow({ width: 800, height: 600 });
              googleWindow.loadURL('https://www.Tiktik.com'); // Charger l'URL de l'iframe
            },
          },
        ]
      },
      {
        label: 'Blog',
        submenu: [
          {
            label: 'Blog_DevOps',
            click: () => {
                // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
                const createWindow = new BrowserWindow({ /* ... */ });
                createWindow.loadFile('public/about.html',{ width: 987, height: 300 });
            }
          },
          { type: 'separator' },
          {
            label: 'Kjournal',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'FactoryAi',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Qi-Store',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Home',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Desktop',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/about.html');
            }
          }
        ]
      },

      {
        label: 'Wallet',
        submenu: [
          {
            label: 'Profile',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'CV',
            role:'system',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },          
          { type: 'separator' },
          {
            label: 'Smart Contract',
            role:'system',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Rib',
            role:'system',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'Crypto',
            role:'system',
            models:'',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('models/about.html');
            }
          },
        ]
      },
      {
        label: 'Terminal',
        submenu: [
          {
            label: 'Ouvrir le terminal',
            click: createTerminalWindow, // Appeler la fonction
            
          },
          {
            label: 'Configuration',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          },
          {
            label: 'Réglages',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          },
          {
            label: 'Profile',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          },
          { type: 'separator' },
          {
            label: 'New',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          },
          {
            label: 'Shell',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              createIframeWindow('./about.html');
            }
          },
          {
            label: 'Run',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          }
        ]
      },
      {
        label: 'Aide',
        submenu: [
          {
            label: 'À propos',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('about.html');
            }
          }
        ]
      }
    ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMenu };