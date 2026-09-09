// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IOnyxVault} from "./interfaces/IOnyxVault.sol";

/**
 * @title OnyxRebalancer
 * @author Ensuro
 * @notice Lets REBALANCER_ROLE accounts rebalance the USDC/eToken composition held by an Onyx vault.
 */
contract OnyxRebalancer is AccessControl {
  using SafeERC20 for IERC20;

  /** @notice Role required to trigger a rebalance. */
  bytes32 public constant REBALANCER_ROLE = keccak256("REBALANCER_ROLE");

  /** @notice The USDC token. */
  IERC20 public immutable usdc;
  /** @notice The Onyx eToken (rebasing, pegged 1:1 to USDC). */
  IERC20 public immutable eToken;
  /** @notice The Onyx vault holding USDC and eToken. */
  IOnyxVault public immutable onyxVault;

  constructor(IERC20 usdc_, IERC20 eToken_, IOnyxVault onyxVault_, address admin_, address[] memory rebalancers_) {
    usdc = usdc_;
    eToken = eToken_;
    onyxVault = onyxVault_;

    _grantRole(DEFAULT_ADMIN_ROLE, admin_);
    for (uint256 i = 0; i < rebalancers_.length; ++i) {
      _grantRole(REBALANCER_ROLE, rebalancers_[i]);
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
   * @notice Sends `amount` eToken from the caller to the vault and withdraws the equivalent amount of USDC back to the caller.
   * @param amount The amount of eToken to send (and USDC to receive).
   */
  function rebalanceUSDCToEToken(uint256 amount) external onlyRoleOrOpenRole(REBALANCER_ROLE) {
    eToken.safeTransferFrom(msg.sender, address(onyxVault), amount);
    onyxVault.withdrawAssetTo(address(usdc), msg.sender, amount);
  }

  /**
   * @notice Sends `amount` USDC from the caller to the vault and withdraws the equivalent amount of eToken back to the caller.
   * @param amount The amount of USDC to send (and eToken to receive).
   */
  function rebalanceETokenToUSDC(uint256 amount) external onlyRoleOrOpenRole(REBALANCER_ROLE) {
    usdc.safeTransferFrom(msg.sender, address(onyxVault), amount);
    onyxVault.withdrawAssetTo(address(eToken), msg.sender, amount);
  }
}
