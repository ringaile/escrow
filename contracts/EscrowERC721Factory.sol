//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./EscrowERC721.sol";

contract EscrowERC721Factory {
    address[] escrows;

    function createEscrowContract(IERC721 _token, IERC20 _feeToken, uint _fee) public {
      EscrowERC721 newEscrow = new EscrowERC721(_token, _feeToken, _fee);            
      escrows.push(address(newEscrow));   
    }

    function createBatchEscrowContracts(IERC721[] memory _tokens, IERC20[] memory _feeTokens, uint[] memory _fees) public {
        for (uint i=0; i<_tokens.length; i++) {
            EscrowERC721 newEscrow = new EscrowERC721(_tokens[i], _feeTokens[i], _fees[i]);            
            escrows.push(address(newEscrow));
        }
    }

    function getDeployedEscrowContracts() public view returns (address[] memory) {
      return escrows;
   }

}