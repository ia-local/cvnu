CVNU - Plateforme de Gestion de Carrière Augmentée par l'IA
============================================================

Sommaire
Introduction

Fonctionnalités

Gestion de CVNU de Base

Fonctionnalités Augmentées par l'IA

Fonctionnement du Système Augmenté par l'IA

Assistant IA Conversationnel

Générateur de CV depuis un Texte

Interaction IA Ponctuelle

Tableau de Bord UTMi

Coefficients et Calculs UTMi (utms_calculator.js)

Architecture du Projet et Fichiers Clés

Utilisation

Exemples d'Utilisation

Notes de Sécurité

Introduction
Le CVNU (CV Numérique Universel) est un projet innovant qui vise à créer un système de gestion de compétences et d'expériences professionnelles. Il permet aux utilisateurs de créer, gérer et partager leur profil de manière sécurisée et transparente. Ce projet est désormais augmenté par des capacités d'Intelligence Artificielle qui transforment les interactions en un atout tangible pour le développement de carrière.

En capturant, analysant et valorisant les conversations avec une IA spécialisée, le système permet de construire un profil de compétences dynamique, de générer des Curriculum Vitae (CV) pertinents, et de quantifier la valeur de chaque interaction via les Unités Temporelles Monétisables (UTMi). Le CVNU cherche à monétiser votre temps et à valoriser votre croissance professionnelle.

Fonctionnalités
Le système est articulé autour de fonctionnalités fondamentales du CVNU et de nouvelles capacités enrichies par l'IA.

Gestion de CVNU de Base
Création de CVNU : Les utilisateurs peuvent créer un CVNU qui contient leurs compétences et expériences professionnelles.

Gestion de compétences : Les utilisateurs peuvent ajouter, modifier et supprimer leurs compétences dans leur CVNU.

Gestion d'expériences : Les utilisateurs peuvent ajouter, modifier et supprimer leurs expériences professionnelles dans leur CVNU.

