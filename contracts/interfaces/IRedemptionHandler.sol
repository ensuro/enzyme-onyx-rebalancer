// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Onyx Redemption Handler interface
 * @author Ensuro
 * @notice Minimal interface of the Onyx redemption handler (ERC7540-like redeem queue) used by this project.
 */
interface IRedemptionHandler {
  /**
   * @notice Executes the given redemption requests.
   * @param requestIds The ids of the redemption requests to execute.
   */
  function executeRedeemRequests(uint256[] calldata requestIds) external;
}
