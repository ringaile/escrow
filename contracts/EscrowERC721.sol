//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Escrow {

  address payable owner;
  uint fee;
  uint counter;

  struct ERC721Item {
      address tokenAddress;
      address seller;
      address buyer;
      uint256 item;
      uint256 expiration;
  }

  mapping(uint256 => ERC721Item) public erc721Items;

  event Deposited(address indexed payee, address tokenAddress, uint256 item);
  event Withdrawn(address indexed payee, address tokenAddress, uint256 item);

  constructor(uint _fee) {
      owner = payable(msg.sender);
      fee = _fee;
      counter = 1;
  }

  modifier requiresFee() {
      require(msg.value < fee);
        _;
    }

    function depositERC721(address _payee, IERC721 _token, uint256 _item, uint256 _expiration) public requiresFee payable {
      require(msg.sender == _token.ownerOf(_item));
      _token.transferFrom(msg.sender, address(this), _item);
      erc721Items[counter] = ERC721Item({
        tokenAddress: address(_token),
        seller: _payee,
        buyer: msg.sender,
        item: _item,
        expiration: _expiration
      });
      counter += 1;
      owner.transfer(fee);
      emit Deposited(_payee, address(_token), _item);
  }

  function withdrawERC721(uint256 _id) public {
      require(block.timestamp > erc721Items[_id].expiration, "The item is still in escrow.");
      address tokenAddress = erc721Items[_id].tokenAddress;
      address seller = erc721Items[_id].seller;
      uint256 itemId = erc721Items[_id].item;
      delete(erc721Items[_id]);
      IERC721(tokenAddress).transferFrom(address(this), seller, itemId);
      emit Withdrawn(seller, tokenAddress, itemId);
  }

}