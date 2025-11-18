pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CITY is ConstructorJWTio {
    // Spécifique : Garantir le droit au travail pour tous les citoyens
    // Mesurable : Créer des jetons JWT.io pour chaque citoyen en tant que preuve de droit au travail
    // Atteignable : Utiliser la fonction createToken() pour créer les jetons JWT.io
    // Réaliste : Hériter de ConstructorJWTio pour utiliser sa logique de création de jetons
    // Temporel : Terminer le contrat dans le délai prévu
    // Tracé : Vérifier régulièrement que les jetons sont créés et distribués comme prévu

    // Mappage pour suivre les récompenses des utilisateurs
    mapping(address => uint256) public userTokens;

    // Fonction pour garantir le droit au travail en créant un jeton JWT.io
    function exerciseWorkRight(address _to) external {
        }
    // Créer un jeton JWT.io pour l'adresse spécifiée en tant que preuve de droit au travail
    createToken(_to);
    
    // Mettre à jour le mappage pour référencer le jeton créé
    userTokens[_to] += 1;
    
    // Instance du contrat MaxVP
    MaxVP public maxVP;

    // Instance du contrat MVPToken
    MVPToken public mvpToken;

    // Mappage pour suivre les récompenses des utilisateurs
    mapping(address => uint256) public userRewards;

    constructor(address _maxVP, address _mvpToken) ConstructorJWTio() {
        maxVP = MaxVP(_maxVP);
        mvpToken = MVPToken(_mvpToken);
    }

    function setReward(uint256 _temperature, uint256 _cvunValue) external {
        // Calculer la récompense en fonction de la température et de la valeur cvun.json
        uint256 reward = calculateReward(_temperature, _cvunValue);

        // Mettre à jour les récompenses de l'utilisateur
        userRewards[msg.sender] += reward;

        // Créer un jeton JWT.io pour les récompenses du joueur
        mvpToken.createToken(msg.sender, reward);
    }

    // Fonction interne pour calculer la récompense
    function calculateReward(uint256 _temperature, uint256 _cvunValue) internal pure returns (uint256) {
        // Appliquer la logique de calcul de la récompense ici
        // Exemple :
        if (_temperature < 0.1) {
            return 0;
        } else if (_temperature < 0.3 && _cvunValue > 760) {
            return 500; // Juniors
        } else if (_temperature < 0.6 && _cvunValue > 3690) {
            return _cvunValue * 2; // Workers
        } else if (_temperature < 0.9 && _cvunValue > 5144) {
            return _cvunValue * 5144; // Seniors
        } else {
            return maxVP.getMaxReward(); // Senior
        }
    }
}