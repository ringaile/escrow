const { expect } = require("chai");
const chai = require('chai');
const numberToBN = require('number-to-bn');
const { network } = require("hardhat");

describe("EscrowERC721", function () {
    let Escrow;
    let escrow;
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
        Escrow = await ethers.getContractFactory("EscrowERC721");
        TestToken = await ethers.getContractFactory("ERC20TestToken");
        TestERC721Token = await ethers.getContractFactory("ERC721TestToken");
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        
        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        testToken = await TestToken.deploy();
        testERC721Token = await TestERC721Token.deploy();
        escrow = await Escrow.deploy(testERC721Token.address, testToken.address, fee);
    
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
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);
            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(0);

            const approveFeeTokenTx = await testToken.connect(owner).approve(addr1.address, addr1Balance);
            await approveFeeTokenTx.wait();

            const transferFeeTokenTx = await testToken.transferFrom(owner.address, addr1.address, addr1Balance);
            await transferFeeTokenTx.wait();

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance);
            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance);
            
            const approveTx = await testToken.connect(addr1).approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(addr1.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(addr1.address);

            const approveERC721TokenTx = await testERC721Token.connect(addr1).approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(addr1).deposit(addr2.address, item, expiration);
            await depositTx.wait();

            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance-fee);

            const transferFeeTx = await escrow.connect(owner).transferFee();
            await transferFeeTx.wait();

            expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(itemId);
            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance-fee);
            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance + fee);
        });

        it("Should not allow any address to collect fees", async function () {
            let addr1Balance = 5;
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);
            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(0);

            const approveFeeTokenTx = await testToken.connect(owner).approve(addr1.address, addr1Balance);
            await approveFeeTokenTx.wait();

            const transferFeeTokenTx = await testToken.transferFrom(owner.address, addr1.address, addr1Balance);
            await transferFeeTokenTx.wait();

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance);
            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance);
            
            const approveTx = await testToken.connect(addr1).approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(addr1.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(addr1.address);

            const approveERC721TokenTx = await testERC721Token.connect(addr1).approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(addr1).deposit(addr2.address, item, expiration);
            await depositTx.wait();

            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance-fee);

            expect(escrow.connect(addr1).transferFee()).to.be.revertedWith("Must be an owner.");

            expect((await testToken.balanceOf(escrow.address)).toNumber()).to.equal(fee);
            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance-fee);
            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply - addr1Balance);
        });
      });  

      describe("Deposit", function () {
        it("Should allow to deposit ERC721 compatible token", async function () {
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);
            
            const approveTx = await testToken.approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(owner.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(owner.address);

            const approveERC721TokenTx = await testERC721Token.approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(owner).deposit(addr1.address, item, expiration);
            await depositTx.wait();

            await expect(depositTx).to.emit(escrow, 'Deposited').withArgs(itemId, addr1.address, testERC721Token.address, item);

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply-fee);
          });

        it("Should allow to deposit ERC721 compatible token from not a contract owner address", async function () {
            let addr1Balance = 5;
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            const approveFeeTokenTx = await testToken.connect(owner).approve(addr1.address, addr1Balance);
            await approveFeeTokenTx.wait();

            const transferFeeTokenTx = await testToken.transferFrom(owner.address, addr1.address, addr1Balance);
            await transferFeeTokenTx.wait();

            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance);
            
            const approveTx = await testToken.connect(addr1).approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(addr1.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(addr1.address);

            const approveERC721TokenTx = await testERC721Token.connect(addr1).approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(addr1).deposit(addr2.address, item, expiration);
            await depositTx.wait();

            await expect(depositTx).to.emit(escrow, 'Deposited').withArgs(itemId, addr2.address, testERC721Token.address, item);

            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(addr1Balance-fee);

            let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
            expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

            escrowItem = await escrow.erc721Items(itemId);
            expect(escrowItem.seller).to.equal(addr2.address);
            expect(escrowItem.buyer).to.equal(addr1.address);
            expect(escrowItem.item).to.equal(item);
            expect(escrowItem.expiration).to.equal(expectedBlock);
          });
      
        it("Should allow to see deposited item of an account", async function () {
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);
            
            const approveTx = await testToken.approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(owner.address, fee);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(owner.address);

            const approveERC721TokenTx = await testERC721Token.approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(owner).deposit(addr1.address, item, expiration);
            await depositTx.wait();

            await expect(depositTx).to.emit(escrow, 'Deposited').withArgs(0, addr1.address, testERC721Token.address, item);

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply-fee);

            let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
            expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

            escrowItem = await escrow.erc721Items(itemId);
            expect(escrowItem.seller).to.equal(addr1.address);
            expect(escrowItem.buyer).to.equal(owner.address);
            expect(escrowItem.item).to.equal(item);
            expect(escrowItem.expiration).to.equal(expectedBlock);
        });
    
        it("Should not allow to deposit if account has inssuficient balance", async function () { 
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(addr1.address)).toNumber()).to.equal(0);

            const mintTx = await testERC721Token.mint(addr1.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(addr1.address);

            const approveERC721TokenTx = await testERC721Token.connect(addr1).approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            expect(escrow.connect(addr1).deposit(addr2.address, item, expiration)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
      });

      describe("Withdraw", function () {
        it("Should allow to withdraw a token after the expiration time", async function () {
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);
            
            const approveTx = await testToken.approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(owner.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(owner.address);

            const approveERC721TokenTx = await testERC721Token.approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(owner).deposit(addr1.address, item, expiration);
            await depositTx.wait();

            let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
            expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

            let escrowItem = await escrow.erc721Items(itemId);
            expect(escrowItem.expiration).to.equal(expectedBlock);

            await network.provider.send("evm_setNextBlockTimestamp", [expectedBlock])
            await network.provider.send("evm_mine");

            let futureLatestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
            expect(escrowItem.expiration).to.equal(parseInt(futureLatestBlock.timestamp, 16));

            const withdrawTx = await escrow.withdraw(itemId);
            await withdrawTx.wait();

            await expect(withdrawTx).to.emit(escrow, 'Withdrawn').withArgs(0, addr1.address, testERC721Token.address, item);
            
            expect(await testERC721Token.ownerOf(item)).to.equal(addr1.address);
            
            escrowItem = await escrow.erc721Items(itemId);
            expect(escrowItem.seller).to.equal(ethers.constants.AddressZero);
            expect(escrowItem.buyer).to.equal(ethers.constants.AddressZero);
            expect(escrowItem.item).to.equal(0);
            expect(escrowItem.expiration).to.equal(0);
        });

        it("Should not allow to withdraw a token before the expiration time", async function () {
            let itemId = 0;
            let item = 1;
            let expiration = 1;

            expect((await testToken.balanceOf(owner.address)).toNumber()).to.equal(tokenSupply);
            
            const approveTx = await testToken.approve(escrow.address, fee);
            await approveTx.wait();

            const mintTx = await testERC721Token.mint(owner.address, item);
            await mintTx.wait();

            expect(await testERC721Token.ownerOf(item)).to.equal(owner.address);

            const approveERC721TokenTx = await testERC721Token.approve(escrow.address, item);
            await approveERC721TokenTx.wait();

            const depositTx = await escrow.connect(owner).deposit(addr1.address, item, expiration);
            await depositTx.wait();

            let latestBlock = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
            expectedBlock = parseInt(latestBlock.timestamp, 16) + expiration;

            let escrowItem = await escrow.erc721Items(itemId);
            expect(escrowItem.expiration).to.equal(expectedBlock);

            expect(escrow.withdraw(0)).to.be.revertedWith("The item is still in escrow.");

            expect(await testERC721Token.ownerOf(item)).to.equal(escrow.address);

            escrowItem = await escrow.erc721Items(itemId);
            expect(escrowItem.seller).to.equal(addr1.address);
            expect(escrowItem.buyer).to.equal(owner.address);
            expect(escrowItem.item).to.equal(item);
            expect(escrowItem.expiration).to.equal(expectedBlock);
        });
      });  
});