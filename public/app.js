// public/app.js - Logique UI Complète avec Chatroom intégrée (plus de modal chatbot)
// Importation des modules externes
import { showModal } from './modal.js';
import { setConversations, renderChatConversationList, changeChatPage, initPaginationControls, setActiveConversationId } from './pagination.js';

const API_BASE_URL = window.location.origin;

// --- DOM Elements (Global) ---
const globalStatusMessage = document.getElementById('globalStatusMessage');
// Les éléments du modal générique sont définis dans modal.js, pas besoin de les redéclarer ici
// pour ne pas créer de confusion sur la portée. Le showModal les gère en interne.

// --- Header Elements ---
const navigateToChatroomBtn = document.getElementById('navigateToChatroomBtn'); // Nouveau : bouton Chat IA du header
const themeToggle = document.getElementById('themeToggle');

// --- Navigation Elements ---
const navLinks = document.querySelectorAll('.nav-link');
const appPages = document.querySelectorAll('.content-section');

// --- Page: Accueil (Home) ---
const promptInput = document.getElementById('prompt-input');
const generateResponseBtn = document.getElementById('generateResponseBtn');
const clearPromptBtn = document.getElementById('clearPromptBtn');
const iaResponseOutput = document.getElementById('ia-response-output');

// --- Page: Dashboard UTMi ---
const totalUtmiEl = document.getElementById('totalUtmi');
const totalEstimatedCostUSDEl = document.getElementById('totalEstimatedCostUSD');
const totalEstimatedCostEUREl = document.getElementById('totalEstimatedCostEUR');
const totalInteractionCountEl = document.getElementById('totalInteractionCount');
const averageUtmiPerInteractionEl = document.getElementById('averageUtmiPerInteraction');
const totalUtmiPerCostRatioEl = document.getElementById('totalUtmiPerCostRatio');
const utmiByTypeEl = document.getElementById('utmiByType');
const utmiByModelEl = document.getElementById('utmiByModel');
const utmiPerCostRatioByModelEl = document.getElementById('utmiPerCostRatioByModel');
const utmiByCognitiveAxisEl = document.getElementById('utmiByCognitiveAxis');
const thematicUtmiMarketingEl = document.getElementById('thematicUtmiMarketing');
const thematicUtmiAffiliationEl = document.getElementById('thematicUtmiAffiliation');
const thematicUtmiFiscalEconomicEl = document.getElementById('thematicUtmiFiscalEconomic');
const mostValuableTopicsEl = document.getElementById('mostValuableTopics');
const mostCommonActivitiesEl = document.getElementById('mostCommonActivities');
const exchangeRatesEl = document.getElementById('exchangeRates');
const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

// --- Page: Profil Utilisateur (CV) ---
const cvInput = document.getElementById('cv-input');
const generateCvBtn = document.getElementById('generateCvBtn');
const clearCvInputBtn = document.getElementById('clearCvInputBtn');
const cvOutput = document.getElementById('cv-output');
const downloadCvBtn = document.getElementById('downloadCvBtn');
const valorizeCvContentBtn = document.getElementById('valorizeCvContentBtn');
const valorizationOutput = document.getElementById('valorization-output');

// --- Chatroom Page Elements (anciennement du modal) ---
const startNewConversationBtn = document.getElementById('startNewConversationBtn');
const generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn');
const conversationList = document.getElementById('conversation-list'); // Toujours utilisé par pagination.js
const currentConversationIdSpan = document.getElementById('current-conversation-id');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const modalCvSummarySection = document.getElementById('modalCvSummarySection'); // Son ID est conservé pour la rétrocompatibilité des styles et fonctions
const modalCvSummaryOutput = document.getElementById('modalCvSummaryOutput');
const copyModalCvSummaryBtn = document.getElementById('copyModalCvSummaryBtn');

// --- State Variables ---
let currentConversationId = null;
let currentConversationMessages = []; // Full message history including system message
let generatedCvHtmlContent = ''; // Stores the HTML content of the generated CV for download/valorization


// --- UI Utility Functions ---

