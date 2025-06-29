// docs/app.js - Le nouveau fichier principal de l'application client

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin;

// --- Imports des modules utilitaires et de page ---
// modal.js et pagination.js sont maintenant dans le même dossier que app.js (docs/)
import { showModal } from './modal.js';
import { initPaginationControls, setActiveConversationId, setConversations, renderChatConversationList } from './pagination.js'; // Added setConversations, renderChatConversationList


// Importe les modules spécifiques à chaque page (maintenant dans docs/modules/)
import { initDashboardPage, fetchDashboardInsights } from './modules/dashboard.js';
import { initChatroomPage } from './modules/chatroom.js';
import { initCvManagementPage } from './modules/cv_management.js';
import { initUserProfilePage } from './modules/user_profile.js';
import { initWorkspacePage } from './modules/workspace.js';
import { initDocumentationPage } from './modules/documentation.js';
import { initContactPage } from './modules/contact.js';

// --- Global state ---
let currentConversationId = null;
let currentChatPage = 1;
const CHAT_CONVERSATIONS_PER_PAGE = 5;
let currentCvStructuredData = null;

// --- Global DOM elements (initialisées dans DOMContentLoaded) ---
let mainNavbar, navLinks, contentSections, dynamicLeftNav, dynamicNavList, globalStatusMessage;

// Fonctions globales utilitaires
export function getApiBaseUrl() {
    return API_BASE_URL;
}

export function showStatusMessage(message, type = 'info') {
    if (globalStatusMessage) {
        globalStatusMessage.textContent = message;
        globalStatusMessage.className = `status-message ${type} active`;
        setTimeout(() => {
            globalStatusMessage.classList.remove('active');
        }, 3000);
    } else {
        console.warn('Global status message element not found.');
    }
}

export function getCurrentConversationId() {
    return currentConversationId;
}

export function setCurrentConversationId(id) {
    currentConversationId = id;
}

export function getCurrentChatPage() {
    return currentChatPage;
}

export function setCurrentChatPage(page) {
    currentChatPage = page;
}

export function getChatConversationsPerPage() {
    return CHAT_CONVERSATIONS_PER_PAGE;
}

export function getCurrentCvStructuredData() {
    return currentCvStructuredData;
}

export function setCurrentCvStructuredData(data) {
    currentCvStructuredData = data;
}


