// taxeAi.js
import Groq from 'groq-sdk';
import { policySchema } from './policySchema.js'; // Importation du schéma

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 

/**
 * Simule l'impact de la Taxe IA sur les recettes et génère une justification par IA.
 * @param {number} vatReceipts - Recettes TVA annuelles actuelles (en milliards).
 * @returns {object} Un rapport de simulation.
 */
export async function simulateTaxeIA(vatReceipts) {
    // Les taux et estimations proviennent des hypothèses budgétaires
    const affectationRate = 0.02; // 2%
    const iaTaxRate = 0.10; // 10% sur la valeur ajoutée IA
    const estimatedIAValue = 100; // 100 milliards € (Hypothèse V.A. IA)
    
    const vatAffected = vatReceipts * affectationRate;
    const iaTaxCollected = estimatedIAValue * iaTaxRate;
    const totalFRCFinance = vatAffected + iaTaxCollected;

    // Utilisation de Groq pour l'intelligence politique
    const groqExplanation = await groq.chat.completions.create({
        messages: [{ role: "user", content: `Expliquez brièvement le principe de la 'Taxe IA' en tant qu'affectation de la TVA et sa justification économique pour financer le Revenu Citoyen. Le total financé est ${totalFRCFinance} milliards €.` }],
        model: "llama-3.1-8b-instant"
    });

    return {
        totalFRCFinance: totalFRCFinance, // en milliards €
        details: {
            vatAffected: vatAffected,
            iaTaxCollected: iaTaxCollected,
        },
        justification: groqExplanation.choices[0].message.content
    };
}