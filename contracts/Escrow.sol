//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Escrow {

  address payable public owner;
  uint public fee;
  uint collectedFee;
  IERC20 token;

  event Deposited(address indexed payee, address tokenAddress, uint256 amount);
  event Withdrawn(address indexed payee, address tokenAddress, uint256 amount);

  // payee address => token address => amount
  mapping(address => mapping(address => uint256)) public deposits;

  // payee address => token address => expiration time
  mapping(address => mapping(address => uint256)) public expirations;

  constructor(IERC20 _token, uint _fee) {
      owner = payable(msg.sender);
      token = _token;
      fee = _fee;
  }

  modifier requiresFee() {
      require(msg.value >= fee, "Not enough value.");
        _;
    }

  function deposit(address _payee, uint256 _amount, uint256 _expiration) public requiresFee payable {
      token.transferFrom(msg.sender, address(this), _amount + fee);
      deposits[_payee][address(token)] += _amount;
      expirations[_payee][address(token)] = block.timestamp + _expiration;
      collectedFee += fee;
      emit Deposited(_payee, address(token), _amount);
  }

  function withdraw(address payable _payee) public {
      require(block.timestamp > expirations[_payee][address(token)], "The payment is still in escrow.");
      uint256 payment = deposits[_payee][address(token)];
      deposits[_payee][address(token)] = 0;
      require(token.transfer(msg.sender, payment));
      emit Withdrawn(_payee, address(token), payment);
  }

}