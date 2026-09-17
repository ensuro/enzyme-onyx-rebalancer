import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OnyxRedeemerModule", (m) => {
  // TODO: provide real addresses (e.g. via parameters or named accounts).
  const onyxVault = m.getParameter("onyxVault");
  const redemptionHandler = m.getParameter("redemptionHandler");
  const admin = m.getParameter("admin");
  const updateScalers = m.getParameter("updateScalers");
  const redeemExecutors = m.getParameter("redeemExecutors");

  const redeemer = m.contract("OnyxRedeemer", [onyxVault, redemptionHandler, admin, updateScalers, redeemExecutors]);

  return { redeemer };
});
