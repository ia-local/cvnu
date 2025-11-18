// server_modules/utms_calculator.js (Version Complète avec Logique RBU/CVNU/Temps)

// Importation des scores de qualité des modèles (Simulé)
const MODEL_QUALITY_SCORES = {
    "deepseek-r1-distill-llama-70b": { quality_multiplier: 1.2 },
    "default": { quality_multiplier: 1.0 }
};

// --- GESTION DU TEMPS ET DU RBU ---
const RBU_CYCLE_DAYS = 28;
const MIN_RBU_ALLOCATION_EUR = 500.00;
const BASE_VALUE_PER_CVNU_POINT_UTMI = 100.00; 

const RBU_ACCOUNTING_COEFFICIENTS = {
    // Coût de distribution fixe par bénéficiaire (simule les frais de smart contract)
    DISTRIBUTION_COST_PER_USER_UTMI: 0.85, 
    // Marge de bénéfice net minimale visée par le système
    TARGET_NET_PROFIT_MULTIPLIER: 0.10, // 10%
    // Valeur monétisable de la dette/passif RBU par cycle
    RBU_DEBT_FACTOR_PER_DAY: 18.00 // Hypothèse: 18 EUR/UTMi de passif par jour
};

function getCycleDayValue(startDate = new Date(2025, 0, 1)) {
    const today = new Date();
    const start = startDate.getTime();
    const diffTime = Math.abs(today.getTime() - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return (diffDays % RBU_CYCLE_DAYS) + 1;
}

// --- Coefficients de Valorisation (Complet) ---
const COEFFICIENTS = {
    TIME_PER_SECOND_UTMI: 0.1, PROMPT: { BASE_UTMI_PER_WORD: 0.5, COMPLEXITY_MULTIPLIER: 1.2, IMPACT_MULTIPLIER: 1.5, UNIQUE_CONCEPT_BONUS: 5, FISCAL_ECONOMIC_TOPIC_BONUS: 3, METIER_RELATED_PROMPT_BONUS: 2, },
    AI_RESPONSE: { BASE_UTMI_PER_TOKEN: 0.1, RELEVANCE_MULTIPLIER: 1.3, COHERENCE_MULTIPLIER: 1.1, COMPLETENESS_MULTIPLIER: 1.2, PROBLEM_SOLVED_MICRO_BONUS: 0.5, FISCAL_ECONOMIC_INSIGHT_BONUS: 7, METIER_SPECIFIC_SOLUTION_BONUS: 5, MODEL_QUALITY_MULTIPLIER_DEFAULT: 1.0, },
    CODE_GENERATION: { BASE_UTMI_PER_LINE: 0.8, COMPLEXITY_MULTIPLIER: 1.5, REUSABILITY_BONUS: 10, TEST_COVERAGE_BONUS: 7, SECURITY_FIX_BONUS: 15, PERFORMANCE_IMPROVEMENT_BONUS: 12, },
    DOCUMENT_GENERATION: { BASE_UTMI_PER_PAGE: 1.5, DETAIL_LEVEL_MULTIPLIER: 1.1, ACCURACY_BONUS: 8, LEGAL_COMPLIANCE_BONUS: 12, CUSTOMIZATION_BONUS: 6, },
    MEDIA_GENERATION: { BASE_UTMI_PER_ITEM: 3, CREATIVITY_MULTIPLIER: 1.3, USAGE_BONUS_PER_VIEW: 0.05, BRAND_ALIGNMENT_BONUS: 4, },
    USER_INTERACTION: { FEEDBACK_SUBMISSION_UTMI: 2, CORRECTION_UTMI: 3, VALIDATION_UTMI: 1.5, SHARING_UTMI: 2.5, TRAINING_DATA_CONTRIBUTION_UTMI: 4, SESSION_START_UTMI: 1, SESSION_DURATION_UTMI_PER_MIN: 0.1, },
    CVNU: { CVNU_VALUE_MULTIPLIER: 0.2, LEVEL_BONUS_FACTOR: 0.05 },
    ECONOMIC_IMPACT: { REVENUE_GENERATION_FACTOR: 0.0001, COST_SAVING_FACTOR: 0.00008, EFFICIENCY_GAIN_FACTOR: 0.00015, BUDGET_SURPLUS_BONUS_PER_MILLION: 0.05, },
    TAX_AI_SPECIFIC: { TAX_VAT: 1, TAX_TFA: 1, TAX_TICPE: 1, TAX_PRODUCTION: 1, TAX_CAMPAGN: 1, TAX_ADVICE_ACCURACY_BONUS: 10, COMPLIANCE_RISK_REDUCTION_UTMI: 15, OPTIMIZATION_OPPORTUNITY_UTMI: 20, UTMI_PER_TAX_AMOUNT_PROCESSED: 0.1 },
    COGNITIVE_AXES: { CONCENTRATION: 0.1, ADAPTATION: 0.15, IMAGINATION: 0.2, STRATEGY: 0.25, ANALYSIS: 0.18, SYNTHESIS: 0.22, COMMUNICATION: 0.12 },
    LOG_TYPES: { PROMPT: 'prompt', AI_RESPONSE: 'ai_response', FINANCIAL_FLOW: 'financial_flow', CVNU_ANALYSIS: 'cvnu_analysis', CODE_GENERATION: 'code_generation', DOCUMENT_GENERATION: 'document_generation', MEDIA_GENERATION: 'media_generation', USER_INTERACTION: 'user_interaction', SYSTEM_PROCESS: 'system_process', SESSION_START: 'session_start', SESSION_END: 'session_end', },
    THEMATIC_MULTIPLIERS: { MARKETING: 1.2, AFFILIATION: 1.1, FISCAL_ECONOMIC: 1.5, OTHER: 1.0 },
    THEMATIC_KEYWORDS : { /* ... */ },
    COMMON_ACTIVITIES: { /* ... */ },
    ACTIVITY_SCORE_THRESHOLDS: { LOW: 0.1, MEDIUM: 0.5, HIGH: 1.0 },
    ACTIVITY_SCORE_BONUS: { LOW: 0.5, MEDIUM: 2, HIGH: 5 },
    TOKEN_COSTS_PER_MODEL: { "llama3-8b-8192": { input: 0.0000005, output: 0.0000015 }, "deepseek-r1-distill-llama-70b": { input: 0.0000001, output: 0.0000001 }, "default": { input: 0.0000001, output: 0.0000001 } },
    EXCHANGE_RATES: { USD: 1.07, GBP: 0.84, EUR: 1.0 }
};

// --- Fonctions utilitaires (Corps omis pour la concision) ---
function getSortedUtmiByValue(obj) { /* ... */ return Object.entries(obj).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).map(([key, value]) => ({ name: key, utmi: parseFloat(value.toFixed(2)) })); }
function getSortedActivitiesByCount(obj) { /* ... */ return Object.entries(obj).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).map(([key, value]) => ({ name: key, count: value })); }
function convertCurrency(amount, fromCurrency, toCurrency) { /* ... */ return amount / COEFFICIENTS.EXCHANGE_RATES[fromCurrency] * COEFFICIENTS.EXCHANGE_RATES[toCurrency]; }
function detectCognitiveAxis(text) { /* ... */ return {}; }
function analyzeTextForThemes(text) { /* ... */ return {}; }
function calculateActivityScore(text) { /* ... */ return { score: 0, detectedActivities: {}, bonus: 0 }; }


