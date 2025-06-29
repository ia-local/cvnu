// public/cv.js - Logique client pour CVNU

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin; // Par exemple: http://localhost:3000

// --- Éléments du DOM globaux ---
const mainNavbar = document.getElementById('mainNavbar');
const navLinks = document.querySelectorAll('.navbar-main-links .nav-link');
const contentSections = document.querySelectorAll('.content-section');
const dynamicLeftNav = document.getElementById('dynamic-left-nav');
const dynamicNavList = document.getElementById('dynamic-nav-list');
const globalStatusMessage = document.getElementById('globalStatusMessage');

// --- Éléments spécifiques à la page Accueil ---
const promptInput = document.getElementById('prompt-input');
const iaResponseOutput = document.getElementById('ia-response-output');
const generateResponseBtn = document.getElementById('generateResponseBtn');
const clearPromptBtn = document.getElementById('clearPromptBtn');

// --- Éléments spécifiques au Dashboard UTMi ---
// Déjà définis dans main.js, à revoir si le dashboard est géré ici ou via un module séparé.
// Pour l'instant, je les mets ici si les scripts sont fusionnés.
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


// --- Éléments spécifiques à la Gestion du CV ---
const cvInput = document.getElementById('cv-input');
const generateCvBtn = document.getElementById('generateCvBtn');
const clearCvInputBtn = document.getElementById('clearCvInputBtn');
const cvOutput = document.getElementById('cv-output');
const downloadCvBtn = document.getElementById('downloadCvBtn');
const valorizeCvContentBtn = document.getElementById('valorizeCvContentBtn');
const valorizationOutput = document.getElementById('valorization-output');

// --- Éléments spécifiques à la Chatroom IA ---
const startNewConversationBtn = document.getElementById('startNewConversationBtn');
const generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn');
const conversationList = document.getElementById('conversation-list');
const currentConversationIdSpan = document.getElementById('current-conversation-id');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const modalCvSummarySection = document.getElementById('modalCvSummarySection');
const modalCvSummaryOutput = document.getElementById('modalCvSummaryOutput');
const copyModalCvSummaryBtn = document.getElementById('copyModalCvSummaryBtn');


// --- État de l'application ---
let currentConversationId = null;
let currentChatPage = 1;
const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations à afficher par page
let conversations = []; // Stocke les conversations chargées

// --- Fonctions utilitaires ---
function showStatusMessage(message, type = 'info') {
    globalStatusMessage.textContent = message;
    globalStatusMessage.className = `status-message ${type} active`;
    setTimeout(() => {
        globalStatusMessage.classList.remove('active');
    }, 3000);
}

// Fonction pour afficher une section spécifique et masquer les autres
const showPage = (pageId) => {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(pageId + '-page');
    if (activeSection) {
        activeSection.classList.add('active');
        updateDynamicLeftNav(pageId); // Mettre à jour la nav latérale
        // Gérer les rendus spécifiques à la page si nécessaire
        if (pageId === 'dashboard') {
            fetchDashboardInsights(); // Recharger les données du dashboard
            renderDashboardChart(); // Rendre le graphique du dashboard
        } else if (pageId === 'home') {
            // Rendre le graphique de la page d'accueil si applicable
        } else if (pageId === 'cv-management') {
            // Pas de graphique ici, mais d'autres initialisations peuvent être nécessaires
        } else if (pageId === 'chatroom') {
            fetchConversations(currentChatPage); // Recharger les conversations du chat
        }
    }
};

