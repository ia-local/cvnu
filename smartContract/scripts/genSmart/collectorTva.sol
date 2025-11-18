// SPDX-License-Identifier: GNU
pragma solidity ^0.8.0;

contract CollectorTva {
    address public owner;
    uint256 public totalCollected;

    event TvaCollected(address indexed from, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function collectTva() public payable {
        require(msg.value > 0, "Value must be greater than 0");
        totalCollected += msg.value;
        emit TvaCollected(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
