//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Escrow {

  address payable owner;
  uint fee;

  event Deposited(address indexed payee, address tokenAddress, uint256 amount);
  event Withdrawn(address indexed payee, address tokenAddress, uint256 amount);

  // payee address => token address => amount
  mapping(address => mapping(address => uint256)) public deposits;

  // payee address => token address => expiration time
  mapping(address => mapping(address => uint256)) public expirations;

  constructor(uint _fee) {
      owner = payable(msg.sender);
      fee = _fee;
  }

  modifier requiresFee() {
      require(msg.value < fee);
        _;
    }

  function deposit(address _payee, IERC20 _token, uint256 _amount, uint256 _expiration) public requiresFee payable {
      require(_token.transferFrom(msg.sender, address(this), _amount));
      deposits[_payee][address(_token)] += _amount;
      expirations[_payee][address(_token)] = block.timestamp + _expiration;
      owner.transfer(fee);
      emit Deposited(_payee, address(_token), _amount);
  }

  function withdraw(address payable _payee, IERC20 _token) public {
      require(block.timestamp > expirations[_payee][address(_token)], "The payment is still in escrow.");
      uint256 payment = deposits[_payee][address(_token)];
      deposits[_payee][address(_token)] = 0;
      require(_token.transfer(msg.sender, payment));
      emit Withdrawn(_payee, address(_token), payment);
  }

}