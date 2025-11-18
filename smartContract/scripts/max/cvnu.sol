pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ConstructorJWTio.sol";
import "./MVPPToken.sol";
import "./MinPToken.sol";
import "./MaxVPToken.sol";

contract cvunPI is ConstructorJWTio {
    // Spécifique : Distribuer des récompenses sous forme de jetons JWT.io en fonction de la température et de la valeur cvun.json
    // Mesurable : 10 échelons de récompense avec des plafonds de 5144 pi.coin (Seniors), un multiple de pi.coin (Workers) et MinVP (Juniors)
    // Atteignable : Créer une logique claire pour distribuer les récompenses et créer une mappage pour suivre le solde de chaque utilisateur
    // Réaliste : Utiliser les contrats MaxVP et MVPToken pour gérer les récompenses seniors et les jetons personnalisés
    // Temporel : Terminer le contrat dans le délai prévu
    // Tracé : Vérifier régulièrement que les récompenses sont distribuées comme prévu

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