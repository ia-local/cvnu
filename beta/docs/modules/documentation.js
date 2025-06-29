// docs/modules/documentation.js

// getApiBaseUrl et showStatusMessage sont maintenant importés directement depuis app.js
import { getApiBaseUrl, showStatusMessage } from '../app.js';

export function initDocumentationPage() {
    console.log('Documentation page initialized.');
    showStatusMessage('Documentation chargée.', 'info');
}
