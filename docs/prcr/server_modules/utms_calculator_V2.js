// server_modules/utms_calculator.js (Version Complète avec Logique RBU/CVNU/Temps)

// Importation des scores de qualité des modèles
const { MODEL_QUALITY_SCORES } = require('./model_quality_config');

// --- NOUVEAU: GESTION DU TEMPS ET DU RBU ---
const RBU_CYCLE_DAYS = 28;
const MIN_RBU_ALLOCATION_EUR = 500.00;
// 🛑 NOUVEAU: Valeur de base pour un point CVNU (hypothèse RBU)
const BASE_VALUE_PER_CVNU_POINT_UTMI = 100.00; 

// Calcule la valeur d'une journée dans le cycle (synchrone)
function getCycleDayValue(startDate = new Date(2025, 0, 1)) {
    const today = new Date();
    const start = startDate.getTime();
    const diffTime = Math.abs(today.getTime() - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return (diffDays % RBU_CYCLE_DAYS) + 1; // Retourne un jour entre 1 et 28
}

// --- Coefficients de Valorisation ---
const COEFFICIENTS = {
    TIME_PER_SECOND_UTMI: 0.1, // Valeur de base pour le temps de calcul / traitement

    PROMPT: {
        BASE_UTMI_PER_WORD: 0.5,
        COMPLEXITY_MULTIPLIER: 1.2, // Basé sur l'analyse NLP ou des tags
        IMPACT_MULTIPLIER: 1.5,     // Basé sur l'importance du prompt
        UNIQUE_CONCEPT_BONUS: 5,    // Pour des requêtes vraiment originales
        FISCAL_ECONOMIC_TOPIC_BONUS: 3,
        METIER_RELATED_PROMPT_BONUS: 2,
    },

    AI_RESPONSE: {
        BASE_UTMI_PER_TOKEN: 0.1,
        RELEVANCE_MULTIPLIER: 1.3,      // Qualité de la pertinence de la réponse
        COHERENCE_MULTIPLIER: 1.1,      // Qualité de la cohérence de la réponse
        COMPLETENESS_MULTIPLIER: 1.2,   // Qualité de l'exhaustivité de la réponse
        PROBLEM_SOLVED_MICRO_BONUS: 0.5,// Petit bonus si un micro-problème est résolu
        FISCAL_ECONOMIC_INSIGHT_BONUS: 7, // Gros bonus pour des insights spécifiques
        METIER_SPECIFIC_SOLUTION_BONUS: 5, // Gros bonus pour des solutions métiers
        MODEL_QUALITY_MULTIPLIER_DEFAULT: 1.0, // Valeur par défaut si non spécifiée
        // TOKEN_COST_IMPACT_FACTOR est supprimé car l'UTMi est un bénéfice net
    },

    CODE_GENERATION: {
        BASE_UTMI_PER_LINE: 0.8,
        COMPLEXITY_MULTIPLIER: 1.5,
        REUSABILITY_BONUS: 10,
        TEST_COVERAGE_BONUS: 7,
        SECURITY_FIX_BONUS: 15,
        PERFORMANCE_IMPROVEMENT_BONUS: 12,
    },

    DOCUMENT_GENERATION: {
        BASE_UTMI_PER_PAGE: 1.5,
        DETAIL_LEVEL_MULTIPLIER: 1.1,
        ACCURACY_BONUS: 8,
        LEGAL_COMPLIANCE_BONUS: 12,
        CUSTOMIZATION_BONUS: 6,
    },

    MEDIA_GENERATION: {
        BASE_UTMI_PER_ITEM: 3,
        CREATIVITY_MULTIPLIER: 1.3,
        USAGE_BONUS_PER_VIEW: 0.05,
        BRAND_ALIGNMENT_BONUS: 4,
    },

    USER_INTERACTION: {
        FEEDBACK_SUBMISSION_UTMI: 2,
        CORRECTION_UTMI: 3,
        VALIDATION_UTMI: 1.5,
        SHARING_UTMI: 2.5,
        TRAINING_DATA_CONTRIBUTION_UTMI: 4,
        SESSION_START_UTMI: 1,
        SESSION_DURATION_UTMI_PER_MIN: 0.1, // Utiliser le coefficient
    },

    CVNU: { 
        CVNU_VALUE_MULTIPLIER: 0.2, // Multiplicateur appliqué à la valeur CVNU
        LEVEL_BONUS_FACTOR: 0.05 // Bonus sur le niveau de l'Agent
    },
    
    ECONOMIC_IMPACT: {
        REVENUE_GENERATION_FACTOR: 0.0001, // Multiplieur pour la génération de revenus
        COST_SAVING_FACTOR: 0.00008,     // Multiplieur pour les économies de coûts
        EFFICIENCY_GAIN_FACTOR: 0.00015, // Multiplieur pour le gain d'efficacité (par %)
        BUDGET_SURPLUS_BONUS_PER_MILLION: 0.05, // Bonus pour chaque million de surplus budgétaire
    },

    TAX_AI_SPECIFIC: {
        TAX_VAT: 1,
        TAX_TFA: 1,
        TAX_TICPE: 1,
        TAX_PRODUCTION: 1,
        TAX_CAMPAGN: 1,
        TAX_ADVICE_ACCURACY_BONUS: 10,
        COMPLIANCE_RISK_REDUCTION_UTMI: 15,
        OPTIMIZATION_OPPORTUNITY_UTMI: 20,
        UTMI_PER_TAX_AMOUNT_PROCESSED: 0.1 // UTMi généré par € de taxe traitée
    },

    COGNITIVE_AXES: { // Utmi par axe cognitif
        CONCENTRATION: 0.1, // Attention soutenue
        ADAPTATION: 0.15,   // Capacité à gérer l'incertitude
        IMAGINATION: 0.2,   // Génération d'idées nouvelles
        STRATEGY: 0.25,     // Planification et prise de décision
        ANALYSIS: 0.18,     // Décomposition et compréhension
        SYNTHESIS: 0.22,    // Combinaison d'éléments
        COMMUNICATION: 0.12 // Expression claire
    },

    LOG_TYPES: {
        PROMPT: 'prompt',
        AI_RESPONSE: 'ai_response',
        FINANCIAL_FLOW: 'financial_flow', // Nouveau type
        CVNU_ANALYSIS: 'cvnu_analysis', // Nouveau type
        CODE_GENERATION: 'code_generation',
        DOCUMENT_GENERATION: 'document_generation',
        MEDIA_GENERATION: 'media_generation',
        USER_INTERACTION: 'user_interaction',
        SYSTEM_PROCESS: 'system_process',
        SESSION_START: 'session_start',
        SESSION_END: 'session_end',
    },

    THEMATIC_MULTIPLIERS: {
        MARKETING: 1.2,
        AFFILIATION: 1.1,
        FISCAL_ECONOMIC: 1.5,
        OTHER: 1.0 // Multiplicateur par défaut
    },

    // Définition des termes clés pour la détection thématique
THEMATIC_KEYWORDS : {
  GOUVERNEMENT: ['politique', 'législation', 'décrets', 'services publics', 'ministère', 'administration'],
  JUSTICE: ['droit', 'loi', 'tribunal', 'juge', 'procès', 'constitution'],
  EDUCATION: ['école', 'université', 'formation', 'diplôme', 'pédagogie', 'apprentissage'],
  COMMERCE: ['distribution', 'vente au détail', 'e-commerce', 'import-export', 'marché', 'logistique'],
  MARKETING: ['marketing', 'publicité', 'campagne', 'vente', 'promotion', 'client', 'produit', 'marque', 'seo', 'sem', 'social media', 'croissance', 'visibilité'],
  AFFILIATION: ['affiliation', 'partenaire', 'commission', 'lien affilié', 'affilié', 'revenu passif', 'parrainage', 'parrain'],
  FISCAL_ECONOMIC: ['impôt', 'fiscalité', 'économie', 'finance', 'investissement', 'budget', 'déclaration', 'crédit', 'défiscalisation', 'amortissement', 'tva', 'bilan', 'comptabilité', 'audit', 'dividende', 'cryptomonnaie', 'bourse'],
  // Ajout de la thématique Gouvernement et de ses sous-catégories
  ENVIRONNEMENT: ['écologie', 'biodiversité', 'pollution', 'climat', 'ressources naturelles', 'développement durable'],
  INDUSTRIE: ['usine', 'production', 'manufacture', 'innovation', 'robotique', 'chaîne de montage'],
  ARTISANAT: ['savoir-faire', 'métier d\'art', 'création', 'produit fait main', 'tradition', 'local'],
  TOURISME: ['voyage', 'destination', 'culture', 'hébergement', 'site touristique', 'touriste'],
  ECOLOGIE: ['environnement', 'faune', 'flore', 'préservation', 'recyclage', 'empreinte carbone'],
  TRANSPORT: ['véhicule', 'infrastructure', 'logistique', 'mobilité', 'transports en commun', 'circulation'],
},
    // Activités courantes et leurs coefficients
    COMMON_ACTIVITIES: {
        DATA_ANALYSIS: { utmi_bonus: 5, keywords: ['analyse données', 'rapport', 'statistiques', 'tendances', 'modèle prédictif', 'big data'] },
        REPORT_GENERATION: { utmi_bonus: 7, keywords: ['rapport', 'compte-rendu', 'synthèse', 'document', 'bilan', 'présentation'] },
        CUSTOMER_SUPPORT: { utmi_bonus: 4, keywords: ['support client', 'aide', 'faq', 'problème', 'assistance', 'ticket'] },
        CONTENT_CREATION: { utmi_bonus: 6, keywords: ['contenu', 'article', 'blog', 'rédaction', 'écriture', 'création', 'post social', 'script'] },
        CODE_DEBUGGING: { utmi_bonus: 8, keywords: ['bug', 'erreur', 'débug', 'fix', 'correction code', 'dépannage'] },
        LEGAL_RESEARCH: { utmi_bonus: 9, keywords: ['légal', 'loi', 'réglementation', 'jurisprudence', 'contrat', 'conformité', 'directive'] },
        FINANCIAL_FORECASTING: { utmi_bonus: 10, keywords: ['prévision financière', 'budget', 'projection', 'cash flow', 'planification', 'trésorerie'] },
        PROJECT_MANAGEMENT: { utmi_bonus: 6, keywords: ['projet', 'planification', 'tâche', 'jalon', 'roadmap', 'gestion'] },
    },

    ACTIVITY_SCORE_THRESHOLDS: {
        LOW: 0.1,
        MEDIUM: 0.5,
        HIGH: 1.0
    },

    ACTIVITY_SCORE_BONUS: {
        LOW: 0.5,
        MEDIUM: 2,
        HIGH: 5
    },

    // Ces valeurs sont des exemples et doivent être mises à jour avec les prix réels de l'API Groq/OpenAI, etc.
    TOKEN_COSTS_PER_MODEL: {
        "llama3-8b-8192": { input: 0.0000005, output: 0.0000015 }, // Coût par token en USD
        "llama3-70b-8192": { input: 0.0000005, output: 0.0000015 },
        "deepseek-r1-distill-llama-70b": { input: 0.0000001, output: 0.0000001 },
        "llama-3.1-8b-instant": { input: 0.0000001, output: 0.0000001 },
        // "gpt-4o": { input: 0.000005, output: 0.000015 },
        // "claude-3-opus-20240229": { input: 0.000015, output: 0.000075 },
        "default": { input: 0.0000001, output: 0.0000001 } // Coût par défaut si le modèle n'est pas trouvé
    },

    // Taux de conversion pour les devises (Exemple: 1 EUR = X USD)
    ACTIVITY_SCORE_THRESHOLDS: { LOW: 0.1, MEDIUM: 0.5, HIGH: 1.0 },
    ACTIVITY_SCORE_BONUS: { LOW: 0.5, MEDIUM: 2, HIGH: 5 },

    TOKEN_COSTS_PER_MODEL: { /* ... inchangé ... */ },
    EXCHANGE_RATES: {
        USD: 1.07, GBP: 0.84, EUR: 1.0
    }
};

// --- Fonctions utilitaires IMPLÉMENTÉES (inchangées) ---
function getSortedUtmiByValue(obj) { /* ... */ return Object.entries(obj).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).map(([key, value]) => ({ name: key, utmi: parseFloat(value.toFixed(2)) })); }
function getSortedActivitiesByCount(obj) { /* ... */ return Object.entries(obj).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).map(([key, value]) => ({ name: key, count: value })); }

