pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ConstructorJWTio {
    // Représentation de la grille
    mapping(uint256 => mapping(uint256 => address)) public grid;

    constructor() {
        // La mappage grid est initialisé avec des valeurs null par défaut
    }

    // Modifie l'état d'une case spécifique
    function setGridCell(uint256 x, uint256 y, address token) public {
        require(IERC721(token).ownerOf(x) == msg.sender, "Vous n'êtes pas le propriétaire du jeton");
        grid[x][y] = token;
    }
}