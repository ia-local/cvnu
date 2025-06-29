// docs/modules/contact.js

// getApiBaseUrl et showStatusMessage sont maintenant importés directement depuis app.js
import { getApiBaseUrl, showStatusMessage } from '../app.js';

export function initContactPage() {
    console.log('Contact page initialized.');
    showStatusMessage('Page Contact chargée.', 'info');
}