/**
 * Shows a global status message at the bottom of the screen.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - Type of message for styling.
 * @param {number} duration - Duration in milliseconds before fading out.
 */
function showGlobalStatus(message, type = 'info', duration = 3000) {
    globalStatusMessage.textContent = message;
    globalStatusMessage.className = `status-message ${type} active`;
    setTimeout(() => {
        globalStatusMessage.classList.remove('active');
    }, duration);
}

/**
 * Helper to render list items.
 * @param {HTMLElement} element - UL element to render into.
 * @param {Array<Object>} data - Array of data objects.
 * @param {Function} itemFormatter - Function to format each item as string.
 */
function renderList(element, data, itemFormatter) {
    element.innerHTML = data.map(item => `<li>${itemFormatter(item)}</li>`).join('');
}

/**
 * Helper to render object properties as list items.
 * @param {HTMLElement} element - UL element to render into.
 * @param {Object} data - Object with properties.
 * @param {Function} itemFormatter - Function to format each key-value pair as string.
 */
function renderObjectList(element, data, itemFormatter) {
    element.innerHTML = Object.entries(data).map(([key, value]) => `<li>${itemFormatter(key, value)}</li>`).join('');
}

/**
 * Downloads content as a file.
 * @param {string} content - The content to download.
 * @param {string} filename - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 */
function downloadFile(content, filename, mimeType) {
    if (!content || content.trim() === '') {
        showGlobalStatus('Rien à télécharger : le contenu est vide.', 'error');
        return;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showGlobalStatus(`Fichier '${filename}' téléchargé avec succès !`, 'success');
}


// --- Main Application Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        themeToggle.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Event Listeners for Global Actions
    navigateToChatroomBtn.addEventListener('click', (event) => { // Mise à jour pour le bouton Chat IA du header
        event.preventDefault();
        showPage('chatroom'); // Navigue vers la nouvelle page chatroom
    });
    themeToggle.addEventListener('click', toggleTheme);

    // Event Listeners for Page Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = event.target.dataset.page;
            showPage(pageId);
        });
    });

    // Default page to show on load
    showPage('home'); // Display home page by default


    // --- Page: Accueil (Home) Event Listeners ---
    generateResponseBtn.addEventListener('click', generateResponse);
    clearPromptBtn.addEventListener('click', () => {
        promptInput.value = '';
        iaResponseOutput.innerHTML = '<p class="placeholder-text">La réponse de l\'IA apparaîtra ici.</p>';
        showGlobalStatus('Champ effacé.', 'info');
    });

    // --- Page: Dashboard UTMi Event Listeners ---
    refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);


    // --- Page: Profil Utilisateur (CV) Event Listeners ---
    generateCvBtn.addEventListener('click', generateCvFromInput);
    clearCvInputBtn.addEventListener('click', () => {
        cvInput.value = '';
        cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
        valorizationOutput.innerHTML = '<p class="placeholder-text">La valorisation de vos compétences par l\'IA apparaîtra ici (ex: phrase d\'accroche, description des compétences, estimation UTMi).</p>';
        downloadCvBtn.style.display = 'none';
        valorizeCvContentBtn.disabled = true;
        showGlobalStatus('Champs CV effacés.', 'info');
    });
    downloadCvBtn.addEventListener('click', () => downloadFile(generatedCvHtmlContent, 'mon_cv_nu.html', 'text/html'));
    valorizeCvContentBtn.addEventListener('click', valorizeCvContent);


    // --- Chatroom Page Event Listeners ---
    startNewConversationBtn.addEventListener('click', startNewConversation);
    generateChatCvSummaryBtn.addEventListener('click', () => generateCvSummaryFromChat(currentConversationId));
    copyModalCvSummaryBtn.addEventListener('click', () => copyToClipboard(modalCvSummaryOutput.textContent));

    // Initialise les écouteurs de pagination du chatbot
    initPaginationControls();

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !chatInput.disabled) {
            sendMessage();
        }
    });

    // Lie les callbacks de pagination à la fenêtre globale pour `pagination.js`
    window.onConversationLoadCallback = loadConversationInChatroom; // Renommé pour correspondre à la nouvelle structure
    window.onConversationDeleteCallback = deleteChatConversation;


    // --- IPC Renderer Listeners for Electron Menu ---
    // Écouteur pour la navigation depuis le menu Electron
    if (window.electronAPI && typeof window.electronAPI.onNavigateToPage === 'function') {
        window.electronAPI.onNavigateToPage((pageId) => {
            showPage(pageId);
        });
    }

    // Écouteur pour démarrer une nouvelle conversation de chat depuis le menu Electron
    if (window.electronAPI && typeof window.electronAPI.onStartNewChatConversation === 'function') {
        window.electronAPI.onStartNewChatConversation(() => {
            showPage('chatroom'); // Assurez-vous d'être sur la page chatroom
            startNewConversation(); // Démarre une nouvelle conversation
        });
    }
});

