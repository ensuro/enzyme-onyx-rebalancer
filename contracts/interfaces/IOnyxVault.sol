// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOnyxVault {
  function withdrawAssetTo(address asset, address to, uint256 amount) external;
}
