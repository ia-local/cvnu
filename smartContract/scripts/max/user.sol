pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UMCToken is ERC20, Ownable {
    uint256 public MinVP;
    uint256 public MaxVP;
    mapping(address => uint256) public userVP;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => uint256) public lastAllocationTime;  // Pour suivre la dernière allocation
    uint256 public allocationInterval = 30 days;  // Intervalle d'un mois pour les allocations

    // Struct to store user profile details
    struct UserProfile {
        uint256 experienceFactor;
        uint256 skillsFactor;
        uint256 achievementsFactor;
    }

    // Event to track conversions and allocations
    event ConversionToWorkValue(address indexed user, uint256 piCoinAmount, uint256 workValue);
    event ConversionToEuros(address indexed user, uint256 workValue, uint256 euros);
    event AllocationPaid(address indexed user, uint256 amount);

    constructor() ERC20("UMCToken", "UMC") {
        MinVP = 500 * 10 ** decimals();
        MaxVP = 5144 * 10 ** decimals();
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    // Set user profile data
    function setUserProfile(
        address user,
        uint256 experienceFactor,
        uint256 skillsFactor,
        uint256 achievementsFactor
    ) external onlyOwner {
        userProfiles[user] = UserProfile({
            experienceFactor: experienceFactor,
            skillsFactor: skillsFactor,
            achievementsFactor: achievementsFactor
        });
    }

    // Function to convert Pi.coin to work value
    function convertPiCoinToWorkValue(uint256 piCoinAmount, address user) public view returns (uint256) {
        UserProfile memory profile = userProfiles[user];
        require(profile.experienceFactor > 0, "User profile not set");

        uint256 workValue = piCoinAmount * profile.experienceFactor * profile.skillsFactor * profile.achievementsFactor;
        return workValue;
    }

    // Conversion of work value to euros based on exchange rate
    function convertWorkValueToEuros(uint256 workValue, uint256 piCoinToEuroRate) public pure returns (uint256) {
        uint256 euros = workValue * piCoinToEuroRate;
        return euros;
    }

    // Example conversion function that executes the conversion process
    function executeConversion(uint256 piCoinAmount, uint256 piCoinToEuroRate) external {
        address user = msg.sender;
        uint256 workValue = convertPiCoinToWorkValue(piCoinAmount, user);
        uint256 euros = convertWorkValueToEuros(workValue, piCoinToEuroRate);

        emit ConversionToWorkValue(user, piCoinAmount, workValue);
        emit ConversionToEuros(user, workValue, euros);
    }

    // Fonction pour calculer l'allocation mensuelle en fonction du profil utilisateur
    function calculateMonthlyAllocation(address user) public view returns (uint256) {
        UserProfile memory profile = userProfiles[user];
        require(profile.experienceFactor > 0, "User profile not set");

        // La formule d'allocation peut être basée sur les facteurs de profil utilisateur
        uint256 baseAllocation = 100 * 10 ** decimals();  // Par exemple, une allocation de base de 100 pi.coin
        uint256 allocation = baseAllocation * profile.experienceFactor * profile.skillsFactor * profile.achievementsFactor;
        return allocation;
    }

    // Fonction pour distribuer l'allocation mensuelle
    function payMonthlyAllocation() external {
        address user = msg.sender;
        require(block.timestamp >= lastAllocationTime[user] + allocationInterval, "Allocation deja payée ce mois-ci");

        uint256 allocationAmount = calculateMonthlyAllocation(user);
        require(allocationAmount > 0, "Aucune allocation à distribuer");

        _mint(user, allocationAmount);  // Mint les tokens directement à l'utilisateur
        lastAllocationTime[user] = block.timestamp;  // Mettre à jour le temps de la dernière allocation

        emit AllocationPaid(user, allocationAmount);
    }

    // Mint new Pi.coin (for rewards or minting process)
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    // Burn Pi.coin (for staking or removing tokens)
    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    // Function to transfer Pi.coin between users
    function transferPiCoin(address sender, address recipient, uint256 amount) external onlyOwner {
        _transfer(sender, recipient, amount);
    }
}
