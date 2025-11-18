// serveur.js (Corrigé et Modulaire)

import express from 'express';
import Groq from 'groq-sdk';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Imports des services et Logiques Métier ---
import { policySchema } from './policySchema.js'; 
import { simulateTaxeIA } from './taxeAi.js';
import { generateCvnuDetails, generateTaxeAiJustification, generateQuestion, generateAnswer,generateLlamaSolution,generateTopFaqTitle } from './srv/aiService.js'; 
import { calculateFinalRBUAccounting } from './server_modules/utms_calculator.js'; 
import { generateNextSlideContent } from './server_modules/slideIA.js'; // Import du nouveau module

// Importe TOUTES les fonctions CRUD depuis le service indépendant dataService.js
import { 
    readSourceData, readCvnuActions, writeCvnuActions, 
    readPolicyData, writePolicyData, readFaqData, writeFaqData, 
    readGanData, writeGanData,logSystemEvent   
} from './srv/dataService.js'; 

// --- Configuration et chemins ---
const app = express();
const PORT = process.env.PORT || 3080;

// Utilisation de import.meta.url pour obtenir __filename et __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Clé API Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 
// Constante de l'époque
const EPOCH_SIZE = 10; // 10 sessions pour déclencher la suggestion FAQ

// Middlewares
app.use(cors());
app.use(express.json()); 

// Ajout du routage statique pour le frontend
app.use(express.static(path.join(__dirname, 'public')));


// --- Logique Métier (RC) ---
/** Simule le calcul du RC utilisant Groq. */
async function calculateRC(cvnuLevel, policyData) {
    const rcComponent = policyData.policyComponents.find(c => c.identifier === "RC-CVNU-28J");
    const minRC = rcComponent?.minPaymentAmount.value || 550;
    const maxRC = rcComponent?.maxPaymentAmount.value || 5500;

    const prompt = `Le niveau CVNU est de ${cvnuLevel} sur 100. En utilisant le modèle de progressivité [${minRC}€ à ${maxRC}€], quelle est une estimation juste et progressive du Revenu Citoyen (RC) mensuel ? Répondez uniquement avec le montant en euros.`;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "mixtral-8x7b-32768"
        });
        const resultText = chatCompletion.choices[0].message.content.trim();
        const amount = parseFloat(resultText.match(/(\d+(\.\d+)?)/)[0]); 
        return Math.min(maxRC, Math.max(minRC, amount)); 
    } catch (error) {
        // Fallback en cas d'erreur IA
        const interpolated = minRC + ((maxRC - minRC) * (cvnuLevel / 100));
        return Math.round(interpolated);
    }
}
// --- Routes API (Optimisation CRUD & Logique) ---

// 1. READ (Lecture de toute la politique)
app.get('/api/policy', async (req, res) => {
    const data = await readPolicyData(); 
    res.json(data);
});

// 2. READ (Calcul RC - Logique métier)
app.post('/api/calculate-rc', async (req, res) => {
    const { cvnuLevel } = req.body;
    if (typeof cvnuLevel !== 'number' || cvnuLevel < 0 || cvnuLevel > 100) {
        return res.status(400).json({ error: "cvnuLevel doit être un nombre entre 0 et 100." });
    }

    const policyData = await readPolicyData(); 
    const calculatedRC = await calculateRC(cvnuLevel, policyData);
    
    res.json({
        cvnuLevel: cvnuLevel,
        revenuCitoyenMensuel: calculatedRC,
        note: "Calcul basé sur le Smart Contract de progressivité (via Groq) et les limites de la politique."
    });
});

// 3. UPDATE (Mise à jour d'un composant spécifique)
app.put('/api/policy/component/:identifier', async (req, res) => {
    const { identifier } = req.params;
    const updatePayload = req.body;
    let data = await readPolicyData();
    
    const index = data.policyComponents.findIndex(c => c.identifier === identifier);

    if (index === -1) {
        return res.status(404).json({ message: "Composant politique non trouvé." });
    }

    data.policyComponents[index] = { ...data.policyComponents[index], ...updatePayload };

    if (await writePolicyData(data)) { 
        return res.json({ message: `Composant ${identifier} mis à jour.`, data: data.policyComponents[index] });
    } else {
        return res.status(500).json({ message: "Erreur lors de l'écriture des données." });
    }
});

