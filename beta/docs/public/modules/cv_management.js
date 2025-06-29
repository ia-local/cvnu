// public/modules/cv_management.js

import { getApiBaseUrl } from '../app.js'; // Import getApiBaseUrl
import { showModal } from '../modal.js'; // Import showModal

// Références aux éléments DOM spécifiques à la gestion du CV
let cvInput, generateCvBtn, clearCvInputBtn, cvOutput, downloadCvBtn,
    valorizeCvContentBtn, valorizationOutput, editCvBtn;

// Callbacks pour les fonctions globales passées depuis app.js
let _showStatusMessage;
let _currentCvStructuredData;
let _setCurrentCvStructuredData;


export function initCvManagementPage(apiBaseUrl, showStatusMessageFn, currentCvStructuredDataVal, setCurrentCvStructuredDataFn, showModalFn) {
    // Assigner les fonctions et valeurs globales
    _showStatusMessage = showStatusMessageFn;
    _currentCvStructuredData = currentCvStructuredDataVal;
    _setCurrentCvStructuredData = setCurrentCvStructuredDataFn;

    // Initialiser les éléments DOM
    cvInput = document.getElementById('cv-input');
    generateCvBtn = document.getElementById('generateCvBtn');
    clearCvInputBtn = document.getElementById('clearCvInputBtn');
    cvOutput = document.getElementById('cv-output');
    downloadCvBtn = document.getElementById('downloadCvBtn');
    valorizeCvContentBtn = document.getElementById('valorizeCvContentBtn');
    valorizationOutput = document.getElementById('valorization-output');
    editCvBtn = document.getElementById('editCvBtn');

    // Attacher les écouteurs d'événements
    if (generateCvBtn) {
        generateCvBtn.onclick = generateCv;
    }
    if (clearCvInputBtn) {
        clearCvInputBtn.onclick = () => {
            if (cvInput) cvInput.value = '';
            if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
            if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">La valorisation de vos compétences par l\'IA apparaîtra ici (ex: phrase d\'accroche, description des compétences, estimation UTMi).</p>';
            if (downloadCvBtn) downloadCvBtn.style.display = 'none';
            if (editCvBtn) editCvBtn.style.display = 'none';
            if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
            _setCurrentCvStructuredData(null);
        };
    }
    if (downloadCvBtn) {
        downloadCvBtn.onclick = downloadCv;
    }
    if (valorizeCvContentBtn) {
        valorizeCvContentBtn.onclick = valorizeCvContent;
    }
    if (editCvBtn) {
        editCvBtn.onclick = openCvEditorModal;
    }

    // Load last structured CV data on page load (if applicable)
    loadLastStructuredCvData();

    // Initial state for buttons
    if (downloadCvBtn) downloadCvBtn.style.display = 'none';
    if (editCvBtn) editCvBtn.style.display = 'none';
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;

}

/**
 * Génère un CV à partir du texte brut saisi ou des données structurées actuelles.
 */
async function generateCv() {
    const rawCvContent = cvInput.value.trim();
    if (!rawCvContent && !_currentCvStructuredData) {
        _showStatusMessage('Veuillez saisir du contenu ou charger un CV pour générer/afficher le CV.', 'warning');
        return;
    }

    _showStatusMessage('Génération du CV en cours...', 'info');
    if (generateCvBtn) generateCvBtn.disabled = true;
    if (clearCvInputBtn) clearCvInputBtn.disabled = true;
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (editCvBtn) editCvBtn.disabled = true;
    if (downloadCvBtn) downloadCvBtn.style.display = 'none';
    if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">En attente de valorisation...</p>';

    try {
        let cvDataToRender = _currentCvStructuredData;

        if (rawCvContent) {
            const parseResponse = await fetch(`${getApiBaseUrl()}/api/cv/parse-and-structure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvContent: rawCvContent }),
            });

            if (!parseResponse.ok) {
                const errorData = await parseResponse.json();
                if (parseResponse.status === 429) {
                    throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer de structurer le CV.");
                }
                throw new Error(errorData.error || 'Échec de l\'analyse et de la structuration du CV.');
            }
            cvDataToRender = await parseResponse.json();
            _setCurrentCvStructuredData(cvDataToRender); // Update global state
        } else if (!_currentCvStructuredData) {
            throw new Error('Aucune donnée de CV disponible pour la génération.');
        }

        const renderHtmlResponse = await fetch(`${getApiBaseUrl()}/api/cv/render-html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvData: cvDataToRender }),
        });

        if (!renderHtmlResponse.ok) {
            const errorText = await renderHtmlResponse.text();
            throw new Error(`Échec du rendu HTML du CV: ${errorText}`);
        }

        const generatedCvHtmlContent = await renderHtmlResponse.text();
        if (cvOutput) cvOutput.innerHTML = generatedCvHtmlContent;
        if (downloadCvBtn) downloadCvBtn.style.display = 'inline-flex';
        if (editCvBtn) editCvBtn.style.display = 'inline-flex';
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
        _showStatusMessage('CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        _showStatusMessage(`Erreur de génération du CV: ${error.message}`, 'error');
        if (cvOutput) cvOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la génération du CV: ${error.message}</p>`;
        if (valorizationOutput) valorizationOutput.innerHTML = `<p class="placeholder-text error-message">Veuillez d'abord générer un CV valide pour la valorisation.</p>`;
    } finally {
        if (generateCvBtn) generateCvBtn.disabled = false;
        if (clearCvInputBtn) clearCvInputBtn.disabled = false;
        if (editCvBtn) editCvBtn.disabled = false;
    }
}

