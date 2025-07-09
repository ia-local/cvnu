// public/js/utils.js

/**
 * Affiche un message de statut global à l'utilisateur.
 * @param {string} message - Le message à afficher.
 * @param {string} type - Le type de message ('info', 'success', 'warning', 'error').
 */
export function showStatusMessage(message, type = 'info') {
    const globalStatusMessage = document.getElementById('globalStatusMessage');
    if (globalStatusMessage) {
        globalStatusMessage.textContent = message;
        globalStatusMessage.className = `status-message ${type} active`;
        setTimeout(() => {
            globalStatusMessage.classList.remove('active');
        }, 3000);
    } else {
        console.warn('Element #globalStatusMessage not found. Message:', message);
    }
}

/**
 * Bascule entre le thème clair et sombre de l'application.
 */
export function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Update toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.querySelector('.toggle-circle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}
