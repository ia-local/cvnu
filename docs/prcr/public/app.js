// public/app.js (Version Complète et Finale)

const API_BASE_URL = window.location.origin;
const EPOCH_SIZE = 10; 

// --- Fonctions de Création d'Éléments Visuels ---
function createFaqCard(q, rank) {
    const shortText = q.text.length > 100 ? q.text.substring(0, 100).trim() + '...' : q.text;
    
    let color = '#007BFF'; 
    if (q.difficulty === 'expert') color = '#DC3545'; 
    if (rank <= 3) color = '#28A745'; 
    
    return `
        <div class="faq-card" style="border: 2px solid ${color}; border-radius: 8px; padding: 15px; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h4 style="margin: 0 0 10px; color: ${color};">
                #${rank} - ${q.difficulty.toUpperCase()}
            </h4>
            <p style="font-weight: bold; margin-top: 0;">${shortText}</p>
            <p style="font-size: 0.9em; color: #DC3545;">
                Posée: <strong>${q.count} fois</strong>
            </p>
        </div>
    `;
}

// --- Fonctions Utilitaires de Base (RC, Chargement) ---

async function calculateRCValue(cvnuLevel) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/calculate-rc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvnuLevel: cvnuLevel })
        });
        const data = await response.json();
        return response.ok ? data.revenuCitoyenMensuel : 0;
    } catch (e) {
        return 0;
    }
}

async function loadPolicyDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/policy`);
        const data = await response.json();
        
        const rcComponent = data.policyComponents.find(c => c.identifier === "RC-CVNU-28J");
        
        const detailsDiv = document.getElementById('policy-details');
        if (!detailsDiv) return;

        detailsDiv.innerHTML = `
            <h3>Détails Financiers du Revenu Citoyen</h3>
            <p><strong>Status:</strong> ${data.legislativeStatus}</p>
            <p><strong>Base Universelle (Min.) :</strong> 
                <span style="color: green; font-weight: bold;">${rcComponent.minPaymentAmount.value.toFixed(2)} ${rcComponent.minPaymentAmount.unitText}</span> (cycle de 28 jours)
            </p>
            <p><strong>Plafond Maximal :</strong> 
                <span style="color: darkred; font-weight: bold;">${rcComponent.maxPaymentAmount.value.toFixed(2)} ${rcComponent.maxPaymentAmount.unitText}</span>
            </p>
            <p><strong>Financement :</strong> Taxe IA (Affectation TVA - Smart Contract)</p>
        `;

    } catch (error) {
        console.error('Erreur de chargement des détails de la politique:', error);
        const detailsDiv = document.getElementById('policy-details');
        if (detailsDiv) detailsDiv.innerHTML = '<p style="color: red;">Erreur: Impossible de contacter le serveur API.</p>';
    }
}

async function loadDeploymentPlan() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/deployment-plan`);
        const plan = await response.json();
        
        const planDiv = document.getElementById('deployment-plan');
        if (!planDiv) return;

        let htmlContent = `<h3>${plan.name}</h3>`;
        htmlContent += `<p>${plan.description}</p>`;
        
        plan.phases.forEach((phase, index) => {
            htmlContent += `
                <div class="phase-name">${index + 1}. ${phase.name}</div>
                <p><strong>Objectif :</strong> ${phase.goal}</p>
                <ul>
                    ${phase.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
            `;
        });
        
        planDiv.innerHTML = htmlContent;

    } catch (error) {
        console.error('Erreur de chargement du Plan de Déploiement:', error);
        const planDiv = document.getElementById('deployment-plan');
        if (planDiv) planDiv.innerHTML = '<p style="color: red;">Erreur: Impossible de charger la feuille de route du programme.</p>';
    }
}


// --- Fonctions de Simulation d'Impact et IA ---

