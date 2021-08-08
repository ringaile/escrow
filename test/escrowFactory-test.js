const { expect } = require("chai");
const chai = require('chai');

describe("EscrowFactory", function () {
    let EscrowFactory;
    let escrowFactory;
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
        EscrowFactory = await ethers.getContractFactory("EscrowFactory");
        TestToken = await ethers.getContractFactory("ERC20TestToken");
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        
        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        testToken = await TestToken.deploy();
        escrowFactory = await EscrowFactory.deploy();
    });

    describe("Deployment", function () {
        it("Should allow to deploy one contract", async function () {
          escrowFactory.createEscrowContract(testToken.address, fee);

          let escrows = await escrowFactory.getDeployedEscrowContracts();

          expect(escrows.length).to.equal(1);
        });
    
        it("Should allow to deploy many contracts", async function () {
            let noOfContracts = 5;
            let tokens = [testToken.address, testToken.address, testToken.address, testToken.address, testToken.address];
            let fees = [fee, fee, fee, fee, fee];

            escrowFactory.createBatchEscrowContracts(tokens, fees);

            let escrows = await escrowFactory.getDeployedEscrowContracts();

            expect(escrows.length).to.equal(noOfContracts);
          });
      });
});