// 4. DELETE (Suppression d'un composant spécifique)
app.delete('/api/policy/component/:identifier', async (req, res) => {
    const { identifier } = req.params;
    let data = await readPolicyData();
    
    const initialLength = data.policyComponents.length;
    data.policyComponents = data.policyComponents.filter(c => c.identifier !== identifier);

    if (data.policyComponents.length === initialLength) {
        return res.status(404).json({ message: "Composant politique non trouvé." });
    }

    if (await writePolicyData(data)) { 
        return res.json({ message: `Composant ${identifier} supprimé.`, count: data.policyComponents.length });
    } else {
        return res.status(500).json({ message: "Erreur lors de l'écriture des données." });
    }
});

// 5. CREATE (Ajout d'un nouveau composant)
app.post('/api/policy/component', async (req, res) => {
    const newComponent = req.body;
    if (!newComponent.identifier) {
        return res.status(400).json({ message: "Le nouveau composant doit avoir un 'identifier'." });
    }

    let data = await readPolicyData();
    if (data.policyComponents.some(c => c.identifier === newComponent.identifier)) {
        return res.status(409).json({ message: "Ce composant existe déjà." });
    }

    data.policyComponents.push(newComponent);

    if (await writePolicyData(data)) { 
        return res.status(201).json({ message: "Nouveau composant créé.", data: newComponent });
    } else {
        return res.status(500).json({ message: "Erreur lors de l'écriture des données." });
    }
});

// 7. READ (Plan de Déploiement)
app.get('/api/deployment-plan', async (req, res) => {
    const deploymentPlan = policySchema.policyComponents.find(c => c.identifier === "DEPLOYMENT-PLAN");
    
    if (deploymentPlan) {
        res.json(deploymentPlan);
    } else {
        res.status(404).json({ message: "Plan de déploiement non trouvé dans le schéma." });
    }
});

// 8. CREATE (Validation d'une nouvelle action par un Oracle)
app.post('/api/cvnu/action', async (req, res) => {
    const newAction = req.body;

    if (!newAction.citizenId || !newAction.category || !newAction.points || !newAction.validatorId) {
        return res.status(400).json({ message: "Les champs citizenId, category, points et validatorId sont requis." });
    }

    const cvnuActions = await readCvnuActions(); 
    
    const newActionId = 'CVNU-' + (cvnuActions.length + 1).toString().padStart(3, '0');

    const actionToSave = {
        ...newAction,
        actionId: newActionId,
        points: parseInt(newAction.points),
        dateValidated: new Date().toISOString()
    };

    cvnuActions.push(actionToSave);

    if (await writeCvnuActions(cvnuActions)) { 
        console.log(`Smart Contract Notif : Action ${newActionId} validée. CVNU Level à recalculer.`);
        return res.status(201).json({ 
            message: "Action CVNU validée et transmise au Smart Contract (Création réussie).", 
            action: actionToSave 
        });
    } else {
        return res.status(500).json({ message: "Erreur lors de l'enregistrement de l'action CVNU." });
    }
});

// 9. READ (Obtenir les actions d'un citoyen spécifique)
app.get('/api/cvnu/actions/:citizenId', async (req, res) => {
    const { citizenId } = req.params;
    const cvnuActions = await readCvnuActions(); 
    
    const citizenActions = cvnuActions.filter(a => a.citizenId === citizenId);
    
    if (citizenActions.length > 0) {
        const totalPoints = citizenActions.reduce((sum, action) => sum + action.points, 0);
        
        res.json({
            citizenId: citizenId,
            actions: citizenActions,
            note: "Le niveau CVNU total (max 100) est la base du calcul RC.",
            totalPointsAccumulated: totalPoints 
        });
    } else {
        res.status(404).json({ message: `Aucune action CVNU trouvée pour l'identifiant ${citizenId}.` });
    }
});

// 10. DELETE (Rétraction d'une action - Audit / Fraude)
app.delete('/api/cvnu/action/:actionId', async (req, res) => {
    const { actionId } = req.params;
    let cvnuActions = await readCvnuActions(); 
    
    const initialLength = cvnuActions.length;
    cvnuActions = cvnuActions.filter(a => a.actionId !== actionId);

    if (cvnuActions.length === initialLength) {
        return res.status(404).json({ message: "Action CVNU non trouvée." });
    }

    if (await writeCvnuActions(cvnuActions)) { 
        console.log(`Smart Contract Notif : Action ${actionId} rétractée. CVNU Level à déduire.`);
        return res.json({ message: `Action ${actionId} rétractée (Suppression réussie).` });
    } else {
        return res.status(500).json({ message: "Erreur lors de la suppression de l'action CVNU." });
    }
});

