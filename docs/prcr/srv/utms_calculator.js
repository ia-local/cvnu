// server_modules/utms_calculator.js (Bloc COEFFICIENTS mis à jour)

// NOTE: Les autres coefficients RBU, temps, et coûts de tokens restent en place.
// server_modules/utms_calculator.js (Version Finale pour la Taxe AI)

// NOTE: Les fonctions utilitaires (getCycleDayValue, convertCurrency, etc.) sont omises pour la concision, 
// mais doivent exister dans le fichier final.

const MODEL_QUALITY_SCORES = { "deepseek-r1-distill-llama-70b": { quality_multiplier: 1.2 }, "default": { quality_multiplier: 1.0 } };
const RBU_CYCLE_DAYS = 28;
const MIN_RBU_ALLOCATION_EUR = 500.00;
const BASE_VALUE_PER_CVNU_POINT_UTMI = 100.00; 

const RBU_ACCOUNTING_COEFFICIENTS = {
    DISTRIBUTION_COST_PER_USER_UTMI: 0.85, 
    TARGET_NET_PROFIT_MULTIPLIER: 0.10, 
    RBU_DEBT_FACTOR_PER_DAY: 18.00 
};



// --- COEFFICIENTS MAJEURS DE VALORISATION ---
const COEFFICIENTS = {
    // ... (Coefficients existants) ...
    CVNU: { CVNU_VALUE_MULTIPLIER: 0.2, LEVEL_BONUS_FACTOR: 0.05 },
    
    // 🛑 COÉFFICIENTS CLÉS DE LA TAXE AI ET DE LA REDISTRIBUTION 🛑
    TAX_AI_SPECIFIC: { 
        // Taux global de TVA (20% comme dans tvaCollector.sol [cite: 36, 37])
        TVA_BASE_RATE: 0.20, 
        
        // Taux d'affectation de la TVA au Fonds CVNU (10% de la TVA totale [cite: 30])
        TAX_AFFECTATION_RATE_ON_TVA: 0.10, 
        
        // Valeur de l'argent de la TVA collectée pour le calcul de l'affectation
        UTMI_PER_TAX_AMOUNT_PROCESSED: 0.1, 

        COMPLIANCE_RISK_REDUCTION_UTMI: 15, 
        OPTIMIZATION_OPPORTUNITY_UTMI: 20, 
        
        // Définition des taxes spécifiques (à l'usage de l'Agent IA pour l'analyse fiscale)
        TAXES_DEFINITIONS: [
            {
                "id": "tax_tfa",
                "name": "Taxe sur les Transactions Financières (TFA)",
                "rate": 0.2, // 20%
                "applicable_to": "financial_flows"
            },
            {
                "id": "tax_production",
                "name": "Taxe sur les Facteurs de Production",
                "rate": 0.05, // 5%
                "applicable_to": "company_data"
            },
            {
                "id": "tax_vat",
                "name": "Taxe sur la Valeur Ajoutée",
                "rate": 0.2, // 20%
                "applicable_to": "transactions"
            },
            {
                "id": "tax_campaign",
                "name": "Taxe sur les Excédents de Comptes de Campagne",
                "rate": 0.5, // 50%
                "applicable_to": "campaign_finance"
            }
        ]
    },
    // ... (Autres coefficients et taux d'échange) ...
};


// Fonctions utilitaires simulées (Nécessaires pour le code)
function getCycleDayValue() { return 1; }
function convertCurrency(amount, fromCurrency, toCurrency) { return amount / COEFFICIENTS.EXCHANGE_RATES[fromCurrency] * COEFFICIENTS.EXCHANGE_RATES[toCurrency]; }


// --- Fonction de Calcul Principale UTMi ---