/**
 * Toggles between light and dark themes.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Update toggle icon
    themeToggle.querySelector('.toggle-circle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

/**
 * Manages which main page section is visible and initializes page-specific logic.
 * Implements the "Multi Modo" principle.
 * @param {string} pageId - The ID of the page to show (e.g., 'home', 'dashboard', 'user-profile', 'chatroom', 'workspace').
 */
function showPage(pageId) {
    // Hide all pages first
    appPages.forEach(page => {
        page.classList.remove('active');
    });

    // Set active navigation link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });

    // Also, update the header chat button if the page is 'chatroom'
    const headerChatBtn = document.getElementById('navigateToChatroomBtn');
    if (pageId === 'chatroom') {
        headerChatBtn.classList.add('active'); // Or a specific class for active state
    } else {
        headerChatBtn.classList.remove('active');
    }


    // Show the selected page
    document.getElementById(`${pageId}-page`).classList.add('active');

    // Scroll to top of the content area when page changes
    document.querySelector('.content-area-wallet-pai').scrollTop = 0;

    // Call page-specific initialization logic (Multi Modo principle)
    switch (pageId) {
        case 'home':
            initializeHomePage();
            break;
        case 'dashboard':
            initializeDashboardPage();
            break;
        case 'user-profile':
            initializeUserProfilePage();
            break;
        case 'chatroom':
            initializeChatroomPage();
            break;
        case 'workspace':
            initializeWorkspacePage();
            break;
        default:
            console.warn(`Page '${pageId}' not recognized or has no specific initialization logic.`);
    }
}

// --- Page Initialization Functions (Multi Modo) ---

function initializeHomePage() {
    console.log('Initializing Home Page...');
    // No specific async data fetch needed here initially, but could be added.
}

function initializeDashboardPage() {
    console.log('Initializing Dashboard Page...');
    fetchDashboardInsights(); // Ensure dashboard insights are fetched when entering this page
}

function initializeUserProfilePage() {
    console.log('Initializing User Profile Page...');
    // Logic for loading user profile data, CV preview, etc.
    // For now, it's mainly static content, but could load CV from backend.
}

function initializeChatroomPage() {
    console.log('Initializing Chatroom Page...');
    fetchChatConversations(); // Load conversations when entering the chatroom
    // Reset active conversation UI if needed when simply entering the page
    // setActiveConversationId(null); // Optional: clear active conversation highlight on page entry
    // displayChatMessages(); // Optional: clear chat window
}

function initializeWorkspacePage() {
    console.log('Initializing Workspace Page...');
    // This is where you would add logic for your Workspace:
    // - Load user's projects or custom tools
    // - Render specific widgets
    // - Fetch data relevant to the workspace
    showGlobalStatus('Bienvenue dans votre Espace de Travail !', 'info', 2000);
}