// --- Fonctions de Calcul Principales ---

/**
 * Calcule les Unités Temporelles Monétisables (UTMi) et les coûts estimés pour une interaction donnée.
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

        default:
            // Logique complète omise pour la concision
            if (!type.includes('FINANCIAL') && !type.includes('CVNU')) {
                // console.warn(`Type d'interaction non géré: ${type}`); // Désactivé pour la concision
            }
            return { utmi: 0, estimatedCostUSD: 0, estimatedCostEUR: 0 };
    }

    // 🛑 1. ÉQUILIBRE DU PRIX RBU & CVNU (Multiplicateur de valeur) 🛑
    if (typeof userCvnuValue === 'number' && userCvnuValue > 0) {
        utmi *= (1 + userCvnuValue * COEFFICIENTS.CVNU.CVNU_VALUE_MULTIPLIER);
        
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
    utmi *= (1 + (cycleDay / RBU_CYCLE_DAYS) * 0.10); 

    // ... (Application des multiplicateurs économiques et thématiques) ...

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
    let totalEstimatedCostEUR = 0; 
    let totalTaxCollected = 0; 
    
    const utmiByCognitiveAxis = {};
    const utmiByType = {};
    const utmiByModel = {}; 
    
    // Initialisation et agrégation omises pour la concision

    logs.forEach(log => {
        const utmiForLog = log.utmi || 0;
        const estimatedCostUSDForLog = log.estimatedCostUSD || 0;
        
        const estimatedCostEURForLog = log.estimatedCostEUR || convertCurrency(estimatedCostUSDForLog, 'USD', 'EUR'); 
        
        totalUtmi += utmiForLog;
        totalEstimatedCostUSD += estimatedCostUSDForLog;
        totalEstimatedCostEUR += estimatedCostEURForLog; 

        if (log.interaction?.type === COEFFICIENTS.LOG_TYPES.FINANCIAL_FLOW && log.interaction.data?.taxAmount) {
            totalTaxCollected += log.interaction.data.taxAmount;
        }
        // ... (Reste de l'agrégation) ...
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
        totalEstimatedCostEUR: parseFloat(totalEstimatedCostEUR.toFixed(6)),
        totalInteractionCount: totalInteractionCount,
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(2)),
        monthlyRBUAllocation: parseFloat(monthlyRBUAllocation.toFixed(2)),
        // ... (Autres résultats d'insights) ...
        utmiByCognitiveAxis: getSortedUtmiByValue(utmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(utmiByType),
        utmiByModel: getSortedUtmiByValue(utmiByModel),
    };
}
/**
 * 🛑 NOUVELLE FONCTION : Calcule la comptabilité finale du RBU et l'équilibre des prix CVNU.
 * Ce service est appelé après l'agrégation du Dashboard.
 * @param {object} dashboardInsights - Le résultat de calculateDashboardInsights.
 * @param {Array<object>} allLogs - L'ensemble des logs pour analyser le poids temporel.
 * @returns {object} Un objet de comptabilité détaillé.
 */
