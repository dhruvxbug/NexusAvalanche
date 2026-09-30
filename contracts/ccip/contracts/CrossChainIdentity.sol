// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CrossChainIdentity
 * @dev Sends and receives KYC credential statuses across chains via Chainlink CCIP.
 */
contract CrossChainIdentity is CCIPReceiver, OwnerIsCreator {
    // Custom errors
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error SourceChainNotAllowed(uint64 sourceChainSelector);

    // Event emitted when a message is sent
    event CredentialStatusSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address user,
        bool isVerified,
        string did,
        uint256 fees
    );

    // Event emitted when a message is received
    event CredentialStatusReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address user,
        bool isVerified,
        string did
    );

    /// @notice Emitted when the trusted source chain set changes.
    event SupportedChainsUpdated(uint64[] chains);

    // Link token interface
    IERC20 private s_linkToken;

    // Registry of verified users from other chains
    // Mapping: user address => chain selector => isVerified
    mapping(address => mapping(uint64 => bool)) public crossChainWhitelist;

    // Mapping: user address => DID
    mapping(address => string) public userDids;

    /**
     * @dev Trusted source chain selectors.
     *
     * The installed Chainlink CCIP v2 CCIPReceiver authenticates the caller
     * with `onlyRouter` but exposes no source-chain allow list, so
     * `any2EvmMessage.sourceChainSelector` would otherwise be trusted
     * verbatim. A credential status is a compliance assertion, so the source
     * chain must be explicitly vetted before its messages are accepted.
     *
     * Empty by default, which fails closed: with no trusted chains configured
     * every inbound message is rejected.
     */
    mapping(uint64 => bool) public supportedChains;

    /// @dev The currently configured source chain selectors, kept so they can
    ///      be replaced wholesale.
    uint64[] private s_supportedChainsList;

    constructor(address router, address link) CCIPReceiver(router) {
        s_linkToken = IERC20(link);
    }

    /**
     * @notice Replace the set of trusted source chains.
     * @dev The previous set is cleared first, so a chain that is removed can
     *      no longer deliver credential statuses.
     */
    function setSupportedChains(uint64[] calldata chains) external onlyOwner {
        for (uint256 i = 0; i < s_supportedChainsList.length; i++) {
            supportedChains[s_supportedChainsList[i]] = false;
        }
        delete s_supportedChainsList;

        for (uint256 i = 0; i < chains.length; i++) {
            supportedChains[chains[i]] = true;
            s_supportedChainsList.push(chains[i]);
        }
        emit SupportedChainsUpdated(chains);
    }

    /// @notice Return the currently trusted source chain selectors.
    function getSupportedChains() external view returns (uint64[] memory) {
        return s_supportedChainsList;
    }

    /// @notice Whether a source chain is currently trusted.
    function isSupportedChain(uint64 sourceChainSelector) external view returns (bool) {
        return supportedChains[sourceChainSelector];
    }

    /**
     * @notice Sends a cross-chain credential status via CCIP.
     * @param destinationChainSelector The CCIP chain selector.
     * @param receiver The address of the receiver contract on the destination chain.
     * @param user The address of the user whose status is being sent.
     * @param isVerified The user's verification status.
     * @param did The user's Decentralized Identifier (DID).
     * @return messageId The CCIP message ID.
     */
    function sendCredentialStatus(
        uint64 destinationChainSelector,
        address receiver,
        address user,
        bool isVerified,
        string memory did
    ) external onlyOwner returns (bytes32 messageId) {
        // Encode the payload
        bytes memory payload = abi.encode(user, isVerified, did);

        // Construct the EVM2AnyMessage
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens, just data
            extraArgs: Client._argsToBytes(
                // Set gas limit for the destination contract's `_ccipReceive` execution
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(s_linkToken)
        });

        // Get the fee required to send the message
        uint256 fees = IRouterClient(this.getRouter()).getFee(
            destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        // Approve the Router to transfer LINK tokens on contract's behalf
        s_linkToken.approve(this.getRouter(), fees);

        // Send the message through the router
        messageId = IRouterClient(this.getRouter()).ccipSend(
            destinationChainSelector,
            evm2AnyMessage
        );

        emit CredentialStatusSent(
            messageId,
            destinationChainSelector,
            user,
            isVerified,
            did,
            fees
        );

        return messageId;
    }

    /**
     * @notice Handles receiving a cross-chain credential status.
     * @dev Rejects the message unless its source chain has been explicitly
     *      trusted via setSupportedChains. CCIPReceiver in Chainlink CCIP v2
     *      authenticates the caller as the router but performs no source-chain
     *      vetting, so without this check any chain able to reach the router
     *      could assert a compliance status.
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        if (!supportedChains[any2EvmMessage.sourceChainSelector]) {
            revert SourceChainNotAllowed(any2EvmMessage.sourceChainSelector);
        }

        // Decode the payload
        (address user, bool isVerified, string memory did) = abi.decode(
            any2EvmMessage.data,
            (address, bool, string)
        );

        // Update local registry
        crossChainWhitelist[user][any2EvmMessage.sourceChainSelector] = isVerified;
        userDids[user] = did;

        emit CredentialStatusReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            user,
            isVerified,
            did
        );
    }

    /**
     * @notice Check if a user is verified on a specific source chain.
     */
    function isVerifiedFromChain(address user, uint64 sourceChainSelector) external view returns (bool) {
        return crossChainWhitelist[user][sourceChainSelector];
    }

    /**
     * @notice Withdraws LINK tokens from the contract to the owner.
     */
    function withdrawLink() public onlyOwner {
        uint256 balance = s_linkToken.balanceOf(address(this));
        if (balance == 0) revert NothingToWithdraw();
        s_linkToken.transfer(msg.sender, balance);
    }
}
