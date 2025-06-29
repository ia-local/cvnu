const { ipcRenderer } = require('electron'); // If you're using Electron's renderer process
const fs = require('fs');


ipcRenderer.on('load-error', (event, errorDescription, errorCode) => {
  console.error(`File load failed: ${errorDescription} (Code: ${errorCode})`);
  // Display the error message to the user, perhaps in an alert box:
  alert(`Error loading file: ${errorDescription}`);
});
document.getElementById('generer').addEventListener('click', () => {
    
    const prompt = document.getElementById('prompt').value;

    fetch('http://localhost:5001/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('resultat').textContent = data.message;
        });
});

document.getElementById('make').addEventListener('click', () => {
    const prompt = document.getElementById('prompt').value;

    fetch('http://localhost:5001/make', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('resultat').textContent = data.message;
        });
});

fs.readFile('logs.json', 'utf8', (err, logData) => {
    if (err) {
        console.error(err);
        return;
    }

    fs.readFile('models.json', 'utf8', (modelErr, modelData) => {
        if (modelErr) {
            console.error(modelErr);
            return;
        }

        const logs = JSON.parse(logData);
        const models = JSON.parse(modelData);
        const logsDiv = document.getElementById('logs');

        logs.forEach(log => {
            const logEntry = document.createElement('p');
            logEntry.textContent = JSON.stringify(log);
            logsDiv.appendChild(logEntry);

            // Détection des activités suspectes
            if (log.action === 'login' && log.status === 'failed') {
                console.warn('Tentative de connexion échouée détectée :', log);
            }

            if (log.action === 'access' && log.resource === '/admin') {
                console.warn('Accès non autorisé détecté :', log);
            }

            // Détection des tentatives de connexion échouées par les modèles IA
            if (models.some(model => model.name.toLowerCase() === log.user.toLowerCase()) && log.action === 'login' && log.status === 'failed') {
                console.error('Tentative de connexion échouée par un modèle IA détectée :', log);
            }
        });
    });
});