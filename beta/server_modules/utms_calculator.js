// server_modules/utms_calculator.js

// Importation des scores de qualité des modèles (si non déjà importé par le serveur)
// const { MODEL_QUALITY_SCORES } = require('./model_quality_config'); // Commenté car importé par serveur.js

/**
 * Moteur de calcul des Unités Temporelles Monétisables (UTMi) et d'analyse des insights.
 * Cette version intègre :
 * - La valorisation des interactions et activités, avec un focus sur la formation et la professionnalisation.
 * - L'analyse des données historiques (logs) pour générer des rapports d'insights détaillés.
 * - La prise en compte des attributs CVNU et du contexte économique.
 * - La consolidation des logs et la détection des thématiques (marketing, affiliation, fiscale/économique).
 * - Prise en compte de la qualité des modèles d'IA.
 * - Intégration des coefficients pour la "TAXE IA" et des coûts estimés.
 */

// --- Coefficients de Valorisation (ajustables) ---
const COEFFICIENTS = {
    TIME_PER_SECOND_UTMI: 0.1,

    PROMPT: {
        BASE_UTMI_PER_WORD: 0.5,
        COMPLEXITY_MULTIPLIER: 1.2,
        IMPACT_MULTIPLIER: 1.5,
        UNIQUE_CONCEPT_BONUS: 5,
        FISCAL_ECONOMIC_TOPIC_BONUS: 3,
        METIER_RELATED_PROMPT_BONUS: 2,
        // NOUVEAU: Bonus pour les prompts liés à l'apprentissage ou la professionnalisation
        LEARNING_PROMPT_BONUS: 4,
        PROFESSIONAL_DEVELOPMENT_PROMPT_BONUS: 6,
    },

    AI_RESPONSE: {
        BASE_UTMI_PER_TOKEN: 0.02, // Ajusté pour un coût plus réaliste, correspond à mes précédentes versions
        RELEVANCE_MULTIPLIER: 1.3,
        COHERENCE_MULTIPLI: 1.1,
        COMPLETENESS_MULTIPLIER: 1.2,
        PROBLEM_SOLVED_MICRO_BONUS: 0.5,
        FISCAL_ECONOMIC_INSIGHT_BONUS: 7,
        METIER_SPECIFIC_SOLUTION_BONUS: 5,
        MODEL_QUALITY_MULTIPLIER_DEFAULT: 1.0, // Par défaut, si non spécifié dans model_quality_config
    },

    CODE_GENERATION: {
        BASE_UTMI_PER_LINE: 0.8,
        COMPLEXITY_MULTIPLIER: 1.5,
        REUSABILITY_BONUS: 10,
        TEST_COVERAGE_BONUS: 7,
        SECURITY_FIX_BONUS: 15,
        PERFORMANCE_IMPROVEMENT_BONUS: 12,
        // NOUVEAU: Bonus si le code généré est pour de l'apprentissage/démonstration
        EDUCATIONAL_CODE_BONUS: 5,
    },

    DOCUMENT_GENERATION: {
        BASE_UTMI_PER_PAGE: 1.5,
        DETAIL_LEVEL_MULTIPLIER: 1.1,
        ACCURACY_BONUS: 8,
        LEGAL_COMPLIANCE_BONUS: 12,
        CUSTOMIZATION_BONUS: 6,
        // NOUVEAU: Bonus pour documents de formation/professionnalisation
        TRAINING_MATERIAL_BONUS: 10,
        CASE_STUDY_BONUS: 8,
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
        // NOUVEAU: Interactions spécifiques à la formation
        QUIZ_COMPLETION_UTMI: 2.5, // Si l'utilisateur complète un quiz généré par IA
        PRACTICE_SESSION_UTMI: 3.0, // Participation à une session de pratique IA
        MENTORING_SESSION_UTMI: 5.0, // Si l'IA sert de mentor simulé
    },

    CVNU: { // Contexte, Valeur, Connaissance, Unicité
        CVNU_VALUE_MULTIPLIER: 0.2, // Multiplicateur appliqué à la valeur CVNU de l'utilisateur
        // NOUVEAU: Impact direct sur la valeur CVNU
        SKILL_ADDITION_IMPACT: 10, // Bonus si une nouvelle compétence est identifiée/ajoutée au CV
        EXPERIENCE_DETAIL_IMPACT: 8, // Bonus si une expérience est enrichie
    },

    ECONOMIC_IMPACT: {
        REVENUE_GENERATION_MULTIPLIER: 0.0001,
        COST_SAVING_MULTIPLIER: 0.00008,
        EFFICIENCY_GAIN_MULTIPLIER: 0.00015,
        BUDGET_SURPLUS_BONUS: 0.05,
    },

    TAX_AI_SPECIFIC: {
        TAX_ADVICE_ACCURACY_BONUS: 10,
        COMPLIANCE_RISK_REDUCTION_UTMI: 15,
        OPTIMIZATION_OPPORTUNITY_UTMI: 20,
    },

    TAXE_IA_COEFFICIENTS: {
        BASE_TAX_RATE: 0.05,
        INTERACTION_LEGAL_COMPLIANCE_BONUS: 0.02,
        INTERACTION_ETHICAL_AI_BONUS: 0.01,
        COMMERCIAL_USE_MULTIPLIER: 1.5,
        CAMPAIGN_FUNDING_IMPACT_MULTIPLIER: 0.1,
        TAX_PER_CV_VALORIZATION_UTMI: 0.01,
        TAX_PER_PROMPT_UTMI: 0.005,
        EDUCATIONAL_USE_TAX_REDUCTION: 0.03,
        NON_PROFIT_OR_PERSONAL_USE_REDUCTION: 0.02,
    },

    COSTS_PER_MILLION_TOKENS_USD: {
        gemma2_9b_it_input: 0.20,
        gemma2_9b_it_output: 0.20,
        "default_input": 0.50,
        "default_output": 0.50,
    },

    EXCHANGE_RATES: {
        USD_TO_EUR: 0.93,
        USD: 0.93,
        GBP: 1.18,
    },

    COGNITIVE_AXES: {
        CONCENTRATION: 0.1,
        ADAPTATION: 0.15,
        IMAGINATION: 0.2,
        STRATEGY: 0.25,
        ANALYSIS: 0.18,
        SYNTHESIS: 0.22,
        COMMUNICATION: 0.12
    },

    LOG_TYPES: {
        PROMPT: 'PROMPT_INTERACTION',
        AI_RESPONSE: 'AI_RESPONSE_INTERACTION',
        CODE_GENERATION: 'CODE_GENERATION',
        DOCUMENT_GENERATION: 'DOCUMENT_GENERATION',
        MEDIA_GENERATION: 'MEDIA_GENERATION',
        USER_INTERACTION: 'USER_INTERACTION',
        SYSTEM_PROCESS: 'SYSTEM_PROCESS',
        SESSION_START: 'SESSION_START',
        CV_GENERATION: 'CV_GENERATION',
        CV_VALORIZATION: 'CV_VALORIZATION',
        CV_SUMMARY_GENERATE: 'CV_SUMMARY_GENERATE',
        LOGIN: 'USER_LOGIN',
        PROFILE_UPDATE: 'USER_PROFILE_UPDATE',
        LEARNING_SESSION: 'LEARNING_SESSION',
        PROFESSIONAL_DEV_SESSION: 'PROFESSIONAL_DEV_SESSION',
        SKILL_ACQUISITION: 'SKILL_ACQUISITION',
    },

    THEMATIC_MULTIPLIERS: {
        MARKETING: 1.2,
        AFFILIATION: 1.1,
        FISCAL_ECONOMIC: 1.5,
        EDUCATION_TRAINING: 1.3,
        PROFESSIONAL_DEVELOPMENT: 1.4,
        OTHER: 1.0
    },

    THEMATIC_KEYWORDS: {
        MARKETING: ['marketing', 'publicité', 'campagne', 'vente', 'promotion', 'client', 'produit', 'marque', 'seo', 'sem', 'social media'],
        AFFILIATION: ['affiliation', 'partenaire', 'commission', 'lien affilié', 'affilié', 'revenu passif'],
        FISCAL_ECONOMIC: ['impôt', 'fiscalité', 'économie', 'finance', 'investissement', 'budget', 'déclaration', 'crédit', 'défiscalisation', 'amortissement', 'tva', 'bilan', 'comptabilité', 'audit'],
        EDUCATION_TRAINING: ['apprendre', 'formation', 'cours', 'tutoriel', 'exercice', 'comprendre', 'pédagogie', 'certification', 'compétence', 'développement personnel'],
        PROFESSIONAL_DEVELOPMENT: ['carrière', 'professionnel', 'gestion de projet', 'leadership', 'soft skills', 'efficacité', 'productivité', 'stratégie métier', 'évolution'],
    },

    COMMON_ACTIVITIES: {
        DATA_ANALYSIS: { utmi_bonus: 5, keywords: ['analyse données', 'rapport', 'statistiques', 'tendances', 'modèle prédictif'] },
        REPORT_GENERATION: { utmi_bonus: 7, keywords: ['rapport', 'compte-rendu', 'synthèse', 'document', 'bilan'] },
        CUSTOMER_SUPPORT: { utmi_bonus: 4, keywords: ['support client', 'aide', 'faq', 'problème', 'assistance'] },
        CONTENT_CREATION: { utmi_bonus: 6, keywords: ['contenu', 'article', 'blog', 'rédaction', 'écriture', 'création'] },
        CODE_DEBUGGING: { utmi_bonus: 8, keywords: ['bug', 'erreur', 'débug', 'fix', 'correction code'] },
        LEGAL_RESEARCH: { utmi_bonus: 9, keywords: ['légal', 'loi', 'réglementation', 'jurisprudence', 'contrat'] },
        FINANCIAL_FORECASTING: { utmi_bonus: 10, keywords: ['prévision financière', 'budget', 'projection', 'cash flow', 'planification'] },
        SKILL_PRACTICE: { utmi_bonus: 6, keywords: ['pratiquer', 'exercice', 'simuler', 'scénario', 'entraînement'] },
        KNOWLEDGE_ACQUISITION: { utmi_bonus: 7, keywords: ['acquérir connaissance', 'étudier', 'comprendre concept', 'nouvelle technologie'] },
        CAREER_PLANNING: { utmi_bonus: 8, keywords: ['plan carrière', 'orientation', 'objectifs professionnels', 'cheminement'] },
        PROBLEM_SOLVING_TRAINING: { utmi_bonus: 9, keywords: ['résoudre problème complexe', 'cas pratique', 'défi technique'] },
    },

    // NOUVEAU: Section ACTIVITY pour les bonus de base par type de log/activité
    ACTIVITY: {
        CONVERSATION_START: 1.0,
        CV_GENERATION: 5.0,
        CV_VALORIZATION: 8.0,
        CV_SUMMARY_GENERATE: 3.0,
        LOGIN: 0.5,
        PROFILE_UPDATE: 1.0,
        LEARNING_SESSION_BASE_UTMI: 0.1, // UTMI par minute de session d'apprentissage
        PROFESSIONAL_DEV_SESSION_BASE_UTMI: 0.2, // UTMI par minute de session de développement pro
        SKILL_ACQUISITION_BASE_UTMI: 10.0, // UTMI de base pour l'acquisition d'une compétence
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
    }
};

