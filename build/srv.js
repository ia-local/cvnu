// serveur.js - Version unifiée et complète (Mise à jour Asynchrone)
const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises; // Utilisation des promesses de fs pour l'asynchronisme
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env file
require('dotenv').config();

// Importation des modules de calcul UTMi et des scores de qualité des modèles
const { calculateUtmi, calculateDashboardInsights, COEFFICIENTS } = require('./server_modules/utms_calculator');
const { MODEL_QUALITY_SCORES } = require('./server_modules/model_quality_config');

// Modules spécifiques au générateur de CV
const { analyzeRawConversation } = require('./analyse_soup');
const { analyzeConversationCognitively } = require('./llama_cognitive_analysis'); // MOCK ou votre implémentation
const { generateCurriculumVitae } = require('./generateCV'); // MOCK ou votre implémentation
const { valorizeSkillsWithGroq } = require('./groq_cv_analyse');
const { generateProfessionalSummary } = require('./server_modules/cv_professional_analyzer');


// --- Server and AI Configuration ---
const config = {
  port: process.env.PORT || 3000,
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'gemma2-9b-it', // Modèle par défaut pour les conversations de chat
    temperature: 0.7,
    maxTokens: 2048,
  },
  ai: {
    generalRole: "Un assistant IA expert en développement et en conseil technique.",
    generalContext: "Fournir des réponses précises, concises et utiles sur des sujets de programmation, d'architecture logicielle et de technologies web. Votre logique métier est d'être un conseiller technique fiable.",
    chatbotRole: "Un coach de carrière IA, expert en extraction de compétences et de savoir-faire pour la rédaction de CV.",
    chatbotContext: "Votre objectif est d'aider l'utilisateur à structurer son parcours professionnel. Posez des questions ciblées sur ses expériences, projets, compétences techniques (langages, outils, plateformes), défis rencontrés et solutions apportées, réalisations quantifiables, responsabilités et soft skills. Guidez-le pour qu'il exprime clairement ses aptitudes professionnelles.",
  },
  logFilePath: path.join(__dirname, 'logs.json'),
  conversationsFilePath: path.join(__dirname, 'conversations.json')
};

// Validate Groq API Key
if (!config.groq.apiKey) {
  console.error("❌ Erreur: La clé API Groq (GROQ_API_KEY) n'est pas configurée dans les variables d'environnement.");
  process.exit(1);
}

const groq = new Groq({ apiKey: config.groq.apiKey });
const app = express();