async function simulateActionImpact() {
    const currentCvnuInput = document.getElementById('current-cvnu');
    const pointsGainedInput = document.getElementById('points-gained');
    const categorySelect = document.getElementById('action-category');
    const impactPre = document.getElementById('impact-result');

    if (!currentCvnuInput || !pointsGainedInput || !categorySelect || !impactPre) return;

    const currentLevel = parseInt(currentCvnuInput.value);
    const pointsGained = parseInt(pointsGainedInput.value);
    const category = categorySelect.value;
    
    if (isNaN(currentLevel) || isNaN(pointsGained) || currentLevel < 0 || currentLevel > 100 || pointsGained < 1) {
        impactPre.textContent = 'Erreur: Veuillez entrer des niveaux et points valides (0-100).';
        return;
    }

    const newLevel = Math.min(100, currentLevel + pointsGained);
    impactPre.textContent = `Simulation en cours pour l'action '${category}' (Nouveau Niveau: ${newLevel}/100)...`;

    try {
        const currentRC = await calculateRCValue(currentLevel); 
        
        const response = await fetch(`${API_BASE_URL}/api/calculate-rc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvnuLevel: newLevel })
        });

        const data = await response.json();
        
        if (response.ok) {
            const newRC = data.revenuCitoyenMensuel;
            const difference = newRC - currentRC;
            
            impactPre.innerHTML = `
                <strong>Action ajoutée :</strong> ${category} (+${pointsGained} points)<br>
                <strong>Ancien Revenu (RC = ${currentLevel}/100) :</strong> ${currentRC.toFixed(2)} €<br>
                <strong>Nouveau Revenu (RC = ${newLevel}/100) :</strong> <span class="rc-amount">${newRC.toFixed(2)} €</span><br>
                <strong>Gain immédiat par cycle :</strong> <span style="color: darkgreen; font-weight: bold;">+${difference.toFixed(2)} €</span>
            `;
        } else {
            impactPre.textContent = `Erreur API: ${data.error || 'Erreur inconnue'}`;
        }

    } catch (error) {
        console.error('Erreur réseau lors de la simulation de l\'impact:', error);
        impactPre.textContent = 'Erreur de connexion au serveur API.';
    }
}

async function fetchAiDetails() {
    const topic = document.getElementById('details-topic').value;
    const outputDiv = document.getElementById('details-output');

    if (!outputDiv) return;

    outputDiv.innerHTML = `<p style="color:#007BFF;">Génération de l'explication par Llama-3.1-8b-instant...</p>`;

    let type = topic;
    let category = '';

    if (topic !== 'taxe_ia_justification') {
        type = 'cvnu_category';
        category = topic;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/details?type=${type}&category=${category}`);
        const data = await response.json();

        if (response.ok) {
            outputDiv.innerHTML = `
                <p><strong>Topic :</strong> ${topic}</p>
                <p>${data.content}</p>
                <p style="text-align: right; font-size: 0.8em; margin-top: 10px;">${data.message}</p>
            `;
        } else {
            outputDiv.textContent = `Erreur: Impossible de générer l'explication. ${data.message || ''}`;
        }

    } catch (error) {
        outputDiv.innerHTML = '<p style="color: red;">Erreur réseau lors de la génération IA.</p>';
        console.error('Erreur AI Details:', error);
    }
}

// --- 6. Fonction pour l'Orchestration du Débat GAN ---
async function startGanDebate() {
    const difficulty = document.getElementById('debate-difficulty').value;
    const outputDiv = document.getElementById('debate-output');
    
    if (!outputDiv) return;

    outputDiv.innerHTML = `<p class="loading-message">🧠 Lancement de la confrontation IA (Niveau ${difficulty})... Cela peut prendre quelques secondes.</p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/gan-debate?difficulty=${difficulty}`); 
        const data = await response.json();

        if (response.ok) {
            outputDiv.innerHTML = `
                <div class="ia-panel" style="border-color: #DC3545; background-color: #fff3f5;">
                    <div class="ia-question">Opposant (Agent IA) : ${data.question}</div>
                    <div class="ia-answer" style="border-color: #010101ff;">
                        <p><strong>Porte-parole PRCR (Agent IA) :</strong></p>
                        <p>${data.response_prcr}</p>
                    </div>
                </div>
                <p style="text-align: right; font-size: 0.8em; margin-top: 10px;">Simulé par Groq AI</p>
            `;
        } else {
            outputDiv.innerHTML = `<p style="color: red;">Erreur: Impossible de lancer le débat. ${data.message || 'Erreur inconnue'}</p>`;
        }
        
        fetchFaqStats(); 
        refreshEpochStatus();

    } catch (error) {
        outputDiv.innerHTML = '<p class="error-message">Erreur réseau lors du simulateur de débat.</p>';
        console.error('Erreur GAN:', error);
    }
}

