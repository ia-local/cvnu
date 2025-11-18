// Fichier : server_modules/userService.js
// Gère la persistance des données utilisateur dans users.json

const path = require('path');
const fs = require('fs/promises');

// Chemin vers le fichier de données des utilisateurs
const USERS_FILE_PATH = path.join(__dirname, '..', 'data', 'users.json');

/**
 * Lit le fichier users.json. Crée un fichier vide si non trouvé.
 * @returns {Promise<Array<Object>>} Tableau d'objets utilisateur.
 */
async function readUsersFile() {
    try {
        const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(USERS_FILE_PATH, '[]', 'utf8');
            return [];
        }
        console.error('Erreur lors de la lecture de users.json:', error);
        throw new Error('Erreur de lecture de la base de données utilisateur.');
    }
}

/**
 * Écrit les données dans le fichier users.json.
 * @param {Array<Object>} users - Tableau d'objets utilisateur à sauvegarder.
 */
async function writeUsersFile(users) {
    try {
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur lors de l\'écriture de users.json:', error);
        throw new Error('Erreur d\'écriture dans la base de données utilisateur.');
    }
}

/**
 * Renvoie le nombre total d'utilisateurs.
 * @returns {Promise<number>}
 */
async function getUserCount() {
    const users = await readUsersFile();
    return users.length;
}

module.exports = {
    readUsersFile,
    writeUsersFile,
    getUserCount
};