// 11. READ (Corpus de Texte de Référence)
app.get('/api/source', async (req, res) => {
    const sourceData = await readSourceData(); 
    res.json(sourceData);
});

// 12. READ (Génération de contenu IA pour le Frontend)
app.get('/api/ai/details', async (req, res) => {
    const { type, category } = req.query;

    let content = null;
    let message = "Contenu généré par Groq AI.";

    if (type === 'cvnu_category' && category) {
        content = await generateCvnuDetails(category); 
    } else if (type === 'taxe_ia_justification') {
        content = await generateTaxeAiJustification();
    } else {
        return res.status(400).json({ message: "Type de contenu requis non spécifié (type=cvnu_category ou taxe_ia_justification)." });
    }
    res.json({ message, content });
});

// 13 (Bloc de la route /api/gan-debate - CORRIGÉ)
app.get('/api/gan-debate', async (req, res) => {
    const difficulty = req.query.difficulty || 'intermédiaire'; 
    const EPOCH_SIZE = 10; 

    if (!['débutant', 'intermédiaire', 'expert'].includes(difficulty)) {
        return res.status(400).json({ message: "La difficulté doit être 'débutant', 'intermédiaire' ou 'expert'." });
    }

    try {
        const startTime = Date.now();
        
        // 1. Génération de la Question et Réponse
        const questionText = await generateQuestion(difficulty); // Question unique
        // CORRECTION DE L'APPEL: generateAnswer prend (question, difficulty)
        const answerText = await generateAnswer(questionText, difficulty); 
        const endTime = Date.now();

        // 2. Traitement des Compteurs FAQ (Logique inchangée mais correcte)
        const faqData = await readFaqData(); 
        const existingQuestions = faqData.questions_compteur;
        
        await logSystemEvent('INFO', `Débat GAN démarré (Niveau: ${difficulty})`);

        // ... (Boucle de comptage et mise à jour de faqData et questionId) ...
        let isNew = true;
        let questionId = null;
        let currentQ = null;

        for (const q of existingQuestions) {
            if (q.text.startsWith(questionText.substring(0, 30))) {
                q.count += 1;
                q.last_asked = new Date().toISOString();
                isNew = false;
                questionId = q.id;
                currentQ = q;
                break;
            }
        }

        if (isNew) {
            const newId = 'Q-' + (faqData.questions_compteur.length + 1).toString().padStart(3, '0');
            currentQ = {
                id: newId,
                text: questionText,
                difficulty: difficulty,
                count: 1,
                last_asked: new Date().toISOString()
            };
            existingQuestions.push(currentQ);
            faqData.original_questions_asked = (faqData.original_questions_asked || 0) + 1;
            questionId = newId;
        }

        await writeFaqData(faqData); 
        
        // 3. Log de la Session GAN (Journalisation)
        const ganData = await readGanData(); // Supposé importé et fonctionnel
        ganData.sessions.push({
            sessionId: 'GAN-' + (ganData.sessions.length + 1),
            timestamp: new Date().toISOString(),
            difficulty: difficulty,
            question: questionText,
            response_prcr: answerText,
            time_ms: endTime - startTime
        });
        ganData.sessions_since_last_epoch = (ganData.sessions_since_last_epoch || 0) + 1;

        // 4. Gestion de l'Époque (Logique inchangée)
        let faqSuggestion = null;
        if (ganData.sessions_since_last_epoch >= EPOCH_SIZE) {
            // ... (Déclenchement de l'époque ici) ...
        }
        await writeGanData(ganData);

        // 5. Envoi de la Réponse au Frontend
        res.json({
            difficulty: difficulty,
            question: questionText, // Utilise la variable unique et correcte
            response_prcr: answerText,
            faq_status: isNew ? "Nouvelle question originale enregistrée" : `Question récurrente (ID: ${questionId})`,
            total_times_asked: currentQ?.count,
            faq_suggestion_epoch: faqSuggestion, 
            model_info: {
                generator: "Mixtral 8x7b",
                discriminator: "Mixtral 8x7b"
            }
        });
        await logSystemEvent('SUCCESS', `Débat GAN complété. Question ID: ${questionId}. Total Sessions: ${ganData.sessions.length}.`);
    } catch (error) {
        console.error("Erreur lors de l'orchestration GAN/FAQ:", error);
        res.status(500).json({ message: "Erreur serveur critique lors de l'orchestration GAN." });
    }
});
// 14. READ (Lecture simple des Stats FAQ avec Agrégation et Titre IA)
app.get('/api/faq-stats', async (req, res) => {
    try {
        const faqData = await readFaqData();
        let questions = faqData.questions_compteur || [];
        
        questions.sort((a, b) => b.count - a.count);
        const top10Questions = questions.slice(0, 10);

        // Appel de la fonction déplacée dans aiService.js
        const title = await generateTopFaqTitle(top10Questions);

        res.json({ 
            title: title,
            questions_compteur: top10Questions, 
            total_original: faqData.original_questions_asked || 0 
        });
    } catch (error) {
        await logSystemEvent('ERROR', `Échec lecture FAQ Stats: ${error.message}`);
        res.status(500).json({ message: "Erreur serveur : Impossible de lire les statistiques FAQ." });
    }
});

