// public/cv.js - Logique client pour CVNU (Refactorisé)

// --- Importation des modules ---
import { showGenericModal } from './modal.js'; // Correction: Renommé showModal en showGenericModal
import { initPaginationControls, setActiveConversationId, setConversations, renderChatConversationList } from './pagination.js';
import { showStatusMessage, toggleTheme } from './utils.js';
import { api } from './apiService.js';
import { initCvGeneratorDomElements, handleGenerateCv, handleDownloadCv, handleValorizeCvContent, openCvEditorModal, loadLastStructuredCvData, clearCvSection } from './cvGenerator.js';
import { initCvnuLevelsDomElements, updateCvnuLevelDisplay } from './cvnuLevels.js';
import { initDashboardDomElements, fetchDashboardInsights, renderDashboardChart } from './dashboard.js';
import { initChatroomDomElements, setupChatPaginationElements, selectConversation, fetchConversations } from './chatroom.js';


// --- Variables pour les éléments du DOM (déclarées ici pour l'accès global si nécessaire, initialisées dans DOMContentLoaded) ---
let mainNavbar, navLinks, contentSections, dynamicLeftNav, dynamicNavList;

// Page Accueil
let promptInput, iaResponseOutput, generateResponseBtn, clearPromptBtn;


// --- Fonctions utilitaires du module principal ---

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
        } else if (pageId === 'cv-management') {
            // Réinitialiser la section CV et charger les dernières données
            clearCvSection(); // S'assure que les champs sont propres
            loadLastStructuredCvData(); // Tente de charger le dernier CV structuré si disponible
        } else if (pageId === 'chatroom') {
            // Initial state for chat input/buttons
            const chatInput = document.getElementById('chat-input');
            const sendChatBtn = document.getElementById('send-chat-btn');
            const generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn');

            if (chatInput) chatInput.disabled = true;
            if (sendChatBtn) sendChatBtn.disabled = true;
            if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';

            // Setup and fetch conversations for the chatroom
            const chatConversationListElement = document.getElementById('conversation-list');
            const chatPrevPageBtn = document.querySelector('#conversation-pagination [data-page-action="prev"]');
            const chatNextPageBtn = document.querySelector('#conversation-pagination [data-page-action="next"]');
            const chatCurrentPageInfoSpan = document.getElementById('current-page-info');

            if (chatConversationListElement && chatPrevPageBtn && chatNextPageBtn && chatCurrentPageInfoSpan) {
                setupChatPaginationElements(chatConversationListElement, chatPrevPageBtn, chatNextPageBtn, chatCurrentPageInfoSpan);
            }
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

    if (dynamicNavList) dynamicNavList.innerHTML = ''; // Clear existing content first
    if (dynamicLeftNav) dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle; // Reset title

    if (currentPageId === 'chatroom') {
        navTitle = `<i class="fas fa-comment-dots"></i> Conversations`;
        if (dynamicLeftNav) dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle;

        // Dynamically create conversation list and pagination elements if not already there
        let conversationListContainer = dynamicNavList.querySelector('.conversation-list-container');
        if (!conversationListContainer) {
            conversationListContainer = document.createElement('div');
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
        }
        // These elements are now initialized by initChatroomDomElements and setupChatPaginationElements when showPage('chatroom') is called
    } else {
        // Default static navigation links
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
                    <li><a href="#cv-management-page .card:nth-of-type(3)">Niveau de Progression CVNU</a></li>
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

        // Add click listeners to dynamic nav links for smooth scrolling
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
                    // Add 'active' class to the clicked dynamic nav link
                    dynamicNavList.querySelectorAll('a').forEach(subLink => subLink.classList.remove('active'));
                    link.classList.add('active');
                });
            });

            // Automatically set the first dynamic link as active if available
            if (dynamicNavList.firstElementChild && dynamicNavList.firstElementChild.firstElementChild) {
                dynamicNavList.firstElementChild.firstElementChild.classList.add('active');
            }
        }
    }
};