// Fonction pour définir le lien de navigation actif
const setActiveNavLink = (pageId) => {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

// Fonction pour mettre à jour la navigation latérale dynamique
const updateDynamicLeftNav = (currentPageId) => {
    let navContent = '';
    let navTitle = `<i class="fas fa-bars"></i> Menu Thématique`;

    switch (currentPageId) {
        case 'home':
            navTitle = `<i class="fas fa-info-circle"></i> Accueil`;
            navContent = `
                <li><a href="#home-page .card:nth-of-type(1)">Assistant IA</a></li>
                <li><a href="#home-page .card:nth-of-type(2)">Interaction Ponctuelle</a></li>
            `;
            break;
        case 'dashboard':
            navTitle = `<i class="fas fa-chart-line"></i> Dashboard UTMi`;
            navContent = `
                <li><a href="#dashboard-page .grid-metrics">Aperçu Global</a></li>
                <li><a href="#dashboard-page .grid-details">Détails & Répartitions</a></li>
                <li><a href="#refreshDashboardBtn">Actualiser</a></li>
            `;
            break;
        case 'user-profile':
            navTitle = `<i class="fas fa-user-circle"></i> Votre Profil`;
            navContent = `
                <li><a href="#user-profile-page .card:nth-of-type(1)">Identité CVNU</a></li>
                <li><a href="#user-profile-page .card:nth-of-type(2)">Comptes Liés</a></li>
                <li><a href="#user-profile-page .card:nth-of-type(3)">Sécurité</a></li>
            `;
            break;
        case 'cv-management':
            navTitle = `<i class="fas fa-address-card"></i> Gestion CV`;
            navContent = `
                <li><a href="#cv-management-page .card:nth-of-type(1)">Générateur de CV</a></li>
                <li><a href="#cv-management-page #cv-output">Aperçu CV</a></li>
                <li><a href="#cv-management-page .card:nth-of-type(2)">Valorisation Compétences</a></li>
            `;
            break;
        case 'chatroom':
            navTitle = `<i class="fas fa-comment-dots"></i> Chatroom IA`;
            navContent = `
                <li><a href="#startNewConversationBtn">Nouvelle Conversation</a></li>
                <li><a href="#conversation-list">Liste des Conversations</a></li>
                <li><a href="#chat-window">Fenêtre de Chat</a></li>
            `;
            break;
        case 'workspace':
            navTitle = `<i class="fas fa-briefcase"></i> Mon Espace`;
            navContent = `
                <li><a href="#workspace-page .card:nth-of-type(1)">Outils Personnalisés</a></li>
                <li><a href="#workspace-page .card:nth-of-type(2)">Projets Actifs</a></li>
            `;
            break;
        case 'documentation':
            navTitle = `<i class="fas fa-book-open"></i> Documentation`;
            navContent = `
                <li><a href="#documentation-page .card:nth-of-type(1)">Guide d'Utilisation</a></li>
                <li><a href="#documentation-page .card:nth-of-type(2)">Référence Développeur</a></li>
            `;
            break;
        case 'contact':
            navTitle = `<i class="fas fa-headset"></i> Contact`;
            navContent = `
                <li><a href="#contact-page .card:nth-of-type(1)">Par Email</a></li>
                <li><a href="#contact-page .card:nth-of-type(2)">Support</a></li>
                <li><a href="#contact-page .card:nth-of-type(3)">Adresse</a></li>
            `;
            break;
        default:
            navContent = `<li class="placeholder-text">Sélectionnez une section...</li>`;
            break;
    }
    dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle;
    dynamicNavList.innerHTML = navContent;

    // Add click listeners to dynamic nav links for smooth scrolling
    dynamicNavList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
};

// --- Logique de l'application ---

// Gestion de la navigation principale
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const pageId = link.getAttribute('data-page');
        showPage(pageId);
        setActiveNavLink(pageId);
    });
});

