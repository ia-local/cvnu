// docs/modules/chatroom.js

// showModal est maintenant dans docs/modal.js
import { showModal } from '../modal.js';
// getApiBaseUrl, etc. sont maintenant dans docs/app.js
import {
    getApiBaseUrl, showStatusMessage,
    getCurrentConversationId, setCurrentConversationId,
    getCurrentChatPage, setCurrentChatPage, getChatConversationsPerPage
} from '../app.js';
// setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId sont dans pagination.js (maintenant dans docs/)
import { setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId } from '../pagination.js';


// Références aux éléments DOM spécifiques au chatroom
let startNewConversationBtn, generateChatCvSummaryBtn,
    currentConversationIdSpan, chatWindow, chatInput, sendChatBtn,
    modalCvSummarySection, modalCvSummaryOutput, copyModalCvSummaryBtn;

// Variables pour les éléments de pagination (dynamiquement créés dans app.js/updateDynamicLeftNav)
let chatConversationListElement, chatPrevPageBtn, chatNextPageBtn, chatCurrentPageInfoSpan;

// Callback pour fetchDashboardInsights (passée depuis app.js)
let _fetchDashboardInsights;


/**
 * Initialise la page du chatroom et attache les écouteurs d'événements.
 * Cette fonction est appelée par app.js lors de l'activation de la page chatroom.
 */
export function initChatroomPage(
    apiBaseUrl, showStatusMessageFn, currentConversationIdVal, setCurrentConversationIdFn,
    initPaginationControlsFn, setActiveConversationIdFn, currentChatPageVal, setCurrentChatPageFn,
    chatConversationsPerPageVal, fetchDashboardInsightsFn, // Pass the fetchDashboardInsights function
    setConversationsFn, renderChatConversationListFn // Pass pagination's functions
) {
    // Assigner les fonctions et valeurs globales
    // Directement importées ou passées pour éviter les dépendances circulaires complexes avec app.js
    // Pour des fonctions comme showStatusMessage, getApiBaseUrl, getCurrentConversationId, etc.
    // nous les importons directement car elles sont exportées d'app.js.
    // Pour les fonctions de pagination, nous les passons explicitement.
    _fetchDashboardInsights = fetchDashboardInsightsFn; // Assignement du callback

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
                showStatusMessage('Résumé copié dans le champ CV.', 'success');
            } else {
                showStatusMessage('Rien à copier.', 'warning');
            }
        };
    }

    // Initial state for chat input/buttons
    if (chatInput) chatInput.disabled = true;
    if (sendChatBtn) sendChatBtn.disabled = true;
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';

    // Initialize pagination controls for the dynamically created elements
    if (chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
        initPaginationControlsFn( // Use the passed function from app.js
            chatPrevPageBtn,
            chatNextPageBtn,
            chatCurrentPageInfoSpan,
            fetchConversations, // Callback pour le fetch
            selectConversation, // Callback pour la sélection
            deleteConversation  // Callback pour la suppression
        );
    }

    // Fetch and render conversations immediately when chatroom page is initialized
    fetchConversations(getCurrentChatPage()); // Use global getter
}


/**
 * Démarre une nouvelle conversation.
 */