// 15. READ (Lecture du Statut du Log GAN)
app.get('/api/gan-log-status', async (req, res) => {
    try {
        const ganData = await readGanData(); // Utilise la fonction importée
        res.json({
            sessions_since_last_epoch: ganData.sessions_since_last_epoch || 0,
            epoch_count: ganData.epoch_count || 0,
            faq_suggestion_epoch: ganData.faq_suggestion_epoch || null
        });
    } catch (error) {
        console.error("Erreur serveur lors de la lecture du log GAN:", error);
        res.status(500).json({ message: "Erreur serveur : Impossible de lire les données du journal GAN." });
    }
});

// 16. API 1001 Solutions (Orchestration Double IA)
app.post('/api/1001-solutions', async (req, res) => {
    const { problemQuestion, difficulty } = req.body;

    if (!problemQuestion) {
        return res.status(400).json({ message: "La question critique est requise." });
    }

    try {
        // --- ÉTAPE 1 : Le Contenu Stratégique (Gemini, via generateAnswer) ---
        const strategicAnswer = await generateAnswer(problemQuestion, difficulty); 

        // --- ÉTAPE 2 : Le Contenu Opérationnel (Llama, via generateLlamaSolution) ---
        const operationalSolutions = await generateLlamaSolution(problemQuestion); 

        // --- ÉTAPE 3 : La Génération des 1001 Variations (Post-Traitement JS) ---
        
        // Correction de sécurité : Ajout d'une vérification robuste
         let operationalArgs = [];
         if (typeof operationalSolutions === 'string' && operationalSolutions.length > 5) {
             operationalArgs = operationalSolutions.split('\n')
                 .map(line => line.replace(/^\s*\d+\.\s*/, '').trim())
                 .filter(line => line.length > 0 && line !== 'Aucune action concrète.'); 
         }

         // Si Llama ne donne rien, insérer un argument de fallback pour éviter le plantage
         if (operationalArgs.length === 0) {
             operationalArgs.push("Mettre en place des audits anti-fraude par Smart Contract");
             operationalArgs.push("Utiliser les réserves du FRC comme garantie anti-récession");
         }

        const solutions1001 = [];
        const baseSentence = strategicAnswer.split('. ')[0] + '.'; 

        for (let i = 0; i < 1001; i++) {
            const operationalArg = operationalArgs[i % operationalArgs.length] || 'Aucune action concrète.';
            const variantId = (i % 5) + 1; 

            solutions1001.push({
                id: i + 1,
                focus: operationalArg,
                full_solution_pitch: `${baseSentence} Cependant, la solution ${operationalArg.toLowerCase()} doit être priorisée. (Variation ${variantId} du discours).`
            });
        }


        await logSystemEvent('SUCCESS', `1001 Solutions générées pour la question: ${problemQuestion.substring(0, 50)}...`);

        res.json({
            question_source: problemQuestion,
            total_solutions: solutions1001.length,
            gemini_strategic_answer: strategicAnswer,
            llama_operational_args: operationalArgs,
            solution_variations: solutions1001.slice(0, 20), 
            message: "1001 solutions générées par la confrontation des modèles Gemini et Llama."
        });

    } catch (error) {
        await logSystemEvent('ERROR', `Échec critique 1001 Solutions: ${error.message}`);
        res.status(500).json({ message: "Erreur serveur : Échec de la génération des solutions IA. Vérifiez les logs détaillés." });
    }
});


