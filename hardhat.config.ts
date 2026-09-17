import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import HardhatContractSizer from "@solidstate/hardhat-contract-sizer";
import { configVariable, defineConfig } from "hardhat/config";

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
  networks: {
    mainnet: {
      type: "http",
      chainType: "l1",
      url: configVariable("MAINNET_RPC_URL"),
      accounts: [configVariable("MAINNET_PRIVATE_KEY")],
    },
    mainnetFork: {
      type: "edr-simulated",
      chainType: "l1",
      forking: {
        enabled: true,
        url: configVariable("MAINNET_RPC_URL"),
        blockNumber: 25934000,
      },
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
  },
});