// --- Page: Accueil (Home) - Fonctions d'Interaction IA Ponctuelle ---
async function generateResponse() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showGlobalStatus('Veuillez entrer un prompt.', 'error');
        return;
    }

    iaResponseOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    generateResponseBtn.disabled = true;
    clearPromptBtn.disabled = true;
    showGlobalStatus('Génération de la réponse ponctuelle...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();
        if (response.ok) {
            iaResponseOutput.innerHTML = `
                <p><strong>Réponse de l'IA :</strong></p>
                <p>${data.response}</p>
                <p class="meta-info">UTMi généré: ${data.utmi.toFixed(2)} EUR | Coût estimé: ${data.estimatedCost.toFixed(6)} USD</p>
            `;
            fetchDashboardInsights(); // Update dashboard
            showGlobalStatus('Réponse ponctuelle générée !', 'success');
        } else {
            iaResponseOutput.innerHTML = `<p class="placeholder-text error-message">Erreur: ${data.error || 'Réponse inattendue du serveur.'}</p>`;
            showGlobalStatus(`Erreur: ${data.error || 'Réponse inattendue du serveur.'}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la requête API ponctuelle:', error);
        iaResponseOutput.innerHTML = `<p class="placeholder-text error-message">Erreur de connexion: ${error.message}</p>`;
        showGlobalStatus(`Erreur de connexion: ${error.message}`, 'error');
    } finally {
        generateResponseBtn.disabled = false;
        clearPromptBtn.disabled = false;
    }
}


// --- Page: Dashboard UTMi (Section 1) ---
async function fetchDashboardInsights() {
    showGlobalStatus('Actualisation du tableau de bord...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-insights`);
        const insights = await response.json();

        // Utilisation de l'opérateur de coalescence nullish (??) pour s'assurer que les valeurs sont des nombres ou 0
        totalUtmiEl.textContent = `${(insights.totalUtmi ?? 0).toFixed(2)} EUR`;
        totalEstimatedCostUSDEl.textContent = `${(insights.totalEstimatedCostUSD ?? 0).toFixed(2)} USD`;
        totalEstimatedCostEUREl.textContent = `${(insights.totalEstimatedCostEUR ?? 0).toFixed(2)} EUR`;
        totalInteractionCountEl.textContent = insights.totalInteractionCount ?? 0;
        averageUtmiPerInteractionEl.textContent = `${(insights.averageUtmiPerInteraction ?? 0).toFixed(2)} EUR`;
        totalUtmiPerCostRatioEl.textContent = (insights.totalUtmiPerCostRatio ?? 0).toFixed(2); // Pas d'unité ici car c'est un ratio

        renderList(utmiByTypeEl, insights.utmiByType || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);
        renderList(utmiByModelEl, insights.utmiByModel || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);
        renderObjectList(utmiPerCostRatioByModelEl, insights.utmiPerCostRatioByModel || {}, (key, value) => `<strong>${key}:</strong> ${(value ?? 0).toFixed(2)}`);
        renderList(utmiByCognitiveAxisEl, insights.utmiByCognitiveAxis || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);

        thematicUtmiMarketingEl.textContent = (insights.thematicUtmi?.marketing ?? 0).toFixed(2);
        thematicUtmiAffiliationEl.textContent = (insights.thematicUtmi?.affiliation ?? 0).toFixed(2);
        thematicUtmiFiscalEconomicEl.textContent = (insights.thematicUtmi?.fiscalEconomic ?? 0).toFixed(2);

        renderList(mostValuableTopicsEl, insights.mostValuableTopics || [], item => `${item.name} (${(item.utmi ?? 0).toFixed(2)} EUR)`);
        renderList(mostCommonActivitiesEl, insights.mostCommonActivities || [], item => `${item.name} (${item.count ?? 0} fois)`);
        renderObjectList(exchangeRatesEl, insights.exchangeRates || {}, (key, value) => `1 EUR = ${(value ?? 0)} ${key}`); // Pas de toFixed ici, taux de change peut être long

        showGlobalStatus('Tableau de bord actualisé !', 'success');

    } catch (error) {
        console.error('Erreur lors de la récupération des insights du tableau de bord:', error);
        showGlobalStatus(`Erreur d'actualisation du tableau de bord: ${error.message}`, 'error');
        // Fallback text in case of error
        const elementsToUpdate = [
            totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
            averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, thematicUtmiMarketingEl,
            thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl
        ];
        elementsToUpdate.forEach(el => { el.textContent = 'Erreur...'; });
        const listElementsToUpdate = [
            utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
            mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl
        ];
        listElementsToUpdate.forEach(el => { el.innerHTML = '<li>Erreur de chargement...</li>'; });
    }
}


