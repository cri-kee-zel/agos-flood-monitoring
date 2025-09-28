"""
Encoder Disk Template Generator and Fabrication Guide
Created: 2025-08-22
Author: GitHub Copilot

This script generates a template for a 10mm encoder disk with 20 slots (10 opaque, 10 transparent)
for use in water level monitoring systems.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Wedge, Rectangle
import os
from datetime import datetime

# Configuration
disk_diameter = 10  # mm - EXACT physical size (small encoder disk)
center_hole_diameter = 8  # mm
num_slots = 20
slot_width_deg = 18  # degrees (360/20 = 18 degrees per slot)
slot_width_mm = 1.5  # mm (width of each segment, both opaque and transparent)

# Calculate derived dimensions
scale_factor = 10  # Scale up for better visibility (10:1)
outer_radius = (disk_diameter * scale_factor) / 2  # 50mm scaled radius
inner_radius = (center_hole_diameter * scale_factor) / 2  # 40mm scaled radius
slot_width_rad = np.deg2rad(slot_width_deg)

def generate_encoder_disk_template():
    """Generate a visual template for encoder disk with alternating opaque and transparent slots"""

    # Set up the figure with exact proportions - scale up for visibility (10:1)
    scale_factor = 10  # Make template 10x larger for printing
    scaled_disk_diameter = disk_diameter * scale_factor  # 100mm for visibility
    fig, ax = plt.subplots(figsize=(8, 8))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)  # Extend plot area to edges

    # Draw outer circle
    outer_circle = Circle((0, 0), outer_radius, fill=False, color='black', linewidth=2)
    ax.add_patch(outer_circle)

    # Draw center hole
    center_hole = Circle((0, 0), inner_radius, fill=True,
                         facecolor='white', edgecolor='black', linewidth=2)
    ax.add_patch(center_hole)

    # Draw alternating slots (opaque and transparent)
    for i in range(num_slots):
        start_angle = i * slot_width_deg
        if i % 2 == 0:  # Opaque segments
            wedge = Wedge((0, 0), outer_radius, start_angle, start_angle + slot_width_deg,
                          width=outer_radius - inner_radius, color='black')
            ax.add_patch(wedge)

    # Add center crosshairs for alignment
    ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5, linewidth=1)
    ax.axvline(x=0, color='gray', linestyle='--', alpha=0.5, linewidth=1)

    # Add angle markings every 18 degrees
    for i in range(num_slots):
        angle_rad = np.deg2rad(i * slot_width_deg)
        x_mark = (outer_radius + 5) * np.cos(angle_rad)
        y_mark = (outer_radius + 5) * np.sin(angle_rad)
        ax.plot([0, x_mark], [0, y_mark], 'r-', alpha=0.3, linewidth=0.5)

        # Add degree labels
        if i % 5 == 0:  # Every 90 degrees
            x_label = (outer_radius + 10) * np.cos(angle_rad)
            y_label = (outer_radius + 10) * np.sin(angle_rad)
            ax.text(x_label, y_label, f'{i * 18}°', ha='center', va='center', fontsize=8)

    # Add dimensions and labels - show actual dimensions (not scaled)
    ax.text(0, -outer_radius-15, f"Ø{disk_diameter}mm (ACTUAL SIZE)", ha='center', va='center', fontweight='bold')
    ax.text(0, -inner_radius-2, f"Ø{center_hole_diameter}mm", ha='center', va='center', fontsize=8)

    # Add scale notice
    ax.text(0, -outer_radius-25, "TEMPLATE SHOWN AT 10x SCALE FOR VISIBILITY",
            ha='center', va='center', color='red', fontsize=10, fontweight='bold')

    # Add title and information
    title = "ENCODER DISK TEMPLATE FOR MANUAL GRINDING"
    subtitle = f"20 slots (10 opaque, 10 transparent) - {slot_width_mm}mm slot width"
    ax.text(0, outer_radius + 20, title, ha='center', va='center', fontweight='bold', fontsize=14)
    ax.text(0, outer_radius + 10, subtitle, ha='center', va='center', fontsize=10)

    # Add fabrication notes
    fabrication_notes = [
        "FABRICATION NOTES:",
        f"• Material: 1mm stainless steel",
        f"• ACTUAL disk diameter: {disk_diameter}mm",
        f"• ACTUAL center hole: {center_hole_diameter}mm",
        f"• Slot width: {slot_width_mm}mm",
        f"• Resolution: 1.57mm per slot (with 5cm pulley)",
        f"• Each segment: {slot_width_deg}° ({slot_width_mm}mm opaque + {slot_width_mm}mm transparent)"
    ]
    # Make the header bold
    fabrication_notes[0] = "FABRICATION NOTES:"

    # Set equal aspect ratio and limits
    buffer = 60  # Increase buffer for better text positioning

    # Position fabrication notes at the exact left edge of the figure
    x_pos_notes = -outer_radius - buffer + 5  # Position at the very left edge with minimal margin
    for i, note in enumerate(fabrication_notes):
        ax.text(x_pos_notes, outer_radius-10-i*8, note, fontsize=9, va='center', ha='left')

    ax.set_xlim(-outer_radius-buffer, outer_radius+buffer)
    ax.set_ylim(-outer_radius-buffer, outer_radius+buffer)
    ax.set_aspect('equal')

    # Add actual size reference - position it more prominently in the center-top
    ax.text(0, outer_radius + 40, "NOTE: PRINT AT 100% SCALE\nTHEN REDUCE TO 10% SIZE",
            ha='center', va='center', color='red', fontsize=12, fontweight='bold',
            bbox=dict(facecolor='white', edgecolor='red', boxstyle='round,pad=0.5'))

    # Hide axis ticks and labels
    ax.set_xticks([])
    ax.set_yticks([])
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)

    return fig

def generate_fabrication_guide():
    """Generate a comprehensive fabrication guide"""

    fig, ax = plt.subplots(figsize=(11, 16))
    fig.patch.set_facecolor('white')

    # Title
    ax.text(0.5, 0.98, "ENCODER DISK FABRICATION GUIDE",
            ha='center', va='top', fontweight='bold', fontsize=16, transform=ax.transAxes)

    # Specifications
    specifications = [
        "ENCODER DISK SPECIFICATIONS:",
        f"• Diameter: 10.0mm (EXACT)",
        f"• Slots: {num_slots} total (10 opaque, 10 transparent)",
        f"• Slot width: {slot_width_mm}mm",
        f"• Center hole: {center_hole_diameter}mm",
        "• Material: 1mm stainless steel",
        "• Resolution: 1.57mm per slot (with 5cm pulley)"
    ]

    # Materials section
    materials = [
        "",
        "MATERIALS NEEDED:",
        "• 1mm stainless steel sheet",
        "• Dremel with 1.5mm cutting wheel",
        "• Needle files",
        "• Matte black spray paint",
        "• Magnifying lamp (recommended)",
        "• Safety glasses",
        "• Sticker paper or label paper",
        "• Fine-point permanent marker",
        "• Compass, ruler, protractor"
    ]

    # Template creation
    template_creation = [
        "",
        "STEP 1: TEMPLATE CREATION",
        "",
        "Method 1 - Using Microsoft Word:",
        "1. Insert → Shapes → Circle (hold Shift for perfect circle)",
        "2. Size: 10cm diameter (for easy cutting, scale 10:1)",
        "3. Add lines at 18° intervals (360°/20 slots)",
        "4. Print at 100% scale",
        "",
        "Method 2 - Manual Drawing:",
        "1. Draw 10cm circle with compass",
        "2. Use protractor to mark 18° increments",
        "3. Draw radial lines for slots",
        "4. Reduce to 10mm by scanning at 10% scale"
    ]

    # Fabrication procedure
    procedure = [
        "",
        "STEP 2: DISK PREPARATION",
        "1. Cut 12mm circle from stainless sheet (allows error margin)",
        "2. Center punch and drill 8mm hole",
        "3. Sand to smooth edges",
        "4. Polish surface to 80-grit finish",
        "",
        "STEP 3: TEMPLATE APPLICATION",
        "1. Print or draw template on sticker paper",
        "2. Cut out precisely along 10mm circle",
        "3. Clean disk surface with alcohol",
        "4. Center on metal disk using 8mm hole",
        "5. Burnish smoothly to avoid air bubbles",
        "",
        "STEP 4: SLOT CUTTING (Dremel Method)",
        "1. Secure disk in vise with soft jaws",
        "2. Use Dremel with 1.5mm cutting wheel",
        "3. Cut along marked lines from center outward",
        "4. Cut halfway through (0.5mm) on first pass",
        "5. Complete cut on second pass",
        "6. Deburr with needle files",
        "",
        "ALTERNATIVE: Manual Method (No Power Tools)",
        "1. Center punch: Mark slot endpoints",
        "2. Drill holes: 1mm drill bit at each mark",
        "3. Jewelers saw: Connect holes with saw",
        "4. Files: Finish to 1.5mm width with needle files",
        "5. Sand: Smooth all surfaces with 400-grit sandpaper"
    ]

    # Finishing
    finishing = [
        "",
        "STEP 5: PAINTING PROCESS",
        "1. Apply matte black spray paint to entire disk",
        "2. Let dry completely (2 hours)",
        "3. Carefully remove sticker template",
        "4. Use razor blade to clean paint from slots",
        "5. Verify light transmission with flashlight"
    ]

    # Quality control
    quality_control = [
        "",
        "QUALITY CONTROL CHECKLIST:",
        "Parameter        | Target  | Tolerance",
        "-------------------------------------",
        "Disk diameter    | 10.0mm  | ±0.1mm",
        "Center hole      | 8.0mm   | ±0.05mm",
        "Slot width       | 1.5mm   | ±0.1mm",
        "Slot count       | 20      | Exact",
        "Slot depth       | 1.0mm   | ±0.1mm",
        "",
        "VERIFICATION STEPS:",
        "□ All 20 slots are uniform width (1.5mm)",
        "□ Slot edges are clean and perpendicular",
        "□ Disk rotates freely on 8mm shaft",
        "□ Opaque segments completely block light",
        "□ Transparent slots allow full light passage",
        "□ No residual adhesive or burrs remain"
    ]

    # Installation guide
    installation = [
        "",
        "INSTALLATION GUIDE:",
        "",
        "Pulley Assembly:",
        "1. Install bearings on 8mm shaft",
        "2. Mount V-groove pulley",
        "3. Install encoder disk",
        "4. Add thrust washers and secure with lock nuts",
        "",
        "Sensor Alignment:",
        "1. Position Omron sensor for primary reading",
        "2. Mount DIY sensor 90° offset for direction",
        "3. Adjust gap to 1mm from disk surface",
        "4. Verify signals with serial monitor"
    ]

    # Troubleshooting
    troubleshooting = [
        "",
        "TROUBLESHOOTING TIPS:",
        "",
        "Problem: Erratic readings",
        "Solution: Check sensor alignment and gap (should be 1mm)",
        "",
        "Problem: Direction detection fails",
        "Solution: Verify DIY sensor is exactly 90° offset",
        "",
        "Problem: Light leakage",
        "Solution: Add black paint to disk edges, ensure opaque",
        "         segments are fully covered"
    ]

    # Combine all sections
    all_text = (specifications + materials + template_creation + procedure +
                finishing + quality_control + installation + troubleshooting)

    # Add text sections
    y_pos = 0.95
    line_height = 0.012

    for line in all_text:
        if line.startswith(("STEP", "ENCODER", "MATERIALS", "QUALITY",
                           "INSTALLATION", "TROUBLESHOOTING")):
            # Headers
            ax.text(0.05, y_pos, line, fontsize=12, fontweight='bold',
                   transform=ax.transAxes)
        elif line.startswith(("Method", "Problem:", "Solution:")):
            # Sub-headers
            ax.text(0.07, y_pos, line, fontsize=10, fontweight='bold',
                   transform=ax.transAxes)
        elif line.startswith(("Parameter", "-----")):
            # Table headers
            ax.text(0.07, y_pos, line, fontsize=9, family='monospace',
                   transform=ax.transAxes)
        elif line.startswith("□"):
            # Checkboxes
            ax.text(0.07, y_pos, line, fontsize=9, transform=ax.transAxes)
        else:
            # Regular text
            ax.text(0.07, y_pos, line, fontsize=10, transform=ax.transAxes)

        y_pos -= line_height

    # Add visual reference diagram
    ax_inset = fig.add_axes([0.65, 0.75, 0.25, 0.15])

    # Draw simplified disk
    outer = Circle((0, 0), 1, fill=False, color='black', linewidth=2)
    inner = Circle((0, 0), 0.8, fill=True, color='white', edgecolor='black', linewidth=1)  # 8mm/10mm = 0.8
    ax_inset.add_patch(outer)
    ax_inset.add_patch(inner)

    # Add slots to visual reference
    for i in range(num_slots):
        start_angle = i * slot_width_deg
        if i % 2 == 0:  # Opaque segments
            wedge = Wedge((0, 0), 1, start_angle, start_angle + slot_width_deg,
                          width=0.84, color='black')
            ax_inset.add_patch(wedge)

    ax_inset.set_xlim(-1.2, 1.2)
    ax_inset.set_ylim(-1.2, 1.2)
    ax_inset.set_aspect('equal')
    ax_inset.axis('off')
    ax_inset.set_title('Template Pattern', fontsize=10)

    # Add timestamp and attribution
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ax.text(0.05, 0.02, f"Generated: {timestamp}", fontsize=8, transform=ax.transAxes)
    ax.text(0.05, 0.005, "Created by: GitHub Copilot", fontsize=8, transform=ax.transAxes)

    ax.axis('off')
    return fig

# Generate the template and guide
print("Generating encoder disk template and fabrication guide...")

disk_template = generate_encoder_disk_template()
fabrication_guide = generate_fabrication_guide()

# Save the files
template_filename = 'encoder_disk_template_10mm.png'
guide_filename = 'encoder_disk_fabrication_guide.pdf'

# Save with high DPI for printing clarity - don't use tight bbox to preserve left alignment
disk_template.savefig(template_filename, dpi=300, bbox_inches=None,
                      facecolor='white', edgecolor='none')
fabrication_guide.savefig(guide_filename, format='pdf', bbox_inches='tight',
                          facecolor='white', edgecolor='none')

print(f"\nFiles generated successfully:")
print(f"1. {template_filename} - Print at 100% scale then reduce to 10% for actual size")
print(f"2. {guide_filename} - Complete fabrication instructions")
print(f"\nTemplate Specifications:")
print(f"• ACTUAL Disk diameter: 10.0mm")
print(f"• ACTUAL Center hole: 8.0mm")
print(f"• Number of slots: {num_slots}")
print(f"• ACTUAL Slot width: {slot_width_mm}mm each (opaque and transparent)")
print(f"• Resolution: 1.57mm per slot (with 5cm pulley)")
print(f"\nIMPORTANT: The template shows a larger 100mm disk for visibility.")
print(f"           The ACTUAL disk size should be 10mm diameter.")
print(f"\nGenerated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")# Show the template
plt.show()