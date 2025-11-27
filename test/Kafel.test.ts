import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

/**
 * Helper to express human-readable amounts with 2 decimals.
 * e.g., toUnits("1.23") == 123n (for decimals=2).
 */
const toUnits = (value: string) => ethers.parseUnits(value, 2);

describe("Kafel token", function () {
  async function deployKafelFixture() {
    const [owner, addr1, addr2, relayer, spender] = await ethers.getSigners();

    const Forwarder = await ethers.getContractFactory("MockTrustedForwarder");
    const forwarder = await Forwarder.deploy();
    await forwarder.waitForDeployment();

    const Kafel = await ethers.getContractFactory("Kafel");
    const token = await Kafel.deploy(await forwarder.getAddress());
    await token.waitForDeployment();

    return {
      token,
      forwarder,
      owner,
      addr1,
      addr2,
      relayer,
      spender
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Deployment
  // ─────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("deploys with correct metadata and initial state", async function () {
      const { token, owner } = await loadFixture(deployKafelFixture);

      expect(await token.name()).to.equal("Kafel");
      expect(await token.symbol()).to.equal("KFL");
      expect(await token.decimals()).to.equal(2);

      expect(await token.totalSupply()).to.equal(0n);
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Minting
  // ─────────────────────────────────────────────────────────────

  describe("Minting", function () {
    it("allows only the owner to mint", async function () {
      const { token, owner, addr1 } = await loadFixture(deployKafelFixture);
      const amount = toUnits("100.00");

      // Owner can mint
      await token.connect(owner).mint(addr1.address, amount);
      expect(await token.totalSupply()).to.equal(amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);

      // Non-owner cannot mint
      await expect(
        token.connect(addr1).mint(addr1.address, amount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Burning
  // ─────────────────────────────────────────────────────────────

  describe("Burning", function () {
    it("allows a holder to burn their own tokens", async function () {
      const { token, owner, addr1 } = await loadFixture(deployKafelFixture);
      const initial = toUnits("50.00");
      const burnAmount = toUnits("10.00");

      await token.connect(owner).mint(addr1.address, initial);

      await token.connect(addr1).burn(burnAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(
        initial - burnAmount
      );
      expect(await token.totalSupply()).to.equal(initial - burnAmount);
    });

    it("allows burnFrom when allowance is sufficient", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployKafelFixture
      );
      const initial = toUnits("20.00");
      const burnAmount = toUnits("5.00");

      await token.connect(owner).mint(addr1.address, initial);

      await token.connect(addr1).approve(addr2.address, burnAmount);
      await token.connect(addr2).burnFrom(addr1.address, burnAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(
        initial - burnAmount
      );
      expect(await token.totalSupply()).to.equal(initial - burnAmount);
    });

    it("reverts when burning more than balance or allowance", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployKafelFixture
      );
      const initial = toUnits("5.00");
      const burnAmount = toUnits("10.00");

      await token.connect(owner).mint(addr1.address, initial);

      // Too much self-burn
      await expect(
        token.connect(addr1).burn(burnAmount)
      ).to.be.reverted;

      // Too much burnFrom
      await token.connect(addr1).approve(addr2.address, toUnits("1.00"));
      await expect(
        token.connect(addr2).burnFrom(addr1.address, toUnits("2.00"))
      ).to.be.reverted;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Transfers & Allowances
  // ─────────────────────────────────────────────────────────────

  describe("Transfers & allowances", function () {
    it("handles basic transfers with 2-decimal arithmetic", async function () {
      const { token, owner, addr1 } = await loadFixture(deployKafelFixture);
      const amount = toUnits("10.50"); // 1050 units

      await token.connect(owner).mint(owner.address, amount);

      await token.connect(owner).transfer(addr1.address, toUnits("1.00"));

      expect(await token.balanceOf(owner.address)).to.equal(
        toUnits("9.50")
      );
      expect(await token.balanceOf(addr1.address)).to.equal(
        toUnits("1.00")
      );
    });

    it("supports approve + transferFrom", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployKafelFixture
      );
      const amount = toUnits("5.00");

      await token.connect(owner).mint(addr1.address, amount);

      await token.connect(addr1).approve(addr2.address, toUnits("2.50"));
      await token
        .connect(addr2)
        .transferFrom(addr1.address, addr2.address, toUnits("2.50"));

      expect(await token.balanceOf(addr1.address)).to.equal(
        toUnits("2.50")
      );
      expect(await token.balanceOf(addr2.address)).to.equal(
        toUnits("2.50")
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Pausable
  // ─────────────────────────────────────────────────────────────

  describe("Pausable behavior", function () {
    it("owner can pause and unpause; non-owner cannot", async function () {
      const { token, owner, addr1 } = await loadFixture(deployKafelFixture);

      await expect(token.connect(addr1).pause()).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount"
      );

      await token.connect(owner).pause();
      expect(await token.paused()).to.equal(true);

      await expect(
        token.connect(addr1).unpause()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

      await token.connect(owner).unpause();
      expect(await token.paused()).to.equal(false);
    });

    it("blocks transfers, mint, and burn while paused", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployKafelFixture
      );
      const amount = toUnits("10.00");

      await token.connect(owner).mint(owner.address, amount);
      await token.connect(owner).transfer(addr1.address, toUnits("3.00"));

      await token.connect(owner).pause();

      await expect(
        token.connect(owner).transfer(addr2.address, toUnits("1.00"))
      ).to.be.reverted;

      await expect(
        token.connect(owner).mint(addr1.address, toUnits("1.00"))
      ).to.be.reverted;

      await expect(
        token.connect(addr1).burn(toUnits("1.00"))
      ).to.be.reverted;

      // After unpause, operations resume
      await token.connect(owner).unpause();

      await token.connect(owner).transfer(addr2.address, toUnits("1.00"));
      expect(await token.balanceOf(addr2.address)).to.equal(
        toUnits("1.00")
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Permit (EIP-2612 via ERC20Permit)
  // ─────────────────────────────────────────────────────────────

  describe("Permit (EIP-2612)", function () {
    it("sets allowance via a signed permit and uses it in transferFrom", async function () {
      const { token, owner, spender } = await loadFixture(
        deployKafelFixture
      );
      const value = toUnits("10.00");

      // Mint tokens to the owner
      await token.connect(owner).mint(owner.address, value);

      const nonce = await token.nonces(owner.address);
      const deadline = (await time.latest()) + 3600n; // 1 hour from now

      const network = await ethers.provider.getNetwork();
      const domain = {
        name: "Kafel",
        version: "1",
        chainId: Number(network.chainId),
        verifyingContract: await token.getAddress()
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const message = {
        owner: owner.address,
        spender: spender.address,
        value,
        nonce,
        deadline
      };

      const signature = await owner.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(signature);

      await token.permit(
        owner.address,
        spender.address,
        value,
        deadline,
        v,
        r,
        s
      );

      expect(await token.nonces(owner.address)).to.equal(nonce + 1n);
      expect(
        await token.allowance(owner.address, spender.address)
      ).to.equal(value);

      await token
        .connect(spender)
        .transferFrom(owner.address, spender.address, value);

      expect(await token.balanceOf(spender.address)).to.equal(value);
      expect(await token.balanceOf(owner.address)).to.equal(0n);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Meta-transactions (ERC2771Context)
  // ─────────────────────────────────────────────────────────────

  describe("Meta-transactions via ERC2771Context", function () {
    it("uses the original signer as _msgSender() when called via trusted forwarder", async function () {
      const { token, forwarder, owner, addr1, addr2, relayer } =
        await loadFixture(deployKafelFixture);

      const initial = toUnits("5.00");
      const sendAmount = toUnits("1.00");

      // Mint to addr1 (the meta-tx signer)
      await token.connect(owner).mint(addr1.address, initial);

      // Encode Kafel.transfer(addr2, sendAmount)
      const data = token.interface.encodeFunctionData("transfer", [
        addr2.address,
        sendAmount
      ]);

      // Meta-tx: relayer calls forwarder, forwarder appends addr1 as signer
      await forwarder
        .connect(relayer)
        .forward(await token.getAddress(), data, addr1.address);

      // Balances reflect _msgSender() == addr1, not the forwarder or relayer
      expect(await token.balanceOf(addr1.address)).to.equal(
        initial - sendAmount
      );
      expect(await token.balanceOf(addr2.address)).to.equal(sendAmount);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ReentrancyGuard
  // ─────────────────────────────────────────────────────────────

  describe("ReentrancyGuard", function () {
    it("prevents reentrant calls into nonReentrantOperation", async function () {
      const { token } = await loadFixture(deployKafelFixture);

      const ReentrancyAttacker = await ethers.getContractFactory(
        "ReentrancyAttacker"
      );
      const attacker = await ReentrancyAttacker.deploy(
        await token.getAddress()
      );
      await attacker.waitForDeployment();

      // The second reentry attempt should revert due to ReentrancyGuard.
      await expect(attacker.attack()).to.be.reverted;
    });
  });
});
