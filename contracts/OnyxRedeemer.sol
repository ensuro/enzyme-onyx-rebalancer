// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IOnyxVault} from "./interfaces/IOnyxVault.sol";
import {IRedemptionHandler} from "./interfaces/IRedemptionHandler.sol";
import {IValuationHandler} from "./interfaces/IValuationHandler.sol";

/**
 * @title OnyxRedeemer
 * @author Ensuro
 * @notice Lets SCALE_UPDATER_ROLE accounts update the Onyx share value and REDEEM_EXECUTOR_ROLE accounts execute redemption requests.
 */
contract OnyxRedeemer is AccessControl {
  /** @notice Role required to update the share value. */
  bytes32 public constant SCALE_UPDATER_ROLE = keccak256("SCALE_UPDATER_ROLE");
  /** @notice Role required to execute redemption requests. */
  bytes32 public constant REDEEM_EXECUTOR_ROLE = keccak256("REDEEM_EXECUTOR_ROLE");

  /** @notice The Onyx vault. */
  IOnyxVault public immutable onyxVault;
  /** @notice The Onyx redemption handler. */
  IRedemptionHandler public immutable redemptionHandler;

  constructor(
    IOnyxVault onyxVault_,
    IRedemptionHandler redemptionHandler_,
    address admin_,
    address[] memory updateScalers_,
    address[] memory redeemExecutors_
  ) {
    onyxVault = onyxVault_;
    redemptionHandler = redemptionHandler_;

    _grantRole(DEFAULT_ADMIN_ROLE, admin_);
    for (uint256 i = 0; i < updateScalers_.length; ++i) {
      _grantRole(SCALE_UPDATER_ROLE, updateScalers_[i]);
    }
    for (uint256 i = 0; i < redeemExecutors_.length; ++i) {
      _grantRole(REDEEM_EXECUTOR_ROLE, redeemExecutors_[i]);
    }
  }

  /**
   * @dev Modifier to make a function callable only by a certain role. In
   * addition to checking the sender's role, `address(0)`'s role is also
   * considered. Granting a role to `address(0)` is equivalent to enabling
   * this role for everyone.
   *
   * Copied from OpenZeppelin's TimelockController.
   */
  modifier onlyRoleOrOpenRole(bytes32 role) {
    if (!hasRole(role, address(0))) {
      _checkRole(role, _msgSender());
    }
    _;
  }

  /**
   * @notice Triggers a share value update on the Onyx valuation handler.
   * @return netShareValue_ The resulting net share value.
   */
  function updateScale() external onlyRoleOrOpenRole(SCALE_UPDATER_ROLE) returns (uint256 netShareValue_) {
    return _updateScale();
  }

  /**
   * @notice Updates the share value and then executes the given redemption requests.
   * @param requestIds The ids of the redemption requests to execute.
   */
  function executeRedeemRequests(uint256[] calldata requestIds) external onlyRoleOrOpenRole(REDEEM_EXECUTOR_ROLE) {
    _updateScale();
    redemptionHandler.executeRedeemRequests(requestIds);
  }

  function _updateScale() internal returns (uint256 netShareValue_) {
    return IValuationHandler(onyxVault.getValuationHandler()).updateShareValue(0);
  }
}
