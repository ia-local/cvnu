// public/js/chatroom.js

import { api } from './apiService.js';
import { showGenericModal } from './modal.js'; // Correction: Renommé showModal en showGenericModal
import { showStatusMessage } from './utils.js';
import { setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId } from './pagination.js';
import { fetchDashboardInsights } from './dashboard.js'; // Pour rafraîchir le dashboard après interaction chat

// --- État local du module ---
let currentConversationId = null;
let currentChatPage = 1;
const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations à afficher par page

// --- Éléments du DOM pour la Chatroom IA ---
let startNewConversationBtn, generateChatCvSummaryBtn,
    currentConversationIdSpan, chatWindow, chatInput, sendChatBtn,
    modalCvSummarySection, modalCvSummaryOutput, copyModalCvSummaryBtn;

// Dynamic elements for chat list and pagination within the left nav
let chatConversationListElement, chatPrevPageBtn, chatNextPageBtn, chatCurrentPageInfoSpan;

/**
 * Initialise les références aux éléments DOM et les écouteurs d'événements pour la chatroom.
 */
export function initChatroomDomElements() {
    startNewConversationBtn = document.getElementById('startNewConversationBtn');
    generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn');
    currentConversationIdSpan = document.getElementById('current-conversation-id');
    chatWindow = document.getElementById('chat-window');
    chatInput = document.getElementById('chat-input');
    sendChatBtn = document.getElementById('send-chat-btn');
    modalCvSummarySection = document.getElementById('modalCvSummarySection');
    modalCvSummaryOutput = document.getElementById('modalCvSummaryOutput');
    copyModalCvSummaryBtn = document.getElementById('copyModalCvSummaryBtn');

    if (startNewConversationBtn) {
        startNewConversationBtn.addEventListener('click', startNewConversation);
    }
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendChatBtn.disabled) {
                sendMessage();
            }
        });
    }
    if (generateChatCvSummaryBtn) {
        generateChatCvSummaryBtn.addEventListener('click', generateChatCvSummary);
    }
    if (copyModalCvSummaryBtn) {
        copyModalCvSummaryBtn.addEventListener('click', () => {
            const cvInput = document.getElementById('cv-input'); // Assurez-vous que cvInput est accessible
            if (modalCvSummaryOutput && cvInput && modalCvSummaryOutput.textContent) {
                cvInput.value = modalCvSummaryOutput.textContent;
                showStatusMessage('Résumé copié dans le champ CV.', 'success');
            } else {
                showStatusMessage('Rien à copier.', 'warning');
            }
        });
    }
}

/**
 * Configure les éléments de pagination du chatroom après leur création dynamique.
 * @param {HTMLElement} listEl - L'élément UL de la liste des conversations.
 * @param {HTMLElement} prevBtn - Le bouton de page précédente.
 * @param {HTMLElement} nextBtn - Le bouton de page suivante.
 * @param {HTMLElement} pageInfoSpan - L'élément SPAN d'information sur la page.
 */
