// Fichier : server_modules/scrapingService.js (Moteur de Scraping ciblé)

const fs = require('fs/promises');
const path = require('path');
const axios = require('axios'); // Nécessaire pour les appels HTTP externes
const { v4: uuidv4 } = require('uuid');

// 🛑 CHEMINS CRITIQUES (doivent correspondre aux chemins de serveur.js)
const CONFIG_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'source.json');
const TEMP_DATA_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'temp_live_data.json');
const MANIF_DATA_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'manifestation_points_2_octobre.json');


// --- CONFIGURATIONS D'ACCÈS API (À COMPLÉTER VIA .ENV) ---
// En production, ces clés seraient lues depuis process.env
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_KEY'; 
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || 'YOUR_GOOGLE_SEARCH_ID';


/**
 * Lit un fichier JSON du système de fichiers (robuste aux erreurs ENOENT).
 */
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw new Error(`Erreur de lecture de ${path.basename(filePath)}: ${error.message}`);
    }
}

/**
 * [MODÉLISATION] Effectue une recherche ciblée sur YouTube (via API).
 * Cette fonction retourne des données réelles (si les clés sont valides).
 */
async function fetchYouTubeVideo(query) {
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_KEY') {
        // Simulation si l'API n'est pas configurée
        if (query.includes('Troyes')) {
            return { link: 'https://www.youtube.com/watch?v=API_SIMULE_TROYES', title: 'Manifestation Troyes - Reportage Live' };
        }
        return null;
    }
    
    // 🛑 LOGIQUE RÉELLE D'APPEL D'API YOUTUBE (MODÈLE) 🛑
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: YOUTUBE_API_KEY,
                q: query,
                part: 'snippet',
                type: 'video',
                maxResults: 1
            }
        });

        if (response.data.items.length > 0) {
            const item = response.data.items[0];
            return {
                link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                title: item.snippet.title
            };
        }
    } catch (e) {
        console.error(`Erreur YouTube API pour la requête "${query}":`, e.message);
    }
    return null;
}


/**
 * [MODÉLISATION] Simule une recherche d'article ou d'archive via Google Custom Search/RSS.
 */
async function fetchGoogleSearch(query) {
    // 🛑 LOGIQUE RÉELLE D'APPEL D'API GOOGLE (MODÈLE) 🛑
    // Pour une recherche large, utiliser Google Custom Search API ou un service RSS de presse locale.
    
    // Simulation pour l'environnement de test
    if (query.includes('Caen Gare') && query.includes('Archive')) {
        return { link: 'https://archive.org/details/manifestation_caen_2oct_webcam', title: 'Archive - Vidéo de la Gare de Caen du 2 Octobre' };
    }
    return null;
}


/**
 * 🛑 Fonction principale du moteur de scraping 🛑
 * Lit la configuration, exécute les recherches et écrit les données temporaires.
 */
async function runRealScrapingJob() {
    console.log(`[SCRAPER] Démarrage du processus de scraping réel...`);
    
    // Charger tous les fichiers nécessaires de manière robuste
    const config = await readJsonFile(CONFIG_PATH);
    const stableData = await readJsonFile(MANIF_DATA_PATH);
    const allCollectedData = [];

    const baseKeywords = config.search_config.base_keywords || [];
    const defaultCities = config.search_config.default_city_list || [];

    // --- ÉTAPE 1 : COLLECTE DES NOUVEAUX ÉVÉNEMENTS ---
    // Cette étape est complexe et doit être faite avec une boucle d'API sur les flux RSS
    // Par souci de simplicité pour le test, nous allons simuler uniquement la collecte
    // des liens vidéos pour les événements existants (Étape 2).
    
    
    // --- ÉTAPE 2 : RECHERCHE DES LIENS VIDÉO MANQUANTS (Enrichissement ciblé) ---
    console.log("[SCRAPER] Démarrage de l'enrichissement vidéo ciblé...");

    // Filtrer les événements stables qui n'ont PAS de lien vidéo
    const pointsToEnrich = stableData.filter(item => !item.video_link);
    console.log(`[SCRAPER] ${pointsToEnrich.length} points nécessitent un enrichissement vidéo.`);

    for (const item of pointsToEnrich) {
        
        let foundLink = null;
        
        for (const sourceConfig of config.data_sources) {
            if (!sourceConfig.is_active || foundLink) continue;

            const queryTemplate = sourceConfig.query_template || "";
            const query = queryTemplate
                            .replace(/{city}/g, item.city)
                            .replace(/{name}/g, item.name);
            
            let searchResult = null;
            
            if (sourceConfig.source_type === 'YOUTUBE_SEARCH') {
                searchResult = await fetchYouTubeVideo(query);
            } else if (sourceConfig.source_type === 'ARCHIVE_ORG_WAYBACK' || sourceConfig.source_type === 'GOOGLE_NEWS') {
                // Simuler une recherche d'article qui pourrait contenir la vidéo
                searchResult = await fetchGoogleSearch(query);
            }
            
            if (searchResult && searchResult.link) {
                // Si la recherche aboutit, stocker le résultat pour l'écriture temporaire
                allCollectedData.push({
                    id: item.id, // Garder l'ID stable pour que l'intégration puisse le trouver
                    type: item.type,
                    city: item.city,
                    name: item.name,
                    lat: item.lat,
                    lon: item.lon,
                    source: sourceConfig.name,
                    video_link: searchResult.link,
                    description: searchResult.title
                });
                foundLink = searchResult.link;
            }
        }
    }
    
    // --- ÉCRITURE TEMPORAIRE ---
    // Écriture de TOUS les résultats collectés (enrichissement inclus) dans le fichier temporaire
    await fs.writeFile(TEMP_DATA_PATH, JSON.stringify(allCollectedData, null, 2), 'utf8');

    console.log(`[SCRAPER] Écriture dans ${path.basename(TEMP_DATA_PATH)} terminée. ${allCollectedData.length} enrichissements/points prêts.`);

    return allCollectedData.length;
}

module.exports = { runRealScrapingJob };