// Fonctions utilitaires pour le dashboard
function getSortedUtmiByValue(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, utmi: parseFloat(value.toFixed(2)) }));
}

function getSortedActivitiesByCount(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, count: value }));
}

/**
 * Converts a currency amount from a given currency to EUR.
 * @param {number} value - The amount to convert.
 * @param {string} currency - The source currency (e.g., 'USD', 'GBP').
 * @param {object} rates - Exchange rates object (e.g., COEFFICIENTS.EXCHANGE_RATES).
 * @returns {number} The converted amount in EUR.
 */
function convertValueToEUR(value, currency, rates) {
    if (!rates || !rates.USD_TO_EUR) {
        console.warn("Exchange rates not available for conversion. Using 1:1 conversion.");
        return value;
    }
    switch (currency.toUpperCase()) {
        case 'USD':
            return value * rates.USD_TO_EUR;
        case 'GBP':
            return value * (rates.GBP || 1);
        case 'EUR':
        default:
            return value;
    }
}

/**
 * Mocks cognitive axis detection based on keywords.
 * @param {string} text - The text to analyze.
 * @returns {object} Object with detected cognitive axes and a simple presence value (1).
 */
function detectCognitiveAxis(text) {
    const axesDetected = {};
    const lowerText = text.toLowerCase();

    const keywordMap = {
        'analyse': 'ANALYSIS', 'comprendre': 'ANALYSIS', 'décomposer': 'ANALYSIS',
        'synthétiser': 'SYNTHESIS', 'combiner': 'SYNTHESIS', 'structurer': 'SYNTHESIS',
        'stratégie': 'STRATEGY', 'planifier': 'STRATEGY', 'décider': 'STRATEGY',
        'imaginer': 'IMAGINATION', 'créer': 'IMAGINATION', 'innover': 'IMAGINATION',
        'adapter': 'ADAPTATION', 'gérer changement': 'ADAPTATION', 'résilience': 'ADAPTATION',
        'communiquer': 'COMMUNICATION', 'présenter': 'COMMUNICATION', 'négocier': 'COMMUNICATION',
        'focus': 'CONCENTRATION', 'détaillé': 'CONCENTRATION', 'précision': 'CONCENTRATION'
    };

    for (const keyword in keywordMap) {
        if (lowerText.includes(keyword)) {
            axesDetected[keywordMap[keyword]] = 1;
        }
    }

    if (Object.keys(axesDetected).length === 0) {
        axesDetected.ANALYSIS = 1;
    }
    return axesDetected;
}

