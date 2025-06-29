// public/modules/chatroom.js

import { getApiBaseUrl } from '../app.js'; // Import getApiBaseUrl
import { showModal } from '../modal.js'; // Import showModal
import { setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId } from '../pagination.js'; // Pagination utilities


// Références aux éléments DOM spécifiques au chatroom
let startNewConversationBtn, generateChatCvSummaryBtn,
    currentConversationIdSpan, chatWindow, chatInput, sendChatBtn,
    modalCvSummarySection, modalCvSummaryOutput, copyModalCvSummaryBtn;

// Variables pour les éléments de pagination (dynamiquement créés dans app.js/updateDynamicLeftNav)
let chatConversationListElement, chatPrevPageBtn, chatNextPageBtn, chatCurrentPageInfoSpan;

// Callbacks pour les fonctions globales passées depuis app.js
let _showStatusMessage;
let _currentConversationId;
let _setCurrentConversationId;
let _initPaginationControls;
let _setActiveConversationId;
let _currentChatPage;
let _setCurrentChatPage;
let _chatConversationsPerPage;
let _fetchDashboardInsights; // Nous devrons importer cette fonction si elle est appelée ici


/**
 * Initialise la page du chatroom et attache les écouteurs d'événements.
 * Cette fonction est appelée par app.js lors de l'activation de la page chatroom.
 */
export function initChatroomPage(
    apiBaseUrl, showStatusMessageFn, currentConversationIdVal, setCurrentConversationIdFn,
    initPaginationControlsFn, setActiveConversationIdFn, currentChatPageVal, setCurrentChatPageFn,
    chatConversationsPerPageVal, fetchDashboardInsightsFn // Passer fetchDashboardInsights si nécessaire
) {
    // Assigner les fonctions et valeurs globales
    _showStatusMessage = showStatusMessageFn;
    _currentConversationId = currentConversationIdVal;
    _setCurrentConversationId = setCurrentConversationIdFn;
    _initPaginationControls = initPaginationControlsFn;
    _setActiveConversationId = setActiveConversationIdFn;
    _currentChatPage = currentChatPageVal;
    _setCurrentChatPage = setCurrentChatPageFn;
    _chatConversationsPerPage = chatConversationsPerPageVal;
    // Vérifier si fetchDashboardInsightsFn est défini avant de l'assigner
    if (fetchDashboardInsightsFn) {
        _fetchDashboardInsights = fetchDashboardInsightsFn;
    } else {
        // Fallback: Si non fourni, on peut importer directement ou gérer l'absence
        // Pour cet exemple, on s'assure qu'elle vient d'app.js qui l'importe de dashboard.js
        console.warn("fetchDashboardInsights function was not passed to initChatroomPage.");
        // Une solution temporaire pourrait être:
        // import { fetchDashboardInsights as _fetchDashboardInsightsFallback } from './dashboard.js';
        // _fetchDashboardInsights = _fetchDashboardInsightsFallback;
    }


    // Récupérer les références DOM (certaines peuvent être créées dynamiquement)
    startNewConversationBtn = document.getElementById('startNewConversationBtn');
    generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn');
    currentConversationIdSpan = document.getElementById('current-conversation-id');
    chatWindow = document.getElementById('chat-window');
    chatInput = document.getElementById('chat-input');
    sendChatBtn = document.getElementById('send-chat-btn');
    modalCvSummarySection = document.getElementById('modalCvSummarySection');
    modalCvSummaryOutput = document.getElementById('modalCvSummaryOutput');
    copyModalCvSummaryBtn = document.getElementById('copyModalCvSummaryBtn');

    // Références aux éléments de pagination dynamiquement créés par updateDynamicLeftNav dans app.js
    chatConversationListElement = document.getElementById('conversation-list');
    chatPrevPageBtn = document.querySelector('#conversation-pagination [data-page-action="prev"]');
    chatNextPageBtn = document.querySelector('#conversation-pagination [data-page-action="next"]');
    chatCurrentPageInfoSpan = document.querySelector('#conversation-pagination #current-page-info');


    // Attacher les écouteurs d'événements
    if (startNewConversationBtn) {
        startNewConversationBtn.onclick = startNewConversation;
    }
    if (sendChatBtn) {
        sendChatBtn.onclick = sendMessage;
    }
    if (chatInput) {
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !sendChatBtn.disabled) {
                sendMessage();
            }
        };
    }
    if (generateChatCvSummaryBtn) {
        generateChatCvSummaryBtn.onclick = generateChatCvSummary;
    }
    if (copyModalCvSummaryBtn) {
        copyModalCvSummaryBtn.onclick = () => {
            if (modalCvSummaryOutput && document.getElementById('cv-input') && modalCvSummaryOutput.textContent) {
                document.getElementById('cv-input').value = modalCvSummaryOutput.textContent;
                _showStatusMessage('Résumé copié dans le champ CV.', 'success');
            } else {
                _showStatusMessage('Rien à copier.', 'warning');
            }
        };
    }

    // Initial state for chat input/buttons
    if (chatInput) chatInput.disabled = true;
    if (sendChatBtn) sendChatBtn.disabled = true;
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';

    // Initialize pagination controls for the dynamically created elements
    if (chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
        _initPaginationControls(
            chatPrevPageBtn,
            chatNextPageBtn,
            chatCurrentPageInfoSpan,
            fetchConversations, // Callback pour le fetch
            selectConversation, // Callback pour la sélection
            deleteConversation  // Callback pour la suppression
        );
    }

    // Fetch and render conversations immediately when chatroom page is initialized
    fetchConversations(_currentChatPage);
}


