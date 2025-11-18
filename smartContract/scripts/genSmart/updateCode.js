// Fonction asynchrone pour charger le fichier JSON et afficher les données
async function loadReformeData() {
    try {
        // Charger le fichier JSON
        const response = await fetch('reforme.json'); // Remplacez par le chemin réel
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des données : ${response.status}`);
        }
        const data = await response.json();
        displayReformeData(data);
    } catch (error) {
        console.error("Erreur :", error);
        document.getElementById('content').innerHTML = "<p>Impossible de charger les données.</p>";
    }
}

// Fonction pour afficher les données dans le DOM
function displayReformeData(data) {
    const container = document.getElementById('content');
    container.innerHTML = ''; // Nettoyer le conteneur

    // Afficher le titre
    const title = document.createElement('h1');
    title.textContent = data.projetReforme.titre;
    container.appendChild(title);

    // Afficher les objectifs
    const objectivesHeader = document.createElement('h2');
    objectivesHeader.textContent = "Objectifs de la Réforme";
    container.appendChild(objectivesHeader);

    const objectivesList = document.createElement('ul');
    data.projetReforme.objectifs.forEach(obj => {
        const listItem = document.createElement('li');
        listItem.textContent = obj;
        objectivesList.appendChild(listItem);
    });
    container.appendChild(objectivesList);

    // Afficher les modifications du Code du Travail
    const modificationsHeader = document.createElement('h2');
    modificationsHeader.textContent = "Modifications du Code du Travail";
    container.appendChild(modificationsHeader);

    const modifications = data.projetReforme.modificationsCodeTravail;

    // Afficher la définition du travail
    displayArticle(modifications.definitionTravail, container, "Définition du Travail");

    // Afficher les dispositions sur les Smart Contracts
    displayArticle(modifications.smartContracts, container, "Smart Contracts");

    // Afficher la durée légale de travail
    displayArticle(modifications.dureeTravail, container, "Durée de Travail");

    // Afficher l'utilisation de la TVA
    const tvaHeader = document.createElement('h3');
    tvaHeader.textContent = "Utilisation de la TVA";
    container.appendChild(tvaHeader);

    modifications.utilisationTVA.forEach(article => {
        displayArticle(article, container, "Article TVA");
    });
}

// Fonction utilitaire pour afficher un article dans le DOM
function displayArticle(article, container, sectionTitle) {
    const section = document.createElement('section');
    section.classList.add('article-section');

    const header = document.createElement('h3');
    header.textContent = sectionTitle + (article.article ? ` : ${article.article}` : "");
    section.appendChild(header);

    const description = document.createElement('p');
    description.textContent = article.description || article.modification || "";
    section.appendChild(description);

    if (article.details) {
        const details = document.createElement('p');
        details.textContent = `Détails : ${article.details}`;
        section.appendChild(details);
    }

    if (article.nouveauArticle) {
        const newTag = document.createElement('span');
        newTag.textContent = "NOUVEAU ARTICLE";
        newTag.style.color = "green";
        newTag.style.fontWeight = "bold";
        section.appendChild(newTag);
    }

    container.appendChild(section);
}

// Charger les données lorsque la page est prête
document.addEventListener('DOMContentLoaded', loadReformeData);