// --- Page: Profil Utilisateur (CV) - Fonctions ---

/**
 * Génère un CV HTML à partir du texte d'entrée.
 * Cette fonction utilise l'ancienne logique d'analyse de conversation collée.
 */
async function generateCvFromInput() {
    const rawCvContent = cvInput.value.trim();
    if (!rawCvContent) {
        showGlobalStatus('Veuillez entrer du contenu pour générer le CV.', 'error');
        return;
    }

    showGlobalStatus('Génération du CV en cours...', 'info');
    generateCvBtn.disabled = true;
    clearCvInputBtn.disabled = true;
    valorizeCvContentBtn.disabled = true;
    downloadCvBtn.style.display = 'none';
    cvOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    valorizationOutput.innerHTML = '<p class="placeholder-text">En attente de valorisation...</p>';


    try {
        // Envoi le contenu brut pour analyse et enregistrement comme une "conversation collée"
        const analyzeResponse = await fetch(`${API_BASE_URL}/api/record-and-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationMarkdown: rawCvContent }),
        });

        if (!analyzeResponse.ok) {
            const errorData = await analyzeResponse.json();
            throw new Error(errorData.message || 'Échec de l\'analyse du contenu pour le CV.');
        }

        // Ensuite, on génère le CV HTML basé sur les logs mis à jour
        const generateCvResponse = await fetch(`${API_BASE_URL}/api/generate-cv`);
        if (!generateCvResponse.ok) {
            const errorText = await generateCvResponse.text();
            throw new Error(`Échec de la génération du CV HTML: ${errorText}`);
        }

        generatedCvHtmlContent = await generateCvResponse.text();
        cvOutput.innerHTML = generatedCvHtmlContent;
        downloadCvBtn.style.display = 'inline-flex';
        valorizeCvContentBtn.disabled = false;
        showGlobalStatus('CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        showGlobalStatus(`Erreur de génération du CV: ${error.message}`, 'error');
        cvOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du CV: ${error.message}</p>`;
    } finally {
        generateCvBtn.disabled = false;
        clearCvInputBtn.disabled = false;
    }
}

/**
 * Valorise le contenu du CV généré via l'IA.
 */
async function valorizeCvContent() {
    if (!generatedCvHtmlContent) {
        showGlobalStatus('Veuillez d\'abord générer le CV.', 'error');
        return;
    }

    showGlobalStatus('Valorisation du CV en cours...', 'info');
    valorizeCvContentBtn.disabled = true;
    valorizationOutput.innerHTML = '<p class="placeholder-text">Valorisation par l\'IA en cours...</p>';

    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generatedCvHtmlContent;
        const cvTextContent = tempDiv.innerText || tempDiv.textContent; // Extraire le texte brut du HTML

        const response = await fetch(`${API_BASE_URL}/api/valorize-cv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent: cvTextContent }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Échec de la valorisation.');
        }

        const result = await response.json();
        valorizationOutput.innerHTML = `<pre>${JSON.stringify(result.valorization, null, 2)}</pre>`;
        showGlobalStatus('CV valorisé avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV:', error);
        showGlobalStatus(`Erreur de valorisation du CV: ${error.message}`, 'error');
        valorizationOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la valorisation du CV: ${error.message}</p>`;
    } finally {
        valorizeCvContentBtn.disabled = false;
    }
}


// --- Chatroom Page Functions (anciennement du Modal Chatbot) ---

/**
 * Fetches all chat conversations for the chatroom list.
 */
async function fetchChatConversations() {
    try {
        showGlobalStatus('Chargement des conversations...', 'info');
        const response = await fetch(`${API_BASE_URL}/api/conversations`);
        const conversations = await response.json();
        setConversations(conversations); // Utilise la fonction du module pagination.js
        showGlobalStatus('Conversations chargées.', 'success');
    } catch (error) {
        console.error('Error fetching chat conversations:', error);
        // Utilise la liste de conversations directement pour afficher l'erreur
        document.getElementById('conversation-list').innerHTML = '<p class="placeholder-text error-message">Erreur de chargement des conversations.</p>';
        showGlobalStatus('Erreur de chargement des conversations.', 'error');
    }
}

async function startNewConversation() {
    showGlobalStatus('Démarrage d\'une nouvelle conversation...', 'info');
    startNewConversationBtn.disabled = true;
    generateChatCvSummaryBtn.style.display = 'none'; // Hide summary button for new conv
    modalCvSummarySection.style.display = 'none'; // Hide summary section
    modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (response.ok) {
            await fetchChatConversations(); // Reload all conversations to include the new one (will reset to page 1)
            loadConversationInChatroom(data.id); // Load the new conversation
            showGlobalStatus('Nouvelle conversation démarrée !', 'success');
        } else {
            await showModal('Erreur', `Impossible de démarrer une nouvelle conversation: ${data.error}`, 'alert');
            showGlobalStatus(`Erreur: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors du démarrage d\'une nouvelle conversation.`, 'alert');
        showGlobalStatus(`Erreur de connexion: ${error.message}`, 'error');
    } finally {
        startNewConversationBtn.disabled = false;
    }
}

async function loadConversationInChatroom(id) {
    showGlobalStatus('Chargement de la conversation...', 'info');
    // Reset state for new conversation loading
    generateChatCvSummaryBtn.style.display = 'none';
    generateChatCvSummaryBtn.disabled = true;
    modalCvSummarySection.style.display = 'none';
    modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
    copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }
        const conversation = await response.json();
        currentConversationId = conversation.id;
        currentConversationMessages = conversation.messages; // Full message history including system message

        displayChatMessages();
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        currentConversationIdSpan.textContent = `(ID: ${currentConversationId.substring(0, 8)}...)`;

        // Update active conversation in the pagination module as well
        setActiveConversationId(id); // Nouvelle ligne pour synchroniser avec pagination.js

        showGlobalStatus('Conversation chargée.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        await showModal('Erreur', `Erreur de chargement de la conversation: ${error.message}`, 'alert');
        showGlobalStatus(`Erreur de chargement de la conversation: ${error.message}`, 'error');
        chatWindow.innerHTML = '<p class="placeholder-text error-message">Erreur de chargement de la conversation.</p>';
        chatInput.disabled = true;
        sendChatBtn.disabled = true;
        generateChatCvSummaryBtn.style.display = 'none';
    }
}