/**
 * Analyzes text for specific themes (marketing, affiliation, fiscal/economic, education/training, professional development).
 * @param {string} text - The text to analyze.
 * @returns {object} Object with boolean flags for each theme.
 */
function analyzeTextForThemes(text) {
    const detectedThemes = {};
    const lowerText = text.toLowerCase();

    for (const theme in COEFFICIENTS.THEMATIC_KEYWORDS) {
        const keywords = COEFFICIENTS.THEMATIC_KEYWORDS[theme];
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                detectedThemes[theme] = true;
                break;
            }
        }
    }
    return detectedThemes;
}

function calculateActivityScore(text) {
    let score = 0;
    const detectedActivities = {};
    const lowerText = text.toLowerCase();

    for (const activityName in COEFFICIENTS.COMMON_ACTIVITIES) {
        const activity = COEFFICIENTS.COMMON_ACTIVITIES[activityName];
        let activityMatchCount = 0;
        for (const keyword of activity.keywords) {
            if (lowerText.includes(keyword)) {
                activityMatchCount++;
            }
        }
        if (activityMatchCount > 0) {
            detectedActivities[activityName] = activityMatchCount;
            score += activity.utmi_bonus * activityMatchCount;
        }
    }

    let bonus = 0;
    if (score > 0) {
        if (score >= COEFFICIENTS.ACTIVITY_SCORE_THRESHOLDS.HIGH) {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.HIGH;
        } else if (score >= COEFFICIENTS.ACTIVITY_SCORE_THRESHOLDS.MEDIUM) {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.MEDIUM;
        } else {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.LOW;
        }
    }
    return { score, detectedActivities, bonus };
}

