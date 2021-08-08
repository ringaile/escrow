const { expect } = require("chai");
const chai = require('chai');

describe("EscrowERC721Factory", function () {
    let EscrowERC721Factory;
    let escrowERC721Factory;
    let TestERC721Token;
    let testERC721Token;
    let TestToken;
    let testToken;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    const fee = 1;
    const tokenSupply = 10000000000000;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        EscrowERC721Factory = await ethers.getContractFactory("EscrowERC721Factory");
        TestToken = await ethers.getContractFactory("ERC20TestToken");
        TestERC721Token = await ethers.getContractFactory("ERC721TestToken");
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        
        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        testToken = await TestToken.deploy();
        testERC721Token = await TestERC721Token.deploy();
        escrowERC721Factory = await EscrowERC721Factory.deploy();
    });

    describe("Deployment", function () {
        it("Should allow to deploy one contract", async function () {
          escrowERC721Factory.createEscrowContract(testERC721Token.address, testToken.address, fee);

          let escrows = await escrowERC721Factory.getDeployedEscrowContracts();

          expect(escrows.length).to.equal(1);
        });
    
        it("Should allow to deploy many contracts", async function () {
          let noOfContracts = 5;
          let erc721Tokens = [testERC721Token.address, testERC721Token.address, testERC721Token.address, testERC721Token.address, testERC721Token.address];
          let tokens = [testToken.address, testToken.address, testToken.address, testToken.address, testToken.address];
          let fees = [fee, fee, fee, fee, fee];

          escrowERC721Factory.createBatchEscrowContracts(erc721Tokens, tokens, fees);

          let escrows = await escrowERC721Factory.getDeployedEscrowContracts();

          expect(escrows.length).to.equal(noOfContracts);
          });
      });
});