// --- GESTION DES STATS FAQ (Récupération des données data_faq.json) ---
async function fetchFaqStats() {
    const faqTitleElement = document.getElementById('faq-title'); 
    const outputDiv = document.getElementById('faq-stats-output');
    const cardsContainer = document.getElementById('top-faq-cards');
    
    if (!outputDiv || !cardsContainer || !faqTitleElement) return; 
    
    outputDiv.innerHTML = `<p style="color:#007BFF;">Chargement des statistiques de fréquence...</p>`;
    cardsContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/faq-stats`); 
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json(); 
        let questions = data.questions_compteur;

        if (!questions || questions.length === 0) {
            outputDiv.innerHTML = `<p>Aucune question n'a été enregistrée pour le moment. Lancez un débat pour commencer l'analyse !</p>`;
            return;
        }

        questions.sort((a, b) => b.count - a.count);
        const top10 = questions.slice(0, 10);
        
        // Mise à jour du titre
        faqTitleElement.innerHTML = `🛡️ ${data.title || "Top 10 des Questions Fréquentes"}`; 

        let cardsHtml = '';
        top10.forEach((q, index) => {
            cardsHtml += createFaqCard(q, index + 1); 
        });
        
        cardsContainer.innerHTML = cardsHtml;
        outputDiv.innerHTML = `<p>Analyse Top ${top10.length} questions (Total original: ${data.total_original || 0}) :</p>`;


    } catch (error) {
        outputDiv.innerHTML = `<p style="color: red;">Erreur de chargement FAQ: ${error.message}</p>`;
        console.error('Erreur de chargement FAQ:', error);
    }
}

// --- 8. Fonction pour Gérer l'État de l'Époque (Analyse IA) ---
async function refreshEpochStatus() {
    const EPOCH_SIZE = 10;
    const statusSpan = document.getElementById('epoch-status');
    const panel = document.getElementById('faq-suggestion-panel');
    const addButton = document.getElementById('add-faq-btn');

    if (!statusSpan || !panel || !addButton) return;
    
    try {
        const logResponse = await fetch(`${API_BASE_URL}/api/gan-log-status`); 
        
        if (!logResponse.ok) throw new Error("Impossible de lire l'état de l'époque.");
        
        const logData = await logResponse.json(); 

        const sessionsSinceLastEpoch = logData.sessions_since_last_epoch || 0;
        const totalEpochs = logData.epoch_count || 0;
        
        // CORRECTION D'AFFICHAGE : S'assurer que le calcul de progression est logique
        const sessionsToDisplay = sessionsSinceLastEpoch % EPOCH_SIZE;
        const remainingToTarget = EPOCH_SIZE - sessionsToDisplay;

        statusSpan.textContent = `Époque ${totalEpochs}. ${sessionsToDisplay} / ${EPOCH_SIZE} sessions complétées.`;
        
        if (logData.faq_suggestion_epoch && sessionsSinceLastEpoch >= EPOCH_SIZE) {
            panel.innerHTML = `
                <h3>🚨 NOUVELLE FAILLE DÉTECTÉE (Époque ${totalEpochs}) :</h3>
                <p style="color: #DC3545; font-weight: bold;">${logData.faq_suggestion_epoch}</p>
                <p>Veuillez valider l'ajout à la source.</p>
            `;
            panel.setAttribute('data-suggestion', logData.faq_suggestion_epoch);
            addButton.style.display = 'block';

        } else {
            panel.innerHTML = `<p>Analyse prévue après ${remainingToTarget} sessions supplémentaires. Continuez le débat pour atteindre le seuil de ${EPOCH_SIZE} sessions.</p>`;
            panel.removeAttribute('data-suggestion');
            addButton.style.display = 'none';
        }

    } catch (error) {
        statusSpan.textContent = "Erreur de connexion au log de l'IA.";
        console.error('Erreur Epoch Status:', error);
    }
}

// --- 9. Fonction pour Ajouter la FAQ Suggérée ---
async function addSuggestedFaq() {
    const suggestionText = document.getElementById('faq-suggestion-panel').getAttribute('data-suggestion');
    if (!suggestionText) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/faq/add-suggestion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: suggestionText, 
                difficulty: 'expert' 
            })
        });

        if (response.ok) {
            alert('FAQ ajoutée avec succès ! Mise à jour des statistiques.');
            fetchFaqStats(); 
            refreshEpochStatus(); 
        } else {
            alert('Échec de l\'ajout de la FAQ.');
        }
    } catch (error) {
        alert('Erreur réseau lors de l\'ajout de la FAQ.');
        console.error('Erreur Ajout FAQ:', error);
    }
}

// --- GESTION DU MOTEUR 1001 SOLUTIONS ---
async function generate1001Solutions() {
    const problemQuestion = document.getElementById('problem-input').value;
    const difficulty = document.getElementById('solution-difficulty').value;
    const outputDiv = document.getElementById('solutions-output');
    
    if (!outputDiv) return;

    if (!problemQuestion) {
        outputDiv.innerHTML = `<p class="warning-message">Veuillez entrer une question critique pour l'analyse.</p>`;
        return;
    }

    outputDiv.innerHTML = `<p class="loading-message">🚀 Activation du moteur double IA (Gemini & Llama). Génération de 1001 variations de solutions...</p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/1001-solutions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problemQuestion, difficulty })
        });
        
        // VÉRIFIE LE STATUT AVANT DE PARSER (CORRECTION de l'erreur 'Unexpected token <')
        if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`);
        }

        const data = await response.json();

        let htmlContent = `
            <h3>Analyse du Problème : "${data.question_source || problemQuestion}"</h3>
            <p><strong>Solutions Potentielles Totales :</strong> <span class="badge">${data.total_solutions || 1001}</span></p>
            <hr>
            <h4>Ligne de Défense Stratégique (Gemini) :</h4>
            <div class="ia-panel gemini-defense">
                <p>${data.gemini_strategic_answer || "Réponse stratégique générée par l'IA..."}</p>
            </div>
            
            <h4>Exemples de Solutions Variées (20 Premières sur 1001) :</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
        `;
        
        const variations = data.solution_variations || [];
        variations.slice(0, 20).forEach((sol) => {
            htmlContent += `
                <div class="solution-card">
                    <strong>Focus :</strong> ${sol.focus}<br>
                    <small>${sol.full_solution_pitch.substring(0, 80)}...</small>
                </div>
            `;
        });

        htmlContent += `</div>`;
        outputDiv.innerHTML = htmlContent;

    } catch (error) {
        outputDiv.innerHTML = `<p class="error-message">Erreur critique lors de la génération des 1001 solutions : ${error.message || error}</p>`;
        console.error('Erreur 1001 Solutions:', error);
    }
}


