#!/usr/bin/env python3
"""
Simple illustration generator for 100mm encoder disk
"""

import os
import math
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from matplotlib.patches import Circle, Wedge, Rectangle


def create_illustrations():
    # Create illustrations directory
    if not os.path.exists("illustrations"):
        os.makedirs("illustrations")

    # Disk specifications
    diameter = 100  # mm
    slots = 40
    slot_width = 3  # mm
    center_hole = 8  # mm
    slot_start_radius = 70  # mm
    slot_end_radius = 85  # mm

    # Create template diagram
    print("Creating disk template...")
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 16), dpi=300)
    fig.suptitle('100mm Encoder Disk - Fabrication Templates', fontsize=20, fontweight='bold')

    # Template 1: Complete disk layout
    ax1.set_title('Complete Disk Layout\n(Actual Size Template)', fontsize=14, fontweight='bold')
    ax1.set_xlim(-60, 60)
    ax1.set_ylim(-60, 60)
    ax1.set_aspect('equal')
    ax1.grid(True, alpha=0.3)

    # Draw outer circle
    outer_circle = Circle((0, 0), 50, fill=False, edgecolor='black', linewidth=2)
    ax1.add_patch(outer_circle)

    # Draw center hole
    center_hole_patch = Circle((0, 0), 4, fill=False, edgecolor='red', linewidth=2)
    ax1.add_patch(center_hole_patch)

    # Draw slot areas
    inner_slot_circle = Circle((0, 0), 35, fill=False, edgecolor='blue', linewidth=1, linestyle='--')
    outer_slot_circle = Circle((0, 0), 42.5, fill=False, edgecolor='blue', linewidth=1, linestyle='--')
    ax1.add_patch(inner_slot_circle)
    ax1.add_patch(outer_slot_circle)

    # Draw slots
    for i in range(slots):
        angle = i * 360 / slots
        slot_width_angle = math.degrees(slot_width / (2 * math.pi * 38.75))

        # Draw every other slot as cut out
        if i % 2 == 0:
            wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                         width=7.5, facecolor='lightgray', edgecolor='black', linewidth=0.5)
            ax1.add_patch(wedge)

        # Mark every 10th slot with angle
        if i % 10 == 0:
            angle_rad = math.radians(angle)
            x = 45 * math.cos(angle_rad)
            y = 45 * math.sin(angle_rad)
            ax1.text(x, y, f'{angle:.0f}°', ha='center', va='center', fontsize=8,
                    bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.8))

    # Add dimensions
    ax1.annotate('', xy=(50, 0), xytext=(-50, 0),
                arrowprops=dict(arrowstyle='<->', color='red', lw=2))
    ax1.text(0, -5, '100mm', ha='center', va='top', fontsize=12, fontweight='bold', color='red')

    # Template 2: Cutting sequence
    ax2.set_title('Cutting Sequence\n(Phase-by-Phase)', fontsize=14, fontweight='bold')
    ax2.set_xlim(-60, 60)
    ax2.set_ylim(-60, 60)
    ax2.set_aspect('equal')
    ax2.grid(True, alpha=0.3)

    # Draw basic circles
    outer_circle2 = Circle((0, 0), 50, fill=False, edgecolor='black', linewidth=2)
    center_hole2 = Circle((0, 0), 4, fill=False, edgecolor='black', linewidth=1)
    ax2.add_patch(outer_circle2)
    ax2.add_patch(center_hole2)

    # Show cutting phases with different colors
    phase_colors = ['red', 'blue', 'green', 'orange']
    for i in range(slots):
        if i % 2 == 0:  # Only cut slots
            angle = i * 360 / slots
            slot_width_angle = math.degrees(slot_width / (2 * math.pi * 38.75))

            # Determine phase
            if i % 10 == 0:  # Every 10th slot
                phase = 0
            elif i % 5 == 0:  # Every 5th slot not covered
                phase = 1
            else:
                phase = 2

            wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                         width=7.5, facecolor=phase_colors[phase], alpha=0.7,
                         edgecolor='black', linewidth=0.5)
            ax2.add_patch(wedge)

    # Template 3: Side view with dimensions
    ax3.set_title('Side View Dimensions', fontsize=14, fontweight='bold')
    ax3.set_xlim(-60, 60)
    ax3.set_ylim(-20, 20)
    ax3.set_aspect('equal')
    ax3.grid(True, alpha=0.3)

    # Draw side view
    disk_rect = Rectangle((-50, -1), 100, 2, facecolor='lightgray', edgecolor='black', linewidth=2)
    ax3.add_patch(disk_rect)

    # Draw center hole
    hole_rect = Rectangle((-4, -1), 8, 2, facecolor='white', edgecolor='red', linewidth=2)
    ax3.add_patch(hole_rect)

    # Add key dimensions
    ax3.text(0, -10, '100mm diameter\n8mm center hole\n2mm thick',
            ha='center', va='center', fontsize=12,
            bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.3))

    # Template 4: Slot reference table
    ax4.set_title('Key Measurements', fontsize=14, fontweight='bold')
    ax4.axis('off')

    specs_text = f"""
SPECIFICATIONS:
• Diameter: 100mm ± 0.5mm
• Slots: 40 total (20 cut)
• Slot width: 3mm ± 0.2mm
• Center hole: 8mm ± 0.1mm
• Slot spacing: 9° center-to-center
• Resolution: 3.927mm per pulse

CUTTING PHASES:
Phase 1: 0°, 90°, 180°, 270°
Phase 2: 45°, 135°, 225°, 315°
Phase 3: Remaining slots

QUALITY CHECKS:
□ All dimensions within tolerance
□ No burrs on slot edges
□ Uniform slot widths
□ Clean optical surfaces
□ No disk warping

ESTIMATED TIME: 4-6 hours
    """

    ax4.text(0.05, 0.95, specs_text, transform=ax4.transAxes, fontsize=11,
            verticalalignment='top', fontfamily='monospace',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='lightgreen', alpha=0.3))

    # Save template
    template_path = os.path.join("illustrations", "100mm_encoder_disk_template.png")
    plt.tight_layout()
    plt.savefig(template_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Template saved: {template_path}")

    # Create angle reference chart
    print("Creating angle reference chart...")
    fig, ax = plt.subplots(1, 1, figsize=(12, 16), dpi=300)
    fig.suptitle('100mm Encoder Disk - Slot Position Reference', fontsize=20, fontweight='bold')

    ax.axis('off')

    # Create slot position table
    table_text = "SLOT POSITION REFERENCE TABLE\n"
    table_text += "=" * 50 + "\n\n"

    # Create table in columns
    for row in range(10):  # 10 rows
        line = ""
        for col in range(4):  # 4 columns
            slot_num = row * 4 + col + 1
            if slot_num <= slots:
                angle = (slot_num - 1) * 360 / slots
                line += f"Slot {slot_num:2d}: {angle:5.1f}°    "
            else:
                line += "               "
        table_text += line + "\n"

    table_text += "\n" + "=" * 50 + "\n\n"
    table_text += "CUTTING SEQUENCE REFERENCE:\n\n"
    table_text += "Phase 1 (First - structural slots):\n"
    phase1_slots = [1, 11, 21, 31]  # 90° spacing
    table_text += f"Slots: {', '.join(map(str, phase1_slots))}\n"
    table_text += f"Angles: {', '.join([f'{(s-1)*360/slots:.1f}°' for s in phase1_slots])}\n\n"

    table_text += "Phase 2 (Secondary structural):\n"
    phase2_slots = [6, 16, 26, 36]  # 45° offset
    table_text += f"Slots: {', '.join(map(str, phase2_slots))}\n"
    table_text += f"Angles: {', '.join([f'{(s-1)*360/slots:.1f}°' for s in phase2_slots])}\n\n"

    table_text += "Phase 3 (Remaining even slots):\n"
    remaining_slots = [i for i in range(2, slots+1, 2) if i not in phase1_slots + phase2_slots]
    table_text += f"Slots: {', '.join(map(str, remaining_slots))}\n\n"

    table_text += "NOTES:\n"
    table_text += "• Only cut EVEN numbered slots (20 total)\n"
    table_text += "• Leave ODD numbered slots solid\n"
    table_text += "• Follow cutting sequence to prevent warping\n"
    table_text += "• Take breaks every 10 slots\n"
    table_text += "• Check dimensions frequently\n"

    ax.text(0.05, 0.95, table_text, transform=ax.transAxes, fontsize=12,
           verticalalignment='top', fontfamily='monospace',
           bbox=dict(boxstyle='round,pad=1', facecolor='lightyellow', alpha=0.8))

    # Save reference chart
    chart_path = os.path.join("illustrations", "100mm_encoder_reference_chart.png")
    plt.tight_layout()
    plt.savefig(chart_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Reference chart saved: {chart_path}")

    print("\n" + "="*60)
    print("PRINT-READY ILLUSTRATIONS GENERATED!")
    print("="*60)
    print(f"Files created in 'illustrations' folder:")
    print(f"1. 100mm_encoder_disk_template.png")
    print(f"2. 100mm_encoder_reference_chart.png")
    print(f"\nThese files are optimized for printing at 300 DPI")
    print(f"Print on A4/Letter size paper for workshop use")


if __name__ == "__main__":
    create_illustrations()