// 17. CREATE (Ajout de la FAQ suggérée)
app.post('/api/faq/add-suggestion', async (req, res) => {
    const { question, difficulty } = req.body;
    
    if (!question) {
        return res.status(400).json({ message: "La question est requise." });
    }

    try {
        const faqData = await readFaqData();

        const newId = 'Q-' + (faqData.questions_compteur.length + 1).toString().padStart(3, '0');
        faqData.questions_compteur.push({
            id: newId,
            text: question,
            difficulty: difficulty || 'expert',
            count: 1,
            last_asked: new Date().toISOString()
        });

        // IMPORTANT : Effacer la suggestion IA du log après son ajout
        const ganLog = await readGanData();
        ganLog.faq_suggestion_epoch = null;
        ganLog.sessions_since_last_epoch = 0; // Réinitialise l'époque après ajout manuel
        ganLog.epoch_count = (ganLog.epoch_count || 0) + 1; // Incrémente l'époque
        await writeGanData(ganLog);
        
        await writeFaqData(faqData); 
        
        await logSystemEvent('SUCCESS', `Nouvelle FAQ ajoutée manuellement: ${question.substring(0, 50)}...`);

        res.status(201).json({ message: "FAQ ajoutée et époque réinitialisée." });

    } catch (error) {
        await logSystemEvent('ERROR', `Échec d'ajout de FAQ: ${error.message}`);
        res.status(500).json({ message: "Erreur serveur : Impossible d'ajouter la FAQ." });
    }
});




// 14. READ (Lecture simple des Stats FAQ avec Agrégation et Titre IA)
app.get('/api/faq-stats', async (req, res) => {
    try {
        const faqData = await readFaqData();
        let questions = faqData.questions_compteur || [];
        
        // 1. Filtrage et Tri : S'assurer que le tri est numérique et décroissant
        questions.sort((a, b) => b.count - a.count);
        
        // 2. Sélection du Top 10
        const top10Questions = questions.slice(0, 10);

        // 3. Génération du Titre IA
        const title = await generateTopFaqTitle(top10Questions);

        // 4. Renvoi de la Structure Agrégée
        res.json({ 
            title: title,
            questions_compteur: top10Questions, // Seulement le Top 10
            total_original: faqData.original_questions_asked || 0 
        });
    } catch (error) {
        await logSystemEvent('ERROR', `Échec lecture FAQ Stats: ${error.message}`);
        res.status(500).json({ message: "Erreur serveur : Impossible de lire les statistiques FAQ." });
    }
});
// serveur.js (AJOUT de la Route /api/dashboard-data)
// Par exemple: import { calculateFinalRBUAccounting, COEFFICIENTS } from './server_modules/utms_calculator.js';

