//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract EscrowERC721 {

  address payable public owner;
  uint public fee;
  uint counter;
  uint collectedFee;
  IERC20 feeToken;
  IERC721 token;

  struct ERC721Item {
      address seller;
      address buyer;
      uint256 item;
      uint256 expiration;
  }

  mapping(uint256 => ERC721Item) public erc721Items;

  event Deposited(uint256 id, address indexed payee, address tokenAddress, uint256 item);
  event Withdrawn(uint256 id, address indexed payee, address tokenAddress, uint256 item);

  constructor(IERC721 _token, IERC20 _feeToken, uint _fee) {
      owner = payable(msg.sender);
      token = _token;
      feeToken = _feeToken;
      fee = _fee;
      counter = 0;
  }

  modifier requiresFee() {
      require(msg.value < fee);
        _;
    }

  modifier onlyOwner() {
      require(msg.sender == owner, "Must be an owner.");
        _;
  }

  function transferFee() public onlyOwner {
      feeToken.approve(owner, collectedFee);
      feeToken.transfer(owner, collectedFee);
      collectedFee = 0;
  }

  function deposit(address _payee, uint256 _item, uint256 _expiration) public requiresFee payable {
      require(msg.sender == token.ownerOf(_item), "Sender is not a token owner.") ;
      token.transferFrom(msg.sender, address(this), _item);
      feeToken.transferFrom(msg.sender, address(this), fee);
      uint256 id = counter;
      erc721Items[id] = ERC721Item({
        seller: _payee,
        buyer: msg.sender,
        item: _item,
        expiration: block.timestamp + _expiration
      });
      counter += 1;
      collectedFee += fee;
      emit Deposited(id, _payee, address(token), _item);
  }

  function withdraw(uint256 _id) public {
      require(block.timestamp > erc721Items[_id].expiration, "The item is still in escrow.");
      address seller = erc721Items[_id].seller;
      uint256 item = erc721Items[_id].item;
      delete(erc721Items[_id]);
      IERC721(address(token)).transferFrom(address(this), seller, item);
      emit Withdrawn(_id, seller, address(token), item);
  }

}