// Initialisation de la page au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Afficher la page d'accueil par défaut
    showPage('home');
    setActiveNavLink('home');

    // Assurer que les événements pour les éléments du Dashboard sont attachés
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);
    }
    // Gérer l'interaction ponctuelle sur la page d'accueil
    if (generateResponseBtn) {
        generateResponseBtn.addEventListener('click', generateResponse);
    }
    if (clearPromptBtn) {
        clearPromptBtn.addEventListener('click', () => {
            promptInput.value = '';
            iaResponseOutput.innerHTML = '<p class="placeholder-text">La réponse de l\'IA apparaîtra ici.</p>';
        });
    }

    // Gérer la gestion du CV
    if (generateCvBtn) {
        generateCvBtn.addEventListener('click', generateCv);
    }
    if (clearCvInputBtn) {
        clearCvInputBtn.addEventListener('click', () => {
            cvInput.value = '';
            cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
            downloadCvBtn.style.display = 'none';
        });
    }
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', downloadCv);
    }
    if (valorizeCvContentBtn) {
        valorizeCvContentBtn.addEventListener('click', valorizeCvContent);
    }

    // Gérer la chatroom
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

    // Adapter le padding du body pour la navbar fixe (peut être aussi fait en CSS)
    const navbarHeight = mainNavbar.offsetHeight;
    document.body.style.paddingTop = `${navbarHeight + 20}px`; // Ajoute un peu de marge
});


// --- Fonctions d'API et de logique métier ---

/**
 * Gère l'interaction IA ponctuelle (page Accueil).
 */
async function generateResponse() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatusMessage('Veuillez entrer une requête pour l\'IA.', 'warning');
        return;
    }

    showStatusMessage('Génération de la réponse IA...', 'info');
    iaResponseOutput.innerHTML = '<p>Chargement...</p>';
    generateResponseBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        iaResponseOutput.innerHTML = `<pre>${data.response}</pre>`; // Ou autre formatage
        showStatusMessage('Réponse générée avec succès.', 'success');
    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        iaResponseOutput.innerHTML = '<p style="color: red;">Erreur: Impossible de générer la réponse. Veuillez réessayer.</p>';
        showStatusMessage('Erreur lors de la génération de la réponse.', 'error');
    } finally {
        generateResponseBtn.disabled = false;
    }
}


/**
 * Récupère et affiche les insights du tableau de bord.
 * Ceci est une version simplifiée, vous devrez lier cela à votre backend.
 */
async function fetchDashboardInsights() {
    showStatusMessage('Chargement du Dashboard...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-insights`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const insights = await response.json();

        // Mettre à jour les éléments du DOM avec les données du dashboard
        totalUtmiEl.textContent = `${insights.totalUtmi.toFixed(2)}`;
        totalEstimatedCostUSDEl.textContent = `${insights.totalEstimatedCostUSD.toFixed(2)}`;
        totalEstimatedCostEUREl.textContent = `${insights.totalEstimatedCostEUR.toFixed(2)}`;
        totalInteractionCountEl.textContent = insights.totalInteractionCount;
        averageUtmiPerInteractionEl.textContent = `${insights.averageUtmiPerInteraction.toFixed(2)}`;
        totalUtmiPerCostRatioEl.textContent = `${insights.totalUtmiPerCostRatio.toFixed(2)}`;

        // Mettre à jour les listes
        utmiByTypeEl.innerHTML = insights.utmiByType.map(item => `<li>${item.name}: ${item.value.toFixed(2)}</li>`).join('');
        utmiByModelEl.innerHTML = insights.utmiByModel.map(item => `<li>${item.name}: ${item.value.toFixed(2)}</li>`).join('');
        utmiPerCostRatioByModelEl.innerHTML = Object.entries(insights.utmiPerCostRatioByModel)
            .map(([model, ratio]) => `<li>${model}: ${ratio.toFixed(2)}</li>`).join('');
        utmiByCognitiveAxisEl.innerHTML = insights.utmiByCognitiveAxis.map(item => `<li>${item.name}: ${item.value.toFixed(2)}</li>`).join('');

        thematicUtmiMarketingEl.textContent = insights.thematicUtmi.marketing.toFixed(2);
        thematicUtmiAffiliationEl.textContent = insights.thematicUtmi.affiliation.toFixed(2);
        thematicUtmiFiscalEconomicEl.textContent = insights.thematicUtmi.fiscalEconomic.toFixed(2);

        mostValuableTopicsEl.innerHTML = insights.mostValuableTopics.map(item => `<li>${item.name} (${item.value.toFixed(2)} UTMi)</li>`).join('');
        mostCommonActivitiesEl.innerHTML = insights.mostCommonActivities.map(item => `<li>${item.name} (${item.count} fois)</li>`).join('');
        exchangeRatesEl.innerHTML = Object.entries(insights.exchangeRates)
            .map(([currency, rate]) => `<li>1 EUR = ${rate} ${currency}</li>`).join('');

        showStatusMessage('Dashboard actualisé.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement des insights du dashboard:', error);
        showStatusMessage('Erreur lors du chargement du dashboard.', 'error');
        // Fallback text in case of error
        const elementsToUpdate = [
            totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
            averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl,
            utmiByCognitiveAxisEl, thematicUtmiMarketingEl, thematicUtmiAffiliationEl,
            thematicUtmiFiscalEconomicEl, mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl
        ];
        elementsToUpdate.forEach(el => {
            if (el.tagName === 'UL') {
                el.innerHTML = '<li>Erreur de chargement...</li>';
            } else {
                el.textContent = 'Erreur...';
            }
        });
    }
}