// Fonction pour afficher une section spécifique et masquer les autres
export const showPage = (pageId) => {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(pageId + '-page');
    if (activeSection) {
        activeSection.classList.add('active');
        updateDynamicLeftNav(pageId); // Mettre à jour la nav latérale

        // Initialiser ou rafraîchir la logique de la page
        switch (pageId) {
            case 'dashboard':
                fetchDashboardInsights(); // Appel direct depuis app.js
                break;
            case 'chatroom':
                // Les éléments de pagination du chatroom sont créés dynamiquement dans updateDynamicLeftNav
                // La logique d'initialisation du chatroom dépend de ces éléments
                // Donc, on appelle initChatroomPage après leur création dans updateDynamicLeftNav
                // et on passe toutes les dépendances nécessaires.
                initChatroomPage(
                    API_BASE_URL,
                    showStatusMessage,
                    currentConversationId,
                    setCurrentConversationId,
                    initPaginationControls,
                    setActiveConversationId,
                    currentChatPage,
                    setCurrentChatPage,
                    CHAT_CONVERSATIONS_PER_PAGE,
                    fetchDashboardInsights, // Pass the function
                    setConversations, // Pass pagination's setConversations
                    renderChatConversationList // Pass pagination's renderChatConversationList
                );
                break;
            case 'cv-management':
                initCvManagementPage(API_BASE_URL, showStatusMessage, currentCvStructuredData, setCurrentCvStructuredData, showModal);
                break;
            case 'user-profile':
                initUserProfilePage(API_BASE_URL, showStatusMessage);
                break;
            case 'workspace':
                initWorkspacePage(API_BASE_URL, showStatusMessage);
                break;
            case 'documentation':
                initDocumentationPage(API_BASE_URL, showStatusMessage);
                break;
            case 'contact':
                initContactPage(API_BASE_URL, showStatusMessage);
                break;
            case 'home':
                // Initialisation des éléments de la page d'accueil (interaction ponctuelle)
                const promptInput = document.getElementById('prompt-input');
                const iaResponseOutput = document.getElementById('ia-response-output');
                const generateResponseBtn = document.getElementById('generateResponseBtn');
                const clearPromptBtn = document.getElementById('clearPromptBtn');

                // S'assurer que les événements ne sont attachés qu'une seule fois si la page est réactivée
                if (generateResponseBtn && !generateResponseBtn.onclick) { // Simple check to prevent re-attaching
                    generateResponseBtn.onclick = async () => {
                        const prompt = promptInput.value.trim();
                        if (!prompt) {
                            showStatusMessage('Veuillez entrer une requête pour l\'IA.', 'warning');
                            return;
                        }
                        showStatusMessage('Génération de la réponse IA...', 'info');
                        generateResponseBtn.disabled = true;
                        clearPromptBtn.disabled = true;
                        iaResponseOutput.innerHTML = '<p>Chargement...</p>';

                        try {
                            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ prompt: prompt })
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                if (response.status === 429) {
                                    throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
                                }
                                throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
                            }

                            const data = await response.json();
                            iaResponseOutput.innerHTML = `
                                <pre>${data.response}</pre>
                                <p class="meta-info">UTMi généré: ${data.utmi.toFixed(2)} EUR | Coût estimé: ${data.estimatedCost.toFixed(6)} USD | Taxe IA: ${data.taxeIAAmount.toFixed(2)} EUR</p>
                            `;
                            showStatusMessage('Réponse générée avec succès.', 'success');
                            fetchDashboardInsights(); // Refresh dashboard after interaction
                        } catch (error) {
                            console.error('Erreur lors de la génération de la réponse IA:', error);
                            iaResponseOutput.innerHTML = `<p class="error-message">Erreur: ${error.message}</p>`;
                            showStatusMessage('Erreur lors de la génération de la réponse.', 'error');
                        } finally {
                            generateResponseBtn.disabled = false;
                            clearPromptBtn.disabled = false;
                        }
                    };
                }
                if (clearPromptBtn && !clearPromptBtn.onclick) { // Simple check
                    clearPromptBtn.onclick = () => {
                        promptInput.value = '';
                        iaResponseOutput.innerHTML = '<p class="placeholder-text">La réponse de l\'IA apparaîtra ici.</p>';
                    };
                }
                break;
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
export const updateDynamicLeftNav = (currentPageId) => {
    let navContent = '';
    let navTitle = `<i class="fas fa-bars"></i> Menu Thématique`;

    if (dynamicNavList) dynamicNavList.innerHTML = ''; // Clear existing content first
    if (dynamicLeftNav) dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle; // Reset title

    if (currentPageId === 'chatroom') {
        navTitle = `<i class="fas fa-comment-dots"></i> Conversations`;
        if (dynamicLeftNav) dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle;

        // Dynamically create conversation list and pagination elements
        const conversationListContainer = document.createElement('div');
        conversationListContainer.className = 'conversation-list-container';
        conversationListContainer.innerHTML = `
            <h3 class="card-subtitle"><i class="fas fa-list"></i> Vos Conversations</h3>
            <ul id="conversation-list" class="conversation-list custom-scrollbar">
                <p class="placeholder-text">Chargement des conversations...</p>
            </ul>
            <div class="pagination-controls" id="conversation-pagination">
                <button class="btn btn-icon" data-page-action="prev" disabled><i class="fas fa-chevron-left"></i></button>
                <span id="current-page-info">Page 1/1</span>
                <button class="btn btn-icon" data-page-action="next" disabled><i class="fas fa-chevron-right"></i></button>
            </div>
        `;
        if (dynamicNavList) dynamicNavList.appendChild(conversationListContainer);

        // Call the chatroom module to initialize its specific parts, passing necessary global elements/functions
        // Note: chatroom.js will need to get references to these dynamically created elements
        initChatroomPage(
            API_BASE_URL,
            showStatusMessage,
            currentConversationId,
            setCurrentConversationId,
            initPaginationControls,
            setActiveConversationId,
            currentChatPage,
            setCurrentChatPage,
            CHAT_CONVERSATIONS_PER_PAGE,
            fetchDashboardInsights, // Pass the function
            setConversations, // Pass pagination's setConversations
            renderChatConversationList // Pass pagination's renderChatConversationList
        );

    } else {
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
        if (dynamicLeftNav) dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle;
        if (dynamicNavList) dynamicNavList.innerHTML = navContent;

        if (dynamicNavList) {
            dynamicNavList.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetSelector = link.getAttribute('href');
                    const targetElement = document.querySelector(targetSelector);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                    dynamicNavList.querySelectorAll('a').forEach(subLink => subLink.classList.remove('active'));
                    link.classList.add('active');
                });
            });

            if (dynamicNavList.firstElementChild && dynamicNavList.firstElementChild.firstElementChild) {
                dynamicNavList.firstElementChild.firstElementChild.classList.add('active');
            }
        }
    }
};

