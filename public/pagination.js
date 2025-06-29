// public/pagination.js

/**
 * Composant de Pagination pour la liste des conversations du Chatbot.
 * Gère l'affichage des conversations par page et les contrôles de navigation.
 */

// Références aux éléments du DOM pour la pagination du chat
const modalConversationPagination = document.getElementById('conversation-pagination');
const modalPrevPageBtn = modalConversationPagination.querySelector('[data-page-action="prev"]');
const modalNextPageBtn = modalConversationPagination.querySelector('[data-page-action="next"]');
const modalCurrentPageInfo = document.getElementById('current-page-info');
const conversationList = document.getElementById('conversation-list'); // Référence à la liste des conversations

// Variables d'état interne pour la pagination
let _allConversations = [];
let _currentPage = 1;
const _itemsPerPage = 5; // Nombre de conversations par page
let _activeConversationId = null; // Nouvelle variable pour suivre la conversation active

/**
 * Met à jour le tableau complet des conversations et réinitialise la page actuelle à 1.
 * @param {Array<Object>} conversations - Le tableau complet de toutes les conversations.
 */
export function setConversations(conversations) {
    _allConversations = conversations;
    _currentPage = 1; // Toujours revenir à la première page lors de la mise à jour des données
    renderChatConversationList();
}

/**
 * Définit l'ID de la conversation actuellement active.
 * Cela permet au composant de pagination de marquer visuellement l'élément de liste correspondant.
 * @param {string|null} conversationId - L'ID de la conversation active, ou `null` si aucune n'est active.
 */
export function setActiveConversationId(conversationId) {
    _activeConversationId = conversationId;
    renderChatConversationList(); // Re-rendre la liste pour appliquer la classe active
}

/**
 * Rend la liste paginée des conversations dans le DOM.
 * Cette fonction doit être appelée après avoir mis à jour les conversations avec `setConversations`.
 * Elle nécessite une fonction `onConversationLoad` et `onConversationDelete` de l'extérieur.
 */
export function renderChatConversationList() {
    conversationList.innerHTML = ''; // Nettoyer la liste existante
    const startIndex = (_currentPage - 1) * _itemsPerPage;
    const endIndex = startIndex + _itemsPerPage;

    // Trier les conversations par date de création descendante (les plus récentes en premier)
    const conversationsToDisplay = _allConversations.slice()
                                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                     .slice(startIndex, endIndex);

    if (conversationsToDisplay.length === 0) {
        conversationList.innerHTML = '<p class="placeholder-text">Aucune conversation trouvée.</p>';
        modalPrevPageBtn.disabled = true;
        modalNextPageBtn.disabled = true;
        modalCurrentPageInfo.textContent = 'Page 0/0';
        return;
    }

    conversationsToDisplay.forEach(conv => {
        const li = document.createElement('li');
        const title = conv.title && conv.title.trim() !== "Nouvelle Conversation" ? conv.title : `Conv. ${new Date(conv.createdAt).toLocaleString()}`;
        li.innerHTML = `
            <div>
                <strong>${title}</strong><br>
                <small>UTMi Total: ${conv.utmi_total ? conv.utmi_total.toFixed(2) : '0.00'} EUR</small>
            </div>
        `;
        li.dataset.id = conv.id;

        // Appliquer la classe active si c'est la conversation actuellement sélectionnée
        if (conv.id === _activeConversationId) {
            li.classList.add('active');
        }

        // La gestion du clic pour charger une conversation doit être passée de l'extérieur
        if (typeof window.onConversationLoadCallback === 'function') {
            li.onclick = () => window.onConversationLoadCallback(conv.id);
        } else {
             console.warn("Callback onConversationLoadCallback non défini. Les clics sur les conversations ne fonctionneront pas.");
        }


        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.className = 'delete-conversation-btn btn-danger btn-icon';
        deleteBtn.title = 'Supprimer cette conversation';
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // Empêche le clic sur le LI parent
            // La gestion de la suppression doit être passée de l'extérieur
            if (typeof window.onConversationDeleteCallback === 'function') {
                window.onConversationDeleteCallback(conv.id, title);
            } else {
                console.warn("Callback onConversationDeleteCallback non défini. La suppression de conversation ne fonctionnera pas.");
            }
        };
        li.appendChild(deleteBtn);
        conversationList.appendChild(li);
    });

    updateChatPaginationControls();
}

/**
 * Met à jour l'état des boutons de pagination (précédent/suivant) et le texte d'information sur la page.
 */
function updateChatPaginationControls() {
    const totalPages = Math.ceil(_allConversations.length / _itemsPerPage);
    modalCurrentPageInfo.textContent = `Page ${_allConversations.length === 0 ? 0 : _currentPage}/${totalPages}`;
    modalPrevPageBtn.disabled = _currentPage === 1;
    modalNextPageBtn.disabled = _currentPage === totalPages || _allConversations.length === 0;
}

/**
 * Change la page actuelle des conversations.
 * @param {number} direction - -1 pour la page précédente, 1 pour la page suivante.
 */
export function changeChatPage(direction) {
    const totalPages = Math.ceil(_allConversations.length / _itemsPerPage);
    _currentPage = Math.max(1, Math.min(totalPages, _currentPage + direction));
    renderChatConversationList();
}

/**
 * Initialise les écouteurs d'événements pour les boutons de pagination.
 */
export function initPaginationControls() {
    modalPrevPageBtn.addEventListener('click', () => changeChatPage(-1));
    modalNextPageBtn.addEventListener('click', () => changeChatPage(1));
}
