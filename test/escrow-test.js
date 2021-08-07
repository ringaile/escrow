const { expect } = require("chai");

describe("Escrow", function () {
    let Escrow;
    let escrow;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    const fee = 1;
  
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Escrow = await ethers.getContractFactory("Escrow");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    
    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    escrow = await Escrow.deploy(fee);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should set the right fee to 1", async function () {
        expect(await escrow.fee()).to.equal(fee);
      });
  });
});