/**
 * Démarre une nouvelle conversation.
 */
async function startNewConversation() {
    _showStatusMessage('Démarrage d\'une nouvelle conversation...', 'info');
    if (startNewConversationBtn) startNewConversationBtn.disabled = true;
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'guest_user' }) // Passer un userId, même par défaut
        });
        const data = await response.json();
        if (response.ok) {
            _setCurrentConversationId(data.id); // Mettre à jour l'ID de conversation global via app.js
            await fetchConversations(1); // Reload and go to first page
            if (chatInput) chatInput.disabled = false;
            if (sendChatBtn) sendChatBtn.disabled = false;
            if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${data.id.substring(0, 8)}...)`;

            _showStatusMessage('Nouvelle conversation démarrée !', 'success');
        } else {
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant de démarrer une nouvelle conversation.", 'alert');
            } else {
                await showModal('Erreur', `Impossible de démarrer une nouvelle conversation: ${data.error}`, 'alert');
            }
            _showStatusMessage(`Erreur: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors du démarrage d\'une nouvelle conversation.`, 'alert');
        _showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    } finally {
        if (startNewConversationBtn) startNewConversationBtn.disabled = false;
    }
}

/**
 * Charge une conversation spécifique dans la fenêtre de chat.
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {string} id - L'ID de la conversation à charger.
 */
async function selectConversation(id) {
    _showStatusMessage('Chargement de la conversation...', 'info');
    if (generateChatCvSummaryBtn) {
        generateChatCvSummaryBtn.style.display = 'inline-block';
        generateChatCvSummaryBtn.disabled = false;
    }
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${id}`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de recharger la conversation.");
            }
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }
        const conversation = await response.json();
        _setCurrentConversationId(conversation.id); // Mettre à jour l'ID de conversation global

        const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');

        if (chatWindow) chatWindow.innerHTML = '';
        userVisibleMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.role}`;
            const utmiInfo = msg.utmi !== undefined && msg.utmi !== null ? `UTMi: ${msg.utmi.toFixed(2)} EUR` : '';
            const costInfo = msg.estimated_cost_usd !== undefined && msg.estimated_cost_usd !== null ? `Coût: ${msg.estimated_cost_usd.toFixed(6)} USD` : '';
            const taxInfo = msg.taxeIAAmount !== undefined && msg.taxeIAAmount !== null ? `Taxe IA: ${msg.taxeIAAmount.toFixed(2)} EUR` : ''; // NOUVEAU
            const metaInfo = (utmiInfo || costInfo || taxInfo) ? `<br><small>${utmiInfo} ${costInfo} ${taxInfo}</small>` : '';

            div.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content}${metaInfo}`;
            if (chatWindow) chatWindow.appendChild(div);
        });

        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${_currentConversationId.substring(0, 8)}...)`;
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;

        _setActiveConversationId(id); // Inform pagination.js about active conversation

        _showStatusMessage('Conversation chargée.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        await showModal('Erreur', `Erreur de chargement de la conversation: ${error.message}`, 'alert');
        _showStatusMessage(`Erreur de chargement de la conversation: ${error.message}`, 'error');
        if (chatWindow) chatWindow.innerHTML = '<p class="placeholder-text error-message">Erreur de chargement de la conversation.</p>';
        if (chatInput) chatInput.disabled = true;
        if (sendChatBtn) sendChatBtn.disabled = true;
        if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
    }
}

