//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Escrow {

  address owner;

  // assuming that there could be few tokens.
  // payee address => token address => amount
  mapping(address => mapping(address => uint256)) public deposits;

  constructor() {
      owner = msg.sender;
  }

  modifier onlyOwner() {
      require(msg.sender == owner);
      _;
  }

  //TODO: seller is _payee
  function deposit(address _payee, IERC20 _token, uint256 _amount) public onlyOwner payable{
      require(_token.transferFrom(msg.sender, address(this), _amount));
      deposits[_payee][address(_token)] += _amount;
  }

  function withdraw(address payable _payee, IERC20 _token) public onlyOwner{
      uint256 payment = deposits[_payee][address(_token)];
      deposits[_payee][address(_token)] = 0;
      require(_token.transfer(msg.sender, payment));
  }

}