function calculateUtmi(interaction, context = {}, processingInfo = {}, modelQualityScores = MODEL_QUALITY_SCORES) {
    let utmi = 0;
    let estimatedCostUSD = 0; 
    
    const type = interaction.type;
    const data = interaction.data || {};
    const { userCvnuValue, economicContext = {}, agentLevel } = context; 

    // ... (Calculs initiaux omis pour la concision) ...
    // Le switch case gérant les types de log (PROMPT, AI_RESPONSE, etc.) est ici.
    // Pour cet exemple, nous nous concentrons sur la phase de post-calcul.

    // 🛑 PHASE DE POST-CALCUL ET AJUSTEMENT FISCAL 🛑
    
    // 1. APPLICATION DU MULTIPLICATEUR CVNU
    if (typeof userCvnuValue === 'number' && userCvnuValue > 0) {
        utmi *= (1 + userCvnuValue * COEFFICIENTS.CVNU.CVNU_VALUE_MULTIPLIER);
    }
    
    // 2. VALORISATION SPÉCIFIQUE DE LA TAXE AI
    if (type === 'FISCAL_ECONOMIC_TRANSACTION') { // Supposons un type de log pour les transactions
        const taxProcessed = data.taxAmountProcessed || 0;
        
        // La Taxe AI ajoute de la valeur monétisable à l'action CVNU (via le T-C Level)
        utmi += taxProcessed * COEFFICIENTS.TAX_AI_SPECIFIC.UTMI_PER_TAX_AMOUNT_PROCESSED;
        
        // Ex : Application du bonus pour la conformité (réduction des risques fiscaux)
        if (data.complianceRiskReduced) {
            utmi += COEFFICIENTS.TAX_AI_SPECIFIC.COMPLIANCE_RISK_REDUCTION_UTMI;
        }
    }
    
    // 3. FACTEUR DE REDISTRIBUTION (Simule l'affectation de la TVA)
    if (economicContext.tvaRevenueCollected) {
        const collectedRevenue = economicContext.tvaRevenueCollected;
        // Seule la part affectée (Taxe AI) est utilisée pour ajuster la valeur globale
        const affectedTax = collectedRevenue * COEFFICIENTS.TAX_AI_SPECIFIC.TAX_AFFECTATION_RATE; 
        
        // L'UTMi est valorisé plus haut si le fonds de redistribution est bien alimenté
        utmi *= (1 + affectedTax * COEFFICIENTS.ECONOMIC_IMPACT.REVENUE_GENERATION_FACTOR);
    }
    
    // ... (Application des autres multiplicateurs temporels et de level) ...

    const estimatedCostEUR = convertCurrency(estimatedCostUSD, 'USD', 'EUR');

    return { 
        utmi: parseFloat(utmi.toFixed(2)), 
        estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(6)),
        estimatedCostEUR: parseFloat(estimatedCostEUR.toFixed(6))
    };
}


// --- Fonctions de Tableau de Bord (Pour l'Équilibre) ---

/**
 * Calcule la comptabilité finale du RBU et l'équilibre des prix CVNU.
 * Sert de preuve de la redistribution de la Taxe AI.
 */
function calculateFinalRBUAccounting(dashboardInsights, allLogs = []) {
    // NOTE: Logique de comptabilité omise pour la concision (utilise les COEFFICIENTS pour l'ajustement)
    // Elle déduirait les coûts et prouverait la part redistribuée.
    const totalTaxCollected = dashboardInsights.totalTaxCollected || 0;
    
    const affectedRevenue = totalTaxCollected * COEFFICIENTS.TAX_AI_SPECIFIC.TAX_AFFECTATION_RATE;
    const finalRedistributionValue = affectedRevenue * (1 - COEFFICIENTS.TAX_AI_SPECIFIC.TAX_VAT_FACTOR); 
    
    return {
        REVENUE_AFFECTED_BY_AI_TAX: parseFloat(affectedRevenue.toFixed(2)),
        NET_REDISTRIBUTION_VALUE: parseFloat(finalRedistributionValue.toFixed(2)),
        // ... (Autres résultats de comptabilité)
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