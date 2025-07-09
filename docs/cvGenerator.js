// public/js/cvGenerator.js

import { api } from './apiService.js';
import { showGenericModal } from './modal.js'; // Correction: Renommé showModal en showGenericModal
import { showStatusMessage } from './utils.js';
import { updateCvnuLevelDisplay } from './cvnuLevels.js'; // Pour mettre à jour l'affichage des niveaux après valorisation

// --- État local du module ---
let currentCvStructuredData = null; // Stocke la dernière structure JSON du CV

// --- Éléments du DOM (déclarés ici mais initialisés par initCvGeneratorDomElements) ---
let cvInput, generateCvBtn, clearCvInputBtn, cvOutput, downloadCvBtn,
    valorizeCvContentBtn, valorizationOutput, editCvBtn;

/**
 * Initialise les références aux éléments DOM et les écouteurs d'événements pour le générateur de CV.
 */
export function initCvGeneratorDomElements() {
    cvInput = document.getElementById('cv-input');
    generateCvBtn = document.getElementById('generateCvBtn');
    clearCvInputBtn = document.getElementById('clearCvInputBtn');
    cvOutput = document.getElementById('cv-output');
    downloadCvBtn = document.getElementById('downloadCvBtn');
    valorizeCvContentBtn = document.getElementById('valorizeCvContentBtn');
    valorizationOutput = document.getElementById('valorization-output');
    editCvBtn = document.getElementById('editCvBtn');

    // --- Gestionnaires d'événements ---
    if (generateCvBtn) {
        generateCvBtn.addEventListener('click', handleGenerateCv);
    }
    if (clearCvInputBtn) {
        clearCvInputBtn.addEventListener('click', clearCvSection);
    }
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', handleDownloadCv);
    }
    if (valorizeCvContentBtn) {
        valorizeCvContentBtn.addEventListener('click', handleValorizeCvContent);
    }
    if (editCvBtn) {
        editCvBtn.addEventListener('click', openCvEditorModal);
    }

    // Charger le dernier CV structuré au démarrage de la page de gestion du CV
    loadLastStructuredCvData();
}

/**
 * Réinitialise la section du générateur de CV.
 */
function clearCvSection() {
    if (cvInput) cvInput.value = '';
    if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
    if (downloadCvBtn) downloadCvBtn.style.display = 'none';
    if (editCvBtn) editCvBtn.style.display = 'none';
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">La valorisation de vos compétences par l\'IA apparaîtra ici (ex: phrase d\'accroche, description des compétences, estimation UTMi).</p>';
    currentCvStructuredData = null; // Réinitialiser les données structurées
    updateCvnuLevelDisplay(0); // Réinitialiser l'affichage des niveaux
}

/**
 * Gère la génération du CV.
 * Si du texte brut est fourni, il est d'abord structuré via l'IA.
 * Ensuite, les données structurées sont utilisées pour générer le HTML du CV.
 */