/**
 * Charge la dernière structure JSON de CV sauvegardée côté serveur.
 */
async function loadLastStructuredCvData() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/cv/last-structured-data`);
        if (response.ok) {
            const data = await response.json();
            _setCurrentCvStructuredData(data);
            if (cvInput) cvInput.value = JSON.stringify(data, null, 2);
            generateCv();
            _showStatusMessage('Dernier CV structuré chargé.', 'info');
        } else if (response.status === 404) {
            _showStatusMessage('Aucun CV structuré précédent trouvé.', 'info');
        } else {
             if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur lors du chargement du dernier CV structuré:', error);
        _showStatusMessage(`Erreur de chargement du dernier CV: ${error.message}`, 'error');
    }
}

/**
 * Télécharge le CV généré sous forme de fichier HTML.
 */
function downloadCv() {
    const cvHtmlContent = cvOutput ? cvOutput.innerHTML : '';
    if (!cvHtmlContent || cvHtmlContent.includes('placeholder-text') || cvHtmlContent.includes('error-message')) {
        _showStatusMessage('Rien à télécharger : le contenu du CV est vide ou invalide.', 'warning');
        return;
    }

    const blob = new Blob([cvHtmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mon_cv_cvnu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    _showStatusMessage('CV téléchargé.', 'success');
}

/**
 * Valorise le contenu du CV via l'IA.
 */
async function valorizeCvContent() {
    const contentToValorize = cvInput ? cvInput.value.trim() : '';
    if (!contentToValorize) {
        _showStatusMessage('Veuillez saisir du texte dans le champ CV pour le valoriser.', 'warning');
        return;
    }

    _showStatusMessage('Valorisation des compétences par l\'IA...', 'info');
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">Analyse et valorisation en cours...</p>';

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/valorize-cv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent: contentToValorize }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer de valoriser le CV.");
            }
            throw new Error(errorData.message || `Échec de la valorisation: ${response.status}`);
        }

        const result = await response.json();
        let valorizationHtml = `
            <h3>Synthèse de Valorisation</h3>
            <p><strong>Message:</strong> ${result.message || 'N/A'}</p>
            <p><strong>UTMi généré:</strong> ${result.utmi.toFixed(2)} EUR</p>
            <p><strong>Coût estimé:</strong> ${result.estimatedCost.toFixed(6)} USD</p>
            <p><strong>Taxe IA:</strong> ${result.taxeIAAmount.toFixed(2)} EUR</p>
            <p><strong>Valorisation Détaillée:</strong></p>
            <pre>${JSON.stringify(result.valorization, null, 2)}</pre>
        `;
        if (valorizationOutput) valorizationOutput.innerHTML = valorizationHtml;
        _showStatusMessage('Valorisation terminée.', 'success');
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV:', error);
        _showStatusMessage(`Erreur de valorisation du CV: ${error.message}`, 'error');
        if (valorizationOutput) valorizationOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la valorisation du CV: ${error.message}</p>`;
    } finally {
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
    }
}

/**
 * Ouvre une modale pour éditer les données structurées du CV.
 */