// --- Global Log Management (Async) ---
const writeLog = async (logEntry) => {
  const timestamp = new Date().toISOString();
  const log = { timestamp, ...logEntry };

  try {
    let logs = [];
    // Utiliser fs.promises.readFile pour lire le fichier de manière asynchrone
    // Gérer l'erreur si le fichier n'existe pas (première exécution)
    try {
      const data = await fs.readFile(config.logFilePath, 'utf8');
      logs = JSON.parse(data);
    } catch (readError) {
      if (readError.code === 'ENOENT') {
        console.log(`➡️ Fichier de log non trouvé, en création : ${config.logFilePath}`);
        logs = []; // Le fichier n'existe pas, commencer avec un tableau vide
      } else {
        console.error(`⚠️ Fichier de log corrompu ou illisible (${config.logFilePath}). Réinitialisation.`);
        logs = []; // Fichier corrompu, réinitialiser
      }
    }

    logs.push(log);
    await fs.writeFile(config.logFilePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error("❌ Erreur lors de l'écriture du log dans logs.json:", error.message);
  }
};

// --- Conversation History Management (Async) ---
let conversations = []; // In-memory storage for current session

const loadConversations = async () => {
  try {
    const data = await fs.readFile(config.conversationsFilePath, 'utf8');
    conversations = JSON.parse(data);
    console.log(`➡️ Conversations historiques chargées depuis : ${config.conversationsFilePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`➡️ Fichier d'historique des conversations non trouvé, en création : ${config.conversationsFilePath}`);
      await fs.writeFile(config.conversationsFilePath, JSON.stringify([]));
      conversations = [];
    } else {
      console.error("❌ Erreur lors du chargement des conversations historiques:", error.message);
      conversations = []; // Start fresh if file is corrupted
    }
  }
};

const saveConversations = async () => {
  try {
    await fs.writeFile(config.conversationsFilePath, JSON.stringify(conversations, null, 2), 'utf8');
  } catch (err) {
    console.error("❌ Erreur lors de l'écriture de l'historique des conversations:", err.message);
  }
};


// --- Middleware Setup ---
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
console.log(`➡️ Service des fichiers statiques depuis : ${path.join(__dirname, 'public')}`);

// --- API Endpoints ---

/**
 * POST /api/generate
 * Génère du contenu via l'API Groq (Interaction ponctuelle).
 * Enregistre les interactions et les UTMi dans les logs.
 */
app.post('/api/generate', async (req, res) => {
  const userPrompt = req.body.prompt;
  const modelToUse = req.body.model || config.groq.model; // Peut utiliser le modèle du chatbot ou être spécifié

  if (!userPrompt) {
    await writeLog({ type: 'ERROR', message: 'Prompt manquant', prompt: userPrompt });
    return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
  }

  const requestStartTime = Date.now();
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: userPrompt }],
      model: modelToUse,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    const processingTime = (Date.now() - requestStartTime) / 1000; // en secondes
    const responseTokenCount = chatCompletion.usage?.output_tokens || Math.ceil(aiResponseContent?.length / 4);
    const promptTokenCount = chatCompletion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4);


    if (aiResponseContent) {
        // --- Calcul UTMi pour la réponse AI ---
        const aiResponseInteractionData = {
            type: COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: aiResponseContent,
                tokenCount: responseTokenCount,
                outputTokens: responseTokenCount,
                inputTokens: promptTokenCount,
                modelId: modelToUse,
                relevance: true, // Placeholder
                coherence: true,
                completeness: true,
                problemSolved: false, // Placeholder
                isFiscalEconomicInsight: aiResponseContent.toLowerCase().includes('fiscal') || aiResponseContent.toLowerCase().includes('économie'),
                isMetierSpecificSolution: false
            }
        };
        const aiResponseUtmiResult = calculateUtmi(aiResponseInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

        await writeLog({
            type: 'AI_RESPONSE_PUNCTUAL',
            prompt: userPrompt,
            response: aiResponseContent,
            model: modelToUse,
            utmi: aiResponseUtmiResult.utmi,
            estimatedCost: aiResponseUtmiResult.estimatedCostUSD,
            processingTime: processingTime
        });

        res.status(200).json({ response: aiResponseContent, utmi: aiResponseUtmiResult.utmi, estimatedCost: aiResponseUtmiResult.estimatedCostUSD });

    } else {
        await writeLog({ type: 'ERROR', message: 'Réponse IA vide', prompt: userPrompt, model: modelToUse });
        res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Groq (ponctuel):', error);
    await writeLog({ type: 'ERROR', message: 'Erreur API Groq (ponctuel)', details: error.message, prompt: userPrompt, model: modelToUse });
    res.status(500).json({ error: 'Une erreur interne est survenue lors de la communication avec l\'IA.' });
  }
});

/**
 * GET /api/dashboard-insights
 * Retourne les insights UTMi agrégés de tous les logs.
 */
app.get('/api/dashboard-insights', async (req, res) => {
    try {
        const data = await fs.readFile(config.logFilePath, 'utf8');
        const logs = JSON.parse(data);
        const insights = calculateDashboardInsights(logs);
        res.status(200).json(insights);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log("Fichier de log non trouvé pour le dashboard, retournant des insights vides.");
            return res.status(200).json(calculateDashboardInsights([])); // Retourne des insights vides si pas de log
        }
        console.error("Erreur lecture/parsing logs pour insights:", err);
        res.status(500).json({ error: "Impossible de lire/parser les logs pour les insights." });
    }
});

// --- API Endpoints for Chatbot Conversations ---

/**
 * GET /api/conversations
 * Retrieves all stored conversation histories.
 */
app.get('/api/conversations', (req, res) => {
  // Not awaiting writeLog here to keep it non-blocking on this common GET
  writeLog({ type: 'CONVERSATION_HISTORY', action: 'READ_ALL', count: conversations.length });
  res.status(200).json(conversations.map(({ id, createdAt, title, utmi_total, estimated_cost_total_usd }) => ({ id, createdAt, title, utmi_total, estimated_cost_total_usd })));
});

/**
 * GET /api/conversations/:id
 * Retrieves a specific conversation history by ID.
 */
app.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conversation = conversations.find(conv => conv.id === id);
  if (conversation) {
    const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');
    res.status(200).json({ ...conversation, messages: userVisibleMessages });
  } else {
    res.status(404).json({ error: 'Conversation non trouvée.' });
  }
});

/**
 * POST /api/conversations/new
 * Starts a new conversation.
 */
