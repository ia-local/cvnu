// server_modules/slideIA.js

import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 
const GROQ_MODEL = "llama-3.1-8b-instan"; 

/**
 * Utilise l'IA pour générer un contenu narratif pour la diapositive de déploiement.
 * @param {object} deploymentPlan - L'objet complet du Plan de Déploiement (phases).
 * @returns {string} Contenu HTML ou texte narratif formaté.
 */
export async function generateNextSlideContent(deploymentPlan) {
    if (!deploymentPlan || !deploymentPlan.phases) {
        return "Erreur: Plan de déploiement non défini.";
    }
    
    const prompt = `
        Le Plan de Déploiement du Programme PRCR est structuré en trois phases:
        ${JSON.stringify(deploymentPlan.phases, null, 2)}
        
        Rédigez un court texte de présentation (max 6 phrases) pour la diapositive finale, 
        mettant en évidence la progression logique du plan : 
        1. Le rôle critique de la Phase 1 (POC/Smart Contract).
        2. La portée sociale de la Phase 2 (Fusion RSA/Intégration Fiscale).
        3. Le but ultime de la Phase 3 (Remplacement de l'État-Providence et Équilibre FRC).
        Utilisez un ton de lancement officiel et soyez très engageant.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
            temperature: 0.6 
        });
        return chatCompletion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erreur IA Slide Content:", error);
        return "Le plan de déploiement est en cours de validation par nos systèmes d'IA. Veuillez actualiser.";
    }
}