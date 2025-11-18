// public/cv.js

// Importe les modules nécessaires
import { initializeModal } from './modal.js';
import { initializeChatbot } from './chatbot.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Le CV est chargé et prêt pour des interactions JavaScript !');

    const chatbotModalElement = document.getElementById('chatbotModal');
    const userInput = document.getElementById('user-input');

    let conversationHistory = []; // Pour stocker l'historique de la conversation

    // Initialise le chatbot et récupère sa fonction addMessage
    const { addMessage } = initializeChatbot(conversationHistory);

    // Initialise le modal avec les fonctions et variables nécessaires
    initializeModal(chatbotModalElement, conversationHistory, addMessage, userInput);
});