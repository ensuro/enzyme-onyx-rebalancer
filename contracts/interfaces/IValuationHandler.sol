// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Onyx Valuation Handler interface
 * @author Ensuro
 * @notice Minimal interface of the Onyx ValuationHandler contract used by this project.
 */
interface IValuationHandler {
  /**
   * @notice Updates the share value using the given untracked positions value.
   * @param untrackedPositionsValue The value of positions not tracked on-chain.
   * @return netShareValue_ The resulting net share value.
   */
  function updateShareValue(int256 untrackedPositionsValue) external returns (uint256 netShareValue_);
}