async function startNewConversation() {
    showStatusMessage('Démarrage d\'une nouvelle conversation...', 'info');
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
            setCurrentConversationId(data.id); // Mettre à jour l'ID de conversation global
            await fetchConversations(1); // Reload and go to first page
            if (chatInput) chatInput.disabled = false;
            if (sendChatBtn) sendChatBtn.disabled = false;
            if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${data.id.substring(0, 8)}...)`;

            showStatusMessage('Nouvelle conversation démarrée !', 'success');
        } else {
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant de démarrer une nouvelle conversation.", 'alert');
            } else {
                await showModal('Erreur', `Impossible de démarrer une nouvelle conversation: ${data.error}`, 'alert');
            }
            showStatusMessage(`Erreur: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors du démarrage d\'une nouvelle conversation.`, 'alert');
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
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
    showStatusMessage('Chargement de la conversation...', 'info');
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
        setCurrentConversationId(conversation.id); // Mettre à jour l'ID de conversation global

        const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');

        if (chatWindow) chatWindow.innerHTML = '';
        userVisibleMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.role}`;
            const utmiInfo = msg.utmi !== undefined && msg.utmi !== null ? `UTMi: ${msg.utmi.toFixed(2)} EUR` : '';
            const costInfo = msg.estimated_cost_usd !== undefined && msg.estimated_cost_usd !== null ? `Coût: ${msg.estimated_cost_usd.toFixed(6)} USD` : '';
            const taxInfo = msg.taxeIAAmount !== undefined && msg.taxeIAAmount !== null ? `Taxe IA: ${msg.taxeIAAmount.toFixed(2)} EUR` : '';
            const metaInfo = (utmiInfo || costInfo || taxInfo) ? `<br><small>${utmiInfo} ${costInfo} ${taxInfo}</small>` : '';

            div.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content}${metaInfo}`;
            if (chatWindow) chatWindow.appendChild(div);
        });

        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${getCurrentConversationId().substring(0, 8)}...)`; // Use getter
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;

        setActiveConversationId(id); // Inform pagination.js about active conversation

        showStatusMessage('Conversation chargée.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        await showModal('Erreur', `Erreur de chargement de la conversation: ${error.message}`, 'alert');
        showStatusMessage(`Erreur de chargement de la conversation: ${error.message}`, 'error');
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
    if (!message || !getCurrentConversationId()) { // Use getter
        showStatusMessage('Veuillez saisir un message ou démarrer une conversation.', 'warning');
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
    showStatusMessage('Envoi du message et attente de la réponse IA...', 'info');

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${getCurrentConversationId()}/message`, { // Use getter
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        if (response.ok) {
            showStatusMessage('Réponse IA reçue.', 'success');
            await selectConversation(getCurrentConversationId()); // Use getter
            await fetchConversations(getCurrentChatPage()); // Use getter
            if (_fetchDashboardInsights) {
                _fetchDashboardInsights(); // Call the passed function
            }
        } else {
            if (response.status === 429) {
                await showModal('Erreur', "Trop de requêtes. Veuillez patienter un instant avant d'envoyer un nouveau message.", 'alert');
            } else {
                await showModal('Erreur', `Erreur lors de l\'envoi du message: ${data.error}`, 'alert');
            }
            showStatusMessage(`Erreur: ${data.error}`, 'error');
            if (chatWindow && userMessageDiv && chatWindow.contains(userMessageDiv)) {
                 chatWindow.removeChild(userMessageDiv);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        await showModal('Erreur', `Erreur de connexion lors de l\'envoi du message.`, 'alert');
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
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
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations?page=${page}&limit=${getChatConversationsPerPage()}`); // Use getter
        const data = await response.json();
        setCurrentChatPage(page); // Use setter

        if (chatConversationListElement && chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
            setConversations(data.conversations, data.totalCount, page, getChatConversationsPerPage()); // Use getter
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
            showStatusMessage('Erreur: Éléments de pagination du chat introuvables. Assurez-vous que la page est bien chargée.', 'error');
        }

        if (getCurrentConversationId()) { // Use getter
            const activeItem = chatConversationListElement?.querySelector(`.conversation-item[data-id="${getCurrentConversationId()}"]`); // Use getter
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        showStatusMessage('Conversations chargées.', 'success');
    } catch (error) {
        console.error('Error fetching chat conversations:', error);
        if (chatConversationListElement) chatConversationListElement.innerHTML = '<li class="placeholder-text error-message">Erreur de chargement des conversations.</li>';
        showStatusMessage('Erreur de chargement des conversations: ' + error.message, 'error');
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

    showStatusMessage('Suppression de la conversation...', 'info');
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showStatusMessage('Conversation supprimée avec succès !', 'success');
            if (getCurrentConversationId() === id) { // Use getter
                setCurrentConversationId(null); // Use setter
                if (currentConversationIdSpan) currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
                if (chatInput) chatInput.disabled = true;
                if (sendChatBtn) sendChatBtn.disabled = true;
                if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
                if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
                if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
                if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;
            }
            await fetchConversations(getCurrentChatPage()); // Use getter
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
            showStatusMessage(`Erreur lors de la suppression: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur de connexion lors de la suppression de la conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors de la suppression de la conversation.`, 'alert');
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    }
}


/**
 * Génère un résumé de CV à partir de la conversation IA active.
 */
async function generateChatCvSummary() {
    if (!getCurrentConversationId()) { // Use getter
        await showModal('Attention', 'Veuillez sélectionner une conversation d\'abord pour générer le résumé.', 'alert');
        return;
    }

    showStatusMessage('Génération du résumé CV en cours...', 'info');
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = true;
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'block';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/conversations/${getCurrentConversationId()}/cv-professional-summary`); // Use getter
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
        showStatusMessage('Résumé CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du résumé CV depuis le chat:', error);
        if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du résumé CV : ${error.message}</p>`;
        showStatusMessage(`Erreur lors de la génération du résumé CV: ${error.message}`, 'error');
    } finally {
        if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = false;
    }
}
