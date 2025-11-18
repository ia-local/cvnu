// srv/aiService.js (Version Finale avec Tous les Exports)

import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai'; 
import { readSourceData } from './dataService.js';
import { policySchema } from '../policySchema.js'; 
// Assurez-vous que model/ia.js exporte correctement generateQuestion/Answer sans le client AI
import { generateQuestion as ganQuestion, generateAnswer as ganAnswer } from '../model/ia.js'; 

// --- Configuration des Clients IA ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 
const GROQ_MODEL = "llama-3.1-8b-instant"; 
const GAN_MODEL = "mixtral-8x7b-32768"; 

// Initialisation du client Gemini (Assurez-vous que le SDK est installé)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 
const GEMINI_MODEL = "gemini-2.5-flash"; 


// -------------------------------------------------------------------------
// --- DÉFINITIONS DES FONCTIONS DE SERVICE (Logique IA) ---
// -------------------------------------------------------------------------

export async function generateQuestion(difficulty) {
    // NOTE: Le client AI est passé depuis serveur.js à model/ia.js via le contexte
    return ganQuestion(difficulty); 
}

export async function generateAnswer(question, difficulty) {
    // NOTE: Le client AI est passé depuis serveur.js à model/ia.js via le contexte
    return ganAnswer(question, difficulty); 
}

/**
 * Génère un titre marketing accrocheur pour le Top 10 FAQ (Utilise Groq/Llama).
 */
export async function generateTopFaqTitle(topQuestions) {
    const questionsText = topQuestions.map(q => q.text).join('; ');
    
    const prompt = `
        Voici le Top 10 des questions les plus débattues par l'opposition (questions hostiles comprises) : ${questionsText}.
        Génère un titre marketing accrocheur et percutant (max 10 mots) pour présenter cette liste sur un tableau de bord politique.
        Réponds uniquement avec le titre.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL, 
            temperature: 0.9 
        });
        return chatCompletion.choices[0].message.content.trim();
    } catch (error) {
        return "Analyse des Failles : Top 10 des Questions IA";
    }
}


export async function generateCvnuDetails(categoryName) {
    const sourceData = await readSourceData();
    const legalRef = sourceData.documentation.find(doc => doc.identifier === "LEGAL-REFORM-TEXT")?.sections[0].articles[0].definition;
    const rcLimits = policySchema.policyComponents.find(c => c.identifier === "RC-CVNU-28J");

    const prompt = `
        En tant qu'expert du Programme PRCR, générez un texte concis (max 4 phrases) pour le frontend décrivant la catégorie CVNU '${categoryName}'.
        Expliquez : 1. Comment elle répond à la nouvelle définition du travail (Art. L3121-1: "${legalRef}"). 2. Son lien avec le financement (Taxe IA) ou la récompense fiscale (T-C Level). 3. L'incitation : ce que le citoyen gagne (entre ${rcLimits.minPaymentAmount.value}€ et ${rcLimits.maxPaymentAmount.value}€).
        Utilisez un ton pédagogique et engageant.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL, 
            temperature: 0.5 
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur lors de la génération IA pour ${categoryName}:`, error);
        return `Détail non disponible: Échec de la connexion au service IA pour la catégorie ${categoryName}.`;
    }
}

export async function generateTaxeAiJustification() {
    const debateArgs = (await readSourceData()).documentation.find(doc => doc.identifier === "DEBATE-ARGUMENTS")?.points[0];

    const prompt = `
        Rédigez un paragraphe (max 5 phrases) expliquant la nécessité de la Taxe IA et en quoi elle n'est pas une pénalité, mais un mécanisme de régulation éthique.
        Utilisez la contre-attaque contre la critique de la 'fuite des entreprises' (argument: "${debateArgs.reponse}").
    `;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL, 
            temperature: 0.4 
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        return "Analyse de la Taxe IA non disponible (Erreur IA).";
    }
}

export async function generateFaqSuggestion(sessions) { 
    const expertSessions = sessions.filter(s => s.difficulty === 'expert');
    const expertQuestions = expertSessions.map(s => s.question).join('\n');

    const prompt = `
        Voici une liste de questions 'expert' posées par l'opposition:
        ${expertQuestions}
        
        En tant qu'analyste politique IA, identifiez le point faible le plus récurrent ou la nouvelle angle d'attaque.
        Générez UNE nouvelle question FAQ (niveau expert) qui synthétise cette faiblesse.
        Répondez UNIQUMEMENT avec la nouvelle question.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GAN_MODEL,
            temperature: 0.7 
        });
        return chatCompletion.choices[0].message.content.trim();
    } catch (error) {
        return "Quelle est la pénalité exacte pour un Partenaire Oracle qui valide de fausses actions ?";
    }
}

/**
 * Interroge Llama (Groq) pour générer des leviers d'action factuels (pour le moteur 1001 solutions).
 */
export async function generateLlamaSolution(problemQuestion) {
    const prompt = `
        En tant qu'analyste opérationnel, proposez 5 actions concrètes pour résoudre la question suivante : "${problemQuestion}". 
        Répondez sous forme d'une liste courte numérotée, sans introduction.
    `;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL, 
            temperature: 0.2 
        });
        return chatCompletion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erreur Llama Solution:", error);
        return ""; 
    }
}

// --- Récapitulatif des Exports pour server.js (maintenant complet) ---
export { 
 // generateQuestion, 
 // generateAnswer,
 // generateCvnuDetails,
 // generateTaxeAiJustification,
 // generateFaqSuggestion,
 // generateLlamaSolution,
 // generateTopFaqTitle // AJOUTÉ : Export de la fonction de titre pour la route /api/faq-stats
};