/**
 * Calcule les Unités Temporelles Monétisables (UTMi), le coût estimé et la Taxe IA pour une interaction donnée.
 * @param {object} interaction - L'objet interaction (type, data).
 * @param {object} userContext - Contexte de l'utilisateur (ex: { userCvnuValue: 0.5, economicContext: {} }).
 * @param {object} modelQualityScores - Les scores de qualité des modèles d'IA (ex: { "llama3-8b": { quality_multiplier: 1.2 } }).
 * @returns {object} Un objet contenant l'UTMi calculée, le coût estimé en USD et le montant de la Taxe IA.
 */
function calculateUtmi(interaction, userContext = { userCvnuValue: 0.5, economicContext: {} }, modelQualityScores = {}) {
    let utmi = 0;
    let estimatedCostUSD = 0;
    let taxeIAAmount = 0;

    const type = interaction.type;
    const data = interaction.data || {};
    const userCvnuValue = userContext.userCvnuValue || 0;

    const modelId = data.modelId;
    const modelScores = modelQualityScores[modelId] || modelQualityScores.default || {};
    const aiModelQualityMultiplier = modelScores.quality_multiplier || COEFFICIENTS.AI_RESPONSE.MODEL_QUALITY_MULTIPLIER_DEFAULT;

    switch (type) {
        case COEFFICIENTS.LOG_TYPES.PROMPT:
            const wordCount = typeof data.text === 'string' ? data.text.split(/\s+/).filter(word => word.length > 0).length : 0;
            utmi += wordCount * COEFFICIENTS.PROMPT.BASE_UTMI_PER_WORD;

            if (data.isLearningSession) utmi += COEFFICIENTS.PROMPT.LEARNING_PROMPT_BONUS;
            if (data.isProfessionalDevelopment) utmi += COEFFICIENTS.PROMPT.PROFESSIONAL_DEVELOPMENT_PROMPT_BONUS;

            if (data.complexityMultiplier) utmi *= data.complexityMultiplier;
            if (data.impactMultiplier) utmi *= data.impactMultiplier;
            if (data.isUniqueConcept) utmi += COEFFICIENTS.PROMPT.UNIQUE_CONCEPT_BONUS;
            if (data.isFiscalEconomicTopic) utmi += COEFFICIENTS.PROMPT.FISCAL_ECONOMIC_TOPIC_BONUS;
            if (data.isMetierRelatedPrompt) utmi += COEFFICIENTS.PROMPT.METIER_RELATED_PROMPT_BONUS;

            const promptInputTokens = data.inputTokens || (typeof data.text === 'string' ? Math.ceil(data.text.length / 4) : 0);
            estimatedCostUSD += (promptInputTokens / 1000000) * (COEFFICIENTS.COSTS_PER_MILLION_TOKENS_USD[`${modelId}_input`] || COEFFICIENTS.COSTS_PER_MILLION_TOKENS_USD.default_input || 0);
            break;

        case COEFFICIENTS.LOG_TYPES.AI_RESPONSE:
            const tokenCount = typeof data.tokenCount === 'number' ? data.tokenCount : 0;
            let baseAiUtmi = tokenCount * COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN;

            if (data.isEducationalContent) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.EDUCATIONAL_CONTENT_BONUS;
            if (data.isPracticalGuidance) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PRACTICAL_GUIDANCE_BONUS;
            // Ensure skillAcquisitionImpact and professionalGrowthImpact are numeric before multiplication
            if (data.skillAcquisitionImpact && typeof data.skillAcquisitionImpact === 'number') baseAiUtmi += COEFFICIENTS.AI_RESPONSE.SKILL_ACQUISITION_IMPACT_BONUS * data.skillAcquisitionImpact;
            if (data.professionalGrowthImpact && typeof data.professionalGrowthImpact === 'number') baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROFESSIONAL_GROWTH_IMPACT_BONUS * data.professionalGrowthImpact;

            if (data.relevance) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.RELEVANCE_MULTIPLIER;
            if (data.coherence) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.COHERENCE_MULTIPLI;
            if (data.completeness) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.COMPLETENESS_MULTIPLIER;
            if (data.problemSolved) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVED_MICRO_BONUS;
            if (data.isFiscalEconomicInsight) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.FISCAL_ECONOMIC_INSIGHT_BONUS;
            if (data.isMetierSpecificSolution) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.METIER_SPECIFIC_SOLUTION_BONUS;

            if (modelScores.response_relevance_bonus && data.relevance) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN * tokenCount * modelScores.response_relevance_bonus;
            }
            if (modelScores.coherence_bonus && data.coherence) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN * tokenCount * modelScores.coherence_bonus;
            }
            if (modelScores.problem_solving_capability && data.problemSolved) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVED_MICRO_BONUS * modelScores.problem_solving_capability;
            }

            utmi = baseAiUtmi * aiModelQualityMultiplier;

            const responseOutputTokens = data.outputTokens || (typeof data.text === 'string' ? Math.ceil(data.text.length / 4) : 0);
            estimatedCostUSD += (responseOutputTokens / 1000000) * (COEFFICIENTS.COSTS_PER_MILLION_TOKENS_USD[`${modelId}_output`] || COEFFICIENTS.COSTS_PER_MILLION_TOKENS_USD.default_output || 0);
            break;

        case COEFFICIENTS.LOG_TYPES.CODE_GENERATION:
            const lineCount = typeof data.lineCount === 'number' ? data.lineCount : 0;
            utmi += lineCount * COEFFICIENTS.CODE_GENERATION.BASE_UTMI_PER_LINE;
            if (data.isEducationalCode) utmi += COEFFICIENTS.CODE_GENERATION.EDUCATIONAL_CODE_BONUS;

            if (data.complexityMultiplier) utmi *= data.complexityMultiplier;
            if (data.reusability) utmi += COEFFICIENTS.CODE_GENERATION.REUSABILITY_BONUS;
            if (data.testCoverage) utmi += COEFFICIENTS.CODE_GENERATION.TEST_COVERAGE_BONUS;
            if (data.securityFix) utmi += COEFFICIENTS.CODE_GENERATION.SECURITY_FIX_BONUS;
            if (data.performanceImprovement) utmi += COEFFICIENTS.CODE_GENERATION.PERFORMANCE_IMPROVEMENT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.DOCUMENT_GENERATION:
            const pageCount = typeof data.pageCount === 'number' ? data.pageCount : 0;
            utmi += pageCount * COEFFICIENTS.DOCUMENT_GENERATION.BASE_UTMI_PER_PAGE;
            if (data.isTrainingMaterial) utmi += COEFFICIENTS.DOCUMENT_GENERATION.TRAINING_MATERIAL_BONUS;
            if (data.isCaseStudy) utmi += COEFFICIENTS.DOCUMENT_GENERATION.CASE_STUDY_BONUS;

            if (data.detailLevelMultiplier) utmi *= data.detailLevelMultiplier;
            if (data.accuracy) utmi += COEFFICIENTS.DOCUMENT_GENERATION.ACCURACY_BONUS;
            if (data.legalCompliance) utmi += COEFFICIENTS.DOCUMENT_GENERATION.LEGAL_COMPLIANCE_BONUS;
            if (data.customization) utmi += COEFFICIENTS.DOCUMENT_GENERATION.CUSTOMIZATION_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.MEDIA_GENERATION:
            const itemCount = typeof data.itemCount === 'number' ? data.itemCount : 0;
            utmi += itemCount * COEFFICIENTS.MEDIA_GENERATION.BASE_UTMI_PER_ITEM;
            if (data.creativityMultiplier) utmi *= data.creativityMultiplier;
            if (data.usageViews && data.usageViews > 0) {
                utmi += data.usageViews * COEFFICIENTS.MEDIA_GENERATION.USAGE_BONUS_PER_VIEW;
            }
            if (data.brandAlignment) utmi += COEFFICIENTS.MEDIA_GENERATION.BRAND_ALIGNMENT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.USER_INTERACTION:
            if (data.feedbackSubmitted) utmi += COEFFICIENTS.USER_INTERACTION.FEEDBACK_SUBMISSION_UTMI;
            if (data.correctionProvided) utmi += COEFFICIENTS.USER_INTERACTION.CORRECTION_UTMI;
            if (data.validationPerformed) utmi += COEFFICIENTS.USER_INTERACTION.VALIDATION_UTMI;
            if (data.sharedContent) utmi += COEFFICIENTS.USER_INTERACTION.SHARING_UTMI;
            if (data.trainingDataContributed) utmi += COEFFICIENTS.USER_INTERACTION.TRAINING_DATA_CONTRIBUTION_UTMI;
            if (data.quizCompleted) utmi += COEFFICIENTS.USER_INTERACTION.QUIZ_COMPLETION_UTMI;
            if (data.practiceSessionParticipated) utmi += COEFFICIENTS.USER_INTERACTION.PRACTICE_SESSION_UTMI;
            if (data.mentoringSession) utmi += COEFFICIENTS.USER_INTERACTION.MENTORING_SESSION_UTMI;
            break;

        case COEFFICIENTS.LOG_TYPES.SYSTEM_PROCESS:
            break;
        case COEFFICIENTS.LOG_TYPES.SESSION_START:
            utmi += COEFFICIENTS.ACTIVITY.CONVERSATION_START;
            break;

        case COEFFICIENTS.LOG_TYPES.CV_GENERATION:
            utmi += COEFFICIENTS.ACTIVITY.CV_GENERATION;
            break;

        case COEFFICIENTS.LOG_TYPES.CV_VALORIZATION:
            utmi += COEFFICIENTS.ACTIVITY.CV_VALORIZATION;
            if (data.skillAdded) utmi += COEFFICIENTS.CVNU.SKILL_ADDITION_IMPACT;
            if (data.experienceDetailed) utmi += COEFFICIENTS.CVNU.EXPERIENCE_DETAIL_IMPACT;
            break;

        case COEFFICIENTS.LOG_TYPES.CV_SUMMARY_GENERATE:
            utmi += COEFFICIENTS.ACTIVITY.CV_SUMMARY_GENERATE;
            break;
        case COEFFICIENTS.LOG_TYPES.LOGIN:
            utmi += COEFFICIENTS.ACTIVITY.LOGIN;
            break;
        case COEFFICIENTS.LOG_TYPES.PROFILE_UPDATE:
            utmi += COEFFICIENTS.ACTIVITY.PROFILE_UPDATE;
            break;
        case COEFFICIENTS.LOG_TYPES.LEARNING_SESSION:
            utmi += (data.durationMinutes || 1) * COEFFICIENTS.ACTIVITY.LEARNING_SESSION_BASE_UTMI;
            break;
        case COEFFICIENTS.LOG_TYPES.PROFESSIONAL_DEV_SESSION:
            utmi += (data.durationMinutes || 1) * COEFFICIENTS.ACTIVITY.PROFESSIONAL_DEV_SESSION_BASE_UTMI;
            break;
        case COEFFICIENTS.LOG_TYPES.SKILL_ACQUISITION:
            utmi += COEFFICIENTS.ACTIVITY.SKILL_ACQUISITION_BASE_UTMI;
            if (data.skillLevelAchieved && typeof data.skillLevelAchieved === 'number') utmi *= data.skillLevelAchieved;
            break;

        default:
            console.warn(`Type d'interaction inconnu: ${type}`);
            return { utmi: 0, estimatedCostUSD: 0, taxeIAAmount: 0 };
    }

    if (typeof userCvnuValue === 'number' && userCvnuValue > 0) {
        utmi *= (1 + userCvnuValue * COEFFICIENTS.CVNU.CVNU_VALUE_MULTIPLIER);
    }

    if (userContext.economicContext) {
        if (typeof userContext.economicContext.revenueGeneratedEUR === 'number' && userContext.economicContext.revenueGeneratedEUR > 0) {
            utmi += userContext.economicContext.revenueGeneratedEUR * COEFFICIENTS.ECONOMIC_IMPACT.REVENUE_GENERATION_MULTIPLIER;
        }
        if (typeof userContext.economicContext.costSavedEUR === 'number' && userContext.economicContext.costSavedEUR > 0) {
            utmi += userContext.economicContext.costSavedEUR * COEFFICIENTS.ECONOMIC_IMPACT.COST_SAVING_MULTIPLIER;
        }
        if (typeof userContext.economicContext.efficiencyGainPercentage === 'number' && userContext.economicContext.efficiencyGainPercentage > 0) {
            utmi += userContext.economicContext.efficiencyGainPercentage * COEFFICIENTS.ECONOMIC_IMPACT.EFFICIENCY_GAIN_MULTIPLIER;
        }
        if (typeof userContext.economicContext.currentBudgetSurplus === 'number' && userContext.economicContext.currentBudgetSurplus > 0) {
            utmi *= (1 + userContext.economicContext.currentBudgetSurplus / 1000000 * COEFFICIENTS.ECONOMIC_IMPACT.BUDGET_SURPLUS_BONUS);
        }
    }

    const interactionText = data.text || '';
    const detectedThemes = analyzeTextForThemes(interactionText);
    let thematicMultiplier = COEFFICIENTS.THEMATIC_MULTIPLIERS.OTHER;
    if (detectedThemes.MARKETING) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.MARKETING);
    if (detectedThemes.AFFILIATION) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.AFFILIATION);
    if (detectedThemes.FISCAL_ECONOMIC) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.FISCAL_ECONOMIC);
    if (detectedThemes.EDUCATION_TRAINING) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.EDUCATION_TRAINING);
    if (detectedThemes.PROFESSIONAL_DEVELOPMENT) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.PROFESSIONAL_DEVELOPMENT);
    utmi *= thematicMultiplier;

    const activityResult = calculateActivityScore(interactionText);
    utmi += activityResult.bonus;

    let currentTaxeIAAmount = 0;
    currentTaxeIAAmount += utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.BASE_TAX_RATE;

    if (data.isLegalCompliance) {
        currentTaxeIAAmount -= utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.INTERACTION_LEGAL_COMPLIANCE_BONUS;
    }
    if (data.isEthicalAI) {
        currentTaxeIAAmount -= utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.INTERACTION_ETHICAL_AI_BONUS;
    }
    if (data.isCommercialUse) {
        currentTaxeIAAmount += utmi * (COEFFICIENTS.TAXE_IA_COEFFICIENTS.COMMERCIAL_USE_MULTIPLIER - 1);
    }
    if (data.campaignRelatedUtmiShare && data.campaignRelatedUtmiShare > 0) {
        currentTaxeIAAmount += utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.CAMPAIGN_FUNDING_IMPACT_MULTIPLIER * data.campaignRelatedUtmiShare;
    }
    if (data.isEducationalUse) {
        currentTaxeIAAmount -= utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.EDUCATIONAL_USE_TAX_REDUCTION;
    }
    if (data.isNonProfitOrPersonalUse) {
        currentTaxeIAAmount -= utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.NON_PROFIT_OR_PERSONAL_USE_REDUCTION;
    }

    if (type === COEFFICIENTS.LOG_TYPES.CV_VALORIZATION) {
        currentTaxeIAAmount += utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.TAX_PER_CV_VALORIZATION_UTMI;
    }
    if (type === COEFFICIENTS.LOG_TYPES.PROMPT) {
        currentTaxeIAAmount += utmi * COEFFICIENTS.TAXE_IA_COEFFICIENTS.TAX_PER_PROMPT_UTMI;
    }

    if (currentTaxeIAAmount < 0) currentTaxeIAAmount = 0;

    let finalUtmi = utmi - currentTaxeIAAmount;
    if (finalUtmi < 0) finalUtmi = 0;

    estimatedCostUSD += currentTaxeIAAmount / (COEFFICIENTS.EXCHANGE_RATES.USD_TO_EUR || 1);


    return {
        utmi: parseFloat(finalUtmi.toFixed(2)),
        estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(6)),
        taxeIAAmount: parseFloat(currentTaxeIAAmount.toFixed(2))
    };
}