function displayChatMessages() {
    chatWindow.innerHTML = '';
    // Filter system messages for user display
    const userVisibleMessages = currentConversationMessages.filter(msg => msg.role !== 'system');

    if (userVisibleMessages.length === 0) {
        chatWindow.innerHTML = '<p class="placeholder-text">Commencez à discuter avec l\'IA !</p>';
        return;
    }

    userVisibleMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.role}`;
        // Assurez-vous que msg.utmi et msg.estimated_cost_usd existent pour ne pas afficher 'undefined'
        const utmiInfo = msg.utmi !== undefined && msg.utmi !== null ? `UTMi: ${msg.utmi.toFixed(2)} EUR` : '';
        const costInfo = msg.estimated_cost_usd !== undefined && msg.estimated_cost_usd !== null ? `Coût: ${msg.estimated_cost_usd.toFixed(6)} USD` : '';
        const metaInfo = (utmiInfo || costInfo) ? `<br><small>${utmiInfo} ${costInfo}</small>` : '';

        div.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content}${metaInfo}`;
        chatWindow.appendChild(div);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) {
        return;
    }

    // Add user message to UI immediately
    currentConversationMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });
    displayChatMessages();
    chatInput.value = ''; // Clear input
    chatInput.disabled = true; // Disable input while AI responds
    sendChatBtn.disabled = true;
    showGlobalStatus('Envoi du message...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        if (response.ok) {
            showGlobalStatus('Réponse de l\'IA reçue !', 'success');
            // Reload conversation to get full updated state (including UTMi/cost from server)
            await loadConversationInChatroom(currentConversationId);
            await fetchChatConversations(); // Update list (especially UTMi totals)
            await fetchDashboardInsights(); // Update dashboard
        } else {
            await showModal('Erreur', `Erreur lors de l\'envoi du message: ${data.error}`, 'alert');
            showGlobalStatus(`Erreur: ${data.error}`, 'error');
            // Remove the last user message if AI failed to respond
            currentConversationMessages.pop();
            displayChatMessages();
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        await showModal('Erreur', `Erreur de connexion lors de l\'envoi du message.`, 'alert');
        showGlobalStatus(`Erreur de connexion: ${error.message}`, 'error');
        currentConversationMessages.pop(); // Remove the message if sending failed
        displayChatMessages();
    } finally {
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
    }
}

