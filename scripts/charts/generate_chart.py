import matplotlib.pyplot as plt
import numpy as np
import os

# Set style for academic paper
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({
    'font.size': 12,
    'axes.labelsize': 14,
    'axes.titlesize': 16,
    'legend.fontsize': 12,
    'xtick.labelsize': 12,
    'ytick.labelsize': 12,
    'figure.figsize': (10, 6),
    'font.family': 'serif'
})

# --- Chart 1: Gas Cost Comparison ---
fig, ax1 = plt.subplots(figsize=(9, 6))

protocols = ['Standard ERC-20\n(Public)', 'NexusAvalanche eERC\n(Encrypted/KYC)', 'Tornado Cash\n(Mixer)', 'Zether\n(Confidential)']
gas_costs = [50000, 943112, 1080000, 7180000] # Approximate typical gas costs for comparison
colors = ['#cccccc', '#2ecc71', '#3498db', '#e74c3c']

bars = ax1.bar(protocols, gas_costs, color=colors, edgecolor='black', linewidth=1.2)

# Add values on top of bars
for bar in bars:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2, yval + (yval*0.1), f'{yval:,}', ha='center', va='bottom', fontweight='bold')

ax1.set_yscale('log')
ax1.set_ylabel('Gas Consumption (Log Scale)')
ax1.set_title('Transaction Gas Cost Comparison: Privacy Protocols vs. Baseline')

# Add a subtle grid
ax1.yaxis.grid(True, linestyle='--', alpha=0.7)
ax1.xaxis.grid(False)

# Add text box for context
textstr = 'NexusAvalanche offers ZK-privacy\nat a fraction of Zether\'s cost,\nwhile ensuring regulatory compliance\nvia TxAllowList.'
props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
ax1.text(0.05, 0.95, textstr, transform=ax1.transAxes, fontsize=11,
        verticalalignment='top', bbox=props)

plt.tight_layout()
plt.savefig('/Users/dhruv/.gemini/antigravity/brain/caa1605b-c747-4158-a2c2-ac04d54d041e/gas_comparison_chart.png', dpi=300)
plt.close()

# --- Chart 2: NexusAvalanche Operations Breakdown ---
fig, ax2 = plt.subplots(figsize=(9, 6))

operations = ['Register User\n(Groth16)', 'Mint Tokens\n(Private)', 'Transfer Tokens\n(Confidential)', 'CCIP Cross-Chain\n(EVM Overhead)']
op_costs = [248279, 386067, 943112, 87221]
colors_op = ['#9b59b6', '#34495e', '#2ecc71', '#f1c40f']

bars2 = ax2.bar(operations, op_costs, color=colors_op, edgecolor='black', linewidth=1.2)

# Add values
for bar in bars2:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2, yval + 15000, f'{yval:,}', ha='center', va='bottom', fontweight='bold')

ax2.set_ylabel('Gas Consumption (Linear Scale)')
ax2.set_title('NexusAvalanche: Cryptographic & Interoperability Operations Overhead')
ax2.set_ylim(0, 1100000)

ax2.yaxis.grid(True, linestyle='--', alpha=0.7)
ax2.xaxis.grid(False)

plt.tight_layout()
plt.savefig('/Users/dhruv/.gemini/antigravity/brain/caa1605b-c747-4158-a2c2-ac04d54d041e/operations_breakdown_chart.png', dpi=300)
plt.close()

print("Charts generated successfully.")
