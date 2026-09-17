import { expect } from "chai";
import { network } from "hardhat";

const ONYX_VAULT = "0xEee7520554A18872a046F736FF262B8E4E0D0b2A";
const REDEMPTION_HANDLER_ETOKEN = "0x0c46aB5DD6a2DE1e88709608f1e5089c58c61eC2";
const REDEMPTION_HANDLER_USDC = "0x3D7C64D24D3936f462b515127Aa69C808Fa22AC8";
const ADMINS_V3 = "0xB809C75914c62DA604B1f6F1C4300bAc91797Aa1";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ETOKEN = "0xa551285B49A29cBDBAE7fC5C6a61fadC918Ad224";
const USER = "0x4d68Cf31d613070b18E406AFd6A42719a62a0785";
const REBALANCER = "0xE82B3Ff29bE643C8228492e05e4D40e2311c2529";
const REQUEST_ID = 1n;
const ONE_USDC = 10n ** 6n;

const ADDRESS_LABELS: Record<string, string> = {
  [ONYX_VAULT.toLowerCase()]: "onyxVault",
  [REDEMPTION_HANDLER_ETOKEN.toLowerCase()]: "eTokenHandler",
  [REDEMPTION_HANDLER_USDC.toLowerCase()]: "usdcHandler",
  [USDC.toLowerCase()]: "USDC",
  [ETOKEN.toLowerCase()]: "eToken",
};

const connection = await network.getOrCreate();
const { ethers, networkHelpers } = connection;

const WITHDRAW_EVENT_INTERFACE = new ethers.Interface([
  "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
]);
const WITHDRAW_TOPIC = WITHDRAW_EVENT_INTERFACE.getEvent("Withdraw").topicHash;

const TRANSFER_EVENT_INTERFACE = new ethers.Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
const TRANSFER_TOPIC = TRANSFER_EVENT_INTERFACE.getEvent("Transfer").topicHash;