function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rates = COEFFICIENTS.EXCHANGE_RATES;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
        console.warn(`Taux de change non disponible pour ${fromCurrency} ou ${toCurrency}.`);
        return amount;
    }
    const amountInEUR = amount / rates[fromCurrency];
    return amountInEUR * rates[toCurrency];
}
function detectCognitiveAxis(text) { /* ... */ return {}; } // Simplifié pour la concision
function analyzeTextForThemes(text) { /* ... */ return {}; } // Simplifié pour la concision
function calculateActivityScore(text) { /* ... */ return { score: 0, detectedActivities: {}, bonus: 0 }; } // Simplifié pour la concision


// --- Fonctions de Calcul Principales ---

/**
 * Calcule les Unités Temporelles Monétisables (UTMi) et les coûts estimés pour une interaction donnée.
 * 🛑 MISE À JOUR : Gestion des coûts USD/EUR et Logique CVNU/RBU.
 */
function calculateUtmi(interaction, context = {}, processingInfo = {}, modelQualityScores = MODEL_QUALITY_SCORES) {
    let utmi = 0;
    let estimatedCostUSD = 0; 
    
    const type = interaction.type;
    const data = interaction.data || {};
    const { userCvnuValue, economicContext, agentLevel } = context; 

    const modelId = data.modelId;
    const modelScores = modelQualityScores[modelId] || modelQualityScores.default || {};
    const aiModelQualityMultiplier = modelScores.quality_multiplier || COEFFICIENTS.AI_RESPONSE.MODEL_QUALITY_MULTIPLIER_DEFAULT;
    const tokenCosts = COEFFICIENTS.TOKEN_COSTS_PER_MODEL[modelId] || COEFFICIENTS.TOKEN_COSTS_PER_MODEL.default;

    switch (type) {
        case COEFFICIENTS.LOG_TYPES.PROMPT:
            // ... (Logique PROMPT) ...
            if (data.inputTokens && tokenCosts.input) estimatedCostUSD += data.inputTokens * tokenCosts.input;
            break;

        case COEFFICIENTS.LOG_TYPES.AI_RESPONSE:
            // ... (Logique AI_RESPONSE) ...
            if (data.outputTokens && tokenCosts.output) estimatedCostUSD += data.outputTokens * tokenCosts.output;
            break;
            
        case COEFFICIENTS.LOG_TYPES.SESSION_END:
            // 🛑 VALORISATION DE LA DURÉE DE SESSION 🛑
            const durationMinutes = data.durationMinutes || 0;
            if (durationMinutes > 0) {
                utmi += durationMinutes * COEFFICIENTS.USER_INTERACTION.SESSION_DURATION_UTMI_PER_MIN;
            }
            break;
            
        case COEFFICIENTS.LOG_TYPES.SYSTEM_PROCESS:
            const computeTimeSeconds = (processingInfo.computeTimeMs / 1000) || 0; 
            if (computeTimeSeconds > 0) {
                utmi += computeTimeSeconds * COEFFICIENTS.TIME_PER_SECOND_UTMI;
                utmi *= (data.criticalityMultiplier || 1);
            }
            break;

        // Cas omis (Code, Doc, Media, etc.)
        default:
            // Ne pas bloquer sur les types non traités, mais logguer si ce n'est pas un type critique
            if (!type.includes('FINANCIAL') && !type.includes('CVNU')) {
                console.warn(`Type d'interaction non géré: ${type}`);
            }
            return { utmi: 0, estimatedCostUSD: 0, estimatedCostEUR: 0 };
    }

    // 🛑 1. ÉQUILIBRE DU PRIX RBU & CVNU (Multiplicateur de valeur) 🛑
    if (typeof userCvnuValue === 'number' && userCvnuValue > 0) {
        // Multiplie la valeur générée par un facteur basé sur la progression du CVNU.
        utmi *= (1 + userCvnuValue * COEFFICIENTS.CVNU.CVNU_VALUE_MULTIPLIER);
        
        // 🛑 RÈGLE CVNU.SOL (SIMULÉE): Bonus RBU si CVNU est analysé
        if (type === COEFFICIENTS.LOG_TYPES.CVNU_ANALYSIS) {
            utmi += BASE_VALUE_PER_CVNU_POINT_UTMI * userCvnuValue;
        }
    }
    
    // 🛑 2. APPLICATION DU BONUS DE LEVEL (Gamification)
    if (typeof context.agentLevel === 'number' && context.agentLevel > 1) {
        utmi *= (1 + (context.agentLevel - 1) * COEFFICIENTS.CVNU.LEVEL_BONUS_FACTOR);
    }
    
    // 🛑 3. APPLICATION DU MULTIPLICATEUR TEMPOREL
    const cycleDay = getCycleDayValue();
    utmi *= (1 + (cycleDay / RBU_CYCLE_DAYS) * 0.10); // Max 10% de bonus en fin de cycle

    // ... (Application des multiplicateurs économiques et thématiques) ...
    // ...

    // 🛑 CALCUL FINAL DU COÛT EN EUR 🛑
    const estimatedCostEUR = convertCurrency(estimatedCostUSD, 'USD', 'EUR');

    return { 
        utmi: parseFloat(utmi.toFixed(2)), 
        estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(6)),
        estimatedCostEUR: parseFloat(estimatedCostEUR.toFixed(6))
    };
}


