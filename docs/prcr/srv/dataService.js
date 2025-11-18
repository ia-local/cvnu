// srv/dataService.js
import { readFile, writeFile, appendFile } from 'fs/promises'; 
import path from 'path';
import { fileURLToPath } from 'url';
// --- Configuration des Chemins (Définis ici pour être utilisés dans les fonctions) ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json'); 
const SOURCE_DATA_FILE = path.join(__dirname, 'data_source.json'); 
const CVNU_DATA_FILE = path.join(__dirname, 'data_cvnu.json'); 
const FAQ_DATA_FILE = path.join(__dirname, 'data_faq.json'); // Nouveau chemin FAQ
const GAN_DATA_FILE = path.join(__dirname, 'data_gan.json');
const SYSTEM_LOG_FILE = path.join(__dirname, 'system.log');
/** Écrit un message dans le fichier system.log avec un horodatage. */
// Dans la fonction logSystemEvent :
export async function logSystemEvent(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    try {
        // Cette ligne fonctionne maintenant
        await appendFile(SYSTEM_LOG_FILE, logEntry, 'utf-8'); 
    } catch (error) {
        console.error("CRITICAL ERROR: Failed to write to system.log file.", error);
    }
}
// --- Fonctions CRUD Générales (Policy Data) ---
export async function readPolicyData() {
    try {
        const data = await readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Erreur de lecture du fichier de politique:", error.message);
        return { policyComponents: [] }; 
    }
}

export async function writePolicyData(data) {
    try {
        await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error("Erreur d'écriture du fichier de politique:", error);
        return false;
    }
}

// --- Fonctions CRUD CVNU Actions ---
export async function readCvnuActions() {
    try {
        const data = await readFile(CVNU_DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return []; 
    }
}

export async function writeCvnuActions(data) {
    try {
        await writeFile(CVNU_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error("Erreur d'écriture des actions CVNU:", error);
        return false;
    }
}

// --- Fonctions CRUD Corpus de Texte ---
export async function readSourceData() {
    try {
        const data = await readFile(SOURCE_DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Erreur de lecture du fichier source:", error.message);
        return { documentation: [] }; 
    }
}

// --- Fonctions CRUD FAQ (Correction de l'erreur d'itération) ---
export async function readFaqData() {
    try {
        const data = await readFile(FAQ_DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        
        // CORRECTION DE L'ERREUR : Assurer que questions_compteur est un tableau.
        if (!parsed.questions_compteur || !Array.isArray(parsed.questions_compteur)) {
            parsed.questions_compteur = [];
        }
        return parsed;

    } catch (error) {
        // Initialiser avec une structure valide en cas d'erreur de lecture/parsing
        return { questions_compteur: [], original_questions_asked: 0 }; 
    }
}

export async function writeFaqData(data) {
    try {
        await writeFile(FAQ_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error("Erreur d'écriture du fichier FAQ:", error);
        return false;
    }
}
export async function readGanData() {
    try {
        const data = await readFile(GAN_DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { log_version: "1.0", sessions: [], epoch_count: 0, sessions_since_last_epoch: 0 };
    }
}

export async function writeGanData(data) {
    try {
        await writeFile(GAN_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error("Erreur d'écriture du fichier GAN Log:", error);
        return false;
    }
}