import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("OnyxRebalancer", function () {
  it("deploys and grants admin and rebalancer roles", async function () {
    const [deployer, admin, rebalancer] = await ethers.getSigners();

    const contract = await ethers.deployContract("OnyxRebalancer", [
      deployer.address, // usdc placeholder
      deployer.address, // eToken placeholder
      deployer.address, // onyxVault placeholder
      admin.address,
      [rebalancer.address],
    ]);

    expect(await contract.REBALANCER_ROLE()).to.equal(ethers.id("REBALANCER_ROLE"));
    expect(await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), deployer.address)).to.equal(false);
    expect(await contract.hasRole(await contract.REBALANCER_ROLE(), rebalancer.address)).to.equal(true);
  });
});
