// docs/modules/user_profile.js

// getApiBaseUrl et showStatusMessage sont maintenant importés directement depuis app.js
import { getApiBaseUrl, showStatusMessage } from '../app.js';

let userIdDisplay, cvnuAddressDisplay;

export function initUserProfilePage() {
    userIdDisplay = document.getElementById('userIdDisplay');
    cvnuAddressDisplay = document.getElementById('cvnuAddressDisplay');

    if (userIdDisplay) userIdDisplay.textContent = 'User_CVNU_ID_12345'; // Placeholder
    if (cvnuAddressDisplay) cvnuAddressDisplay.textContent = '0x123...abc'; // Placeholder for blockchain address

    // Exemple : un bouton pour connecter un portefeuille blockchain
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    // if (connectWalletBtn) {
    //     connectWalletBtn.addEventListener('click', () => {
    //         showStatusMessage('Connexion au portefeuille simulée...', 'info');
    //         // Logique de connexion MetaMask ou autre
    //     });
    // }
}
