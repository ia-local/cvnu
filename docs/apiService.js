// public/js/apiService.js

const API_BASE_URL = window.location.origin;

/**
 * Effectue une requête HTTP générique.
 * @param {string} url - L'URL de l'API.
 * @param {string} method - La méthode HTTP (GET, POST, DELETE, etc.).
 * @param {object} [body=null] - Le corps de la requête pour les méthodes POST/PUT.
 * @returns {Promise<any>} - La réponse JSON de l'API.
 * @throws {Error} - En cas d'erreur HTTP ou réseau.
 */
async function makeApiRequest(url, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (response.status === 429) {
        throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
    }

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: await response.text() }; // Fallback if not JSON
        }
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
    }

    // Tente de parser JSON, sinon renvoie le texte brut (utile pour le rendu HTML du CV)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    } else {
        return response.text();
    }
}

// --- Fonctions spécifiques pour les endpoints API ---

export const api = {
    // API pour les interactions ponctuelles
    generateResponse: (prompt) => makeApiRequest(`${API_BASE_URL}/api/generate`, 'POST', { prompt }),

    // API pour le dashboard
    fetchDashboardInsights: () => makeApiRequest(`${API_BASE_URL}/api/dashboard-insights`),

    // API pour le générateur de CV
    parseAndStructureCv: (cvContent) => makeApiRequest(`${API_BASE_URL}/api/cv/parse-and-structure`, 'POST', { cvContent }),
    renderCvHtml: (cvData) => makeApiRequest(`${API_BASE_URL}/api/cv/render-html`, 'POST', { cvData }),
    fetchLastStructuredCvData: () => makeApiRequest(`${API_BASE_URL}/api/cv/last-structured-data`),
    valorizeCv: (cvContent) => makeApiRequest(`${API_BASE_URL}/api/valorize-cv`, 'POST', { cvContent }),

    // API pour les conversations (chatbot)
    fetchConversations: (page, limit) => makeApiRequest(`${API_BASE_URL}/api/conversations?page=${page}&limit=${limit}`),
    fetchConversationById: (id) => makeApiRequest(`${API_BASE_URL}/api/conversations/${id}`),
    startNewConversation: () => makeApiRequest(`${API_BASE_URL}/api/conversations/new`, 'POST'),
    sendMessage: (id, message) => makeApiRequest(`${API_BASE_URL}/api/conversations/${id}/message`, 'POST', { message }),
    deleteConversation: (id) => makeApiRequest(`${API_BASE_URL}/api/conversations/${id}`, 'DELETE'),
    generateChatCvSummary: (id) => makeApiRequest(`${API_BASE_URL}/api/conversations/${id}/cv-professional-summary`),
};