async function deleteChatConversation(id, title) {
    // Utilise le modal de confirmation personnalisé
    const confirmDelete = await showModal('Confirmer la suppression', `Êtes-vous sûr de vouloir supprimer la conversation "${title}" ? Cette action est irréversible.`, 'confirm');
    if (!confirmDelete) {
        return;
    }

    showGlobalStatus('Suppression de la conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showGlobalStatus('Conversation supprimée avec succès !', 'success');
            if (currentConversationId === id) { // If the active conversation is deleted
                currentConversationId = null;
                currentConversationMessages = [];
                currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
                chatInput.disabled = true;
                sendChatBtn.disabled = true;
                generateChatCvSummaryBtn.style.display = 'none';
                modalCvSummarySection.style.display = 'none';
                modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Un résumé pertinent pour votre CV à partir de la conversation apparaîtra ici.</p>';
                copyModalCvSummaryBtn.disabled = true;
            }
            await fetchChatConversations(); // Reload chat conversations (updates pagination)
            await fetchDashboardInsights(); // Reload dashboard insights
            displayChatMessages(); // Clear chat window if active conversation deleted

            // Après suppression, si la conversation active était celle supprimée, désactiver aussi dans pagination.js
            if (currentConversationId === null) {
                setActiveConversationId(null);
            }
        } else {
            const data = await response.json();
            await showModal('Erreur', `Erreur lors de la suppression: ${data.error}`, 'alert');
            showGlobalStatus(`Erreur lors de la suppression: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur de connexion lors de la suppression de la conversation:', error);
        await showModal('Erreur', `Erreur de connexion lors de la suppression de la conversation.`, 'alert');
        showGlobalStatus(`Erreur de connexion: ${error.message}`, 'error');
    }
}

async function generateCvSummaryFromChat(conversationId) {
    if (!conversationId) {
        await showModal('Attention', 'Veuillez sélectionner une conversation d\'abord pour générer le résumé.', 'alert');
        return;
    }

    showGlobalStatus('Génération du résumé CV en cours...', 'info');
    generateChatCvSummaryBtn.disabled = true;
    modalCvSummarySection.style.display = 'block';
    modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/cv-professional-summary`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Échec HTTP (${response.status}): ${errorText}`);
        }

        const cvSummaryMarkdown = await response.text();
        modalCvSummaryOutput.textContent = cvSummaryMarkdown;
        copyModalCvSummaryBtn.disabled = false;
        showGlobalStatus('Résumé CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du résumé CV depuis le chat:', error);
        modalCvSummaryOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du résumé CV : ${error.message}</p>`;
        showGlobalStatus(`Erreur lors de la génération du résumé CV: ${error.message}`, 'error');
    } finally {
        generateChatCvSummaryBtn.disabled = false;
    }
}

/**
 * Copies the provided text content to the clipboard.
 * @param {string} text - The text content to copy.
 */
function copyToClipboard(text) {
    if (!text || text.trim() === '') {
        showGlobalStatus('Rien à copier : le contenu est vide.', 'error');
        return;
    }
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    try {
        document.execCommand('copy');
        showGlobalStatus('Copié dans le presse-papiers !', 'success');
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        showGlobalStatus('Échec de la copie dans le presse-papiers.', 'error');
    } finally {
        document.body.removeChild(tempTextArea);
    }
}
