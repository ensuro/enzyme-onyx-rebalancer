import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("OnyxRedeemer", function () {
  it("deploys and grants admin, scale updater and redeem executor roles", async function () {
    const [deployer, admin, scaleUpdater, redeemExecutor] = await ethers.getSigners();

    const contract = await ethers.deployContract("OnyxRedeemer", [
      deployer.address, // onyxVault placeholder
      deployer.address, // redemptionHandler placeholder
      admin.address,
      [scaleUpdater.address],
      [redeemExecutor.address],
    ]);

    expect(await contract.SCALE_UPDATER_ROLE()).to.equal(ethers.id("SCALE_UPDATER_ROLE"));
    expect(await contract.REDEEM_EXECUTOR_ROLE()).to.equal(ethers.id("REDEEM_EXECUTOR_ROLE"));
    expect(await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await contract.hasRole(await contract.SCALE_UPDATER_ROLE(), scaleUpdater.address)).to.equal(true);
    expect(await contract.hasRole(await contract.REDEEM_EXECUTOR_ROLE(), redeemExecutor.address)).to.equal(true);
  });
});