/**
 * Génère un CV à partir du texte saisi.
 * Vous devrez intégrer cette fonction à votre API backend `/api/record-and-analyze` ou `/api/generate-cv`.
 */
async function generateCv() {
    const cvContent = cvInput.value.trim();
    if (!cvContent) {
        showStatusMessage('Veuillez saisir des informations pour générer le CV.', 'warning');
        return;
    }

    showStatusMessage('Génération du CV en cours...', 'info');
    cvOutput.innerHTML = '<p>Génération...</p>';
    generateCvBtn.disabled = true;

    try {
        // Supposons une API qui prend le texte brut et renvoie du HTML pour le CV
        const response = await fetch(`${API_BASE_URL}/api/record-and-analyze`, { // Ou une nouvelle route comme /api/generate-cv
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cvContent })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        // Le backend devrait renvoyer le CV formaté en HTML ou en Markdown
        // Pour cet exemple, je suppose que 'data.cvHtml' contient le HTML ou 'data.cvContent' le texte structuré.
        // Si c'est du Markdown, vous aurez besoin d'une bibliothèque Markdown-to-HTML côté client.
        const generatedHtml = `
            <div class="cv-preview">
                <h3>Votre CV Généré</h3>
                ${data.cvHtml || `<pre>${data.cvContent || cvContent}</pre>`}
                <p class="mt-4 text-gray-600">Le contenu ci-dessus est un aperçu. Téléchargez la version HTML complète pour un formatage optimal.</p>
            </div>
        `;
        cvOutput.innerHTML = generatedHtml;
        downloadCvBtn.style.display = 'inline-block'; // Afficher le bouton de téléchargement
        showStatusMessage('CV généré avec succès.', 'success');
    } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        cvOutput.innerHTML = '<p style="color: red;">Erreur: Impossible de générer le CV. Vérifiez le format ou réessayez.</p>';
        showStatusMessage('Erreur lors de la génération du CV.', 'error');
    } finally {
        generateCvBtn.disabled = false;
    }
}

/**
 * Télécharge le CV généré sous forme de fichier HTML.
 */
