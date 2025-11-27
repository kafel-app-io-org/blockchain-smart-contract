// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../Kafel.sol";

/// @title ReentrancyAttacker
/// @notice Test-only contract that attempts to reenter a nonReentrant function on Kafel.
contract ReentrancyAttacker is INonReentrantCallback {
    Kafel public immutable token;
    bool private _attackInProgress;

    constructor(Kafel _token) {
        token = _token;
    }

    /// @notice Starts the reentrancy attack attempt.
    function attack() external {
        _attackInProgress = true;
        token.nonReentrantOperation(address(this));
    }

    /// @notice Called by Kafel.nonReentrantOperation; tries to reenter the same function.
    function onNonReentrantCall() external override {
        if (_attackInProgress) {
            _attackInProgress = false;
            // This second call should revert due to ReentrancyGuard.
            token.nonReentrantOperation(address(this));
        }
    }
}