async function handleGenerateCv() {
    const rawCvContent = cvInput ? cvInput.value.trim() : '';
    if (!rawCvContent && !currentCvStructuredData) {
        showStatusMessage('Veuillez saisir du contenu ou charger un CV pour générer/afficher le CV.', 'warning');
        return;
    }

    showStatusMessage('Génération du CV en cours...', 'info');
    if (generateCvBtn) generateCvBtn.disabled = true;
    if (clearCvInputBtn) clearCvInputBtn.disabled = true;
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (editCvBtn) editCvBtn.disabled = true;
    if (downloadCvBtn) downloadCvBtn.style.display = 'none';
    if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Génération en cours...</p>';
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">En attente de valorisation...</p>';

    try {
        let cvDataToRender = currentCvStructuredData;

        if (rawCvContent) { // Si un input brut est fourni, le parser
            cvDataToRender = await api.parseAndStructureCv(rawCvContent);
            currentCvStructuredData = cvDataToRender; // Mettre à jour l'état local
        } else if (!currentCvStructuredData) {
            throw new Error('Aucune donnée de CV disponible pour la génération.');
        }

        const generatedCvHtmlContent = await api.renderCvHtml(cvDataToRender);
        if (cvOutput) cvOutput.innerHTML = generatedCvHtmlContent;
        if (downloadCvBtn) downloadCvBtn.style.display = 'inline-flex';
        if (editCvBtn) editCvBtn.style.display = 'inline-flex';
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
        showStatusMessage('CV généré avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        showStatusMessage(`Erreur de génération du CV: ${error.message}`, 'error');
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
        const data = await api.fetchLastStructuredCvData();
        currentCvStructuredData = data;
        if (cvInput) cvInput.value = JSON.stringify(data, null, 2); // Afficher le JSON dans l'input pour référence
        handleGenerateCv(); // Générer le CV HTML à partir des données chargées
        showStatusMessage('Dernier CV structuré chargé.', 'info');
    } catch (error) {
        if (error.message.includes('404')) {
            showStatusMessage('Aucun CV structuré précédent trouvé.', 'info');
        } else {
            console.error('Erreur lors du chargement du dernier CV structuré:', error);
            showStatusMessage(`Erreur de chargement du dernier CV: ${error.message}`, 'error');
        }
    }
}

/**
 * Gère le téléchargement du CV généré.
 */
function handleDownloadCv() {
    const htmlContent = cvOutput ? cvOutput.innerHTML : '';
    if (!htmlContent || htmlContent.includes('placeholder-text') || htmlContent.includes('error-message')) {
        showStatusMessage('Rien à télécharger : le contenu du CV est vide ou invalide.', 'warning');
        return;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
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
 * Gère la valorisation du contenu du CV.
 */
async function handleValorizeCvContent() {
    const contentToValorize = cvInput ? cvInput.value.trim() : '';
    if (!contentToValorize) {
        showStatusMessage('Veuillez saisir du texte dans le champ CV pour le valoriser.', 'warning');
        return;
    }

    showStatusMessage('Valorisation des compétences par l\'IA...', 'info');
    if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
    if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">Analyse et valorisation en cours...</p>';

    try {
        const result = await api.valorizeCv(contentToValorize);
        let valorizationHtml = `
            <h3>Synthèse de Valorisation</h3>
            <p class="text-gray-800 font-semibold mb-2">Message: ${result.message || 'N/A'}</p>
            <p class="text-gray-800 font-semibold mb-2">UTMi estimées: <span class="text-indigo-700">${(result.valorization.estimatedUtmi || 0).toFixed(2)}</span></p>
            <p class="text-gray-800 font-semibold mb-2">Résumé Professionnel suggéré:</p>
            <pre class="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">${result.valorization.professionalSummary || 'N/A'}</pre>
            <h4 class="text-lg font-bold text-indigo-700 mb-2">Détails de la Valorisation :</h4>
            <pre class="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">${JSON.stringify(result.valorization, null, 2)}</pre>
        `;
        if (valorizationOutput) valorizationOutput.innerHTML = valorizationHtml;

        // Mettre à jour l'affichage des niveaux CVNU avec les UTMi estimées
        updateCvnuLevelDisplay(result.valorization.estimatedUtmi || 0);

        showStatusMessage('CV valorisé avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV:', error);
        showStatusMessage(`Erreur de valorisation du CV: ${error.message}`, 'error');
        if (valorizationOutput) valorizationOutput.innerHTML = `<p class="placeholder-text error-message">Erreur lors de la valorisation du CV: ${error.message}</p>`;
    } finally {
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
    }
}

/**
 * Ouvre une modale pour éditer les données structurées du CV.
 */
async function openCvEditorModal() {
    if (!currentCvStructuredData) {
        await showGenericModal('Attention', 'Veuillez générer ou charger un CV d\'abord pour pouvoir l\'éditer.', 'alert'); // Correction: showModal -> showGenericModal
        return;
    }

    const createInputField = (id, label, value, type = 'text', rows = 1) => `
        <div class="form-group">
            <label for="${id}" class="label-text">${label} :</label>
            ${type === 'textarea' ?
                `<textarea id="${id}" class="input-field" rows="${rows}">${value || ''}</textarea>` :
                `<input type="${type}" id="${id}" class="input-field" value="${value || ''}">`
            }
        </div>
    `;

    const createSectionHeader = (title) => `
        <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">${title}</h4>
    `;

    // Fonction utilitaire pour créer des champs d'entrée dynamiques pour les expériences
    const createExperienceFields = (exp, index) => `
        <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
            <h5 class="text-lg font-semibold mb-2">Expérience ${index + 1}</h5>
            ${createInputField(`exp-titre-${index}`, 'Titre', exp.titre)}
            ${createInputField(`exp-entreprise-${index}`, 'Entreprise', exp.entreprise)}
            ${createInputField(`exp-duree-${index}`, 'Durée', exp.duree)}
            ${createInputField(`exp-description-${index}`, 'Description', exp.description, 'textarea', 3)}
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-item-btn" data-type="experience"><i class="fas fa-trash-alt"></i> Supprimer</button>
        </div>
    `;

    // Fonction utilitaire pour créer des champs d'entrée dynamiques pour la formation
    const createFormationFields = (edu, index) => `
        <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
            <h5 class="text-lg font-semibold mb-2">Formation ${index + 1}</h5>
            ${createInputField(`edu-diplome-${index}`, 'Diplôme', edu.diplome)}
            ${createInputField(`edu-etablissement-${index}`, 'Établissement', edu.etablissement)}
            ${createInputField(`edu-duree-${index}`, 'Durée', edu.duree)}
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-item-btn" data-type="formation"><i class="fas fa-trash-alt"></i> Supprimer</button>
        </div>
    `;

    // Fonction utilitaire pour créer des champs d'entrée dynamiques pour les projets
    const createProjetFields = (proj, index) => `
        <div class="form-group card-light mb-2 p-3 rounded-md border border-gray-200">
            <h5 class="text-lg font-semibold mb-2">Projet ${index + 1}</h5>
            ${createInputField(`proj-nom-${index}`, 'Nom', proj.nom)}
            ${createInputField(`proj-description-${index}`, 'Description', proj.description, 'textarea', 3)}
            ${createInputField(`proj-technologies-${index}`, 'Technologies (virgule séparée)', proj.technologies ? proj.technologies.join(', ') : '')}
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-item-btn" data-type="projet"><i class="fas fa-trash-alt"></i> Supprimer</button>
        </div>
    `;

    // Construire le contenu HTML du formulaire d'édition pour la modale
    let modalFormHtml = `
        <div class="space-y-4">
            ${createInputField('edit-nom', 'Nom', currentCvStructuredData.nom)}
            ${createInputField('edit-email', 'Email', currentCvStructuredData.email, 'email')}
            ${createInputField('edit-phone', 'Téléphone', currentCvStructuredData.telephone, 'tel')}
            ${createInputField('edit-address', 'Adresse', currentCvStructuredData.adresse)}
            ${createInputField('edit-resume', 'Résumé professionnel', currentCvStructuredData.resume, 'textarea', 4)}

            ${createSectionHeader('Expériences')}
            <div id="edit-experiences-container" class="space-y-4">
                ${currentCvStructuredData.experiences.map(createExperienceFields).join('')}
            </div>
            <button type="button" id="add-experience-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Expérience</button>

            ${createSectionHeader('Formation')}
            <div id="edit-formation-container" class="space-y-4">
                ${currentCvStructuredData.formation.map(createFormationFields).join('')}
            </div>
            <button type="button" id="add-formation-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Formation</button>

            ${createSectionHeader('Compétences (séparées par des virgules)')}
            ${createInputField('edit-competences', 'Compétences', currentCvStructuredData.competences ? currentCvStructuredData.competences.join(', ') : '', 'textarea', 3)}

            ${createSectionHeader('Langues (Ex: Français (Courant), Anglais (Intermédiaire))')}
            ${createInputField('edit-langues', 'Langues', currentCvStructuredData.langues ? currentCvStructuredData.langues.map(l => `${l.langue} (${l.niveau})`).join(', ') : '', 'textarea', 3)}

            ${createSectionHeader('Projets')}
            <div id="edit-projets-container" class="space-y-4">
                ${currentCvStructuredData.projets.map(createProjetFields).join('')}
            </div>
            <button type="button" id="add-projet-btn" class="btn btn-primary btn-sm mt-2"><i class="fas fa-plus"></i> Ajouter Projet</button>
        </div>
    `;

    const result = await showGenericModal('Modifier les informations du CV', modalFormHtml, 'confirm', '900px'); // Correction: showModal -> showGenericModal

    if (result) {
        // Récupérer les données modifiées de la modale
        const updatedData = {
            nom: document.getElementById('edit-nom')?.value || '',
            email: document.getElementById('edit-email')?.value || '',
            telephone: document.getElementById('edit-phone')?.value || '',
            adresse: document.getElementById('edit-address')?.value || '',
            resume: document.getElementById('edit-resume')?.value || '',
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

        // Parse experiences
        document.querySelectorAll('#edit-experiences-container > .form-group').forEach(expDiv => {
            updatedData.experiences.push({
                titre: expDiv.querySelector('[id^="exp-titre-"]').value,
                entreprise: expDiv.querySelector('[id^="exp-entreprise-"]').value,
                duree: expDiv.querySelector('[id^="exp-duree-"]').value,
                description: expDiv.querySelector('[id^="exp-description-"]').value
            });
        });

        // Parse formation
        document.querySelectorAll('#edit-formation-container > .form-group').forEach(eduDiv => {
            updatedData.formation.push({
                diplome: eduDiv.querySelector('[id^="edu-diplome-"]').value,
                etablissement: eduDiv.querySelector('[id^="edu-etablissement-"]').value,
                duree: eduDiv.querySelector('[id^="edu-duree-"]').value
            });
        });

        // Parse projets
        document.querySelectorAll('#edit-projets-container > .form-group').forEach(projDiv => {
            updatedData.projets.push({
                nom: projDiv.querySelector('[id^="proj-nom-"]').value,
                description: projDiv.querySelector('[id^="proj-description-"]').value,
                technologies: projDiv.querySelector('[id^="proj-technologies-"]').value.split(',').map(s => s.trim()).filter(s => s)
            });
        });

        currentCvStructuredData = updatedData; // Mettre à jour l'état local avec les données modifiées

        // Régénérer et afficher le CV avec les nouvelles données
        showStatusMessage('Mise à jour du CV...', 'info');
        handleGenerateCv(); // Appelle handleGenerateCv sans texte brut, il utilisera currentCvStructuredData
    } else {
        showStatusMessage('Modification du CV annulée.', 'info');
    }
}

// Fonctions pour ajouter dynamiquement de nouveaux champs
function addItemField(containerId, createFieldHtml) {
    const container = document.getElementById(containerId);
    if (container) {
        const newItemDiv = document.createElement('div');
        newItemDiv.className = 'form-group card-light mb-2 p-3 rounded-md border border-gray-200';
        newItemDiv.innerHTML = createFieldHtml(container.children.length); // Passe un index pour des IDs uniques
        container.appendChild(newItemDiv);
        newItemDiv.querySelector('.remove-item-btn').addEventListener('click', () => newItemDiv.remove());
    }
}

// Event delegation for dynamically added buttons in modal after it opens
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item-btn')) {
        e.target.closest('.form-group')?.remove();
    } else if (e.target.id === 'add-experience-btn') {
        addItemField('edit-experiences-container', (index) => `
            <h5 class="text-lg font-semibold mb-2">Nouvelle Expérience</h5>
            ${createInputField(`exp-titre-${index}`, 'Titre', '')}
            ${createInputField(`exp-entreprise-${index}`, 'Entreprise', '')}
            ${createInputField(`exp-duree-${index}`, 'Durée', '')}
            ${createInputField(`exp-description-${index}`, 'Description', '', 'textarea', 3)}
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-item-btn" data-type="experience"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `);
    } else if (e.target.id === 'add-formation-btn') {
        addItemField('edit-formation-container', (index) => `
            <h5 class="text-lg font-semibold mb-2">Nouvelle Formation</h5>
            ${createInputField(`edu-diplome-${index}`, 'Diplôme', '')}
            ${createInputField(`edu-etablissement-${index}`, 'Établissement', '')}
            ${createInputField(`edu-duree-${index}`, 'Durée', '')}
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-item-btn" data-type="formation"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `);
    } else if (e.target.id === 'add-projet-btn') {
        addItemField('edit-projets-container', (index) => `
            <h5 class="text-lg font-semibold mb-2">Nouveau Projet</h5>
            ${createInputField(`proj-nom-${index}`, 'Nom', '')}
            ${createInputField(`proj-description-${index}`, 'Description', '', 'textarea', 3)}
            ${createInputField(`proj-technologies-${index}`, 'Technologies (virgule séparée)', '')}
            <button type="button" class="btn btn-secondary btn-sm mt-2 remove-item-btn" data-type="projet"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `);
    }
});

// Exportation des fonctions clés pour l'initialisation depuis le module principal
export { handleGenerateCv, handleDownloadCv, handleValorizeCvContent, openCvEditorModal, loadLastStructuredCvData, clearCvSection };
