// model/ia.js (CORRECTION : Suppression de aiClient des arguments)

import Groq from 'groq-sdk';
// Nécessite d'importer les helpers de données depuis le service de données
import { readSourceData } from '../srv/dataService.js'; 
import { policySchema } from '../policySchema.js'; 

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 
const GAN_MODEL = "llama-3.3-70b-versatile"; 

// --- Fonction GAN 1 : Générer la Question (Le "Générateur") ---
// --- Fonction GAN 1 : Générer la Question (Le "Générateur") ---
/**
 * Génère une question complexe et critique basée sur les schémas de politique.
 * @param {object} utmCoefficients - Coefficients UTM injectés depuis serveur.js
 */
export async function generateQuestion(difficulty, utmCoefficients) {
    const policyDetails = JSON.stringify(policySchema, null, 2);
    
    let tone = "";
    if (difficulty === 'intermédiaire') {
        tone = "Critique mais professionnelle. Questionnez la faisabilité budgétaire.";
    } else if (difficulty === 'expert') {
        tone = "Hostile et incisive. Concentrez-vous sur les failles légales, le contrôle social, et la fuite des capitaux.";
    } else {
        tone = "Basique et d'information. Questionnez la différence entre RC et RSA.";
    }
    
    // QUESTION EXPERT basée sur les chiffres UTM
    const expertQuestion = `
        La comptabilité du Revenu Citoyen révèle que le coût de distribution par bénéficiaire est de ${utmCoefficients.RBU_ACCOUNTING_COEFFICIENTS.DISTRIBUTION_COST_PER_USER_UTMI} UTMi. 
        Comment le gouvernement PRCR garantit-il, compte tenu du taux d'affectation de la Taxe AI (seulement ${utmCoefficients.TAX_AI_SPECIFIC.TAX_AFFECTATION_RATE_ON_TVA * 100}% de la TVA brute), que la valeur monétisée (REVENUE_AFFECTED_BY_AI_TAX) est toujours suffisante pour couvrir non seulement ces coûts d'exécution du Smart Contract, mais aussi maintenir le TARGET_NET_PROFIT_MULTIPLIER de ${utmCoefficients.RBU_ACCOUNTING_COEFFICIENTS.TARGET_NET_PROFIT_MULTIPLIER * 100}% ?
    `;

    // Le prompt est ajusté pour inclure la question basée sur l'UTM pour le niveau expert
    const prompt = (difficulty === 'expert') ? expertQuestion : `
        En vous basant sur la politique PRCR, générez UNE question de niveau '${difficulty}'. 
        Le ton doit être hostile. Questionnez le risque de dette passive RBU (valeur: ${utmCoefficients.RBU_DEBT_FACTOR_PER_DAY} EUR/UTMi par jour) ou la légalité du CVNU.
        POLITIQUE PRCR: ${policyDetails}
        ---
        QUESTION:
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GAN_MODEL,
            temperature: 0.8
        });
        return chatCompletion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erreur GAN Question:", error);
        return "Quelle est la garantie que le Revenu Citoyen ne deviendra pas une simple inflation monétaire ?";
    }
}

// --- Fonction GAN 2 : Générer la Réponse (Le "Discriminateur") ---
/**
 * Génère une réponse structurée et défendable à une question donnée, en utilisant le corpus source.
 */
export async function generateAnswer(question, difficulty, utmCoefficients) {
    const expertiseLevel = difficulty === 'expert' ? 
        `Utilisez un ton extrêmement confiant, technique, et réfutez l'attaque en citant les COEFFICIENTS UTM. Citez la COMPLIANCE_RISK_REDUCTION_UTMI (${utmCoefficients.TAX_AI_SPECIFIC.COMPLIANCE_RISK_REDUCTION_UTMI} UTMi) comme avantage.` : 
        `Utilisez un ton pédagogique et rassurant, en insistant sur l'équité et le RC de base de ${utmCoefficients.MIN_RBU_ALLOCATION_EUR}€.`;

    const systemPrompt = `
        Vous êtes le porte-parole du Programme PRCR (Generator). Votre mission est de répondre à la question de l'opposition avec assurance, en utilisant le module de comptabilité UTM pour prouver la viabilité financière.
        ---
        Question de l'opposition : "${question}"
        ${expertiseLevel}
        Points Clés UTM à Intégrer : Base Fiduciaire: CVNU_FIDUCIAIRE_BASE. Marge: ${utmCoefficients.RBU_ACCOUNTING_COEFFICIENTS.TARGET_NET_PROFIT_MULTIPLIER * 100}%. Coût du Smart Contract: ${utmCoefficients.RBU_ACCOUNTING_COEFFICIENTS.DISTRIBUTION_COST_PER_USER_UTMI} UTMi.
        ---
        Votre réponse doit être technique, directe, et doit convaincre l'auditoire que la Taxe AI est la solution comptable parfaite.
    `;
    const sourceData = await readSourceData();
    // Utilisation d'un nom non réservé (debateArguments)
    const debateArguments = sourceData.documentation.find(doc => doc.identifier === "DEBATE-ARGUMENTS")?.points;
    const legalText = sourceData.documentation.find(doc => doc.identifier === "LEGAL-REFORM-TEXT").sections.map(s => s.articles.map(a => a.code + ": " + a.definition)).flat().join('\n');
    
    let instruction = (difficulty === 'expert') 
        ? "Utilisez au moins DEUX références légales (Art. L...) et attaquez l'argument opposé directement. Terminez par une phrase de conviction."
        : "Soyez pédagogique et utilisez UN seul argument clé pour justifier la politique.";

    const prompt = `
        QUESTION: ${question}
        ---
        CORPUS DE RÉFÉRENCE:
        Arguments de Défense: ${JSON.stringify(debateArguments)}
        Références Légales: ${legalText}
        ---
        En tant qu'Assistant du Parti PRCR, répondez à la question ci-dessus. 
        INSTRUCTION: ${instruction}
        RÉPONSE:
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Vous êtes le porte-parole officiel du Programme PRCR. Votre rôle est de défendre la politique avec clarté, en citant les articles de loi pertinents (Art. L3121-1, Art. L4331-1) et en vous appuyant sur le financement par la Taxe IA et le Smart Contract." },
                { role: "user", content: prompt }
            ],
            model: GAN_MODEL
        });
        return chatCompletion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erreur GAN Réponse:", error);
        return "Notre politique est parfaitement défendable par l'Article L4331-1 et la régulation du marché par la Taxe IA.";
    }
}