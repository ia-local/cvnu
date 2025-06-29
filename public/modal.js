// public/modal.js

/**
 * Composant Modal Générique.
 * Gère l'affichage des boîtes de dialogue personnalisées (alertes et confirmations).
 */

// Références aux éléments du DOM du modal générique
const genericAppModal = document.getElementById('genericAppModal');
const genericModalTitle = document.getElementById('genericModalTitle');
const genericModalBody = document.getElementById('genericModalBody');
const genericModalConfirmBtn = document.getElementById('genericModalConfirmBtn');
const genericModalCancelBtn = document.getElementById('genericModalCancelBtn');
const genericModalOkBtn = document.getElementById('genericModalOkBtn');
const genericCloseModalBtn = document.getElementById('genericCloseModalBtn');

// Map pour stocker les gestionnaires d'événements afin de pouvoir les retirer correctement
const eventHandlers = new Map();

/**
 * Affiche une boîte de dialogue modale personnalisée.
 * @param {string} title - Le titre du modal.
 * @param {string} bodyHtml - Le contenu HTML du corps du modal.
 * @param {'alert'|'confirm'} type - Le type de modal. 'alert' affiche un bouton OK, 'confirm' affiche Confirmer/Annuler.
 * @returns {Promise<boolean|undefined>} Résout à `true` pour confirmer, `false` pour annuler (type confirm), ou `undefined` pour alerte.
 */
export function showModal(title, bodyHtml, type = 'alert') {
    return new Promise(resolve => {
        // S'assurer que le modal existe avant de tenter d'interagir avec
        if (!genericAppModal) {
            console.error("Erreur: Le modal générique '#genericAppModal' n'a pas été trouvé dans le DOM.");
            // Fallback pour les environnements sans le HTML du modal
            if (type === 'confirm') {
                resolve(confirm(bodyHtml));
            } else {
                alert(bodyHtml);
                resolve(undefined);
            }
            return;
        }

        // Nettoyer les anciens écouteurs pour éviter les fuites de mémoire et les déclenchements multiples
        if (eventHandlers.has('confirm')) genericModalConfirmBtn.removeEventListener('click', eventHandlers.get('confirm'));
        if (eventHandlers.has('cancel')) genericModalCancelBtn.removeEventListener('click', eventHandlers.get('cancel'));
        if (eventHandlers.has('ok')) genericModalOkBtn.removeEventListener('click', eventHandlers.get('ok'));
        if (eventHandlers.has('close')) genericCloseModalBtn.removeEventListener('click', eventHandlers.get('close'));
        if (eventHandlers.has('outsideClick')) genericAppModal.removeEventListener('click', eventHandlers.get('outsideClick'));

        genericModalTitle.textContent = title;
        genericModalBody.innerHTML = bodyHtml;

        // Cacher tous les boutons par défaut
        genericModalConfirmBtn.style.display = 'none';
        genericModalCancelBtn.style.display = 'none';
        genericModalOkBtn.style.display = 'none';

        // Définir les gestionnaires d'événements
        const confirmHandler = () => { genericAppModal.classList.remove('active'); resolve(true); };
        const cancelHandler = () => { genericAppModal.classList.remove('active'); resolve(false); };
        const okHandler = () => { genericAppModal.classList.remove('active'); resolve(undefined); };
        const closeHandler = () => {
            if (type === 'confirm') {
                cancelHandler(); // Le bouton de fermeture agit comme Annuler pour les confirmations
            } else {
                okHandler(); // Le bouton de fermeture agit comme OK pour les alertes
            }
        };
        const clickOutsideHandler = (event) => {
            if (event.target === genericAppModal) {
                closeHandler(); // Un clic à l'extérieur ferme le modal
            }
        };

        // Stocker les gestionnaires pour le nettoyage futur
        eventHandlers.set('confirm', confirmHandler);
        eventHandlers.set('cancel', cancelHandler);
        eventHandlers.set('ok', okHandler);
        eventHandlers.set('close', closeHandler);
        eventHandlers.set('outsideClick', clickOutsideHandler);

        // Attacher les nouveaux écouteurs basés sur le type de modal
        if (type === 'confirm') {
            genericModalConfirmBtn.style.display = 'inline-flex';
            genericModalCancelBtn.style.display = 'inline-flex';
            genericModalConfirmBtn.addEventListener('click', confirmHandler);
            genericModalCancelBtn.addEventListener('click', cancelHandler);
        } else { // 'alert'
            genericModalOkBtn.style.display = 'inline-flex';
            genericModalOkBtn.addEventListener('click', okHandler);
        }

        genericCloseModalBtn.addEventListener('click', closeHandler);
        genericAppModal.addEventListener('click', clickOutsideHandler);

        // Afficher le modal
        genericAppModal.classList.add('active');
    });
}
