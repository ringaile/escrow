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
    const tokenSupply = 10000000000000;
  
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

    const approveTx = await testToken.connect(owner).approve(owner.address, tokenSupply);
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

  describe("Fee collection", function () {
    it("Should allow only owner to collect fees", async function () {
        let addr1Balance = 5;
        let escrowAmount = 1;
        let expiration = 1;

        const approveTx = await testToken.connect(owner).approve(addr1.address, addr1Balance);
        // wait until the transaction is mined
        await approveTx.wait();

        const transferTx = await testToken.transferFrom(owner.address, addr1.address, addr1Balance);
        await transferTx.wait();

        expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance);

        const approveEscrowTx = await testToken.connect(addr1).approve(escrow.address, escrowAmount+fee);
        await approveEscrowTx.wait();

        const depositTx = await escrow.connect(addr1).deposit(addr2.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();

        expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(escrowAmount+fee);

        const transferFeeTx = await escrow.connect(owner).transferFee();
        await transferFeeTx.wait();

        expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(escrowAmount);
        expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance + fee);
    });

    it("Should not allow not owner address to collect fees", async function () {
        let addr1Balance = 5;
        let escrowAmount = 1;
        let expiration = 1;

        const approveTx = await testToken.connect(owner).approve(addr1.address, addr1Balance);
        // wait until the transaction is mined
        await approveTx.wait();

        const transferTx = await testToken.transferFrom(owner.address, addr1.address, addr1Balance);
        await transferTx.wait();

        expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance);

        const approveEscrowTx = await testToken.connect(addr1).approve(escrow.address, escrowAmount+fee);
        await approveEscrowTx.wait();

        const depositTx = await escrow.connect(addr1).deposit(addr2.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();

        expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(escrowAmount+fee);

        expect(escrow.connect(addr1).transferFee()).to.be.revertedWith("Must be an owner.");

        expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(escrowAmount+fee);
        expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance);
    });
  });

  describe("Deposit", function () {
    it("Should allow to deposit ERC20 compatible token", async function () {
      let escrowAmount = 1;
      let expiration = 1;
      expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);

      const approveTx = await testToken.connect(owner).approve(escrow.address, escrowAmount+fee);
      await approveTx.wait();

      const depositTx= await escrow.connect(owner).deposit(addr1.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
      await depositTx.wait();

      expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(9999999999998);
      expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(2);
    });

    it("Should allow to deposit ERC20 compatible token from not an owner address", async function () {
        let addr1Balance = 5;
        let escrowAmount = 1;
        let expiration = 1;

        const approveTx = await testToken.connect(owner).approve(addr1.address, addr1Balance);
        await approveTx.wait();

        const transferTx = await testToken.transferFrom(owner.address, addr1.address, addr1Balance);
        await transferTx.wait();

        expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance);

        const approveEscrowTx = await testToken.connect(addr1).approve(escrow.address, escrowAmount+fee);
        await approveEscrowTx.wait();

        const depositTx = await escrow.connect(addr1).deposit(addr2.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();
        
        expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance-escrowAmount-fee);
        expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(escrowAmount+fee);
      });

    it("Should allow to see deposited amount of an account", async function () {
        let escrowAmount = 1;
        let expiration = 1;
        const approveTx = await testToken.connect(owner).approve(escrow.address, escrowAmount+fee);
        await approveTx.wait();

        const depositTx = await escrow.connect(owner).deposit(addr1.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();

        await expect(depositTx).to.emit(escrow, 'Deposited').withArgs(addr1.address, testToken.address, escrowAmount);
  
        expect(await escrow.deposits(addr1.address, testToken.address)).to.equal(escrowAmount);
    });

    it("Should allow to see expiration of deposited amount", async function () {
        let escrowAmount = 1;
        let expiration = 1;

        const approveTx = await testToken.connect(owner).approve(escrow.address, escrowAmount+fee);
        await approveTx.wait();

        const depositTx = await escrow.connect(owner).deposit(addr1.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();
  
        let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
        expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

        expect(await escrow.expirations(addr1.address, testToken.address)).to.equal(expectedBlock);
    });

    it("Should not allow to deposit if account has inssuficient balance", async function () { 
        let escrowAmount = 1;
        let expiration = 1;
           
        const approveTx = await testToken.connect(owner).approve(addr2.address, escrowAmount);
        await approveTx.wait();

        const transferTx = await testToken.transferFrom(owner.address, addr2.address, escrowAmount);
        await transferTx.wait();

        expect((await testToken.balanceOf(addr2.address)).toNumber()).to.equal(escrowAmount);
        
        expect(escrow.connect(addr2).deposit(addr1.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")})).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

  });

  describe("Withdraw", function () {
    it("Should allow to withdraw a token after the expiration time", async function () {    
        let escrowAmount = 1;
        let expiration = 1;

        const approveTx = await testToken.connect(owner).approve(escrow.address, escrowAmount+fee);
        await approveTx.wait();

        const depositTx = await escrow.connect(owner).deposit(addr1.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();
  
        let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
        expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

        expect(await escrow.expirations(addr1.address, testToken.address)).to.equal(expectedBlock);

        await network.provider.send("evm_setNextBlockTimestamp", [expectedBlock])
        await network.provider.send("evm_mine");

        let futureLatestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
        expect(await escrow.expirations(addr1.address, testToken.address)).to.equal(parseInt(futureLatestBlock.timestamp, 16));

        const withdrawTx = await escrow.withdraw(addr1.address);
        await withdrawTx.wait();

        expect(await escrow.deposits(addr1.address, testToken.address)).to.equal(0);
        expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(escrowAmount);
    });

    it("Should not allow to withdraw a token before the expiration time", async function () {
        let escrowAmount = 1;
        let expiration = 1;

        const approveTx = await testToken.connect(owner).approve(escrow.address, escrowAmount+fee);
        await approveTx.wait();

        const depositTx = await escrow.connect(owner).deposit(addr1.address, escrowAmount, expiration, { value: ethers.utils.parseEther("1")});
        await depositTx.wait();
  
        let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
        expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

        expect(await escrow.expirations(addr1.address, testToken.address)).to.equal(expectedBlock);

        expect(escrow.withdraw(addr1.address)).to.be.revertedWith("The payment is still in escrow.");

        expect(await escrow.deposits(addr1.address, testToken.address)).to.equal(escrowAmount);
        expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(0);
    });
  });
});