// Initialisation globale des éléments du DOM et attachement des écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
    mainNavbar = document.getElementById('mainNavbar');
    navLinks = document.querySelectorAll('.navbar-main-links .nav-link');
    contentSections = document.querySelectorAll('.content-section');
    dynamicLeftNav = document.getElementById('dynamic-left-nav');
    dynamicNavList = document.getElementById('dynamic-nav-list');
    globalStatusMessage = document.getElementById('globalStatusMessage');

    // Afficher la page d'accueil par défaut
    showPage('home');
    setActiveNavLink('home');

    // Adapter le padding du body pour la navbar fixe
    const navbarHeight = mainNavbar ? mainNavbar.offsetHeight : 0;
    document.body.style.paddingTop = `${navbarHeight + 20}px`;

    // Gestion de la navigation principale
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
            setActiveNavLink(pageId);
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            themeToggle.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Open CMS modal button
    const openCmsModalBtn = document.getElementById('openCmsModalBtn');
    if (openCmsModalBtn) {
        openCmsModalBtn.addEventListener('click', async () => {
            await showModal('Gestion de Contenu (CMS)', '<p>Bienvenue dans votre interface de gestion de contenu. Ceci est un exemple de modal.</p>', 'alert');
        });
    }

    // Navbar search functionality
    const navbarSearchInput = document.getElementById('navbarSearchInput');
    const navbarSearchBtn = document.getElementById('navbarSearchBtn');
    if (navbarSearchBtn) {
        navbarSearchBtn.addEventListener('click', () => {
            const query = navbarSearchInput.value.trim();
            if (query) {
                showStatusMessage(`Recherche lancée pour : "${query}"`, 'info');
            } else {
                showStatusMessage('Veuillez entrer un terme de recherche.', 'info');
            }
        });
    }
    if (navbarSearchInput) {
        navbarSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navbarSearchBtn.click();
            }
        });
    }

    // Initialize all page modules (they will then handle their own specific DOM events)
    initDashboardPage(); // No need to pass API_BASE_URL, showStatusMessage here as they are imported
    // initChatroomPage is now called by showPage for dynamic element creation
    initCvManagementPage(); // No need to pass global functions here, imported by module
    initUserProfilePage(); // No need to pass global functions here, imported by module
    initWorkspacePage(); // No need to pass global functions here, imported by module
    initDocumentationPage(); // No need to pass global functions here, imported by module
    initContactPage(); // No need to pass global functions here, imported by module
});


/**
 * Toggles between light and dark themes.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.querySelector('.toggle-circle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

