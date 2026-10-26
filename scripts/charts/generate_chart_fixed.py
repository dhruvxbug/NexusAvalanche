import matplotlib.pyplot as plt

plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({'font.size': 12, 'font.family': 'serif'})

# Chart 1
fig, ax1 = plt.subplots(figsize=(9, 6))
protocols = ['Standard ERC-20\n(Public)', 'NexusAvalanche eERC\n(Encrypted/KYC)', 'Tornado Cash\n(Mixer)', 'Zether\n(Confidential)']
gas_costs = [21000, 943112, 1389587, 7000000] 
colors = ['#f0f0f0', '#a0a0a0', '#606060', '#202020']
bars = ax1.bar(protocols, gas_costs, color=colors, edgecolor='black', linewidth=1.5)
for bar in bars:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2, yval + (yval*0.1), f'{yval:,}', ha='center', va='bottom', fontweight='bold', color='black')
ax1.set_yscale('log')
ax1.set_ylabel('Gas Consumption (Log Scale)')
ax1.set_title('Transaction Gas Cost Comparison: Privacy Protocols vs. Baseline')
ax1.yaxis.grid(True, linestyle='--', color='#cccccc', alpha=0.7)
ax1.xaxis.grid(False)
plt.tight_layout()
plt.savefig('/Users/dhruv/.gemini/antigravity/brain/caa1605b-c747-4158-a2c2-ac04d54d041e/gas_comparison_chart_mono.png', dpi=300)
plt.close()

# Chart 2
fig, ax2 = plt.subplots(figsize=(10, 6))
operations = ['TxAllowList\nSync', 'ZK Verif\n(Register)', 'ZK Verif\n(Mint)', 'Total eERC\nTransfer', 'CCIP Cross-Chain\n(EVM Overhead)']
op_costs = [43359, 248279, 386067, 943112, 87221]
colors_op = ['#e0e0e0', '#b0b0b0', '#808080', '#505050', '#202020']
bars2 = ax2.bar(operations, op_costs, color=colors_op, edgecolor='black', linewidth=1.5)
for bar in bars2:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2, yval + 15000, f'{yval:,}', ha='center', va='bottom', fontweight='bold', color='black')
ax2.set_ylabel('Gas Consumption (Linear Scale)')
ax2.set_title('NexusAvalanche: Protocol Operations Overhead')
ax2.set_ylim(0, 1100000)
ax2.yaxis.grid(True, linestyle='--', color='#cccccc', alpha=0.7)
ax2.xaxis.grid(False)
plt.tight_layout()
plt.savefig('/Users/dhruv/.gemini/antigravity/brain/caa1605b-c747-4158-a2c2-ac04d54d041e/operations_breakdown_chart_mono.png', dpi=300)
plt.close()