function downloadCv() {
    const cvHtml = cvOutput.innerHTML; // Ou la version complète si l'API la renvoie
    if (!cvHtml || cvHtml.includes('placeholder-text') || cvHtml.includes('Erreur:')) {
        showStatusMessage('Aucun CV à télécharger ou CV invalide.', 'warning');
        return;
    }

    const blob = new Blob([cvHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mon_cv_cvnu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('CV téléchargé.', 'success');
}

/**
 * Valorise le contenu du CV via l'IA.
 * Cela devrait appeler votre API backend pour l'analyse et la valorisation (ex: `/api/valorize-cv`).
 */
async function valorizeCvContent() {
    const contentToValorize = cvInput.value.trim(); // Utiliser le contenu du champ CV
    if (!contentToValorize) {
        showStatusMessage('Veuillez saisir du texte dans le champ CV pour le valoriser.', 'warning');
        return;
    }

    showStatusMessage('Valorisation des compétences par l\'IA...', 'info');
    valorizationOutput.innerHTML = '<p>Analyse et valorisation en cours...</p>';
    valorizeCvContentBtn.disabled = true;

    try {
        // Supposons une API qui prend le texte et renvoie la valorisation
        const response = await fetch(`${API_BASE_URL}/api/valorize-skills`, { // Nouvelle route suggérée
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent: contentToValorize })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        let valorizationHtml = `
            <h3>Synthèse de Valorisation</h3>
            <p><strong>Phrase d'accroche professionnelle:</strong> ${data.professionalSummary || 'N/A'}</p>
            <p><strong>Compétences Clés Extraites:</strong> ${data.extractedSkills ? data.extractedSkills.join(', ') : 'N/A'}</p>
            <p><strong>Estimation de Valeur UTMi:</strong> <span class="font-bold text-green-700">${data.estimatedUtmiValue ? data.estimatedUtmiValue.toFixed(2) : 'N/A'} UTMi</span></p>
            <p><strong>Conseils pour Amélioration:</strong> ${data.improvementTips || 'Aucun conseil pour le moment.'}</p>
        `;
        valorizationOutput.innerHTML = valorizationHtml;
        showStatusMessage('Valorisation terminée.', 'success');
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV:', error);
        valorizationOutput.innerHTML = '<p style="color: red;">Erreur: Impossible de valoriser le CV. Le serveur n\'a peut-être pas renvoyé de données ou une erreur est survenue.</p>';
        showStatusMessage('Erreur lors de la valorisation.', 'error');
    } finally {
        valorizeCvContentBtn.disabled = false;
    }
}


// --- Fonctions de gestion du Chatroom IA ---
// Ces fonctions sont basées sur le "main.js" précédent et les APIs de "serveur.js"

/**
 * Démarre une nouvelle conversation.
 */
async function startNewConversation() {
    showStatusMessage('Démarrage d\'une nouvelle conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Corps vide pour nouvelle conversation
        });
        const data = await response.json();
        currentConversationId = data.conversationId;
        currentConversationIdSpan.textContent = `ID: ${currentConversationId}`;
        chatWindow.innerHTML = '<p class="chat-message bot">Bonjour ! Comment puis-je vous aider ?</p>';
        chatInput.value = '';
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        generateChatCvSummaryBtn.style.display = 'none'; // Cacher jusqu'à ce qu'il y ait du contenu
        showStatusMessage('Nouvelle conversation démarrée.', 'success');
        fetchConversations(); // Recharger la liste des conversations
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        showStatusMessage('Erreur lors du démarrage de la conversation.', 'error');
    }
}

/**
 * Sélectionne une conversation existante.
 * @param {string} conversationId - L'ID de la conversation à charger.
 */
async function selectConversation(conversationId) {
    showStatusMessage('Chargement de la conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
        const data = await response.json();
        currentConversationId = data.id;
        currentConversationIdSpan.textContent = `ID: ${currentConversationId}`;
        chatWindow.innerHTML = data.messages.map(msg =>
            `<p class="chat-message ${msg.sender}">${msg.message}</p>`
        ).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        generateChatCvSummaryBtn.style.display = 'inline-block'; // Afficher le bouton de résumé
        showStatusMessage('Conversation chargée.', 'success');
        // Mettre à jour l'état actif dans la liste
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === conversationId) {
                item.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        showStatusMessage('Erreur lors du chargement de la conversation.', 'error');
    }
}

/**
 * Envoie un message dans la conversation active.
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) {
        showStatusMessage('Veuillez saisir un message ou démarrer une conversation.', 'warning');
        return;
    }

    // Afficher le message de l'utilisateur immédiatement
    chatWindow.innerHTML += `<p class="chat-message user">${message}</p>`;
    chatInput.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
    sendChatBtn.disabled = true; // Désactiver le bouton pendant la réponse IA
    chatInput.disabled = true;

    showStatusMessage('Envoi du message et attente de la réponse IA...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        chatWindow.innerHTML += `<p class="chat-message bot">${data.reply}</p>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
        showStatusMessage('Réponse IA reçue.', 'success');
        fetchConversations(currentChatPage); // Rafraîchir la liste pour montrer les mises à jour
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        chatWindow.innerHTML += `<p class="chat-message bot error">Désolé, une erreur est survenue. Veuillez réessayer.</p>`;
        showStatusMessage('Erreur lors de l\'envoi du message.', 'error');
    } finally {
        sendChatBtn.disabled = false; // Réactiver le bouton
        chatInput.disabled = false;
        chatInput.focus();
    }
}

/**
 * Récupère la liste des conversations du backend.
 */
