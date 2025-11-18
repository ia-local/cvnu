// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserCV {
    struct CV {
        string name;
        string level;
        string details;
    }

    mapping(address => CV) private cvs;

    function createCV(string memory _name, string memory _level, string memory _details) public {
        cvs[msg.sender] = CV(_name, _level, _details);
    }

    function getCV(address _user) public view returns (string memory, string memory, string memory) {
        CV memory userCV = cvs[_user];
        return (userCV.name, userCV.level, userCV.details);
    }

    function updateCV(string memory _name, string memory _level, string memory _details) public {
        cvs[msg.sender] = CV(_name, _level, _details);
    }
}
