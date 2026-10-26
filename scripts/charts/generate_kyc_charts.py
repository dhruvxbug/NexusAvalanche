import matplotlib.pyplot as plt
import numpy as np

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

# --- Chart 1: Latency Pipeline (Horizontal Stacked Bar) ---
fig, ax1 = plt.subplots(figsize=(10, 4))

categories = ['Compliance Pipeline']
jrdl = [0.1]  # Visual sliver, actual is 0.0082ms - 0.125ms
vc_gen = [15.0] # DID and VC Generation
sync = [13.46] # TxAllowList Sync

p1 = ax1.barh(categories, jrdl, color='#e0e0e0', edgecolor='black', height=0.4)
p2 = ax1.barh(categories, vc_gen, left=jrdl, color='#969696', edgecolor='black', height=0.4)
p3 = ax1.barh(categories, sync, left=[jrdl[0] + vc_gen[0]], color='#404040', edgecolor='black', height=0.4)

# Add text labels inside/above bars
ax1.text(jrdl[0]/2, 0.25, '< 0.1 ms\nJRDL Policy', ha='center', va='bottom', color='black', fontweight='bold')
ax1.text(jrdl[0] + vc_gen[0]/2, 0, '15.0 ms\nDID & VC Generation', ha='center', va='center', color='black', fontweight='bold')
ax1.text(jrdl[0] + vc_gen[0] + sync[0]/2, 0, '13.46 ms\nTxAllowList L1 Sync', ha='center', va='center', color='white', fontweight='bold')

ax1.set_xlabel('Processing Latency (Milliseconds)')
ax1.set_title('End-to-End KYC Webhook Processing Pipeline')
ax1.set_xlim(0, 32)
ax1.xaxis.grid(True, linestyle='--', color='#cccccc', alpha=0.7)
ax1.yaxis.grid(False)

plt.tight_layout()
plt.savefig('/Users/dhruv/.gemini/antigravity/brain/caa1605b-c747-4158-a2c2-ac04d54d041e/kyc_latency_chart_mono.png', dpi=300)
plt.close()

# --- Chart 2: Gas Efficiency (Network vs App Layer Rejection) ---
fig, ax2 = plt.subplots(figsize=(8, 6))

methods = ['Network-Level Admission\n(TxAllowList Precompile)', 'Application-Level Admission\n(Smart Contract require)']
gas_wasted = [0, 23500] # 21000 base + 2500 sload
colors = ['#d9d9d9', '#404040']

bars = ax2.bar(methods, gas_wasted, width=0.5, color=colors, edgecolor='black', linewidth=1.5)

for bar in bars:
    yval = bar.get_height()
    if yval == 0:
        ax2.text(bar.get_x() + bar.get_width()/2, yval + 500, '0 gas\n(Rejected at RPC)', ha='center', va='bottom', fontweight='bold', color='black')
    else:
        ax2.text(bar.get_x() + bar.get_width()/2, yval + 500, f'~{yval:,} gas\n(Wasted EVM Execution)', ha='center', va='bottom', fontweight='bold', color='black')

ax2.set_ylabel('EVM Gas Consumed by Unauthorized User')
ax2.set_title('Compliance Enforcement Overhead: Unauthorized Access Attempt')
ax2.set_ylim(0, 28000)
ax2.yaxis.grid(True, linestyle='--', color='#cccccc', alpha=0.7)
ax2.xaxis.grid(False)

plt.tight_layout()
plt.savefig('/Users/dhruv/.gemini/antigravity/brain/caa1605b-c747-4158-a2c2-ac04d54d041e/kyc_gas_efficiency_chart_mono.png', dpi=300)
plt.close()

print("KYC specific charts generated successfully.")
