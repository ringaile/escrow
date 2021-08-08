//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Escrow.sol";

contract EscrowFactory {
    address[] escrows;

    function createEscrowContract(IERC20 _token, uint _fee) public {
      Escrow newEscrow = new Escrow(_token, _fee);            
      escrows.push(address(newEscrow));   
    }

    function createBatchEscrowContracts(IERC20[] memory _tokens, uint[] memory _fees) public {
        for (uint i=0; i<_tokens.length; i++) {
            Escrow newEscrow = new Escrow(_tokens[i], _fees[i]);            
            escrows.push(address(newEscrow));
        }
    }

    function getDeployedEscrowContracts() public view returns (address[] memory) {
      return escrows;
   }

}