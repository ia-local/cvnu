// public/modal.js

// Exporte les fonctions et gestionnaires d'événements liés au modal Bootstrap
export function initializeModal(chatbotModalElement, conversationHistory, addMessage, userInput) {
    // Initialisation de la conversation lorsque le modal est ouvert
    chatbotModalElement.addEventListener('shown.bs.modal', () => {
        // Ajouter un message de bienvenue si l'historique est vide
        if (conversationHistory.length === 0) {
            const welcomeMessage = "Bonjour ! Je suis l'assistant personnel de Mickael Cauchon. Posez-moi des questions sur son parcours, ses compétences ou ses projets !";
            addMessage('assistant', welcomeMessage);
            conversationHistory.push({ role: "assistant", content: welcomeMessage });
        }
        userInput.focus();
    });

    // Réinitialiser la conversation à la fermeture du modal
    chatbotModalElement.addEventListener('hidden.bs.modal', () => {
        conversationHistory.length = 0; // Efface l'historique de la conversation
        document.getElementById('chatbot-messages').innerHTML = ''; // Efface les messages affichés
        userInput.value = '';
        // Cacher la barre de progression si elle était visible
        document.getElementById('chatbot-progress').classList.add('d-none');
        document.getElementById('chatbot-progress').querySelector('.progress-bar').style.width = '0%';
        document.getElementById('chatbot-progress').querySelector('.progress-bar').setAttribute('aria-valuenow', '0');
    });
}