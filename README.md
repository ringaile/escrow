# ERC20 / ERC721 Escrow contracts

ERC20 / ERC721 Escrow application built on Ethereum.
Base escrow contract, holds tokens designated for a payee for a designated time. It can by withdrawn after the end of escrow time.

## Features

* The smart contract allows user to send any ERC20 or any ERC721 token for escrow.
* The user can specify escrow time and the account that can claim it.
* The contrat support batched escrow creation. 


## Installation

Download the project and run 

```bash
npm i
```

## Compile

```bash
npx hardhat compile
```

## Test

```bash
npx hardhat test
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)