app.post('/api/conversations/new', async (req, res) => {
  const newConversationId = uuidv4();
  const systemMessage = {
    role: "system",
    content: `${config.ai.chatbotRole} ${config.ai.chatbotContext}`
  };
  const initialMessages = [systemMessage];

  const sessionStartUtmiResult = calculateUtmi({ type: COEFFICIENTS.LOG_TYPES.SESSION_START }, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

  const newConversation = {
    id: newConversationId,
    createdAt: new Date().toISOString(),
    messages: initialMessages,
    title: `Conversation ${new Date().toLocaleString()}`,
    utmi_total: sessionStartUtmiResult.utmi,
    estimated_cost_total_usd: sessionStartUtmiResult.estimatedCostUSD
  };
  conversations.push(newConversation);
  await saveConversations(); // Await asynchronous save
  await writeLog({
      type: 'CONVERSATION_MANAGEMENT',
      action: 'NEW_CONVERSATION',
      conversationId: newConversationId,
      utmi_generated: newConversation.utmi_total,
      estimated_cost_usd: newConversation.estimated_cost_total_usd
  });
  res.status(201).json(newConversation);
});

/**
 * POST /api/conversations/:id/message
 * Sends a message within an existing conversation and gets an AI response.
 */
app.post('/api/conversations/:id/message', async (req, res) => {
  const { id } = req.params;
  const userMessageContent = req.body.message;
  const modelToUse = config.groq.model;

  if (!userMessageContent) {
    await writeLog({ type: 'CONVERSATION_ERROR', action: 'SEND_MESSAGE_FAIL', reason: 'Missing message', conversationId: id });
    return res.status(400).json({ error: "Le champ 'message' est manquant dans le corps de la requête." });
  }

  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex === -1) {
    await writeLog({ type: 'CONVERSATION_ERROR', action: 'SEND_MESSAGE_FAIL', reason: 'Conversation not found', conversationId: id });
    return res.status(404).json({ error: 'Conversation non trouvée.' });
  }

  const currentConversation = conversations[conversationIndex];

  const userPromptInteractionData = {
      type: COEFFICIENTS.LOG_TYPES.PROMPT,
      data: {
          text: userMessageContent,
          wordCount: userMessageContent.split(/\s+/).filter(word => word.length > 0).length,
          inputTokens: Math.ceil(userMessageContent.length / 4),
      }
  };
  const userUtmiResult = calculateUtmi(userPromptInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

  currentConversation.messages.push({
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      utmi: userUtmiResult.utmi,
      estimated_cost_usd: userUtmiResult.estimatedCostUSD
  });
  currentConversation.utmi_total = (currentConversation.utmi_total || 0) + userUtmiResult.utmi;
  currentConversation.estimated_cost_total_usd = (currentConversation.estimated_cost_total_usd || 0) + userUtmiResult.estimatedCostUSD;

  await writeLog({
      type: 'CONVERSATION_MESSAGE',
      action: 'USER_MESSAGE_SENT',
      conversationId: id,
      userMessage: userMessageContent.substring(0, 100) + '...',
      utmi: userUtmiResult.utmi,
      estimated_cost_usd: userUtmiResult.estimatedCostUSD,
      interaction: userPromptInteractionData
  });

  try {
    const messagesForGroq = currentConversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesForGroq,
      model: modelToUse,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    const responseTokenCount = chatCompletion.usage?.output_tokens || Math.ceil(aiResponseContent?.length / 4);
    const promptTokenCount = chatCompletion.usage?.prompt_tokens || Math.ceil(messagesForGroq.map(m => m.content).join('').length / 4);

    if (aiResponseContent) {
        const aiResponseInteractionData = {
            type: COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: aiResponseContent,
                tokenCount: responseTokenCount,
                outputTokens: responseTokenCount,
                inputTokens: promptTokenCount,
                modelId: modelToUse,
                relevance: true,
                coherence: true,
                completeness: true,
                problemSolved: false,
                isFiscalEconomicInsight: aiResponseContent.toLowerCase().includes('fiscal') || aiResponseContent.toLowerCase().includes('économie'),
                isMetierSpecificSolution: false
            }
        };
        const aiUtmiResult = calculateUtmi(aiResponseInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

        currentConversation.messages.push({
            role: 'assistant',
            content: aiResponseContent,
            timestamp: new Date().toISOString(),
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD
        });
        currentConversation.utmi_total = (currentConversation.utmi_total || 0) + aiUtmiResult.utmi;
        currentConversation.estimated_cost_total_usd = (currentConversation.estimated_cost_total_usd || 0) + aiUtmiResult.estimatedCostUSD;

        await saveConversations(); // Await asynchronous save

        await writeLog({
            type: 'CONVERSATION_MESSAGE',
            action: 'AI_RESPONSE_RECEIVED',
            conversationId: id,
            aiResponse: aiResponseContent.substring(0, 100) + '...',
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD,
            interaction: aiResponseInteractionData
        });
        res.status(200).json({ aiResponse: aiResponseContent, utmi: aiUtmiResult.utmi, estimated_cost_usd: aiUtmiResult.estimatedCostUSD });
    } else {
      console.warn(`⚠️ Groq n'a pas généré de contenu pour la conversation ${id}.`);
      await writeLog({ type: 'CONVERSATION_ERROR', action: 'AI_RESPONSE_EMPTY', conversationId: id });
      res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error(`❌ Erreur lors de l'appel à l'API Groq pour la conversation ${id}:`, error);
    await writeLog({
        type: 'CONVERSATION_ERROR',
        action: 'AI_API_ERROR',
        conversationId: id,
        errorMessage: error.message,
        stack: error.stack?.substring(0, 500) + '...' || 'N/A'
    });
    res.status(500).json({ error: "Une erreur interne est survenue lors de la communication avec l'IA." });
  }
});

/**
 * DELETE /api/conversations/:id
 * Deletes a specific conversation history.
 */
app.delete('/api/conversations/:id', async (req, res) => {
  const { id } = req.params;
  const initialLength = conversations.length;
  conversations = conversations.filter(conv => conv.id !== id);

  if (conversations.length < initialLength) {
    await saveConversations(); // Await asynchronous save
    await writeLog({ type: 'CONVERSATION_MANAGEMENT', action: 'CONVERSATION_DELETED', status: 'SUCCESS', conversationId: id });
    res.status(204).send();
  } else {
    await writeLog({ type: 'CONVERSATION_MANAGEMENT', action: 'CONVERSATION_DELETED', status: 'NOT_FOUND', conversationId: id });
    res.status(404).json({ error: `Conversation avec l'ID ${id} non trouvée.` });
  }
});


// --- NOUVELLES ROUTES POUR LE GÉNÉRATEUR DE CV À PARTIR DE TEXTE (Section 1) ---

/**
 * @route POST /api/record-and-analyze
 * @description Reçoit la conversation Markdown brute, l'enregistre, puis la traite avec Llama pour générer et mettre à jour logs.json.
 * @body {string} conversationMarkdown - Le contenu de la conversation au format Markdown.
 * @returns {object} - Statut de l'opération, chemins des fichiers traités.
 */
app.post('/api/record-and-analyze', async (req, res) => {
    const { conversationMarkdown } = req.body;

    if (!conversationMarkdown) {
        return res.status(400).json({ message: 'Contenu Markdown de la conversation manquant.' });
    }

    try {
        // 1. Enregistrement initial de la conversation
        const structuredConversation = analyzeRawConversation(conversationMarkdown); // analyzeRawConversation est synchrone, c'est OK

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const markdownFileName = `conversation_pasted_${timestamp}.md`;
        const pastedConversationsDirPath = path.join(__dirname, 'conversations_pasted_raw');
        const markdownFilePath = path.join(pastedConversationsDirPath, markdownFileName);

        // Assurez-vous que le répertoire 'conversations_pasted_raw' existe de manière asynchrone
        await fs.mkdir(pastedConversationsDirPath, { recursive: true }).catch(err => {
            if (err.code !== 'EEXIST') throw err; // Ne pas jeter d'erreur si le dossier existe déjà
        });
        await fs.writeFile(markdownFilePath, conversationMarkdown, 'utf8');
        console.log(`Conversation brute collée enregistrée dans ${markdownFilePath}`);

        // 2. Analyse cognitive par Llama et enregistrement dans logs.json
        const cognitiveAnalysisResult = await analyzeConversationCognitively(structuredConversation);

        const logEntry = {
            id: `pasted_conv_${timestamp}`,
            date: new Date().toISOString(),
            rawMarkdownPath: markdownFilePath,
            analysis: cognitiveAnalysisResult
        };

        let existingLogs = [];
        try {
            const data = await fs.readFile(config.logFilePath, 'utf8');
            existingLogs = JSON.parse(data);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                console.log("Fichier de log non trouvé lors de l'analyse CV, création d'un nouveau.");
            } else {
                console.error("Erreur de lecture du fichier de log lors de l'analyse CV:", readError);
            }
        }
        existingLogs.push(logEntry);
        await fs.writeFile(config.logFilePath, JSON.stringify(existingLogs, null, 2), 'utf8');
        console.log(`Logs de conversation mis à jour dans ${config.logFilePath}`);

        res.status(200).json({
            message: 'Conversation enregistrée et analysée cognitivement avec succès.',
            markdownFile: markdownFileName,
            logFile: 'logs.json',
            analysisResult: cognitiveAnalysisResult
        });

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement ou de l\'analyse de la conversation collée:', error);
        res.status(500).json({ message: 'Erreur serveur lors du traitement de la conversation.', error: error.message });
    }
});