/**
 * Calcule les insights agrégés à partir d'une liste de logs d'interactions.
 * @param {Array<object>} logs - Tableau des logs d'interactions. Chaque log doit contenir { interaction, userId, utmi, estimatedCost, taxeIAAmount, ... }
 * @param {object} modelQualityScores - Les scores de qualité des modèles d'IA.
 * @returns {object} Un objet contenant divers insights.
 */
function calculateDashboardInsights(logs, modelQualityScores) {
    let totalUtmi = 0;
    let totalEstimatedCostUSD = 0;
    let totalTaxeIAAmount = 0;
    let totalInteractionCount = 0;
    let totalProcessingTime = 0;
    let totalConversationLengthTokens = 0;

    const totalUtmiByCognitiveAxis = {};
    const totalUtmiByType = {};
    const commonTopicsUtmi = {};
    const commonActivities = {};
    let thematicUtmi = { marketing: 0, affiliation: 0, fiscalEconomic: 0, educationTraining: 0, professionalDevelopment: 0 };
    const utmiByModel = {};
    const modelCosts = {};

    for (const axis in COEFFICIENTS.COGNITIVE_AXES) {
        totalUtmiByCognitiveAxis[axis] = 0;
    }

    logs.forEach(log => {
        const currentUtmi = log.utmi || 0;
        const currentEstimatedCost = log.estimatedCost || 0;
        const currentTaxeIAAmount = log.taxeIAAmount || 0;

        totalUtmi += currentUtmi;
        totalEstimatedCostUSD += currentEstimatedCost;
        totalTaxeIAAmount += currentTaxeIAAmount;

        if (log.type === COEFFICIENTS.LOG_TYPES.PROMPT || log.type === COEFFICIENTS.LOG_TYPES.AI_RESPONSE) {
            totalInteractionCount++;
        }

        if (log.processingTime) {
            totalProcessingTime += log.processingTime;
        }

        const interactionType = log.type;
        totalUtmiByType[interactionType] = (totalUtmiByType[interactionType] || 0) + currentUtmi;

        const interactionTextForThemes = log.prompt || log.response || (log.interaction && log.interaction.data ? log.interaction.data.text : '');
        const detectedThemes = analyzeTextForThemes(interactionTextForThemes);
        if (detectedThemes.MARKETING) thematicUtmi.marketing += currentUtmi;
        if (detectedThemes.AFFILIATION) thematicUtmi.affiliation += currentUtmi;
        if (detectedThemes.FISCAL_ECONOMIC) thematicUtmi.fiscalEconomic += currentUtmi;
        if (detectedThemes.EDUCATION_TRAINING) thematicUtmi.educationTraining += currentUtmi;
        if (detectedThemes.PROFESSIONAL_DEVELOPMENT) thematicUtmi.professionalDevelopment += currentUtmi;


        const textForCognitiveAxis = log.prompt || log.response || (log.interaction && log.interaction.data ? log.interaction.data.text : '');
        const detectedAxes = detectCognitiveAxis(textForCognitiveAxis);
        for (const axis in detectedAxes) {
            totalUtmiByCognitiveAxis[axis] = (totalUtmiByCognitiveAxis[axis] || 0) + currentUtmi;
        }

        const textForActivity = log.prompt || log.response || (log.interaction && log.interaction.data ? log.interaction.data.text : '');
        const activityResult = calculateActivityScore(textForActivity);
        for (const activity in activityResult.detectedActivities) {
            commonActivities[activity] = (commonActivities[activity] || 0) + 1;
            commonTopicsUtmi[activity] = (commonTopicsUtmi[activity] || 0) + currentUtmi;
        }

        const model = log.model || (log.interaction && log.interaction.data ? log.interaction.data.modelId : 'unknown');
        if (model && currentUtmi !== undefined && currentUtmi !== null) {
            utmiByModel[model] = (utmiByModel[model] || 0) + currentUtmi;
            modelCosts[model] = (modelCosts[model] || 0) + currentEstimatedCost;
        }

        if (log.interaction && log.interaction.data && log.interaction.data.tokenCount) {
             totalConversationLengthTokens += log.interaction.data.tokenCount;
        }
    });

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const averageCostPerInteraction = totalInteractionCount > 0 ? totalEstimatedCostUSD / totalInteractionCount : 0;
    const averageConversationLength = totalInteractionCount > 0 ? totalConversationLengthTokens / totalInteractionCount : 0;

    const utmiPerCostRatioByModel = {};
    for (const model in utmiByModel) {
        if (modelCosts[model] && modelCosts[model] > 0) {
            utmiPerCostRatioByModel[model] = parseFloat((utmiByModel[model] / modelCosts[model]).toFixed(2));
        } else {
            utmiPerCostRatioByModel[model] = 0;
        }
    }
    const totalUtmiPerCostRatio = totalEstimatedCostUSD > 0 ? parseFloat((totalUtmi / totalEstimatedCostUSD).toFixed(2)) : 0;

    const sentimentSummary = { positive: 0.7, neutral: 0.2, negative: 0.1 };

    const totalEstimatedCostEUR = convertValueToEUR(totalEstimatedCostUSD, 'USD', COEFFICIENTS.EXCHANGE_RATES);

    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(2)),
        totalEstimatedCostUSD: parseFloat(totalEstimatedCostUSD.toFixed(6)),
        totalEstimatedCostEUR: parseFloat(totalEstimatedCostEUR.toFixed(2)),
        totalTaxeIAAmount: parseFloat(totalTaxeIAAmount.toFixed(2)),
        totalInteractionCount: totalInteractionCount,
        totalProcessingTime: parseFloat(totalProcessingTime.toFixed(2)),
        totalConversationLengthTokens: parseFloat(totalConversationLengthTokens.toFixed(2)),
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(2)),
        averageCostPerInteraction: parseFloat(averageCostPerInteraction.toFixed(6)),
        sentimentSummary: sentimentSummary,
        utmiByCognitiveAxis: getSortedUtmiByValue(totalUtmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(totalUtmiByType),
        utmiByModel: getSortedUtmiByValue(utmiByModel),
        thematicUtmi: {
            marketing: parseFloat(thematicUtmi.marketing.toFixed(2)),
            affiliation: parseFloat(thematicUtmi.affiliation.toFixed(2)),
            fiscalEconomic: parseFloat(thematicUtmi.fiscalEconomic.toFixed(2)),
            educationTraining: parseFloat(thematicUtmi.educationTraining.toFixed(2)),
            professionalDevelopment: parseFloat(thematicUtmi.professionalDevelopment.toFixed(2)),
        },
        utmiPerCostRatioByModel: utmiPerCostRatioByModel,
        totalUtmiPerCostRatio: parseFloat(totalUtmiPerCostRatio),
        mostValuableTopics: getSortedUtmiByValue(commonTopicsUtmi).slice(0, 5),
        mostCommonActivities: getSortedActivitiesByCount(commonActivities).slice(0, 5),
        exchangeRates: COEFFICIENTS.EXCHANGE_RATES,
    };
}

// Exportation des fonctions et coefficients
module.exports = {
    calculateUtmi,
    calculateActivityScore,
    calculateDashboardInsights,
    COEFFICIENTS,
    convertValueToEUR,
    detectCognitiveAxis,
    analyzeTextForThemes
};
