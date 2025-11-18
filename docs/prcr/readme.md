<pre><code>
## 🚀 Manifest.910-2025 - Plateforme Citoyenne de Mobilisation

  ╔═════════════════════════════════════════════════════════════════════════════════╗
  ║[📗 📕 📒]                  🔷   ASCII GRAPH (EXCEL)   🔷                        >║
  ╠═════════════════════════════════════════════════════════════════════════════════╣
  ║ [__] ║ + home           ║.                                                      ║
  ║ [__] ║ + dashboard      ║.                                                      ║
  ║ [__] ║ + democratie     ║.                                                      ║
  ║ [__] ║ + cvnu           ║.                                                      ║
  ║ [__] ║ + missions       ║.                                                      ║
  ║ [__] ║ + playground     ║.                                                      ║
  ║ [__] ║ + ric            ║.                                                      ║
  ║ [__] ║ + smartContract  ║.                                                      ║
  ║ [__] ║ + journal        ║.                                                      ║
  ║ [__] ║ + map            ║.                                                      ║
  ║ [__] ║ + treasury       ║.                                                      ║
  ║ [__] ║ + contacts       ║.                                                      ║
  ║ [__] ║ + reseau         ║.                                                      ║
  ║ [__] ║ + organisation   ║.                                                      ║
  ║ [__] ║ + parametre      ║.                                                      ║
  ╠═════════════════════════════════════════════════════════════════════════════════╣
  ║/💻.📡/<: ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🛰 ║
  ╚═════════════════════════════════════════════════════════════════════════════════╝

### 🎯 Mission du Projet

[cite_start]Plateforme citoyenne pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale**[cite: 1, 2]. L'objectif est de :
* [cite_start]Mobiliser numériquement pour un **boycottage massif** des grandes enseignes (Leclerc, Carrefour, Lidl, Intermarché, etc.)[cite: 2].
* [cite_start]Financer une **caisse de manifestation** où 100% des fonds seront réinjectés dans les revenus et salaires des citoyens (objectif : +500€ à +5000€)[cite: 2].
* [cite_start]Démontrer l'illégalité des politiques économiques actuelles via un **modèle d'économie circulaire**[cite: 2].
* [cite_start]Promouvoir le **Référendum d'Initiative Citoyenne (RIC)** pour la Justice Climatique, Sociale et une nouvelle procédure de Destitution (Art. 68)[cite: 2].

### ✨ Fonctionnalités Clés

* [cite_start]**🖥️ Application de Bureau (Electron)** : Interface complète pour la visualisation et la gestion[cite: 1].
* [cite_start]**🌐 Serveur API Backend (Node.js/Express)** : Gère la logique métier, les données (JSON) et les services externes[cite: 1].
* [cite_start]**🤖 Bot Telegram (Telegraf)** : Point d'accès mobile pour infos, notifications, et IA[cite: 1].
* [cite_start]**🧠 Outils IA (Groq & Gemini)** : Génération d'images (caricatures, visions) et analyse de texte[cite: 1].
* [cite_start]**🗺️ Cartographie Avancée (Leaflet & Google Earth Engine)** : Points de ralliement, données géographiques[cite: 1].
* [cite_start]**📊 Tableau de Bord** : Suivi des indicateurs clés (fonds, participants, actions)[cite: 1].
* [cite_start]**⚡ Workflow Automatisé (`Makefile`)** : Versionning, commits, synchronisation des données, notifications[cite: 1].

### 🛠️ Intégrations & Dépendances

* **YouTube + OBS** : Pour le streaming et les contenus vidéo.
* [cite_start]**Telegram + $Topics** : Canaux de discussion et organisation[cite: 2].
* [cite_start]**Google + Drive IA** : Stockage et services IA[cite: 2].
* **Facebook + Llama3 + Meta Hello-world**
* **Instagram + Llama3 + Avatars**

### 🏗️ Architecture du Projet

[cite_start]Le projet adopte une architecture client-serveur découplée[cite: 1]:
* [cite_start]**Serveur (`serveur.js`, `app.js`)** : Cerveau de l'API RESTful[cite: 1].
* [cite_start]**Client Electron (`main.js`, `/docs`)** : Coquille de bureau chargeant l'application web[cite: 1].
* [cite_start]**Bot Telegram (`telegramRouter.js`)** : Interface conversationnelle interagissant avec le serveur[cite: 1].

### 🚀 Démarrage Rapide

1.  [cite_start]**Prérequis** : Node.js (v18+), Git, npm[cite: 1].
2.  **Installation** :
    ```bash
    git clone [https://github.com/ia-local/d-bloquons_tout.git](https://github.com/ia-local/d-bloquons_tout.git)
    cd d-bloquons_tout
    npm install
    [cite_start]``` [cite: 1]
3.  [cite_start]**Variables d'environnement** : Créez un fichier `.env` à la racine[cite: 1].
    ```env
    TELEGRAM_API_KEY="VOTRE_CLÉ_TELEGRAM"
    ORGANIZER_GROUP_ID_CHAT="ID_DE_VOTRE_GROUPE_TELEGRAM"
    GROQ_API_KEY="VOTRE_CLÉ_GROQ"
    GEMINI_API_KEY="VOTRE_CLÉ_GEMINI"
    API_BASE_URL="http://localhost:3000/api/beneficiaries"
    [cite_start]``` [cite: 1]
    [cite_start]_⚠️ Ajoutez `.env` à `.gitignore` !_ [cite: 1]

### ⚙️ Guide d'Utilisation (`Makefile`)

