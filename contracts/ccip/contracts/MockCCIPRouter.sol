// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

/**
 * @title MockCCIPRouter
 * @notice Minimal stand-in for the Chainlink CCIP Router.
 *
 * The real Router is a live, audited contract whose fee is quoted by Chainlink
 * oracles and which must be configured with supported destination chains. It
 * cannot be reproduced on a local development L1, so this mock exists purely to
 * measure the EVM cost of CrossChainIdentity's own logic plus one router call.
 *
 * Gas measured against this mock is a LOWER BOUND on a real CCIP send. It is
 * NOT a Chainlink fee and must not be reported as one.
 *
 * The signatures deliberately mirror Client.EVM2AnyMessage so the function
 * selectors match IRouterClient exactly; using a loose `bytes` parameter would
 * produce different selectors and a call would not land.
 */
contract MockCCIPRouter {
    uint256 public constant MOCK_FEE = 0.01 ether;

    error MockSendFailed();

    event CCIPMessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        bytes data
    );

    function getFee(
        uint64,
        Client.EVM2AnyMessage calldata
    ) external pure returns (uint256) {
        return MOCK_FEE;
    }

    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external returns (bytes32) {
        bytes32 messageId = keccak256(abi.encode(destinationChainSelector, message));
        emit CCIPMessageSent(
            messageId,
            destinationChainSelector,
            abi.decode(message.receiver, (address)),
            message.data
        );
        return messageId;
    }

    /// @dev Deliver a message to a receiver, to exercise the receive path.
    function deliver(
        address receiver,
        bytes calldata data,
        uint64 sourceChainSelector
    ) external returns (bytes32) {
        bytes32 messageId = keccak256(abi.encode(receiver, data, sourceChainSelector));
        (bool ok, ) = receiver.call(
            abi.encodeWithSignature(
                "ccipReceive((bytes32,uint64,bytes,bytes,(address,uint256)[]))",
                Client.Any2EVMMessage({
                    messageId: messageId,
                    sourceChainSelector: sourceChainSelector,
                    sender: abi.encode(address(this)),
                    data: data,
                    destTokenAmounts: new Client.EVMTokenAmount[](0)
                })
            )
        );
        if (!ok) {
            revert MockSendFailed();
        }
        return messageId;
    }
}
