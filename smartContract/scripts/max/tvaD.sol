pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UMCToken is ERC20, Ownable {
    // Structure du Compte de Campagne pour respecter les formalités légales
    struct CompteCampagne {
        string statutAssociation;
        string typeCampagne;
        string contactInfo;
        uint256 enveloppeA;  // Dépenses
        uint256 enveloppeB;  // Recettes
    }

    mapping(address => CompteCampagne) public comptesCampagne;

    event CompteCampagneCree(address indexed user, string statutAssociation, string typeCampagne);
    event RecetteAjoutee(address indexed user, uint256 montant);
    event DepenseAjoutee(address indexed user, uint256 montant);
    event DecaissementTVAEffectue(address indexed user, uint256 montantTVA);

    constructor() ERC20("UMCToken", "UMC") {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    // Fonction pour créer un compte de campagne
    function createCompteCampagne(
        string memory _statutAssociation,
        string memory _typeCampagne,
        string memory _contactInfo,
        uint256 _enveloppeA,
        uint256 _enveloppeB
    ) external {
        comptesCampagne[msg.sender] = CompteCampagne({
            statutAssociation: _statutAssociation,
            typeCampagne: _typeCampagne,
            contactInfo: _contactInfo,
            enveloppeA: _enveloppeA,
            enveloppeB: _enveloppeB
        });
        
        emit CompteCampagneCree(msg.sender, _statutAssociation, _typeCampagne);
    }

    // Fonction pour ajouter des recettes à l'enveloppe B (par exemple, donations)
    function ajouterRecettes(uint256 montant) external {
        require(montant > 0, "Le montant doit être supérieur à 0");
        
        // Ajouter le montant à l'enveloppe B (recettes)
        comptesCampagne[msg.sender].enveloppeB += montant;

        emit RecetteAjoutee(msg.sender, montant);
    }

    // Fonction pour ajouter des dépenses à l'enveloppe A (publicité, frais)
    function ajouterDepenses(uint256 montant) external {
        require(montant > 0, "Le montant doit être supérieur à 0");
        require(comptesCampagne[msg.sender].enveloppeA >= montant, "Solde insuffisant dans l'enveloppe A");
        
        // Déduire le montant des dépenses de l'enveloppe A
        comptesCampagne[msg.sender].enveloppeA -= montant;

        emit DepenseAjoutee(msg.sender, montant);
    }

    // Fonction pour décaisser de la TVA à partir de l'enveloppe B
    function decaissementTVA(uint256 montantTVA) external {
        require(montantTVA > 0, "Le montant doit être supérieur à 0");
        require(comptesCampagne[msg.sender].enveloppeB >= montantTVA, "Solde insuffisant dans l'enveloppe B");

        // Décaisser la TVA de l'enveloppe B
        comptesCampagne[msg.sender].enveloppeB -= montantTVA;

        emit DecaissementTVAEffectue(msg.sender, montantTVA);
    }

    // Fonction pour vérifier les soldes des enveloppes A et B
    function getSoldeEnveloppes(address account) external view returns (uint256 enveloppeA, uint256 enveloppeB) {
        CompteCampagne memory compte = comptesCampagne[account];
        return (compte.enveloppeA, compte.enveloppeB);
    }
}
