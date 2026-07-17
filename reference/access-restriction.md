Welcome to the Course | Avalanche Builder Hub
Builder Hub

- Academy
- Blog
- Chat
- Console
- Documentation
- Ecosystem Careers
- Events
- Explorer
- Grants
- Integrations
- Stats Search ⌘ K

-

Access Restriction

Welcome to the Course
📘 FUNDAMENTALS
Introduction
Introduction to Precompiles Allowlist Interface Access Control Use-cases Genesis Activation
Permissioning Precompiles Create Your L1 Test Transaction Allowlist Test Contract Deployer Allowlist Fundamentals Certificate
Fundamentals Certificate
🔬 ADVANCED TOPICS
Precompile Flow (Optional)
Direct Precompile Calls Automatic Enforcement User Error
Remove Users Admin Wallet Test for Error Network Upgrade: Deactivation
Introduction Set Up Docker Validator Upgrade Rules Reading Validator Config Modify upgrade.json Restarting Node Testing in console precompiles no longer activated Network Upgrade: Activation
Introduction Creating or modifying upgrade.json Restarting Node Testing precompile activation Advanced Certificate
Advanced Topics Certificate

Search ⌘ K

Welcome to the Course

# Welcome to the Course
Master access control patterns using transaction and contract deployer allowlists with hands-on precompile implementation

## Access Restriction
Access restriction is a core requirement for many real-world networks: you may need to control who can submit transactions and who can deploy contracts to meet operational, institutional, and compliance needs.
In Avalanche L1s, these controls are implemented as precompiles (go code wrapped in a solidity interface) that follow a shared, audited permission model: the AllowList interface .

## Course Structure
This course is divided into two parts:

### Part 1: Fundamentals
The first section covers the basics of access restriction precompiles:

- Introduction — What precompiles are, the AllowList permission model (Admin/Manager/Enabled), and real-world use cases
- Genesis Activation — Create an L1 with Transaction AllowList and Contract Deployer AllowList enabled from genesis, then test that permissions work as expected

### Part 2: Advanced Topics
The second section dives deeper into precompile internals and recovery patterns:

- Precompile Flow (Optional) — Understand how Solidity calls route to Go code, and how the blockchain automatically enforces permissions even when you're not directly calling the precompile
- User Error — Intentionally lock yourself out by removing your admin privileges, then observe the resulting failures
- Network Upgrades — Learn how to deactivate and reactivate precompiles via  `upgrade.json ` to recover from misconfigurations (requires a self-hosted Docker validator)
Part 1 uses a BuilderHub hosted node for quick setup. Part 2 (Advanced) requires running your own Docker validator to access configuration files for network upgrades.

## Prerequisites
Before starting this course, we recommend completing:

- Customizing the EVM — especially the Precompiles section
- Comfort using Core Wallet , Docker , and reading a genesis JSON

## Learning Outcomes
By the end of this course, you will be able to:

- Understand what precompiles are and leverage them to implement privileged network features
- Enable Transaction AllowList and Contract Deployer AllowList in genesis
- Activate and Deactivate precompiles via Network Upgrades
Is this guide helpful?
Yes No
Copy Markdown

Introduction to Precompiles

A quick refresher on precompiles and why Avalanche L1s use them for privileged features.

### On this page

Access Restriction
Course Structure
Part 1: Fundamentals
Part 2: Advanced Topics
Prerequisites
Learning Outcomes

Page Actions
Edit on GitHub Report Issue Copy Markdown Open in AI
Instructors:

Nicolas Arnedo
Developer Relations Engineer

Join Telegram Course Chat
