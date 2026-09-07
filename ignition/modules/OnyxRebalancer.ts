import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OnyxRebalancerModule", (m) => {
  // TODO: provide real addresses (e.g. via parameters or named accounts).
  const usdc = m.getParameter("usdc");
  const eToken = m.getParameter("eToken");
  const onyxVault = m.getParameter("onyxVault");
  const admin = m.getParameter("admin");
  const rebalancers = m.getParameter("rebalancers");

  const rebalancer = m.contract("OnyxRebalancer", [usdc, eToken, onyxVault, admin, rebalancers]);

  return { rebalancer };
});
