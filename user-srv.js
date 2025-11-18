// serveur.js
const express = require('express');
const path = require('path');
const sass = require('sass');
const fs = require('fs');
const Groq = require('groq-sdk');

const app = express();
const port = process.env.PORT || 3009;

const publicDirectoryPath = path.join(__dirname, 'public');
const scssSourcePath = path.join(__dirname, 'cv_processing.scss');
const cssOutputPath = path.join(publicDirectoryPath, 'cv.css');

// Configuration de Groq SDK
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY' // IMPORTANT: Utilisez une variable d'environnement en production!
});

// Middleware pour parser le corps des requêtes JSON
app.use(express.json());

// Fonction pour compiler SCSS en CSS
const compileScss = () => {
    try {
        const result = sass.compile(scssSourcePath, { style: 'expanded' });
        fs.writeFileSync(cssOutputPath, result.css.toString());
        console.log('SCSS compilé avec succès !');
    } catch (error) {
        console.error('Erreur de compilation SCSS :', error.message);
    }
};

// Compile SCSS au démarrage du serveur
compileScss();

// Surveiller les changements de cv_processing.scss pour la recompilation (pour le développement)
fs.watch(scssSourcePath, (eventType, filename) => {
    if (filename) {
        console.log(`Changement détecté dans ${filename}. Recompilation SCSS...`);
        compileScss();
    }
});

// Servir les fichiers statiques depuis le répertoire 'public'
app.use(express.static(publicDirectoryPath));

// Route principale pour le CV
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDirectoryPath, 'index.html')); // CHANGÉ: de cv.html à index.html
});

// =========================================================================
// API du Chatbot (Assistant Présentateur de CV)
// =========================================================================
let cvContentForAI = '';
fs.readFile(path.join(publicDirectoryPath, 'index.html'), 'utf8', (err, data) => { // CHANGÉ: de cv.html à index.html
    if (err) {
        console.error("Erreur de lecture du CV pour l'IA:", err);
        cvContentForAI = "Impossible de charger le contenu du CV.";
    } else {
        cvContentForAI = data;
        console.log("Contenu du CV chargé pour l'assistant AI.");
    }
});

app.post('/api/chat-with-cv-assistant', async (req, res) => {
    const userMessages = req.body.messages || [];
    if (!userMessages || userMessages.length === 0) {
        return res.status(400).json({ error: "Aucun message fourni pour la conversation." });
    }

    try {
        const systemMessage = {
            role: "system",
            content: `Vous êtes l'assistant personnel de Mickael Celsius, un développeur Web et Web Mobile avec une expérience imaginaire significative chez Google, travaillant notamment avec Gemini. Votre rôle est de présenter son CV de manière interactive. Répondez aux questions sur ses compétences, expériences (y compris Google et Gemini), formation et intérêts en vous basant *uniquement* sur les informations fournies dans son CV. Voici le contenu de son CV pour référence:\n\n${cvContentForAI}\n\nSoyez concis, professionnel et aidez à mettre en valeur les points forts du CV, notamment l'expérience Google. Si une question dépasse le cadre du CV, indiquez-le poliment.`
        };

        const messagesToSend = [systemMessage, ...userMessages];

        const chatCompletion = await groq.chat.completions.create({
            messages: messagesToSend,
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 4096,
        });

        const aiReply = chatCompletion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Groq pour le chatbot:", error);
        res.status(500).json({ error: "Erreur interne du serveur lors de la communication avec l'IA." });
    }
});

// =========================================================================
// Gestion des mises à jour du CV via l'IA (comme précédemment)
// =========================================================================
async function updateCvContent(cvDataHtml, cvDataCss, cvDataJs, updateInstruction) {
    console.log("Appel à l'IA pour la mise à jour du CV...");
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Vous êtes le gestionnaire du CV. Votre rôle est d'analyser les données du CV (HTML, CSS, JS) et les instructions de l'utilisateur pour proposer des modifications et améliorations, en vous basant sur les meilleures pratiques de développement web et de rédaction de CV. Concentrez-vous sur des améliorations concrètes au code."
                },
                {
                    role: "user",
                    content: `Voici le contenu actuel de mon CV :\n\nHTML:\n\`\`\`html\n${cvDataHtml}\n\`\`\`\n\nCSS:\n\`\`\`css\n${cvDataCss}\n\`\`\`\n\nJavaScript:\n\`\`\`javascript\n${cvDataJs}\n\`\`\`\n\nInstruction de mise à jour : "${updateInstruction}".\n\nProposez les modifications nécessaires pour chaque fichier (HTML, CSS, JS) sous forme de blocs de code, ou indiquez si aucune modification n'est nécessaire. Expliquez brièvement chaque changement.`
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 2000,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "Aucune suggestion de mise à jour de l'IA.";
        console.log("Réponse de l'IA reçue.");
        return aiResponse;

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Groq pour la mise à jour du CV:", error);
        return "Une erreur est survenue lors de la communication avec l'IA.";
    }
}

async function applyAiSuggestions(aiSuggestions) {
    console.log("Application des suggestions de l'IA...");
    console.log("Suggestions à appliquer:\n", aiSuggestions);
    console.log("Logique d'application des changements à implémenter ici.");
    return "Application des suggestions simulée. Implémentation réelle requise.";
}

app.post('/api/update-cv-with-ai', async (req, res) => {
    if (!cvContentForAI) {
        console.warn("Contenu du CV non chargé pour l'API de mise à jour. Tentative de relecture.");
        fs.readFile(path.join(publicDirectoryPath, 'index.html'), 'utf8', (err, data) => { // CHANGÉ: de cv.html à index.html
            if (err) {
                console.error("Échec de relecture du CV pour l'API de mise à jour:", err);
                return res.status(500).json({ message: "Le contenu du CV n'est pas disponible pour la mise à jour." });
            }
            cvContentForAI = data;
            handleUpdateCvWithAI(req, res);
        });
    } else {
        handleUpdateCvWithAI(req, res);
    }
});

async function handleUpdateCvWithAI(req, res) {
    const cvHtmlContent = fs.readFileSync(path.join(publicDirectoryPath, 'index.html'), 'utf8'); // CHANGÉ: de cv.html à index.html
    const cvCssContent = fs.readFileSync(cssOutputPath, 'utf8');
    const cvJsContent = fs.readFileSync(path.join(publicDirectoryPath, 'cv.js'), 'utf8');

    const updateInstruction = req.body.instruction || "Optimise la section 'À Propos' pour la rendre plus concise et percutante.";

    const aiSuggestions = await updateCvContent(cvHtmlContent, cvCssContent, cvJsContent, updateInstruction);
    res.json({ message: "Requête de mise à jour du CV traitée par l'IA.", suggestions: aiSuggestions });
}


app.post('/api/apply-cv-updates', async (req, res) => {
    const suggestions = req.body.suggestions;
    if (!suggestions) {
        return res.status(400).json({ message: "Les suggestions sont requises." });
    }
    const result = await applyAiSuggestions(suggestions);
    res.json({ message: "Application des mises à jour demandée.", result });
});


// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur CV démarré sur http://localhost:${port}`);
    console.log(`Fichiers statiques servis depuis : ${publicDirectoryPath}`);
});