async function openCvEditorModal() {
    if (!_currentCvStructuredData) {
        await showModal('Attention', 'Veuillez générer ou charger un CV d\'abord pour pouvoir l\'éditer.', 'alert');
        return;
    }

    const createExperienceFields = (exp, index) => `
        <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
            <h5 class="text-lg font-semibold mb-2">Expérience ${index + 1}</h5>
            <label class="label-text">Titre :</label>
            <input type="text" class="input-field mb-1" data-field="titre" value="${exp.titre || ''}">
            <label class="label-text">Entreprise :</label>
            <input type="text" class="input-field mb-1" data-field="entreprise" value="${exp.entreprise || ''}">
            <label class="label-text">Durée :</label>
            <input type="text" class="input-field mb-1" data-field="duree" value="${exp.duree || ''}">
            <label class="label-text">Description :</label>
            <textarea class="input-field mt-1" rows="3" data-field="description">${exp.description || ''}</textarea>
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-experience-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        </div>
    `;

    let modalFormHtml = `
        <div class="space-y-4">
            <div class="form-group">
                <label for="edit-nom" class="label-text">Nom :</label>
                <input type="text" id="edit-nom" class="input-field" value="${_currentCvStructuredData.nom || ''}">
            </div>
            <div class="form-group">
                <label for="edit-email" class="label-text">Email :</label>
                <input type="email" id="edit-email" class="input-field" value="${_currentCvStructuredData.email || ''}">
            </div>
            <div class="form-group">
                <label for="edit-phone" class="label-text">Téléphone :</label>
                <input type="tel" id="edit-phone" class="input-field" value="${_currentCvStructuredData.telephone || ''}">
            </div>
            <div class="form-group">
                <label for="edit-address" class="label-text">Adresse :</label>
                <input type="text" id="edit-address" class="input-field" value="${_currentCvStructuredData.adresse || ''}">
            </div>
            <div class="form-group">
                <label for="edit-resume" class="label-text">Résumé professionnel :</label>
                <textarea id="edit-resume" class="input-field" rows="4">${_currentCvStructuredData.resume || ''}</textarea>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Expériences</h4>
            <div id="edit-experiences-container" class="space-y-4">
                ${_currentCvStructuredData.experiences.map(createExperienceFields).join('')}
            </div>
            <button type="button" id="add-experience-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Expérience</button>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Formation (simplifié)</h4>
            <div id="edit-formation-container" class="space-y-4">
                ${_currentCvStructuredData.formation.map((edu, index) => `
                    <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
                        <h5 class="text-lg font-semibold mb-2">Formation ${index + 1}</h5>
                        <label class="label-text">Diplôme :</label>
                        <input type="text" class="input-field mb-1" data-field="diplome" value="${edu.diplome || ''}">
                        <label class="label-text">Établissement :</label>
                        <input type="text" class="input-field mb-1" data-field="etablissement" value="${edu.etablissement || ''}">
                        <label class="label-text">Durée :</label>
                        <input type="text" class="input-field" data-field="duree" value="${edu.duree || ''}">
                        <button type="button" class="btn btn-secondary btn-sm mt-2 remove-formation-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
                    </div>
                `).join('')}
                <button type="button" id="add-formation-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Formation</button>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Compétences (séparées par des virgules)</h4>
            <div class="form-group">
                <textarea id="edit-competences" class="input-field" rows="3">${_currentCvStructuredData.competences ? _currentCvStructuredData.competences.join(', ') : ''}</textarea>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Langues (Ex: Français (Courant), Anglais (Intermédiaire))</h4>
            <div class="form-group">
                <textarea id="edit-langues" class="input-field" rows="3">${_currentCvStructuredData.langues ? _currentCvStructuredData.langues.map(l => `${l.langue} (${l.niveau})`).join(', ') : ''}</textarea>
            </div>

            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Projets (simplifié)</h4>
            <div id="edit-projets-container" class="space-y-4">
                ${_currentCvStructuredData.projets.map((proj, index) => `
                    <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
                        <h5 class="text-lg font-semibold mb-2">Projet ${index + 1}</h5>
                        <label class="label-text">Nom :</label>
                        <input type="text" class="input-field mb-1" data-field="nom" value="${proj.nom || ''}">
                        <label class="label-text">Description :</label>
                        <textarea class="input-field mt-1" rows="3" data-field="description">${proj.description || ''}</textarea>
                        <label class="label-text">Technologies (virgule séparée):</label>
                        <input type="text" class="input-field mt-1" data-field="technologies" value="${proj.technologies ? proj.technologies.join(', ') : ''}">
                        <button type="button" class="btn btn-secondary btn-sm mt-2 remove-projet-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
                    </div>
                `).join('')}
                <button type="button" id="add-projet-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Projet</button>
            </div>
        </div>
    `;

    const result = await showModal('Modifier les informations du CV', modalFormHtml, 'confirm', '900px');

    if (result) {
        const updatedData = {
            nom: document.getElementById('edit-nom')?.value || 'N/A',
            email: document.getElementById('edit-email')?.value || 'N/A',
            telephone: document.getElementById('edit-phone')?.value || 'N/A',
            adresse: document.getElementById('edit-address')?.value || 'N/A',
            resume: document.getElementById('edit-resume')?.value || 'N/A',
            experiences: [],
            formation: [],
            competences: document.getElementById('edit-competences')?.value.split(',').map(s => s.trim()).filter(s => s) || [],
            langues: document.getElementById('edit-langues')?.value.split(',').map(l => {
                const parts = l.split('(');
                if (parts.length === 2) {
                    return { langue: parts[0].trim(), niveau: parts[1].replace(')', '').trim() };
                }
                return { langue: l.trim(), niveau: 'N/A' };
            }).filter(l => l.langue) || [],
            projets: []
        };

        document.querySelectorAll('#edit-experiences-container > .form-group').forEach(expDiv => {
            updatedData.experiences.push({
                titre: expDiv.querySelector('[data-field="titre"]').value,
                entreprise: expDiv.querySelector('[data-field="entreprise"]').value,
                duree: expDiv.querySelector('[data-field="duree"]').value,
                description: expDiv.querySelector('[data-field="description"]').value
            });
        });

        document.querySelectorAll('#edit-formation-container > .form-group').forEach(eduDiv => {
            updatedData.formation.push({
                diplome: eduDiv.querySelector('[data-field="diplome"]').value,
                etablissement: eduDiv.querySelector('[data-field="etablissement"]').value,
                duree: eduDiv.querySelector('[data-field="duree"]').value
            });
        });

        document.querySelectorAll('#edit-projets-container > .form-group').forEach(projDiv => {
            updatedData.projets.push({
                nom: projDiv.querySelector('[data-field="nom"]').value,
                description: projDiv.querySelector('[data-field="description"]').value,
                technologies: projDiv.querySelector('[data-field="technologies"]').value.split(',').map(s => s.trim()).filter(s => s)
            });
        });

        _setCurrentCvStructuredData(updatedData);

        _showStatusMessage('Mise à jour du CV...', 'info');
        generateCv();
    } else {
        _showStatusMessage('Modification du CV annulée.', 'info');
    }
}