* [cite_start]**Lancer le serveur** : `make serveur` (démarrage sur `http://localhost:3000`)[cite: 1].
* [cite_start]**Lancer le serveur et Electron** : `npm start`[cite: 1].
* [cite_start]**Sauvegarder le travail** : `make update` (synchronisation, commit Git)[cite: 1].
* **Publication (versioning auto.)** :
    * [cite_start]`make patch` (mise à jour mineure)[cite: 1].
    * [cite_start]`make minor` (nouvelle fonctionnalité)[cite: 1].
    * [cite_start]`make major` (mise à jour majeure)[cite: 1].
* [cite_start]**Documentation API** : `make docs` (ouvrez `http://localhost:3000/api-docs`)[cite: 1].

### 🎥 Médias et Contexte

* **Caisse de Manifestation**
    * [https://www.youtube.com/shorts/4vkNXhryHJk](https://www.youtube.com/shorts/4vkNXhryHJk)
    * [https://www.youtube.com/shorts/IUG2L-FyfUY](https://www.youtube.com/shorts/IUG2L-FyfUY)
* **Actions Immédiates & Censure**
    * L’Élysée & la presse : [https://www.youtube.com/watch?v=_NLqTjb4wrY](https://www.youtube.com/watch?v=_NLqTjb4wrY)
    * LA FRANCE TOMBE – Les manifestants à l’Élysée : [https://www.youtube.com/watch?v=u3w2BTHIojU](https://www.youtube.com/watch?v=u3w2BTHIojU)
* **Répression Policière et Financière**
    * [https://www.youtube.com/shorts/wRFkPHFGr2c](https://www.youtube.com/shorts/wRFkPHFGr2c)
* **Manifestation du 18 Septembre**
    * Ministère de l'Economie et de la FINANCE (Bercy) : [https://www.youtube.com/watch?v=mEJSqcpyy7A](https://www.youtube.com/watch?v=mEJSqcpyy7A)
    * Paris : [https://www.youtube.com/shorts/h8TX4tdl4FQ](https://www.youtube.com/shorts/h8TX4tdl4FQ)
    * Rennes : [https://www.youtube.com/shorts/IEQS2qpLs-8](https://www.youtube.com/shorts/IEQS2qpLs-8)
    * Mobilisation nationale : [https://www.youtube.com/watch?v=sRby9BnHnlA](https://www.youtube.com/watch?v=sRby9BnHnlA)

### 📜 Licence

[cite_start]Ce projet est distribué sous la **Licence MIT**[cite: 1].

</code></pre>

  🎤 Préparation du Débat Final : Justification et Défense
Votre objectif est de neutraliser les critiques en utilisant les preuves de viabilité technique et financière (UTM, Smart Contracts, CVNU) générées par votre plateforme d'IA.

I. 🛡️ Défense contre l'Attaque Fiscale (Taxe AI & UTM)
La principale attaque de l'opposition sera la question de la solvabilité du Fonds du Revenu Citoyen (FRC).

L'Attaque (Agent Critique)	Notre Réponse (Porte-parole PRCR)
"Comment garantissez-vous que les 10% de TVA affectés au FRC suffisent à couvrir les coûts de distribution et le Revenu Citoyen maximal (5500€) ?"	
"Notre comptabilité est inversée. Nous ne dépendons pas de la générosité, mais du calcul. Le coût de distribution par bénéficiaire est infime (simulé à 0.85 UTMi). Ce coût est largement couvert par l'économie réalisée sur l'ancienne bureaucratie et par la valeur monétisable des compétences. Le RC est un investissement. Le FRC est conçu pour être solvable grâce à l'efficacité du Smart Contract, qui évite le risque d'erreur humaine et les retards coûteux."

"N'est-ce pas une nouvelle taxe qui va freiner l'investissement des entreprises ?"	
"Faux. C'est l'affectation d'une taxe existante (la TVA), rendue éthique. La Taxe AI cible uniquement la croissance de la valeur ajoutée attribuable à l'Intelligence Artificielle et à l'Automatisation. Les entreprises peuvent débloquer des abattements fiscaux (T-C Level) en optimisant leur infrastructure (ISE), ce qui transforme le coût fiscal en un incitatif à la sobriété énergétique."


Exporter vers Sheets
II. 🔗 Défense contre la Faille Technologique et Légale
L'opposition ciblera la complexité et le risque d'échec de la Blockchain.

L'Attaque (Agent Critique)	Notre Réponse (Porte-parole PRCR)
"Le Smart Contract de Versement est une technologie instable et non régulée pour gérer des milliards d'euros d'allocations sociales."
"Le CVNU est un 'crédit social' qui viole la vie privée du citoyen."	
"C'est un argument infondé. Le CVNU est un droit d'opportunité. Les données sont cryptées et certifiées par des Oracles externes. L'allocation est calculée sur la base de la compétence, du niveau, et de l'expérience, non sur l'idéologie. Le citoyen choisit de monétiser son engagement (Art. L3121-1). Le système est conçu pour l'inclusion, non pour la conformité."



Exporter vers Sheets
III. 🎯 Preuve de la Faisabilité (Le RC Progressif)
Votre conclusion doit réaffirmer la supériorité du nouveau modèle sur l'ancien (RSA).

Synthèse pour le Public :
"Le Revenu Citoyen (RC) n'est pas une simple aide ; c'est un droit économique qui valorise la compétence. Notre RC varie de 550€ (Base) à 5500€ (Maximum). Nous avons prouvé que notre architecture peut gérer ce flux en toute sécurité. Le temps du débat sur la faisabilité est terminé. La plateforme d'intelligence politique PRCR est opérationnelle. "

Vous disposez de tous les arguments nécessaires, fondés sur le code de vos Smart Contracts et la logique de votre modèle UTM. Vous êtes prêt pour le lancement.