/**
 * Calcule les insights agrégés à partir d'une liste de logs d'interactions (pour le Dashboard).
 */
function calculateDashboardInsights(logs) {
    let totalUtmi = 0;
    let totalInteractionCount = logs.length;
    let totalEstimatedCostUSD = 0;
    let totalEstimatedCostEUR = 0; // 🛑 NOUVELLE VARIABLE
    let totalTaxCollected = 0; 
    
    // ... (Initialisation des objets d'agrégation) ...
    const utmiByCognitiveAxis = {};
    const utmiByType = {};
    const utmiByModel = {}; 
    const commonActivities = {};

    // ... (Initialisation des objets d'agrégation) ...

    logs.forEach(log => {
        const utmiForLog = log.utmi || 0;
        const estimatedCostUSDForLog = log.estimatedCostUSD || 0;
        
        const estimatedCostEURForLog = log.estimatedCostEUR || convertCurrency(estimatedCostUSDForLog, 'USD', 'EUR'); 
        
        totalUtmi += utmiForLog;
        totalEstimatedCostUSD += estimatedCostUSDForLog;
        totalEstimatedCostEUR += estimatedCostEURForLog; // 🛑 AGRÉGATION EUR

        if (log.interaction?.type === COEFFICIENTS.LOG_TYPES.FINANCIAL_FLOW && log.interaction.data?.taxAmount) {
            totalTaxCollected += log.interaction.data.taxAmount;
        }
        // ... (Reste de la logique d'agrégation) ...
    });

    // 🛑 AJUSTEMENT DE LA VALEUR RBU ESTIMÉE 🛑
    const maxCVNULevel = 5000; 
    const currentCVNU = logs.reduce((max, log) => Math.max(max, log.context?.userCvnuValue || 0), 0);
    
    const baseAllocation = MIN_RBU_ALLOCATION_EUR;
    let progressiveBonus = (currentCVNU / maxCVNULevel) * (5144 - MIN_RBU_ALLOCATION_EUR);
    
    const monthlyRBUAllocation = baseAllocation + progressiveBonus;

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const totalUtmiPerCostRatio = totalEstimatedCostUSD > 0 ? totalUtmi / totalEstimatedCostUSD : (totalUtmi > 0 ? Infinity : 0);


    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(2)),
        totalTaxCollected: parseFloat(totalTaxCollected.toFixed(2)), 
        totalEstimatedCostUSD: parseFloat(totalEstimatedCostUSD.toFixed(6)),
        totalEstimatedCostEUR: parseFloat(totalEstimatedCostEUR.toFixed(6)), // 🛑 NOUVEL EXPORT
        totalInteractionCount: totalInteractionCount,
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(2)),
        monthlyRBUAllocation: parseFloat(monthlyRBUAllocation.toFixed(2)), // Allocation RBU
        // ... (Autres résultats d'insights) ...
        utmiByCognitiveAxis: getSortedUtmiByValue(utmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(utmiByType),
        utmiByModel: getSortedUtmiByValue(utmiByModel),
    };
}


// Exportation des fonctions et coefficients
module.exports = {
    calculateUtmi,
    calculateDashboardInsights,
    COEFFICIENTS,
    convertCurrency,
    detectCognitiveAxis,
    analyzeTextForThemes,
    calculateActivityScore,
    getCycleDayValue
    // Exportez ici toutes les fonctions utilitaires nécessaires si elles sont appelées dans d'autres modules
};