// Fonction pour ajouter dynamiquement une nouvelle expérience
function addExperienceField() {
    const container = document.getElementById('edit-experiences-container');
    if (container) {
        const newExpDiv = document.createElement('div');
        newExpDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newExpDiv.innerHTML = `
            <h5 class="text-lg font-semibold mb-2">Nouvelle Expérience</h5>
            <label class="label-text">Titre :</label>
            <input type="text" class="input-field mb-1" data-field="titre" value="">
            <label class="label-text">Entreprise :</label>
            <input type="text" class="input-field mb-1" data-field="entreprise" value="">
            <label class="label-text">Durée :</label>
            <input type="text" class="input-field mb-1" data-field="duree" value="">
            <label class="label-text">Description :</label>
            <textarea class="input-field mt-1" rows="3" data-field="description"></textarea>
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-experience-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
        container.appendChild(newExpDiv);
        newExpDiv.querySelector('.remove-experience-btn').addEventListener('click', () => newExpDiv.remove());
    }
}

// Fonction pour ajouter dynamiquement une nouvelle formation
function addFormationField() {
    const container = document.getElementById('edit-formation-container');
    if (container) {
        const newEduDiv = document.createElement('div');
        newEduDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newEduDiv.innerHTML = `
            <h5 class="text-lg font-semibold mb-2">Nouvelle Formation</h5>
            <label class="label-text">Diplôme :</label>
            <input type="text" class="input-field mb-1" data-field="diplome" value="">
            <label class="label-text">Établissement :</label>
            <input type="text" class="input-field mb-1" data-field="etablissement" value="">
            <label class="label-text">Durée :</label>
            <input type="text" class="input-field" data-field="duree" value="">
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-formation-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
        container.appendChild(newEduDiv);
        newEduDiv.querySelector('.remove-formation-btn').addEventListener('click', () => newEduDiv.remove());
    }
}

// Fonction pour ajouter dynamiquement un nouveau projet
function addProjetField() {
    const container = document.getElementById('edit-projets-container');
    if (container) {
        const newProjDiv = document.createElement('div');
        newProjDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newProjDiv.innerHTML = `
            <h5 class="text-lg font-semibold mb-2">Nouveau Projet</h5>
            <label class="label-text">Nom :</label>
            <input type="text" class="input-field mb-1" data-field="nom" value="">
            <label class="label-text">Description :</label>
            <textarea class="input-field mt-1" rows="3" data-field="description"></textarea>
            <label class="label-text">Technologies (virgule séparée):</label>
            <input type="text" class="input-field mt-1" data-field="technologies" value="">
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-projet-btn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
        container.appendChild(newProjDiv);
        newProjDiv.querySelector('.remove-projet-btn').addEventListener('click', () => newProjDiv.remove());
    }
}

// Event delegation for dynamically added remove buttons in modal after it opens
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-experience-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.classList.contains('remove-formation-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.classList.contains('remove-projet-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.id === 'add-experience-btn') {
        addExperienceField();
    } else if (e.target.id === 'add-formation-btn') {
        addFormationField();
    } else if (e.target.id === 'add-projet-btn') {
        addProjetField();
    }
});