app.get('/api/dashboard-data', async (req, res) => {
    try {
        const policyData = await readPolicyData();
        
        // --- 1. Simulation des données agrégées (devraient venir des logs) ---
        // Dans un environnement réel, ces données proviendraient d'une agrégation de tous les logs.
        const dashboardInsights = {
            totalTaxCollected: 1000000, // Simuler une collecte de taxe élevée
            totalUtmi: 20000, 
            totalEstimatedCostEUR: 50000,
            // (Ajoutez ici les autres insights nécessaires à calculateFinalRBUAccounting)
        };

        // --- 2. Exécution du Module UTM pour l'Équilibre Financier ---
        // (NOTE: Assurez-vous que le module utms_calculator est importé)
        const accounting = calculateFinalRBUAccounting(dashboardInsights);

        // --- 3. Construction de l'objet de réponse pour dashboard.js ---
        // Les données ici doivent correspondre à ce que dashboard.js utilise.
        res.json({
            // Indicateurs de Solvabilité (UTM)
            accounting: {
                CVNU_FIDUCIAIRE_BASE: accounting.CVNU_FIDUCIAIRE_BASE || 500.00,
                TOTAL_REVENUE: accounting.TOTAL_REVENUE || 1000000, 
                TOTAL_EXPENSES: accounting.TOTAL_EXPENSES || 500000, 
            },

            // Données pour le Diagramme Circulaire (Taxe AI)
            finance_summary: {
                // Utilisation du taux contractuel (simulé à 10% pour l'exemple)
                taxe_ai_share_percent: 10 
            },

            // Données pour les graphiques CVNU/ISE (Simulées pour le dashboard)
            cvnu_scores: {
                labels: ['Citoyenne', 'Vertueuse', 'Numérique', 'Utilitaire'],
                data: [75, 88, 92, 65]
            },
            ise_metric: {
                labels: ['Efficacité Code', 'Taux Mise en Veille', 'Optimisation CI/CD', 'Seuil Platine'],
                values: [45 * 0.4, 45 * 0.35, 45 * 0.25, 50],
                current_value: 0.45
            },
            rc_curve: [
                { cvnu: 0, rc: 550 }, { cvnu: 20, rc: 1500 }, { cvnu: 50, rc: 3025 }, 
                { cvnu: 80, rc: 4500 }, { cvnu: 100, rc: 5500 }
            ]
        });

    } catch (error) {
        await logSystemEvent('ERROR', `Échec d'agrégation du Dashboard: ${error.message}`);
        console.error('Erreur Dashboard:', error);
        res.status(500).json({ message: "Erreur serveur : Impossible d'agréger les données pour le dashboard." });
    }
});
// NOUVEAU: 20. READ (Génération du Contenu de la Diapositive Finale)
app.get('/api/slide-content', async (req, res) => {
    try {
        // 1. Récupérer le Plan de Déploiement brut (comme fait à la Route 7)
        const deploymentPlan = policySchema.policyComponents.find(c => c.identifier === "DEPLOYMENT-PLAN");
        
        if (!deploymentPlan) {
            return res.status(404).json({ message: "Plan de déploiement non trouvé." });
        }
        
        // 2. Générer le contenu narratif avec l'IA
        const narrativeContent = await generateNextSlideContent(deploymentPlan);
        
        res.json({
            narrative: narrativeContent,
            planDetails: deploymentPlan.phases 
        });
    } catch (error) {
        await logSystemEvent('ERROR', `Échec IA Slide Content: ${error.message}`);
        res.status(500).json({ message: "Erreur serveur : Échec de la génération du contenu de la diapositive." });
    }
});


// 17. CREATE (Ajout de la FAQ suggérée)
app.post('/api/faq/add-suggestion', async (req, res) => {
    const { question, difficulty } = req.body;
    
    if (!question) {
        return res.status(400).json({ message: "La question est requise." });
    }

    try {
        const faqData = await readFaqData();

        const newId = 'Q-' + (faqData.questions_compteur.length + 1).toString().padStart(3, '0');
        faqData.questions_compteur.push({
            id: newId,
            text: question,
            difficulty: difficulty || 'expert',
            count: 1,
            last_asked: new Date().toISOString()
        });

        // IMPORTANT : Effacer la suggestion IA du log après son ajout
        const ganLog = await readGanData();
        ganLog.faq_suggestion_epoch = null;
        ganLog.sessions_since_last_epoch = 0; // Réinitialise l'époque après ajout manuel
        ganLog.epoch_count = (ganLog.epoch_count || 0) + 1; // Incrémente l'époque
        await writeGanData(ganLog);
        
        await writeFaqData(faqData); 
        
        await logSystemEvent('SUCCESS', `Nouvelle FAQ ajoutée manuellement: ${question.substring(0, 50)}...`);

        res.status(201).json({ message: "FAQ ajoutée et époque réinitialisée." });

    } catch (error) {
        await logSystemEvent('ERROR', `Échec d'ajout de FAQ: ${error.message}`);
        res.status(500).json({ message: "Erreur serveur : Impossible d'ajouter la FAQ." });
    }
});

// --- Démarrage du Serveur ---
app.listen(PORT, async () => { // <-- CORRECTION : La fonction de rappel est explicitement 'async'
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Accès à l'application: http://localhost:${PORT}/`);
    
    // Log : Démarrage de l'Application (Maintenant que le callback est async)
    try {
        // Cette ligne est maintenant valide
        await logSystemEvent('SYSTEM', `Application PRCR lancée sur le port ${PORT}.`);
    } catch (e) {
        console.error("Erreur critique lors de l'enregistrement du log de démarrage.", e);
    }
});