function calculateFinalRBUAccounting(dashboardInsights, allLogs = []) {
    
    // Récupération des totaux
    const totalUtmiCollected = dashboardInsights.totalUtmi || 0;
    const totalTaxCollected = dashboardInsights.totalTaxCollected || 0;
    const totalUsers = dashboardInsights.totalInteractionCount || 1; 
    const totalCost = dashboardInsights.totalEstimatedCostEUR || 0;
    const monthlyAllocation = dashboardInsights.monthlyRBUAllocation || MIN_RBU_ALLOCATION_EUR;

    // --- 1. Calcul du Passif RBU (Dépenses Futures) ---
    const RBU_PASSIVE_DEBT = totalUsers * monthlyAllocation * (RBU_CYCLE_DAYS / 30.5);
    
    // --- 2. Calcul des Dépenses Directes (Coût de l'IA + Frais de Distribution) ---
    const distributionCost = totalUsers * RBU_ACCOUNTING_COEFFICIENTS.DISTRIBUTION_COST_PER_USER_UTMI;
    const totalExpenses = totalCost + distributionCost;
    
    // --- 3. Calcul de la Recette Totale (Taxe + Valeur UTMi Brute) ---
    // La Taxe AI est la source de la recette fiduciaire.
    const totalRevenue = totalTaxCollected + totalUtmiCollected;
    
    // --- 4. Détermination du Bénéfice Net du Projet (Économie Circulaire) ---
    const netBenefit = totalRevenue - totalExpenses;
    
    // --- 5. Valorisation Temporelle du CVNU (Facteur de Confiance) ---
    // Simuler le poids temporel des logs (date de création/modification/edge)
    const averageLogAgeDays = allLogs.length > 0 
        ? allLogs.reduce((sum, log) => sum + (Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24), 0) / allLogs.length
        : 0;
        
    // Équilibre du Prix : Montant minimum RBU (500) ajusté par le Bénéfice Net et le Poids Temporel
    const confidenceFactor = Math.min(1.0, (netBenefit / totalRevenue) + (1 - (averageLogAgeDays / 365)));
    
    const baseRBUBalance = MIN_RBU_ALLOCATION_EUR * confidenceFactor;

    return {
        REVENUE_TAX_UTMI: parseFloat(totalTaxCollected.toFixed(2)),
        REVENUE_UTMI_BRUT: parseFloat(totalUtmiCollected.toFixed(2)),
        TOTAL_REVENUE: parseFloat(totalRevenue.toFixed(2)),
        
        TOTAL_EXPENSES: parseFloat(totalExpenses.toFixed(2)),
        DISTRIBUTION_COST: parseFloat(distributionCost.toFixed(2)),
        
        NET_BENEFIT: parseFloat(netBenefit.toFixed(2)),
        
        RBU_ALLOCATION_PER_USER: parseFloat(monthlyAllocation.toFixed(2)),
        RBU_DEBT_PASSIVE: parseFloat(RBU_PASSIVE_DEBT.toFixed(2)),
        
        // 🛑 L'ÉQUILIBRE DU PRIX CVNU (Valeur fiduciaire de base)
        CVNU_FIDUCIAIRE_BASE: parseFloat(baseRBUBalance.toFixed(2)),
        
        // Indicateurs de DevOps pour la confiance
        AVERAGE_LOG_AGE_DAYS: parseFloat(averageLogAgeDays.toFixed(2)),
        CONFIDENCE_FACTOR: parseFloat(confidenceFactor.toFixed(3))
    };
}


// Exportation des fonctions et coefficients
module.exports = {
    calculateUtmi,
    calculateDashboardInsights,
    calculateFinalRBUAccounting, // 🛑 NOUVEL EXPORT
    COEFFICIENTS,
    convertCurrency,
    detectCognitiveAxis,
    analyzeTextForThemes,
    calculateActivityScore,
    getCycleDayValue
};