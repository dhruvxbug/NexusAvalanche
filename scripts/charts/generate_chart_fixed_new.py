import matplotlib.pyplot as plt

plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({'font.size': 12, 'font.family': 'serif'})

# Chart 2: Operations Breakdown with NEW Data
fig, ax2 = plt.subplots(figsize=(10, 6))
operations = ['TxAllowList\nSync', 'ZK Verif\n(Register)', 'ZK Verif\n(Mint)', 'Total eERC\nTransfer', 'CCIP Cross-Chain\n(EVM Overhead)']
op_costs = [43563, 248279, 386067, 943112, 87221]  # Using the new 43,563 value!
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
print("Chart updated!")
