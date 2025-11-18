pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CVUNGame is ERC20, Ownable {
    struct User {
        uint256 level;
        uint256 xp; // Points d'expérience
        uint256 piCoins; // Pièces gagnées (pi.coin)
    }

    mapping(address => User) public users;

    uint256[] public levelThresholds = [500, 1000, 2000, 3500, 5144]; // Seuils de niveau
    uint256[] public levelRewards = [500, 1000, 2000, 3500, 5144]; // Récompenses en pi.coin

    constructor() ERC20("UMCToken", "UMC") {
        _mint(msg.sender, 100000 * 10 ** decimals()); // Réserve initiale
    }

    function registerUser(address user) public onlyOwner {
        require(users[user].level == 0, "Utilisateur déjà inscrit");
        users[user] = User(1, 0, 0); // Commence au niveau 1
    }

    function completeTask(address user, uint256 xpGained) public onlyOwner {
        require(users[user].level > 0, "Utilisateur non inscrit");
        users[user].xp += xpGained;
        checkLevelUp(user);
    }

    function checkLevelUp(address user) internal {
        uint256 currentLevel = users[user].level;
        if (currentLevel < 5 && users[user].xp >= levelThresholds[currentLevel - 1]) {
            users[user].level += 1;
            users[user].piCoins += levelRewards[currentLevel - 1]; // Récompense en pi.coin
            mint(user, levelRewards[currentLevel - 1] * 10 ** decimals()); // Mint des pi.coin
        }
    }

    function mint(address account, uint256 amount) internal {
        _mint(account, amount);
    }

    function getUserLevel(address user) public view returns (uint256) {
        return users[user].level;
    }

    function getUserPiCoins(address user) public view returns (uint256) {
        return users[user].piCoins;
    }
}
