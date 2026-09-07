import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import HardhatContractSizer from "@solidstate/hardhat-contract-sizer";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers, HardhatContractSizer],
  solidity: {
    version: "0.8.35",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "prague",
    },
    npmFilesToBuild: [
      // List contracts from npm packages that need to be built here (e.g. proxies).
    ],
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
  },
});
