// public/js/cvnuLevels.js

import { showGenericModal, hideGenericModal } from './modal.js'; // Correction: Renommé showModal en showGenericModal
import { showStatusMessage } from './utils.js';

// --- Constantes pour les niveaux CVNU (à terme, ces données viendraient du backend) ---
const CVNU_LEVELS_DATA = {
    "Niveau 1: Fondations et Première Monétisation": {
        minUtmi: 0,
        maxUtmi: 5000, // Exemple de seuil UTMi pour ce niveau
        competences: [
            "Maîtrise des bases de Python",
            "Compréhension des concepts fondamentaux de l'IA (Machine Learning supervisé/non supervisé)",
            "Utilisation de LLM simples (ex: prompt engineering avec ChatGPT)"
        ],
        objectifsSmart: [
            "Spécifique : Générer 500€/mois de revenu passif.",
            "Mesurable : Suivi des revenus via les smart contracts.",
            "Atteignable : Basé sur la création de contenu assisté par IA (blogs, ebooks légers) ou de templates numériques simples.",
            "Réaliste : Nécessite une implication de X heures par semaine pour la création initiale.",
            "Temporel : Atteindre cet objectif dans les 3 mois suivant le début de la formation.",
            "Validation Smart Contract : Preuves de publication de contenu, preuves de vente de produits numériques."
        ]
    },
    "Niveau 2: Croissance et Spécialisation Initiale": {
        minUtmi: 5001,
        maxUtmi: 20000, // Exemple de seuil UTMi pour ce niveau
        competences: [
            "Maîtrise avancée de Python (bibliothèques spécifiques IA)",
            "Compréhension des réseaux de neurones",
            "Développement de petits outils IA (chatbots simples, scripts d'automatisation)"
        ],
        objectifsSmart: [
            "Spécifique : Générer 2000€/mois de revenu passif.",
            "Mesurable : Suivi des abonnements/ventes d'outils IA ou revenus des cours en ligne.",
            "Atteignable : Basé sur le développement et la monétisation d'un petit outil IA ou la création d'un cours en ligne.",
            "Réaliste : Nécessite une optimisation continue et une stratégie marketing.",
            "Temporel : Atteindre cet objectif dans les 9 mois suivant la validation du Niveau 1.",
            "Validation Smart Contract : Preuves de déploiement d'un outil fonctionnel, nombre d'inscriptions/ventes de cours."
        ]
    },
    "Niveau 3: Maîtrise et Scalabilité": {
        minUtmi: 20001,
        maxUtmi: Infinity, // Pas de limite supérieure pour le niveau le plus élevé
        competences: [
            "Expertise en IA (apprentissage profond, traitement de données massives)",
            "Architecture de systèmes IA",
            "Gestion de projets complexes, leadership"
        ],
        objectifsSmart: [
            "Spécifique : Générer 5000€+/mois de revenu passif.",
            "Mesurable : Suivi des KPIs d'une plateforme SaaS ou des contrats de conseil.",
            "Atteignable : Basé sur le lancement d'un SaaS IA, la direction d'une agence de conseil, ou des investissements stratégiques.",
            "Réaliste : Nécessite une vision stratégique et potentiellement une équipe.",
            "Temporel : Atteindre cet objectif dans le 12 mois suivant la validation du Niveau 2.",
            "Validation Smart Contract : Preuves de revenus récurrents du SaaS, validation de contrats de conseil signés, audits financiers liés aux investissements."
        ]
    }
};

// --- Éléments du DOM pour les niveaux CVNU ---
let currentCvnuLevelSpan, currentTotalUtmiSpan, levelProgressPercentageSpan, levelProgressBar,
    nextCvnuLevelSpan, nextLevelObjectivesDiv, viewDetailedLevelInfoBtn,
    levelDetailsModal, closeLevelDetailsModalBtn, levelDetailsModalBody, levelDetailsModalOkBtn;

/**
 * Initialise les références aux éléments DOM et les écouteurs d'événements.
 */
export function initCvnuLevelsDomElements() {
    currentCvnuLevelSpan = document.getElementById('currentCvnuLevel');
    currentTotalUtmiSpan = document.getElementById('currentTotalUtmi');
    levelProgressPercentageSpan = document.getElementById('levelProgressPercentage');
    levelProgressBar = document.getElementById('levelProgressBar');
    nextCvnuLevelSpan = document.getElementById('nextCvnuLevel');
    nextLevelObjectivesDiv = document.getElementById('nextLevelObjectives');
    viewDetailedLevelInfoBtn = document.getElementById('viewDetailedLevelInfoBtn');
    levelDetailsModal = document.getElementById('levelDetailsModal');
    closeLevelDetailsModalBtn = document.getElementById('closeLevelDetailsModalBtn');
    levelDetailsModalBody = document.getElementById('levelDetailsModalBody');
    levelDetailsModalOkBtn = document.getElementById('levelDetailsModalOkBtn');

    if (viewDetailedLevelInfoBtn) {
        viewDetailedLevelInfoBtn.addEventListener('click', showLevelDetailsModal);
    }
    if (closeLevelDetailsModalBtn) {
        closeLevelDetailsModalBtn.addEventListener('click', () => hideGenericModal(levelDetailsModal));
    }
    if (levelDetailsModalOkBtn) {
        levelDetailsModalOkBtn.addEventListener('click', () => hideGenericModal(levelDetailsModal));
    }
}