async function fetchConversations(page = 1) {
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations?page=${page}&limit=${CHAT_CONVERSATIONS_PER_PAGE}`);
        const data = await response.json();
        conversations = data.conversations; // Assurez-vous que le backend renvoie un tableau 'conversations'
        const totalPages = data.totalPages;

        conversationList.innerHTML = '';
        if (conversations.length === 0) {
            conversationList.innerHTML = '<p class="placeholder-text">Aucune conversation. Cliquez sur "Nouvelle" pour commencer.</p>';
            document.getElementById('conversation-pagination').style.display = 'none';
        } else {
            conversations.forEach(conv => {
                const li = document.createElement('li');
                li.className = 'conversation-item';
                li.dataset.id = conv.id;
                li.innerHTML = `
                    <span>${conv.title || `Conversation ${conv.id.substring(0, 4)}...`}</span>
                    <button class="delete-conversation-btn" data-id="${conv.id}"><i class="fas fa-trash-alt"></i></button>
                `;
                li.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-conversation-btn')) {
                        selectConversation(conv.id);
                    }
                });
                conversationList.appendChild(li);
            });

            // Gérer la pagination
            document.getElementById('current-page-info').textContent = `Page ${page}/${totalPages}`;
            document.querySelector('#conversation-pagination button[data-page-action="prev"]').disabled = (page <= 1);
            document.querySelector('#conversation-pagination button[data-page-action="next"]').disabled = (page >= totalPages);
            document.getElementById('conversation-pagination').style.display = 'flex'; // Afficher la pagination

            // Attacher les écouteurs pour les boutons de suppression
            document.querySelectorAll('.delete-conversation-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // Empêche la sélection de la conversation
                    deleteConversation(e.target.dataset.id);
                });
            });

            // Si une conversation est actuellement sélectionnée, assurez-vous qu'elle est marquée active
            if (currentConversationId) {
                const activeItem = document.querySelector(`.conversation-item[data-id="${currentConversationId}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                } else {
                    // Si la conversation active n'est plus dans la liste (ex: supprimée ou sur une autre page)
                    currentConversationId = null;
                    currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
                    chatWindow.innerHTML = '<p class="placeholder-text">Sélectionnez ou créez une conversation pour commencer à chatter.</p>';
                    chatInput.disabled = true;
                    sendChatBtn.disabled = true;
                    generateChatCvSummaryBtn.style.display = 'none';
                }
            }
        }
        showStatusMessage('Conversations chargées.', 'success');
    } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        conversationList.innerHTML = '<li>Erreur de chargement des conversations.</li>';
        showStatusMessage('Erreur lors du chargement des conversations.', 'error');
        document.getElementById('conversation-pagination').style.display = 'none';
    }
}

// Écouteurs de pagination pour la chatroom
document.querySelector('#conversation-pagination button[data-page-action="prev"]').addEventListener('click', () => {
    if (currentChatPage > 1) {
        currentChatPage--;
        fetchConversations(currentChatPage);
    }
});

document.querySelector('#conversation-pagination button[data-page-action="next"]').addEventListener('click', () => {
    // Calculer totalPages de manière plus robuste, idéalement depuis la réponse du serveur de fetchConversations
    // Pour cet exemple, supposons qu'il y ait toujours une page suivante si le bouton n'est pas désactivé.
    currentChatPage++;
    fetchConversations(currentChatPage);
});


/**
 * Supprime une conversation.
 * @param {string} conversationId - L'ID de la conversation à supprimer.
 */