/**
 * @route GET /api/generate-cv
 * @description Génère un CV HTML/CSS basé sur les logs de conversation.
 * @returns {string} - Le contenu HTML du CV.
 */
app.get('/api/generate-cv', async (req, res) => {
    try {
        const data = await fs.readFile(config.logFilePath, 'utf8');
        const logs = JSON.parse(data);

        // Génère le CV en HTML/CSS à partir des logs analysés
        const cvHtml = await generateCurriculumVitae(logs); // generateCurriculumVitae est asynchrone

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(cvHtml);
    } catch (error) {
        console.error('Erreur lors de la génération du CV HTML:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la génération du CV.', error: error.message });
    }
});

/**
 * @route POST /api/valorize-cv
 * @description Envoie le contenu textuel du CV au modèle Groq pour la valorisation des compétences.
 * @body {string} cvContent - Le contenu textuel du CV à valoriser.
 * @returns {object} - La valorisation des compétences par l'IA.
 */
app.post('/api/valorize-cv', async (req, res) => {
    const { cvContent } = req.body;

    if (!cvContent) {
        return res.status(400).json({ message: 'Contenu du CV manquant pour la valorisation.' });
    }

    try {
        // Appelle la fonction de valorisation avec Groq
        const valorizedResult = await valorizeSkillsWithGroq(cvContent); // valorizeSkillsWithGroq est asynchrone

        res.status(200).json({
            message: 'Compétences du CV valorisées avec succès.',
            valorization: valorizedResult
        });
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV avec Groq (route /api/valorize-cv):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la valorisation du CV.', error: error.message });
    }
});