/**
 * Met à jour l'affichage du niveau CVNU et de la progression.
 * @param {number} totalUtmi - Le total des UTMi accumulées par l'utilisateur.
 */
export function updateCvnuLevelDisplay(totalUtmi) {
    let currentLevelName = "Non Défini";
    let nextLevelName = "Niveau 1: Fondations et Première Monétisation";
    let nextLevelMinUtmi = CVNU_LEVELS_DATA[nextLevelName].minUtmi;
    let progressPercentage = 0;

    // Déterminer le niveau actuel
    const levelNames = Object.keys(CVNU_LEVELS_DATA);
    for (let i = 0; i < levelNames.length; i++) {
        const levelName = levelNames[i];
        const level = CVNU_LEVELS_DATA[levelName];
        if (totalUtmi >= level.minUtmi && totalUtmi <= level.maxUtmi) {
            currentLevelName = levelName;
            break;
        }
    }

    // Déterminer le niveau suivant et le progrès
    let foundCurrent = false;
    for (let i = 0; i < levelNames.length; i++) {
        const levelName = levelNames[i];
        const level = CVNU_LEVELS_DATA[levelName];
        if (foundCurrent) {
            nextLevelName = levelName;
            nextLevelMinUtmi = level.minUtmi;
            // Calcul du pourcentage de progression vers le prochain niveau
            const prevLevelMaxUtmi = CVNU_LEVELS_DATA[currentLevelName]?.maxUtmi || 0;
            const range = nextLevelMinUtmi - prevLevelMaxUtmi;
            if (range > 0) {
                progressPercentage = ((totalUtmi - prevLevelMaxUtmi) / range) * 100;
            } else {
                progressPercentage = 100; // Si le range est 0 ou négatif, on est au-delà
            }
            progressPercentage = Math.min(100, Math.max(0, progressPercentage)); // S'assurer que c'est entre 0 et 100
            break;
        }
        if (levelName === currentLevelName) {
            foundCurrent = true;
        }
    }

    // Si on est au dernier niveau, il n'y a pas de niveau suivant
    if (currentLevelName === "Niveau 3: Maîtrise et Scalabilité") {
        nextLevelName = "Félicitations ! Vous avez atteint le niveau maximum.";
        if (nextLevelObjectivesDiv) nextLevelObjectivesDiv.innerHTML = "<p>Continuez à innover et à générer de la valeur !</p>";
        progressPercentage = 100; // Au niveau max, la barre est pleine
    } else {
        // Afficher les objectifs SMART du niveau suivant
        const objectives = CVNU_LEVELS_DATA[nextLevelName]?.objectifsSmart || [];
        if (nextLevelObjectivesDiv) nextLevelObjectivesDiv.innerHTML = objectives.map(obj => `<p>- ${obj}</p>`).join('');
    }

    // Mettre à jour l'affichage dans le DOM
    if (currentCvnuLevelSpan) currentCvnuLevelSpan.textContent = currentLevelName;
    if (currentTotalUtmiSpan) currentTotalUtmiSpan.textContent = totalUtmi.toFixed(2);
    if (levelProgressPercentageSpan) levelProgressPercentageSpan.textContent = `${progressPercentage.toFixed(0)}%`;
    if (levelProgressBar) levelProgressBar.style.width = `${progressPercentage}%`;
    if (nextCvnuLevelSpan) nextCvnuLevelSpan.textContent = nextLevelName;
}

/**
 * Affiche le modal avec les détails de tous les niveaux.
 */
function showLevelDetailsModal() {
    let htmlContent = '<div class="space-y-6">';
    for (const levelName in CVNU_LEVELS_DATA) {
        const level = CVNU_LEVELS_DATA[levelName];
        htmlContent += `
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 class="text-xl font-bold text-indigo-800 mb-2">${levelName}</h4>
                <p class="text-sm text-gray-600 mb-2">Seuil UTMi : ${level.minUtmi.toLocaleString()} - ${level.maxUtmi === Infinity ? 'Infini' : level.maxUtmi.toLocaleString()} UTMi</p>
                <h5 class="font-semibold text-gray-700 mt-3 mb-1">Compétences Requises :</h5>
                <ul class="list-disc list-inside text-sm text-gray-700">
                    ${level.competences.map(c => `<li>${c}</li>`).join('')}
                </ul>
                <h5 class="font-semibold text-gray-700 mt-3 mb-1">Objectifs SMART de Monétisation :</h5>
                <ul class="list-disc list-inside text-sm text-gray-700">
                    ${level.objectifsSmart.map(o => `<li>${o}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    htmlContent += '</div>';
    if (levelDetailsModalBody) levelDetailsModalBody.innerHTML = htmlContent;
    showGenericModal('Détails des Niveaux de Progression CVNU', htmlContent, 'info', '900px'); // Utilise showGenericModal
}