export function setupChatPaginationElements(listEl, prevBtn, nextBtn, pageInfoSpan) {
    chatConversationListElement = listEl;
    chatPrevPageBtn = prevBtn;
    chatNextPageBtn = nextBtn;
    chatCurrentPageInfoSpan = pageInfoSpan;

    initPaginationControls(
        chatPrevPageBtn,
        chatNextPageBtn,
        chatCurrentPageInfoSpan,
        fetchConversations,
        selectConversation,
        deleteConversation
    );
    fetchConversations(currentChatPage); // Fetch and render conversations immediately
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
        const data = await api.startNewConversation();
        currentConversationId = data.id;
        await fetchConversations(1); // Reload and go to first page
        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${currentConversationId.substring(0, 8)}...)`;

        showStatusMessage('Nouvelle conversation démarrée !', 'success');
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        showGenericModal('Erreur', `Impossible de démarrer une nouvelle conversation: ${error.message}`, 'alert'); // Correction: showModal -> showGenericModal
        showStatusMessage(`Erreur: ${error.message}`, 'error');
    } finally {
        if (startNewConversationBtn) startNewConversationBtn.disabled = false;
    }
}

/**
 * Charge une conversation spécifique dans la fenêtre de chat.
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {string} id - L'ID de la conversation à charger.
 */
export async function selectConversation(id) {
    showStatusMessage('Chargement de la conversation...', 'info');
    if (generateChatCvSummaryBtn) {
        generateChatCvSummaryBtn.style.display = 'inline-block';
        generateChatCvSummaryBtn.disabled = false;
    }
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const conversation = await api.fetchConversationById(id);
        currentConversationId = conversation.id;
        const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');

        if (chatWindow) chatWindow.innerHTML = '';
        userVisibleMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.role}`;
            const utmiInfo = msg.utmi !== undefined && msg.utmi !== null ? `UTMi: ${msg.utmi.toFixed(2)} EUR` : '';
            const costInfo = msg.estimated_cost_usd !== undefined && msg.estimated_cost_usd !== null ? `Coût: ${msg.estimated_cost_usd.toFixed(6)} USD` : '';
            const metaInfo = (utmiInfo || costInfo) ? `<br><small>${utmiInfo} ${costInfo}</small>` : '';

            div.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content}${metaInfo}`;
            if (chatWindow) chatWindow.appendChild(div);
        });

        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (currentConversationIdSpan) currentConversationIdSpan.textContent = `(ID: ${currentConversationId.substring(0, 8)}...)`;
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;

        setActiveConversationId(id);

        showStatusMessage('Conversation chargée.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        showGenericModal('Erreur', `Erreur de chargement de la conversation: ${error.message}`, 'alert'); // Correction: showModal -> showGenericModal
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
    const message = chatInput ? chatInput.value.trim() : '';
    if (!message || !currentConversationId) {
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
        const data = await api.sendMessage(currentConversationId, message);
        showStatusMessage('Réponse IA reçue.', 'success');
        await selectConversation(currentConversationId);
        await fetchConversations(currentChatPage);
        await fetchDashboardInsights();
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showGenericModal('Erreur', `Erreur lors de l\'envoi du message: ${error.message}`, 'alert'); // Correction: showModal -> showGenericModal
        showStatusMessage(`Erreur: ${error.message}`, 'error');
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
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {number} page - Le numéro de page à récupérer.
 */
export async function fetchConversations(page = 1) {
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const data = await api.fetchConversations(page, CHAT_CONVERSATIONS_PER_PAGE);
        currentChatPage = page;

        if (chatConversationListElement && chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
            setConversations(data.conversations, data.totalCount, page, CHAT_CONVERSATIONS_PER_PAGE);
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

        if (currentConversationId) {
            const activeItem = chatConversationListElement?.querySelector(`.conversation-item[data-id="${currentConversationId}"]`);
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
 * Cette fonction est appelée par `pagination.js` via un callback.
 * @param {string} id - L'ID de la conversation à supprimer.
 */
async function deleteConversation(id) {
    const confirmDelete = await showGenericModal('Confirmer la suppression', `Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.`, 'confirm'); // Correction: showModal -> showGenericModal
    if (!confirmDelete) {
        return;
    }

    showStatusMessage('Suppression de la conversation...', 'info');
    try {
        await api.deleteConversation(id);
        showStatusMessage('Conversation supprimée avec succès !', 'success');
        if (currentConversationId === id) {
            currentConversationId = null;
            if (currentConversationIdSpan) currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
            if (chatInput) chatInput.disabled = true;
            if (sendChatBtn) sendChatBtn.disabled = true;
            if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
            if (modalCvSummarySection) modalCvSummarySection.style.display = 'none';
            if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
            if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;
        }
        await fetchConversations(currentChatPage);
        await fetchDashboardInsights();
    } catch (error) {
        console.error('Erreur de connexion lors de la suppression de la conversation:', error);
        showGenericModal('Erreur', `Erreur lors de la suppression: ${error.message}`, 'alert'); // Correction: showModal -> showGenericModal
        showStatusMessage(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
}


/**
 * Génère un résumé de CV à partir de la conversation IA active.
 */
async function generateChatCvSummary() {
    if (!currentConversationId) {
        showGenericModal('Attention', 'Veuillez sélectionner une conversation d\'abord pour générer le résumé.', 'alert'); // Correction: showModal -> showGenericModal
        return;
    }

    showStatusMessage('Génération du résumé CV en cours...', 'info');
    if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.disabled = true;
    if (modalCvSummarySection) modalCvSummarySection.style.display = 'block';
    if (modalCvSummaryOutput) modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (copyModalCvSummaryBtn) copyModalCvSummaryBtn.disabled = true;

    try {
        const cvSummaryMarkdown = await api.generateChatCvSummary(currentConversationId);
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