// --- Lancement des Fonctions et Liaison du Bouton ---
// public/app.js (Bloc de Liaison Final et Corrigé)

// ... (Définitions de toutes les fonctions) ...

// --- Lancement des Fonctions et Liaison du Bouton ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation des composants principaux
    loadPolicyDetails();
    loadDeploymentPlan();
    
    // 2. LIAISON DES ÉVÉNEMENTS AUX BOUTONS (Ciblage par ID)
    
    // a. FAQ Stats (Bouton problématique)
    const fetchBtn = document.getElementById('fetch-faq-btn'); // Cible le bouton
    if (fetchBtn) fetchBtn.addEventListener('click', fetchFaqStats); 
    
    // b. Débat GAN
    // Utiliser querySelector pour les boutons définis par onclick dans l'HTML
    const ganBtn = document.querySelector('button[onclick="startGanDebate()"]');
    if (ganBtn) {
        ganBtn.removeAttribute('onclick'); // Supprimer l'ancien conflit
        ganBtn.addEventListener('click', startGanDebate);
    }
    
    // c. Simulation d'Impact CVNU
    const simulateBtn = document.querySelector('button[onclick="simulateActionImpact()"]');
    if (simulateBtn) {
        simulateBtn.removeAttribute('onclick');
        simulateBtn.addEventListener('click', simulateActionImpact);
    }
    
    // d. Moteur 1001 Solutions (Si vous ajoutez un bouton pour cela dans index.html)
    const btn1001 = document.getElementById('generate-1001-btn');
    if (btn1001) btn1001.addEventListener('click', generate1001Solutions);
    
    // e. Explications Dynamiques
    const aiDetailsBtn = document.querySelector('button[onclick="fetchAiDetails()"]');
    if (aiDetailsBtn) {
        aiDetailsBtn.removeAttribute('onclick');
        aiDetailsBtn.addEventListener('click', fetchAiDetails);
    }
    
    const addFaqBtn = document.getElementById('add-faq-btn');
        if (addFaqBtn) addFaqBtn.addEventListener('click', addSuggestedFaq);


    // 3. Appel initial au chargement des données
    fetchFaqStats(); 
    refreshEpochStatus(); 
});