/**
 * Envoie un message dans la conversation active et gère la réponse de l'IA.
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !_currentConversationId) {
        _showStatusMessage('Veuillez saisir un message ou démarrer une conversation.', 'warning');
        return;
    }

    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = `chat-message user`;
    userMessageDiv.innerHTML = `<strong>Vous:</strong> ${message}`;
    if (chatWindow) chatWindow.appendChild(userMessageDiv);
    if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;

    if (chatInput) chatInput.value = '';
    if (chatInput) chatInput.disabled = true;
    if (sendChatBtn) sendChatBtn.disabled = true;
    _showStatusMessage('Envoi du message et attente de la réponse IA...', 'info');

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${_currentConversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        if (response.ok) {
            _showStatusMessage('Réponse IA reçue.', 'success');
            await selectConversation(_currentConversationId);
            await fetchConversations(_currentChatPage);
            // Appeler la fonction globale fetchDashboardInsights
            if (_fetchDashboardInsights) {
                _fetchDashboardInsights();
            } else {
                console.warn("fetchDashboardInsights is not available in chatroom.js via app.js.");
            }
        } else {
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant d'envoyer un nouveau message.", 'alert');
            } else {
                await showModal('Erreur', `Erreur lors de l\'envoi du message: ${data.error}`, 'alert');
            }
            _showStatusMessage(`Erreur: ${data.error}`, 'error');
            if (chatWindow && userMessageDiv && chatWindow.contains(userMessageDiv)) {
                 chatWindow.removeChild(userMessageDiv);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        await showModal('Erreur', `Erreur de connexion lors de l\'envoi du message.`, 'alert');
        _showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
        if (chatWindow && userMessageDiv && chatWindow.contains(userMessageDiv)) {
            chatWindow.removeChild(userMessageDiv);
        }
    } finally {
        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (chatInput) chatInput.focus();
    }
}

/**
 * Récupère la liste des conversations du backend avec pagination.
 */
export async function fetchConversations(page = 1) {
    _showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations?page=${page}&limit=${_chatConversationsPerPage}`);
        const data = await response.json();
        _setCurrentChatPage(page);

        if (chatConversationListElement && chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
            setConversations(data.conversations, data.totalCount, page, _chatConversationsPerPage);
            renderChatConversationList(
                chatConversationListElement,
                chatPrevPageBtn,
                chatNextPageBtn,
                chatCurrentPageInfoSpan,
                selectConversation,
                deleteConversation
            );
        } else {
            console.warn("Éléments de pagination du chat non trouvés pour le rendu.");
            _showStatusMessage('Erreur: Éléments de pagination du chat introuvables. Assurez-vous que la page est bien chargée.', 'error');
        }

        if (_currentConversationId) {
            const activeItem = chatConversationListElement?.querySelector(`.conversation-item[data-id="${_currentConversationId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        _showStatusMessage('Conversations chargées.', 'success');
    } catch (error) {
        console.error('Error fetching chat conversations:', error);
        if (chatConversationListElement) chatConversationListElement.innerHTML = '<li class="placeholder-text error-message">Erreur de chargement des conversations.</li>';
        _showStatusMessage('Erreur de chargement des conversations: ' + error.message, 'error');
        if (chatPrevPageBtn) chatPrevPageBtn.disabled = true;
        if (chatNextPageBtn) chatNextPageBtn.disabled = true;
        if (chatCurrentPageInfoSpan) chatCurrentPageInfoSpan.textContent = 'Erreur...';
    }
}

/**
 * Supprime une conversation.
 */
async function deleteConversation(id) {
    const confirmDelete = await showModal('Confirmer la suppression', `Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.`, 'confirm');
    if (!confirmDelete) {
        return;
    }

    _showStatusMessage('Suppression de la conversation...', 'info');
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            _showStatusMessage('Conversation supprimée avec succès !', 'success');
            if (_currentConversationId === id) {
                _setCurrentConversationId(null);
                if (currentConversationIdSpan) currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
                if (chatInput) chatInput.disabled = true;
                if (sendChatBtn) sendChatBtn.disabled = true;
                if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
                if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
                if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
                if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;
            }
            await fetchConversations(_currentChatPage);
            if (_fetchDashboardInsights) {
                _fetchDashboardInsights();
            }
        } else {
            const data = await response.json();
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant de supprimer la conversation.", 'alert');
            } else {
                await showModal('Erreur', `Erreur lors de la suppression: ${data.error}`, 'alert');
            }
            _showStatusMessage(`Erreur lors de la suppression: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur de connexion lors de la suppression de la conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors de la suppression de la conversation.`, 'alert');
        _showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    }
}


/**
 * Génère un résumé de CV à partir de la conversation IA active.
 */
async function generateChatCvSummary() {
    if (!_currentConversationId) {
        await showModal('Attention', 'Veuillez sélectionner une conversation d\'abord pour générer le résumé.', 'alert');
        return;
    }

    _showStatusMessage('Génération du résumé CV en cours...', 'info');
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = true;
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'block';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${_currentConversationId}/cv-professional-summary`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de générer le résumé.");
            }
            const errorText = await response.text();
            throw new Error(`Échec HTTP (${response.status}): ${errorText}`);
        }

        const cvSummaryMarkdown = await response.text();
        if (modalCvSummaryOutput) modalCvSummaryOutput.textContent = cvSummaryMarkdown;
        if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = false;
        _showStatusMessage('Résumé CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du résumé CV depuis le chat:', error);
        if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du résumé CV : ${error.message}</p>`;
        _showStatusMessage(`Erreur lors de la génération du résumé CV: ${error.message}`, 'error');
    } finally {
        if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = false;
    }
}