// --- Logique d'initialisation de l'application ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments DOM globaux
    mainNavbar = document.getElementById('mainNavbar');
    navLinks = document.querySelectorAll('.navbar-main-links .nav-link');
    contentSections = document.querySelectorAll('.content-section');
    dynamicLeftNav = document.getElementById('dynamic-left-nav');
    dynamicNavList = document.getElementById('dynamic-nav-list');
    // globalStatusMessage est géré par le module utils

    // Initialisation des éléments DOM spécifiques aux pages (via leurs modules)
    // Page Accueil
    promptInput = document.getElementById('prompt-input');
    iaResponseOutput = document.getElementById('ia-response-output');
    generateResponseBtn = document.getElementById('generateResponseBtn');
    clearPromptBtn = document.getElementById('clearPromptBtn');

    // Attacher les écouteurs d'événements pour la page d'accueil
    if (generateResponseBtn) {
        generateResponseBtn.addEventListener('click', generateResponse);
    }
    if (clearPromptBtn) {
        clearPromptBtn.addEventListener('click', () => {
            if (promptInput) promptInput.value = '';
            if (iaResponseOutput) iaResponseOutput.innerHTML = '<p class="placeholder-text">La réponse de l\'IA apparaîtra ici.</p>';
        });
    }

    // Initialisation des modules spécifiques
    initCvGeneratorDomElements();
    initCvnuLevelsDomElements();
    initDashboardDomElements();
    initChatroomDomElements(); // Initialise les éléments DOM du chatroom, mais pas la pagination dynamique

    // Afficher la page d'accueil par défaut
    showPage('home');
    setActiveNavLink('home');

    // Adapter le padding du body pour la navbar fixe
    const navbarHeight = mainNavbar.offsetHeight;
    document.body.style.paddingTop = `${navbarHeight + 20}px`; // Ajoute un peu de marge

    // Gestion de la navigation principale
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
            setActiveNavLink(pageId);
        });
    });

    // Initial theme setup (from utils.js)
    const themeToggleEl = document.getElementById('themeToggle');
    if (themeToggleEl) {
        themeToggleEl.addEventListener('click', toggleTheme);
        // Set initial icon based on theme
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggleEl.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            themeToggleEl.querySelector('.toggle-circle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Open CMS modal button
    const openCmsModalBtn = document.getElementById('openCmsModalBtn');
    if (openCmsModalBtn) {
        openCmsModalBtn.addEventListener('click', async () => {
            await showGenericModal('Gestion de Contenu (CMS)', '<p>Bienvenue dans votre interface de gestion de contenu. Ceci est un exemple de modal.</p>', 'alert');
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
                // Implement actual search logic here
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
});


// --- Fonctions d'API et de logique métier (pour la page d'accueil, les autres sont dans des modules) ---

/**
 * Gère l'interaction IA ponctuelle (page Accueil).
 */
async function generateResponse() {
    const prompt = promptInput ? promptInput.value.trim() : '';
    if (!prompt) {
        showStatusMessage('Veuillez entrer une requête pour l\'IA.', 'warning');
        return;
    }

    showStatusMessage('Génération de la réponse IA...', 'info');
    if (iaResponseOutput) iaResponseOutput.innerHTML = '<p>Chargement...</p>';
    if (generateResponseBtn) generateResponseBtn.disabled = true;
    if (clearPromptBtn) clearPromptBtn.disabled = true;

    try {
        const data = await api.generateResponse(prompt);
        if (iaResponseOutput) {
            iaResponseOutput.innerHTML = `
                <pre>${data.response}</pre>
                <p class="meta-info">UTMi généré: ${data.utmi.toFixed(2)} EUR | Coût estimé: ${data.estimatedCost.toFixed(6)} USD</p>
            `;
        }
        showStatusMessage('Réponse générée avec succès.', 'success');
        fetchDashboardInsights(); // Refresh dashboard after interaction
    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        if (iaResponseOutput) iaResponseOutput.innerHTML = `<p class="error-message">Erreur: ${error.message}</p>`;
        showStatusMessage('Erreur lors de la génération de la réponse.', 'error');
    } finally {
        if (generateResponseBtn) generateResponseBtn.disabled = false;
        if (clearPromptBtn) clearPromptBtn.disabled = false;
    }
}
