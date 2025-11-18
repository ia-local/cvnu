pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ConstructorJWTio.sol";
import "./MinPToken.sol";
import "./MaxVPToken.sol";


contract MVPToken is ERC721 {
    // Spécifique : Définir les règles pour distribuer les récompenses aux workers
    // Mesurable : Les récompenses des workers sont calculées en fonction de la valeur cvun.json
    // Atteignable : Créer une fonction pour créer des jetons personnalisés pour les workers
    // Réaliste : Le contrat MVPToken hérite de la logique ERC721 et peut être utilisé par d'autres contrats
    // Temporel : Terminer le contrat dans le délai prévu
    // Tracé : Vérifier régulièrement que les récompenses des workers sont distribuées comme prévu

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
        } else if (_temperature < 0.9 && _cvunValue > 5000) {
            return _cvunValue * 5144; // Seniors
        } else {
            return maxVP.getMaxReward(); // Senior
        }
    }
}