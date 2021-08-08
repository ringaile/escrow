const { expect } = require("chai");
const chai = require('chai');
const numberToBN = require('number-to-bn');
const { network } = require("hardhat");

describe("Escrow", function () {
    let Escrow;
    let escrow;
    let TestToken;
    let testToken;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    const fee = 1;
  
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Escrow = await ethers.getContractFactory("Escrow");
    TestToken = await ethers.getContractFactory("ERC20TestToken");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    
    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    testToken = await TestToken.deploy();
    escrow = await Escrow.deploy(testToken.address, fee);

    const approveTx = await testToken.connect(owner).approve(owner.address, 10000000000000);
    // wait until the transaction is mined
    await approveTx.wait();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should set the right fee to 1", async function () {
        expect(await escrow.fee()).to.equal(fee);
      });
  });

  describe("Deposit", function () {
    it("Should allow to deposit ERC20 compatible token", async function () {
      expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(10000000000000);

      const approve = await testToken.connect(owner).approve(escrow.address, 2);
      const deposit = await escrow.connect(owner).deposit(addr1.address, 1, 1, { value: ethers.utils.parseEther("1")});

      expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(9999999999998);
      expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(2);
    });

    it("Should allow to deposit ERC20 compatible token from not an owner address", async function () {
        const approveTx = await testToken.connect(owner).approve(addr1.address, 5);
        // wait until the transaction is mined
        await approveTx.wait();

        const transferTx = await testToken.transferFrom(owner.address, addr1.address, 5);
        await transferTx.wait();

        expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(5);

        const approveEscrowTx = await testToken.connect(addr1).approve(escrow.address, 2);
        await approveEscrowTx.wait();

        const depositTx = await escrow.connect(addr1).deposit(addr2.address, 1, 1, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();
        
        expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(3);
        expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(2);
      });

    it("Should allow to see deposited amount of an account", async function () {
        const approve = await testToken.connect(owner).approve(escrow.address, 2);
        const deposit = await escrow.connect(owner).deposit(addr1.address, 1, 1, { value: ethers.utils.parseEther("1")});

        await expect(deposit).to.emit(escrow, 'Deposited').withArgs(addr1.address, testToken.address, 1);
  
        expect(await escrow.deposits(addr1.address, testToken.address)).to.equal(1);
    });

    it("Should allow to see expiration of deposited amount", async function () {
        //await network.provider.send("evm_setNextBlockTimestamp", [1625097600])
        //await network.provider.send("evm_mine");

        const approve = await testToken.connect(owner).approve(escrow.address, 2);
        const deposit = await escrow.connect(owner).deposit(addr1.address, 1, 1, { value: ethers.utils.parseEther("1")});
  
        let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
        expectedBlock = parseInt(latestBlock.timestamp, 16) + 1;
        expect(await escrow.expirations(addr1.address, testToken.address)).to.equal(expectedBlock);
    });

    it("Should not allow to deposit if account has inssuficient balance", async function () {    
        const approveTx = await testToken.connect(owner).approve(addr2.address, 1);
        // wait until the transaction is mined
        await approveTx.wait();

        const transferTx = await testToken.transferFrom(owner.address, addr2.address, 1);
        await transferTx.wait();

        expect((await testToken.balanceOf(addr2.address)).toNumber()).to.equal(1);
        
        expect(escrow.connect(addr2).deposit(addr1.address, 1, 1, { value: ethers.utils.parseEther("1")})).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

  });

  describe("Withdraw", function () {
  });
});