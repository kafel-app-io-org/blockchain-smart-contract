// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Kafel ERC-20 Token
/// @notice Kafel (KFL) is a 2-decimal ERC-20 token with burn, pause, permit, and meta-transaction support.
interface INonReentrantCallback {
    function onNonReentrantCall() external;
}

contract Kafel is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    ERC20Permit,
    ERC2771Context,
    Ownable,
    ReentrancyGuard
{
    /// @notice Creates the Kafel token contract.
    /// @param trustedForwarder Address of the trusted meta-transaction forwarder.
    constructor(address trustedForwarder)
        ERC20("Kafel", "KFL")
        ERC20Permit("Kafel")
        ERC2771Context(trustedForwarder)
        Ownable(msg.sender) // initial owner is deployer (per OZ v5 Ownable)
    {}

    /// @notice KFL uses 2 decimals instead of the ERC-20 default 18.
    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    /// @notice Owner-only mint function, protected by ReentrancyGuard.
    /// @param to Recipient address.
    /// @param amount Amount in smallest units (e.g., 100 == 1.00 KFL with 2 decimals).
    function mint(address to, uint256 amount) external onlyOwner nonReentrant {
        _mint(to, amount);
    }

    /// @notice Pauses all token transfers, mints, and burns.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses token transfers, mints, and burns.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Example nonReentrant hook for future complex operations (used in tests).
    /// @dev Calls a callback contract; re-entrancy into this function will revert.
    /// @param callback Address of a contract implementing INonReentrantCallback.
    function nonReentrantOperation(address callback) external nonReentrant {
        if (callback != address(0)) {
            INonReentrantCallback(callback).onNonReentrantCall();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Internal overrides
    // ─────────────────────────────────────────────────────────────

    /// @dev Combine ERC20 and ERC20Pausable update logic (OZ v5 uses _update).
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }

    /// @dev Use ERC2771Context for meta-transaction-aware msg.sender.
    function _msgSender()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (address sender)
    {
        return ERC2771Context._msgSender();
    }

    /// @dev Use ERC2771Context for meta-transaction-aware msg.data.
    function _msgData()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }
}
