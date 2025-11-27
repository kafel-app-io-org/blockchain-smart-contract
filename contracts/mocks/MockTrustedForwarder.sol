// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockTrustedForwarder
/// @notice Simple ERC-2771-style forwarder for testing ERC2771Context.
/// @dev It appends the original signer address to the calldata as required by ERC-2771.
contract MockTrustedForwarder {
    /// @notice Forwards a call to `target`, appending `signer` as the last 20 bytes of calldata.
    /// @param target The destination contract (e.g., Kafel).
    /// @param data ABI-encoded function call (without the signer suffix).
    /// @param signer The original user address to be recovered by ERC2771Context.
    function forward(address target, bytes calldata data, address signer) external {
        bytes memory extended = abi.encodePacked(data, signer);
        (bool success, ) = target.call(extended);
        require(success, "Forward failed");
    }
}
