// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Onyx Vault interface
 * @author Ensuro
 * @notice Minimal interface of the Onyx Shares (vault) contract used by this project.
 */
interface IOnyxVault {
  /**
   * @notice Withdraws `amount` of `asset` from the vault to `to`.
   * @param asset The asset to withdraw.
   * @param to The recipient of the withdrawn asset.
   * @param amount The amount to withdraw.
   */
  function withdrawAssetTo(address asset, address to, uint256 amount) external;

  /**
   * @notice Returns the address of the valuation handler.
   * @return valuationHandler The valuation handler address.
   */
  function getValuationHandler() external view returns (address valuationHandler);
}
