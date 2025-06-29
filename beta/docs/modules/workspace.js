// docs/modules/workspace.js

// getApiBaseUrl et showStatusMessage sont maintenant importés directement depuis app.js
import { getApiBaseUrl, showStatusMessage } from '../app.js';

export function initWorkspacePage() {
    console.log('Workspace page initialized.');
    showStatusMessage('Espace de travail chargé.', 'info');
}