// --- NOUVELLE ROUTE: Générer un résumé professionnel d'une conversation pour un CV (depuis le chat) ---
app.get('/api/conversations/:id/cv-professional-summary', async (req, res) => {
    const { id } = req.params;
    const conversation = conversations.find(conv => conv.id === id);

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    try {
        const professionalSummaryMarkdown = await generateProfessionalSummary(conversation.messages); // generateProfessionalSummary est asynchrone

        res.setHeader('Content-Type', 'text/markdown');
        res.status(200).send(professionalSummaryMarkdown);

        await writeLog({ // Await asynchronous log write
            type: 'CV_GENERATION_FROM_CHAT',
            action: 'GENERATE_SUMMARY',
            status: 'SUCCESS',
            conversationId: id,
            summaryLength: professionalSummaryMarkdown.length
        });

    } catch (error) {
        console.error(`Erreur lors de la génération du résumé professionnel pour la conversation ${id}:`, error);
        await writeLog({ // Await asynchronous log write
            type: 'CV_GENERATION_FROM_CHAT',
            action: 'GENERATE_SUMMARY',
            status: 'ERROR',
            conversationId: id,
            error: error.message
        });
        res.status(500).json({ error: 'Échec de la génération du résumé professionnel.', details: error.message });
    }
});


// --- Gestion des erreurs 404 ---
app.use((req, res) => {
    res.status(404).send('Désolé, la page demandée ou l\'API n\'a pas été trouvée.');
});

// --- Server Initialization (Wrapped in an IIFE to use await) ---
(async () => {
  await loadConversations(); // Load conversations asynchronously at startup

  app.listen(config.port, () => {
    console.log(`\n🚀 Serveur unifié démarré sur http://localhost:${config.port}`);
    console.log(`Accédez à l'interface principale : http://localhost:${config.port}/`);
    console.log(`--- API Endpoints ---`);
    console.log(`  POST /api/generate (Interaction Ponctuelle)`);
    console.log(`  GET /api/dashboard-insights`);
    console.log(`  --- Chatbot Conversationnel ---`);
    console.log(`    POST /api/conversations/new`);
    console.log(`    POST /api/conversations/:id/message`);
    console.log(`    GET /api/conversations`);
    console.log(`    GET /api/conversations/:id`);
    console.log(`    DELETE /api/conversations/:id`);
    console.log(`    GET /api/conversations/:id/cv-professional-summary (Résumé CV depuis chat)`);
    console.log(`  --- Générateur de CV depuis Texte ---`);
    console.log(`    POST /api/record-and-analyze`);
    console.log(`    GET /api/generate-cv`);
    console.log(`    POST /api/valorize-cv`);
    console.log(`Logs enregistrés dans : ${config.logFilePath}`);
    console.log(`Historique des conversations enregistré dans : ${config.conversationsFilePath}`);
  });
})(); // Self-invoking async function
