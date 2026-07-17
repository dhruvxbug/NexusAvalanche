# SDK Repository Selection Decision

## Evaluation Criteria

I evaluated two potential SDK repositories:
1. ava-labs/ac-eerc-sdk
2. ava-labs/eerc-sdk

## Key Findings

### ava-labs/ac-eerc-sdk
- Package name: @avalabs/ac-eerc-sdk
- Version: 2.0.61 (significantly higher)
- Description: "SDK for the Encrypted ERC"
- Peer dependencies: viem^1.21.4, wagmi^1.4.13
- Includes publish script: "npm run build && npm publish"
- Recent commit: "chore: tsup version update (#59)"
- Actively maintained and published to npm

### ava-labs/eerc-sdk
- Package name: @avalabs/eerc-sdk
- Version: 1.0.2 (older)
- Description: "SDK for the Encrypted ERC"
- Peer dependencies: viem^2.0.0, wagmi^2.0.0
- NO publish script in package.json
- Recent commit: "Old doc link updated with the correct one (#13)"
- Repository field points to: git+https://github.com/ava-labs/ac-eerc-sdk.git

## Critical Evidence
The `ava-labs/eerc-sdk` package.json contains:
```
"repository": {
  "type": "git",
  "url": "git+https://github.com/ava-labs/ac-eerc-sdk.git"
}
```

This indicates the eerc-sdk repository is either outdated, deprecated, or was mistakenly pointing to the wrong repository.

## Decision
Selected **ava-labs/ac-eerc-sdk** as the maintained eERC SDK repository because:
1. Higher version number (2.0.61 vs 1.0.2)
2. Active publishing to npm (has publish script)
3. More recent meaningful updates
4. The competing repository's package.json incorrectly references this repo
5. Better maintenance indicators

This SDK will be used for eERC integration in the project.

## Repository Placement Decisions
- eERC contracts: Cloned `ava-labs/EncryptedERC` directly to `/contracts/eerc/` (not as submodule)
- eERC SDK: Cloned selected `ava-labs/ac-eerc-sdk` to `/reference/ac-eerc-sdk/`

*Decision made: Thu Jul 16 04:55:15 UTC 2026*