Connexion sécurisée : Les utilisateurs peuvent se connecter via Google OAuth ou PayPal Sandbox pour accéder à leurs informations de compte (note: l'implémentation de ces connexions est distincte des interactions IA).

Partage de CVNU : Les utilisateurs peuvent partager leur CVNU avec d'autres utilisateurs ou entreprises.

Fonctionnalités Augmentées par l'IA
Les capacités d'IA intégrées permettent une valorisation et une extraction intelligentes des compétences.

Assistant IA Conversationnel :

But : Permettre un dialogue continu avec une IA spécialisée pour extraire et structurer les compétences et expériences professionnelles de l'utilisateur. L'IA agit comme un "coach de carrière".

Modèle IA : Utilise gemma2-9b-it de Groq.

Enregistrement : L'historique complet de la conversation est enregistré pour une analyse ultérieure.

Sortie : Génération d'un résumé professionnel au format Markdown (soup.md conceptuel) à partir de la conversation sélectionnée, idéal pour un CV.

Générateur de CV depuis un Texte :

But : Analyser un texte Markdown de conversation (historique collé ou importé) pour en extraire des compétences, projets et attributs, puis générer un CV HTML/CSS prêt à l'emploi.

Modèles IA : Utilise un modèle Llama (pour l'analyse cognitive initiale) et Groq (pour la valorisation finale).

Enregistrement : L'analyse du texte collé est stockée dans les logs.

Interaction IA Ponctuelle :

But : Permettre une interaction rapide et unique avec une IA pour obtenir une réponse directe à une question spécifique, sans maintien de contexte conversationnel prolongé.

Modèle IA : Peut utiliser le modèle Groq par défaut (gemma2-9b-it) ou un autre modèle configuré.

Enregistrement : L'interaction est logguée pour le calcul UTMi.

Tableau de Bord UTMi :

But : Fournir une vue agrégée et monétisée de toutes les interactions avec l'IA.

Calcul : Quantifie la valeur générée (UTMi) et les coûts estimés de chaque interaction, offrant une perspective unique sur l'investissement dans le développement des compétences.

Fonctionnement du Système Augmenté par l'IA
Le système repose sur une architecture client-serveur (Node.js Express pour le backend, HTML/CSS/JavaScript pour le frontend) et interagit avec les APIs de modèles de langage (Groq et Llama).

Assistant IA Conversationnel
Cette section permet une interaction structurée visant à construire le profil professionnel de l'utilisateur.

Démarrage d'une Nouvelle Conversation :

L'utilisateur initie une nouvelle conversation via l'interface (app.js).

Une requête POST est envoyée à /api/conversations/new (server.js).

Le server.js crée un ID unique, initialise l'historique de la conversation avec un message "système" qui configure l'IA comme un coach de carrière (config.ai.chatbotRole, config.ai.chatbotContext), et enregistre la conversation dans conversations.json. Un log NEW_CONVERSATION est écrit dans logs.json, incluant un calcul initial d'UTMi pour le début de session.

Envoi et Réception de Messages :

L'utilisateur envoie un message via le champ de texte (app.js).

Une requête POST est envoyée à /api/conversations/:id/message.

Le server.js :

Ajoute le message utilisateur à l'historique de la conversation et calcule son UTMi (via utms_calculator.js).

Envoie l'historique complet des messages au modèle Groq (gemma2-9b-it).

Reçoit la réponse de l'IA, l'ajoute à l'historique, et calcule son UTMi (via utms_calculator.js).

Met à jour la conversation dans conversations.json et enregistre un log détaillé dans logs.json.

Renvoie la réponse de l'IA et les métriques UTMi/coûts au client.

L'interface (app.js) met à jour la fenêtre de chat et les totaux UTMi.

Génération du Résumé Professionnel (CV "soup.md" conceptuel) :

L'utilisateur clique sur "Générer Résumé CV (Markdown)" pour une conversation donnée (app.js).

Une requête GET est envoyée à /api/conversations/:id/cv-professional-summary.

Le server.js :

Récupère l'historique de la conversation depuis conversations.json.

Appelle la fonction generateProfessionalSummary (server_modules/cv_professional_analyzer.js).

Ce module utilise le modèle Groq (gemma2-9b-it) pour extraire et formater en Markdown les compétences, projets, réalisations et soft skills.

Le server.js renvoie le Markdown généré au client.

L'interface (app.js) affiche ce résumé dans une zone dédiée.

Générateur de CV depuis un Texte
Cette section permet la création d'un CV à partir d'un texte Markdown d'historique de conversation collé.

Analyse et Enregistrement du Texte Collé :

L'utilisateur colle un texte Markdown dans un textarea et clique sur "Analyser le Texte & Générer le CV" (app.js).

Une requête POST est envoyée à /api/record-and-analyze.

Le server.js :

Appelle analyse_soup.js pour nettoyer et structurer le texte brut.

Enregistre ce Markdown brut dans conversations_pasted_raw/.

Appelle llama_cognitive_analysis.js (simulation ou implémentation réelle) pour une analyse cognitive approfondie.

Le résultat est enregistré dans logs.json.

Génération du CV HTML :

Après l'analyse (ou déclenché par l'utilisateur), une requête GET est envoyée à /api/generate-cv.

Le server.js :

Lit les logs pertinents depuis logs.json.

Appelle generateCV.js, qui agglomère les données analysées et les insère dans un template HTML/CSS prédéfini.

Renvoie le CV HTML au client.

L'interface (app.js) affiche ce HTML.

Valorisation des Compétences du CV :

Après la génération du CV HTML, l'utilisateur clique sur "Valoriser les Compétences du CV (via Groq)" (app.js).

Une requête POST est envoyée à /api/valorize-cv avec le contenu textuel du CV.

Le server.js :

Appelle groq_cv_analyse.js, qui construit un prompt spécifique pour Groq.

Le prompt est envoyé à un modèle Groq (ex: llama3-8b-8192 ou gemma2-9b-it).

L'IA analyse le CV, valorise les compétences techniques, identifie les soft skills avec justification, et propose une phrase d'accroche.

Le résultat (JSON) est renvoyé au client.

L'interface (app.js) affiche cette valorisation détaillée.

Interaction IA Ponctuelle
Cette section gère les requêtes simples sans contexte.

Envoi du Prompt :

L'utilisateur entre un prompt et clique sur "Générer une réponse" (app.js).

Une requête POST est envoyée à /api/generate.

Le server.js :

Envoie le prompt directement au modèle Groq (défaut : gemma2-9b-it).

Reçoit la réponse de l'IA et calcule son UTMi (via utms_calculator.js).

Enregistre l'interaction et ses métriques dans logs.json.

Renvoie la réponse et les métriques au client.

L'interface (app.js) affiche la réponse.

Tableau de Bord UTMi
Ce tableau de bord offre une vue d'ensemble des interactions et de la valeur générée.

Collecte et Affichage des Insights :

Au chargement de la page et après chaque interaction significative, app.js appelle fetchDashboardInsights().

Une requête GET est envoyée à /api/dashboard-insights.

Le server.js :

Lit l'intégralité des logs depuis logs.json.

Appelle calculateDashboardInsights (utms_calculator.js) qui agrège et calcule diverses métriques (UTMi total, coût, interactions, etc.).

Renvoie les insights agrégés au client.

L'interface (app.js) met à jour les indicateurs du tableau de bord.

Coefficients et Calculs UTMi (utms_calculator.js)
Le module utms_calculator.js est le moteur économique de l'application, définissant les règles de monétisation du temps d'interaction et de la valeur générée.

COEFFICIENTS : Un ensemble de constantes ajustables qui déterminent la valeur de chaque type d'interaction (valeur de base par seconde, bonus pour complexité des prompts, impact des réponses IA, scores de qualité des modèles, valorisation des axes cognitifs, thématiques, etc.).

calculateUtmi(interactionData, userProfile, modelQualityScores) : Cette fonction prend les détails d'une interaction (type, contenu, modèle, temps) et applique les coefficients pour calculer l'UTMi et le coût estimé en USD. Elle intègre l'analyse thématique et cognitive des textes pour attribuer des UTMi supplémentaires.

calculateDashboardInsights(logs, modelQualityScores) : Cette fonction agrège les données de logs.json pour fournir des totaux, des moyennes, des ratios, et des ventilations par type d'interaction, modèle, axe cognitif, et thématique. Elle inclut également des taux de change.

Architecture du Projet et Fichiers Clés
Le projet est structuré comme suit :

index.html : Interface utilisateur principale, structure les différentes sections (Générateur CV, Chatbot, Ponctuel IA).

style.css : Feuille de style CSS pour le rendu visuel de toutes les sections.

app.js : Logique JavaScript côté client, gère les interactions utilisateur, les requêtes API, et l'affichage des données.

server.js : Serveur backend Node.js (Express), orchestre toutes les requêtes API, gère l'interaction avec Groq, et coordonne les modules d'analyse et de calcul.

.env : Fichier de configuration pour les variables d'environnement (clé API Groq, port).

logs.json : Base de données JSON de toutes les interactions enregistrées, sert de source pour le tableau de bord et l'analyse de CV.

conversations.json : Base de données JSON des historiques de conversations du chatbot.

conversations_pasted_raw/ : Dossier de stockage des fichiers Markdown bruts collés par l'utilisateur pour le générateur de CV.

server_modules/ : Dossier contenant les modules backend spécifiques :

utms_calculator.js : Moteur de calcul des UTMi et des insights.

model_quality_config.js : Définit les scores de qualité des modèles d'IA.

cv_professional_analyzer.js : Analyse les conversations de chat pour un résumé professionnel (Markdown).

analyse_soup.js : Module de nettoyage et de structuration des conversations Markdown brutes pour l'analyse initiale du générateur de CV.

llama_cognitive_analysis.js : Simule ou implémente l'analyse cognitive de conversations par un modèle Llama pour le générateur de CV principal.

generateCV.js : Génère le CV au format HTML/CSS à partir des données analysées des logs.

groq_cv_analyse.js : Valorise les compétences d'un CV (texte) en utilisant un modèle Groq.

Utilisation
Pour utiliser le CVNU et ses fonctionnalités IA, suivez ces étapes :

Démarrage du Serveur : Assurez-vous que Node.js est installé. Placez les fichiers dans la structure définie, renseignez votre GROQ_API_KEY dans le fichier .env à la racine du projet. Ouvrez un terminal à la racine du projet et exécutez :

npm install
npm start

Accès à l'Application : Ouvrez votre navigateur et accédez à http://localhost:3000.

Vous pourrez alors :

Générer un CV depuis un texte : Collez un historique de conversation Markdown dans la section dédiée et cliquez sur "Analyser le Texte & Générer le CV". Vous pourrez ensuite "Valoriser les Compétences du CV" via l'IA.

Utiliser l'Assistant IA Conversationnel : Démarrez une "Nouvelle Conversation" et échangez avec l'IA coach de carrière. Une fois satisfait, cliquez sur "Générer Résumé CV (Markdown)" pour obtenir un aperçu professionnel de votre échange.

Interagir de manière ponctuelle : Posez une question rapide à l'IA dans la section "Interaction IA Ponctuelle".

Consulter le Tableau de Bord UTMi : Les métriques seront automatiquement mises à jour après chaque interaction, vous donnant une vue de la valeur générée.

Exemples d'Utilisation
Création d'un CVNU (fonctionnalité de base) :

// createCVNU() - Cette fonction permet aux utilisateurs de créer un nouveau CVNU.
// (Exemple conceptuel, l'implémentation dépend du module de base du CVNU)

Ajout d'une compétence (fonctionnalité de base) :

// addSkill(string skill) - Cette fonction permet aux utilisateurs d'ajouter une nouvelle compétence à leur CVNU.
// (Exemple conceptuel, l'implémentation dépend du module de base du CVNU)

Début d'une conversation orientée CV :

Utilisateur : "Bonjour IA, je cherche à mettre à jour mon CV. Peux-tu m'aider à identifier mes compétences clés ?"

IA : "Absolument ! Commençons par vos expériences récentes. Décrivez-moi un projet technique majeur sur lequel vous avez travaillé. Quels étaient les défis et comment les avez-vous résolus ?"

Génération de résumé après chat :

Cliquez sur le bouton "Générer Résumé CV (Markdown)" à côté de votre conversation de coaching.

Vous obtiendrez un texte Markdown structuré comme ceci :

## Résumé Professionnel (Extrait de Conversation IA)

### Profil
Développeur full-stack proactif, spécialisé en intégration API et optimisation de processus.

### Compétences Techniques Clés
-   **Node.js :** Maîtrise des environnements d'exécution backend.
-   **API REST :** Expertise en intégration et débogage d'APIs tierces (ex: Stripe).
-   **Automatisation du Déploiement :** Capacité à créer des scripts pour optimiser les processus de mise en production.

### Expériences et Réalisations (Projets / Missions)
-   **Résolution de Bug Critique sur Intégration Stripe :** Diagnostic et résolution d'un problème d'API lié à une version obsolète de Node.js, assurant la fonctionnalité du module de paiement.
    * **Rôle/Actions :** Débogage avancé, mise à jour des dépendances, reconfiguration des hooks.
    * **Résultats/Impact :** Rétablissement rapide du service de paiement, amélioration de la stabilité de l'application.
    * **Technologies utilisées :** Node.js, API Stripe.

### Compétences Comportementales (Soft Skills)
-   **Résolution de Problèmes :** Démontre une capacité à diagnostiquer et résoudre des défis techniques complexes.
-   **Proactivité :** Prend l'initiative de documenter les solutions et d'automatiser les processus pour prévenir de futures occurrences.

Valorisation d'un CV généré :

Après avoir généré le CV HTML à partir d'un texte collé, cliquez sur "Valoriser les Compétences du CV (via Groq)".

L'IA fournira des descriptions enrichies comme :

{
  "catch_phrase": "Développeur ingénieux et proactif, expert en résolution de problèmes techniques complexes et en optimisation de l'intégration logicielle.",
  "valorized_technical_skills": [
    {
      "skill": "Débogage (API Stripe)",
      "valorization": "Capacité avérée à diagnostiquer et résoudre rapidement les anomalies logicielles complexes, notamment dans les intégrations d'API critiques, assurant la continuité des services."
    },
    {
      "skill": "Mise à jour de dépendances (Node.js)",
      "valorization": "Maîtrise des écosystèmes backend, incluant la gestion et la mise à jour sécurisée des dépendances pour garantir la compatibilité et la performance des applications."
    }
  ],
  "professional_attributes": [
    {
      "attribute": "Résolution de problèmes",
      "justification": "Démontre une approche méthodique et efficace face aux défis techniques, aboutissant à des solutions concrètes."
    },
    {
      "attribute": "Proactivité",
      "justification": "Prend l'initiative de documenter les solutions et d'implémenter des améliorations préventives pour le bénéfice de l'équipe et du projet."
    }
  ]
}

Notes de Sécurité
Le CVNU utilise des technologies de sécurité à jour pour protéger les données des utilisateurs.

Les utilisateurs doivent prendre soin de protéger leurs informations de compte (clés API personnelles si utilisées localement) et de ne pas partager leur CVNU ou les résumés générés avec des tiers non autorisés si ces documents contiennent des informations sensibles.

Les données des conversations sont stockées localement (logs.json, conversations.json, conversations_pasted_raw/) pour assurer la confidentialité.

Les appels aux modèles d'IA (Groq) sont effectués via le serveur, protégeant ainsi votre clé API.

Les développeurs du CVNU sont responsables de la sécurité et de la maintenance du système.