describe("OnyxRedeemer mainnet fork", function () {
  before(function () {
    if (connection.networkName !== "mainnetFork") {
      this.skip();
    }
  });

  async function deployRedeemer(handler: string) {
    const [deployer] = await ethers.getSigners();

    const redeemer = await ethers.deployContract("OnyxRedeemer", [
      ONYX_VAULT,
      handler,
      deployer.address,
      [],
      [deployer.address],
    ]);

    // Impersonate the Onyx vault admin and register the redeemer as a vault admin.
    await networkHelpers.impersonateAccount(ADMINS_V3);
    await networkHelpers.setBalance(ADMINS_V3, 10n ** 18n);
    const vaultAdmin = await ethers.getSigner(ADMINS_V3);

    const vault = await ethers.getContractAt(
      ["function addAdmin(address _admin) external", "function getValuationHandler() view returns (address)"],
      ONYX_VAULT
    );
    await (await vault.connect(vaultAdmin).addAdmin(await redeemer.getAddress())).wait();

    return { redeemer, vault, deployer };
  }

  async function eTokenDeployFixture() {
    return deployRedeemer(REDEMPTION_HANDLER_ETOKEN);
  }

  async function usdcDeployFixture() {
    return deployRedeemer(REDEMPTION_HANDLER_USDC);
  }

  async function getValuationHandler(vault: Awaited<ReturnType<typeof deployRedeemer>>["vault"]) {
    return ethers.getContractAt(
      [
        "function getSharePrice() view returns (uint256 price_, uint256 timestamp_)",
        "function getShareValue() view returns (uint256 value_, uint256 timestamp_)",
      ],
      await vault.getValuationHandler()
    );
  }

  it(`executes eToken redeem request ${REQUEST_ID} and pays ~100.128 eToken to the user`, async function () {
    const { redeemer } = await networkHelpers.loadFixture(eTokenDeployFixture);

    const eToken = await ethers.getContractAt(["function balanceOf(address) view returns (uint256)"], ETOKEN);
    const before = await eToken.balanceOf(USER);

    const tx = await redeemer.executeRedeemRequests([REQUEST_ID]);
    const receipt = await tx.wait();

    const after = await eToken.balanceOf(USER);
    const delta = after - before;
    console.log("USER eToken received:", delta.toString());

    expect(delta).to.be.gte(100127000n);
    expect(delta).to.be.lte(100130000n);

    for (const log of receipt.logs) {
      if (log.topics[0] === WITHDRAW_TOPIC) {
        console.log("Withdraw event:", WITHDRAW_EVENT_INTERFACE.parseLog(log).args);
      } else if (log.topics[0] === TRANSFER_TOPIC) {
        const label = ADDRESS_LABELS[log.address.toLowerCase()] ?? log.address;
        console.log(`Transfer event (${label}):`, TRANSFER_EVENT_INTERFACE.parseLog(log).args);
      }
    }
  });

  it("USDC redeem: fails on insufficient USDC, then succeeds after adding 1 USDC via rebalancer", async function () {
    const { redeemer } = await networkHelpers.loadFixture(usdcDeployFixture);

    // USER requests a 100-share redemption on the USDC handler.
    await networkHelpers.impersonateAccount(USER);
    await networkHelpers.setBalance(USER, 10n ** 18n);
    const userSigner = await ethers.getSigner(USER);

    const vault = await ethers.getContractAt(
      ["function approve(address spender, uint256 value) returns (bool)"],
      ONYX_VAULT
    );
    await (await vault.connect(userSigner).approve(REDEMPTION_HANDLER_USDC, 100n * 10n ** 18n)).wait();

    const usdcHandler = await ethers.getContractAt(
      [
        "function requestRedeem(uint256 shares, address controller, address owner) returns (uint256 requestId)",
        "function getRedeemLastId() view returns (uint128)",
      ],
      REDEMPTION_HANDLER_USDC
    );
    await (await usdcHandler.connect(userSigner).requestRedeem(100n * 10n ** 18n, USER, USER)).wait();
    const requestId = await usdcHandler.getRedeemLastId();

    // 1. The redemption fails because the vault only holds 100 USDC.
    await expect(redeemer.executeRedeemRequests([requestId])).to.revert(ethers);

    // 2. USER adds 1 USDC to the vault through the deployed OnyxRebalancer.
    const usdc = await ethers.getContractAt(
      [
        "function approve(address spender, uint256 value) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
      ],
      USDC
    );
    await (await usdc.connect(userSigner).approve(REBALANCER, ONE_USDC)).wait();

    const rebalancer = await ethers.getContractAt(
      ["function rebalanceETokenToUSDC(uint256 amount) external"],
      REBALANCER
    );
    await (await rebalancer.connect(userSigner).rebalanceETokenToUSDC(ONE_USDC)).wait();

    // 3. Now the redemption succeeds.
    const usdcBefore = await usdc.balanceOf(USER);
    await redeemer.executeRedeemRequests([requestId]);
    const usdcAfter = await usdc.balanceOf(USER);

    const received = usdcAfter - usdcBefore;
    console.log("USER USDC received from redemption:", received.toString());
    expect(received).to.be.gte(100127000n);
    expect(received).to.be.lte(100130000n);
  });

  it("prints share price/value before and after updateScale", async function () {
    const { redeemer, vault, deployer } = await networkHelpers.loadFixture(eTokenDeployFixture);

    await (await redeemer.grantRole(await redeemer.SCALE_UPDATER_ROLE(), deployer.address)).wait();

    const valuationHandler = await getValuationHandler(vault);

    console.log("before getSharePrice:", await valuationHandler.getSharePrice());
    console.log("before getShareValue:", await valuationHandler.getShareValue());

    await (await redeemer.updateScale()).wait();

    console.log("after getSharePrice:", await valuationHandler.getSharePrice());
    console.log("after getShareValue:", await valuationHandler.getShareValue());
  });
});