async function deleteConversation(conversationId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
        return;
    }
    showStatusMessage('Suppression de la conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        if (currentConversationId === conversationId) {
            currentConversationId = null;
            currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
            chatWindow.innerHTML = '<p class="placeholder-text">Sélectionnez ou créez une conversation pour commencer à chatter.</p>';
            chatInput.disabled = true;
            sendChatBtn.disabled = true;
            generateChatCvSummaryBtn.style.display = 'none';
        }
        showStatusMessage('Conversation supprimée.', 'success');
        fetchConversations(currentChatPage); // Recharger la liste après suppression
    } catch (error) {
        console.error('Erreur lors de la suppression de la conversation:', error);
        showStatusMessage('Erreur lors de la suppression de la conversation.', 'error');
    }
}

/**
 * Génère un résumé de CV à partir de la conversation IA active.
 * Cette fonction appellera votre endpoint backend `/api/conversations/:id/cv-professional-summary`.
 */
async function generateChatCvSummary() {
    if (!currentConversationId) {
        showStatusMessage('Veuillez sélectionner une conversation pour générer un résumé.', 'warning');
        return;
    }

    showStatusMessage('Génération du résumé de CV à partir du chat...', 'info');
    modalCvSummaryOutput.innerHTML = '<p>Génération...</p>';
    modalCvSummarySection.style.display = 'block'; // Afficher la section de résumé
    generateChatCvSummaryBtn.disabled = true;
    copyModalCvSummaryBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/cv-professional-summary`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data.summary) {
            modalCvSummaryOutput.innerHTML = `<pre>${data.summary}</pre>`;
            copyModalCvSummaryBtn.disabled = false;
            showStatusMessage('Résumé de CV généré.', 'success');
        } else {
            modalCvSummaryOutput.innerHTML = '<p class="placeholder-text">Aucun résumé n\'a pu être généré pour cette conversation.</p>';
            showStatusMessage('Aucun résumé généré.', 'info');
        }
    } catch (error) {
        console.error('Erreur lors de la génération du résumé de CV du chat:', error);
        modalCvSummaryOutput.innerHTML = '<p style="color: red;">Erreur: Impossible de générer le résumé. Veuillez réessayer.</p>';
        showStatusMessage('Erreur lors de la génération du résumé.', 'error');
    } finally {
        generateChatCvSummaryBtn.disabled = false;
    }
}

// Fonction pour copier le contenu du résumé dans le champ CV
if (copyModalCvSummaryBtn) {
    copyModalCvSummaryBtn.addEventListener('click', () => {
        if (modalCvSummaryOutput.textContent) {
            cvInput.value = modalCvSummaryOutput.textContent;
            showStatusMessage('Résumé copié dans le champ CV.', 'success');
            // Optionnel: masquer la section de résumé après copie
            // modalCvSummarySection.style.display = 'none';
        } else {
            showStatusMessage('Rien à copier.', 'warning');
        }
    });
}


// --- Fonctions de rendu de graphique (Placeholders) ---
// Vous devrez implémenter la logique réelle des graphiques ici en utilisant Chart.js
// Assurez-vous que les IDs des canvas dans index.html correspondent.

function renderDashboardChart() {
    const ctx = document.getElementById('dashboardChart'); // Assurez-vous d'avoir un canvas avec cet ID dans le dashboard
    if (ctx) {
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy(); // Détruire l'ancien graphique s'il existe
        }
        new Chart(ctx, {
            type: 'bar', // Exemple: graphique à barres pour les UTMi par type
            data: {
                labels: ['Marketing', 'Affiliation', 'Fiscal/Économique'],
                datasets: [{
                    label: 'UTMi Générées',
                    data: [
                        parseFloat(thematicUtmiMarketingEl.textContent),
                        parseFloat(thematicUtmiAffiliationEl.textContent),
                        parseFloat(thematicUtmiFiscalEconomicEl.textContent)
                    ],
                    backgroundColor: ['#4299e1', '#10b981', '#9f7aea'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'UTMi par Thématique'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}