// cv_processing.js
// Logique métier complexe pour le CV et le chatbot.

document.addEventListener('DOMContentLoaded', () => {
    const chatbotMessages = document.getElementById('chatbot-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatbotProgress = document.getElementById('chatbot-progress');
    const progressBar = chatbotProgress.querySelector('.progress-bar');
    const chatbotModalElement = document.getElementById('chatbotModal');

    let conversationHistory = []; // Pour stocker l'historique de la conversation

    // Fonction pour ajouter un message à la zone de discussion
    function addMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'text-end' : 'text-start');
        messageElement.innerHTML = `<strong>${sender === 'user' ? 'Vous' : 'Assistant'} :</strong> ${message}`;
        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll vers le bas
    }

    // Fonction pour afficher/cacher la barre de progression
    function showProgress(show) {
        if (show) {
            chatbotProgress.classList.remove('d-none');
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', '100');
        } else {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', '0');
            chatbotProgress.classList.add('d-none');
        }
    }

    // Fonction pour envoyer un message à l'API Groq (votre assistant CV)
    async function sendMessageToAssistant(message) {
        addMessage('user', message);
        conversationHistory.push({ role: "user", content: message });
        userInput.value = ''; // Effacer l'entrée utilisateur
        sendButton.disabled = true;
        userInput.disabled = true;
        showProgress(true); // Afficher la barre de progression

        try {
            const response = await fetch('/api/chat-with-cv-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            const assistantResponse = data.reply;

            addMessage('assistant', assistantResponse);
            conversationHistory.push({ role: "assistant", content: assistantResponse });

        } catch (error) {
            console.error('Erreur lors de la communication avec l\'assistant CV:', error);
            addMessage('assistant', 'Désolé, une erreur est survenue. Veuillez réessayer.');
        } finally {
            showProgress(false); // Cacher la barre de progression
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus(); // Redonner le focus
        }
    }

    // Gestion de l'envoi du message
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            sendMessageToAssistant(message);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Initialisation de la conversation lorsque le modal est ouvert
    chatbotModalElement.addEventListener('shown.bs.modal', () => {
        // Optionnel : Réinitialiser la conversation à chaque ouverture ou reprendre
        // Ici, nous allons initialiser un message de bienvenue si l'historique est vide.
        if (conversationHistory.length === 0) {
            addMessage('assistant', "Bonjour ! Je suis l'assistant personnel de Mickael Cauchon. Posez-moi des questions sur son parcours, ses compétences ou ses projets !");
            conversationHistory.push({ role: "assistant", content: "Bonjour ! Je suis l'assistant personnel de Mickael Cauchon. Posez-moi des questions sur son parcours, ses compétences ou ses projets !" });
        }
        userInput.focus();
    });

    // Optionnel : Réinitialiser la conversation à la fermeture du modal
    chatbotModalElement.addEventListener('hidden.bs.modal', () => {
        conversationHistory = []; // Efface l'historique
        chatbotMessages.innerHTML = ''; // Efface les messages affichés
        userInput.value = '';
        showProgress(false);
    });
});