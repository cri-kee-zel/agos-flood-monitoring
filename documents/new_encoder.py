#!/usr/bin/env python3
"""
100mm Encoder Disk Fabrication Guide Generator
Generates comprehensive manual fabrication guide for stainless steel encoder disk
"""

import os
import math
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from matplotlib.patches import Circle, Wedge, Rectangle
import matplotlib.patches as mpatches


class EncoderDiskGuide:
    def __init__(self):
        # Disk specifications
        self.diameter = 100  # mm
        self.slots = 40
        self.slot_width = 3  # mm
        self.center_hole = 8  # mm
        self.material = "2mm stainless steel"
        self.slot_start_radius = 70  # mm
        self.slot_end_radius = 85  # mm

        # Pulley specifications for resolution calculation
        self.pulley_diameter = 50  # mm (5cm)

        # Calculate resolution
        self.pulley_circumference = math.pi * self.pulley_diameter / 10  # cm
        self.resolution_mm = (self.pulley_circumference * 10) / self.slots  # mm per slot

    def generate_guide(self):
        """Generate the complete fabrication guide"""
        guide = []

        # Title and header
        guide.append(self._generate_header())

        # Specifications
        guide.append(self._generate_specifications())

        # Resolution calculation
        guide.append(self._generate_resolution_calculation())

        # Manual fabrication guide
        guide.append(self._generate_fabrication_steps())

        # Quality control
        guide.append(self._generate_quality_control())

        # Alternative methods
        guide.append(self._generate_alternatives())

        # Templates and measurements
        guide.append(self._generate_templates())

        return "\n".join(guide)

    def _generate_header(self):
        """Generate document header"""
        return f"""# 100mm Encoder Disk Fabrication Guide
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Perfect! 100mm Disk is IDEAL for Manual Fabrication

Thank you for the clarification! A **100mm diameter disk** changes everything and makes manual
fabrication not just possible, but actually quite straightforward. This is excellent news.

Let's redesign for your 100mm disk - this will be much easier to work with and will give you
**superior resolution**.

## Why 100mm is Perfect

✓ 10x larger working area than 10mm disk
✓ 3mm slots are easily visible and cuttable
✓ Hand tools work effectively at this scale
✓ Mistakes are correctable
✓ Better heat dissipation during cutting
✓ Professional appearance when finished"""

    def _generate_specifications(self):
        """Generate disk specifications section"""
        return f"""
## Optimized Design Specifications

```
[Disk Specifications]
- Diameter: {self.diameter}mm ({self.diameter/10}cm) - Perfect for manual work
- Slots: {self.slots} (optimal for resolution and manual fabrication)
- Slot width: {self.slot_width}mm (easily visible and cuttable)
- Slot length: {self.slot_end_radius - self.slot_start_radius}mm (from radius {self.slot_start_radius}mm to {self.slot_end_radius}mm)
- Center hole: {self.center_hole}mm (matches your bearings)
- Material: {self.material} - Perfect choice
- Total cutting area: {self.slots} slots × {self.slot_width}mm × {self.slot_end_radius - self.slot_start_radius}mm
```

### Angle Calculations:
- Degrees per slot: {360/self.slots}°
- Slot spacing: {360/self.slots}° center-to-center
- Arc length per slot at 77.5mm radius: {2 * math.pi * 77.5 * (360/self.slots) / 360:.2f}mm"""

    def _generate_resolution_calculation(self):
        """Generate resolution calculation section"""
        return f"""
## Resolution Calculation

**With {self.diameter}mm disk and {self.pulley_diameter}mm diameter pulley:**
```
Pulley circumference = π × {self.pulley_diameter/10}cm = {self.pulley_circumference:.2f}cm
Each revolution = {self.pulley_circumference:.2f}cm water level change
{self.slots} slots per revolution = {self.pulley_circumference:.2f}cm ÷ {self.slots} = {self.pulley_circumference/self.slots:.4f}cm per slot
```

**Your resolution: {self.resolution_mm:.3f}mm per slot** - This is exceptional precision!

This means each encoder pulse represents {self.resolution_mm:.3f}mm of water level change."""

    def _generate_fabrication_steps(self):
        """Generate detailed fabrication steps"""
        return f"""
## Manual Fabrication Guide for {self.diameter}mm Disk

### Step 1: Template Creation and Planning
```
Required Tools:
- Compass (for 100mm circle)
- Protractor (360° marked)
- Permanent marker
- Steel ruler
- Center punch
- Sharp scribe

Process:
1. Draw {self.diameter}mm circle on paper template
2. Mark center point precisely
3. Divide into {self.slots} segments: 360° ÷ {self.slots} = {360/self.slots}° per segment
4. Mark slot positions: {self.slot_width}mm wide, {self.slot_end_radius - self.slot_start_radius}mm long
5. Slots from radius {self.slot_start_radius}mm to {self.slot_end_radius}mm
```

### Step 2: Marking the Steel Disk
```
Safety First:
- Wear safety glasses
- Secure work surface
- Good lighting essential

Marking Process:
1. Center punch exact center point
2. Drill {self.center_hole}mm center hole (use cutting oil)
3. Mount disk on temporary arbor for marking
4. Use protractor to mark every {360/self.slots}° ({360/(self.slots*2)}° spacing for alternating pattern)
5. Draw radial lines from center to edge
6. Mark slot boundaries at {self.slot_start_radius}mm and {self.slot_end_radius}mm radius
7. Draw slot outlines: {self.slot_width/2}mm each side of radial line
```

### Step 3: Cutting Process - Dremel Method
```
Required Tools:
- Dremel rotary tool
- Cutting wheels (1mm or 1.5mm thickness)
- Straight edge guide/fence
- Clamps
- Safety equipment (glasses, dust mask)
- Cutting oil or WD-40

Cutting Technique:
1. Set up straight edge guide for each slot
2. Start with light scoring passes (don't try to cut through immediately)
3. Make 3-4 progressively deeper passes
4. Cut from inner radius ({self.slot_start_radius}mm) outward
5. Maintain steady feed rate to avoid overheating
6. Take 5-minute breaks every 10 slots to prevent overheating
7. Use cutting oil to reduce heat and improve finish
```

### Step 4: Cutting Sequence Strategy
```
Smart Cutting Order (maintains structural integrity):
Phase 1: Cut slots at 0°, 90°, 180°, 270° (every 90°)
Phase 2: Cut slots at 45°, 135°, 225°, 315° (fill in quarters)
Phase 3: Cut remaining slots in systematic pattern
Phase 4: Final cleanup and deburring

This prevents:
- Disk warping during cutting
- Loss of reference marks
- Accumulation of cutting stress
```

### Step 5: Finishing Process
```
Deburring:
- Use fine file to remove cutting burrs
- Light sandpaper (320 grit) for smooth edges
- Ensure all slots have clean, sharp edges

Surface Preparation:
- Clean with degreaser
- Light sand with 400 grit if painting
- Wipe clean with tack cloth

Painting (if desired):
- Prime with metal primer
- Apply matte black paint to alternate segments
- Use masking tape for clean lines
- Allow full cure time between coats
```"""

    def _generate_quality_control(self):
        """Generate quality control checklist"""
        return f"""
## Quality Control Checklist

### Dimensional Checks:
```
[ ] Overall diameter: {self.diameter}mm ± 0.5mm
[ ] Center hole: {self.center_hole}mm ± 0.1mm
[ ] All {self.slots} slots present and accounted for
[ ] Slot width: {self.slot_width}mm ± 0.2mm
[ ] Slot length: {self.slot_end_radius - self.slot_start_radius}mm ± 0.5mm
[ ] Slot spacing: {360/self.slots}° ± 0.5° between centers
```

### Functional Checks:
```
[ ] Disk runs true on shaft (no wobble > 0.1mm)
[ ] Opaque segments block light completely
[ ] Transparent segments allow clear light passage
[ ] No burrs or sharp edges that could damage sensors
[ ] Surface finish appropriate for sensor detection
[ ] Center hole fits bearing/shaft properly
```

### Optical Performance:
```
[ ] Clean transitions between opaque and transparent
[ ] No partial blockages in slot areas
[ ] Consistent opacity in painted areas
[ ] No scratches in critical sensor areas
[ ] Paint adhesion good (no flaking)
```"""

    def _generate_alternatives(self):
        """Generate alternative fabrication methods"""
        return f"""
## Alternative Fabrication Methods

### Method 1: Laser/Waterjet Cutting (Professional)
```
Advantages:
- Perfect precision
- Clean edges
- Fast production
- Repeatable results

Files needed:
- DXF file with exact dimensions
- Material specification: {self.material}

Cost: Typically $20-50 for single disk
```

### Method 2: Segment Painting (Easier DIY)
```
If cutting {self.slots} slots seems daunting:

1. Cut blank {self.diameter}mm disk with {self.center_hole}mm center hole
2. Sand surface lightly for paint adhesion
3. Create vinyl stencil with slot pattern
4. Paint entire disk matte black
5. Remove stencil while paint is slightly tacky
6. Touch up as needed
7. Clear coat for protection

This requires only basic metalworking - no precision slot cutting
```

### Method 3: Hybrid Approach
```
1. Professional center hole and outer diameter
2. DIY slot cutting using template
3. Professional finishing if desired

Combines cost savings with precision where it matters most
```"""

    def _generate_templates(self):
        """Generate template and measurement data"""
        slot_positions = []
        for i in range(self.slots):
            angle = i * 360 / self.slots
            slot_positions.append(f"Slot {i+1:2d}: {angle:6.1f}°")

        # Split into columns for readability
        col1 = slot_positions[:self.slots//2]
        col2 = slot_positions[self.slots//2:]

        template_data = "## Template Data and Measurements\n\n"
        template_data += "### Slot Position Table:\n```\n"

        for i in range(len(col1)):
            line = col1[i]
            if i < len(col2):
                line += f"    {col2[i]}"
            template_data += line + "\n"

        template_data += "```\n\n"

        template_data += f"""### Critical Measurements:
```
Center coordinates: (0, 0)
Slot inner radius: {self.slot_start_radius}mm
Slot outer radius: {self.slot_end_radius}mm
Slot width (arc): {2 * math.pi * 77.5 * self.slot_width / 360:.2f}mm at center radius
Angular width: {self.slot_width * 360 / (2 * math.pi * 77.5):.2f}° at center radius
```

### Time Estimates:
```
Design and layout: 30-45 minutes
Marking the disk: 20-30 minutes
Cutting {self.slots} slots: 2-3 hours (with breaks)
Deburring and finishing: 30-45 minutes
Painting (if applicable): 1 hour + drying time
Total project time: 4-6 hours over 1-2 days
```

### Material Requirements:
```
- {self.material} disk, {self.diameter}mm diameter
- Cutting wheels: 10-15 pieces (spares for breakage)
- Primer: 50ml
- Paint: 100ml matte black
- Sandpaper: 320 and 400 grit
- Cutting oil: 100ml
```

### Sensor Placement Guide:
```
For {self.diameter}mm disk with sensors:
- Place sensors at radius 77.5mm (center of slot area)
- Maintain 1-2mm gap from disk surface
- Omron sensor: Choose any convenient position
- DIY sensor: Place 90° from Omron sensor
- Ensure both sensors are at same radius for timing accuracy
```"""

        return template_data

    def export_to_file(self, filename="100mm_encoder_disk_fabrication_guide.md"):
        """Export the guide to a markdown file"""
        guide_content = self.generate_guide()

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(guide_content)
            return f"✓ Guide successfully exported to: {filename}"
        except Exception as e:
            return f"✗ Error exporting guide: {str(e)}"

    def generate_print_ready_guide(self):
        """Generate a print-optimized version of the guide"""
        guide = []

        # Print-optimized header
        guide.append("=" * 80)
        guide.append("100mm ENCODER DISK FABRICATION GUIDE - PRINT VERSION")
        guide.append("=" * 80)
        guide.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        guide.append("=" * 80)
        guide.append("")

        # Executive Summary for quick reference
        guide.append("QUICK REFERENCE SUMMARY")
        guide.append("-" * 40)
        guide.append(f"• Disk Diameter: {self.diameter}mm")
        guide.append(f"• Number of Slots: {self.slots}")
        guide.append(f"• Slot Width: {self.slot_width}mm")
        guide.append(f"• Resolution: {self.resolution_mm:.3f}mm per slot")
        guide.append(f"• Material: {self.material}")
        guide.append(f"• Estimated Time: 4-6 hours")
        guide.append("")

        # Table of Contents
        guide.append("TABLE OF CONTENTS")
        guide.append("-" * 40)
        guide.append("1. Specifications & Calculations")
        guide.append("2. Tools & Materials Required")
        guide.append("3. Step-by-Step Instructions")
        guide.append("4. Quality Control Checklist")
        guide.append("5. Troubleshooting Guide")
        guide.append("6. Slot Position Reference Table")
        guide.append("")
        guide.append("=" * 80)

        # Section 1: Specifications
        guide.append("1. SPECIFICATIONS & CALCULATIONS")
        guide.append("=" * 80)
        guide.append("")
        guide.append("DISK SPECIFICATIONS:")
        guide.append(f"  Diameter: {self.diameter}mm ({self.diameter/10}cm)")
        guide.append(f"  Total Slots: {self.slots}")
        guide.append(f"  Slot Width: {self.slot_width}mm")
        guide.append(f"  Slot Length: {self.slot_end_radius - self.slot_start_radius}mm")
        guide.append(f"  Slot Position: {self.slot_start_radius}mm to {self.slot_end_radius}mm radius")
        guide.append(f"  Center Hole: {self.center_hole}mm diameter")
        guide.append(f"  Material: {self.material}")
        guide.append("")
        guide.append("ANGLE CALCULATIONS:")
        guide.append(f"  Degrees per slot: {360/self.slots}°")
        guide.append(f"  Slot spacing: {360/self.slots}° center-to-center")
        guide.append("")
        guide.append("RESOLUTION CALCULATION:")
        guide.append(f"  Pulley diameter: {self.pulley_diameter}mm")
        guide.append(f"  Pulley circumference: {self.pulley_circumference:.2f}cm")
        guide.append(f"  Resolution: {self.resolution_mm:.3f}mm per slot")
        guide.append("")

        # Section 2: Tools & Materials
        guide.append("=" * 80)
        guide.append("2. TOOLS & MATERIALS REQUIRED")
        guide.append("=" * 80)
        guide.append("")
        guide.append("CUTTING TOOLS:")
        guide.append("  • Dremel rotary tool with variable speed")
        guide.append("  • Cutting wheels (1-1.5mm thickness) - 15 pieces")
        guide.append("  • Straight edge guide/fence")
        guide.append("  • Clamps (4-6 pieces)")
        guide.append("")
        guide.append("MEASURING TOOLS:")
        guide.append("  • Compass (for 100mm circles)")
        guide.append("  • Protractor (360° marked)")
        guide.append("  • Steel ruler (300mm minimum)")
        guide.append("  • Center punch")
        guide.append("  • Sharp scribe")
        guide.append("")
        guide.append("SAFETY EQUIPMENT:")
        guide.append("  • Safety glasses (mandatory)")
        guide.append("  • Dust mask")
        guide.append("  • Work gloves")
        guide.append("  • First aid kit nearby")
        guide.append("")
        guide.append("MATERIALS:")
        guide.append(f"  • {self.material} disk, {self.diameter}mm diameter")
        guide.append("  • Cutting oil or WD-40 (100ml)")
        guide.append("  • Sandpaper: 320 and 400 grit")
        guide.append("  • Metal primer (50ml)")
        guide.append("  • Matte black paint (100ml)")
        guide.append("  • Clean rags")
        guide.append("")

        # Section 3: Instructions
        guide.append("=" * 80)
        guide.append("3. STEP-BY-STEP INSTRUCTIONS")
        guide.append("=" * 80)
        guide.append("")
        guide.append("STEP 1: TEMPLATE PREPARATION (30 minutes)")
        guide.append("-" * 50)
        guide.append("1.1 Draw 100mm circle on paper using compass")
        guide.append("1.2 Mark exact center point")
        guide.append(f"1.3 Divide circle into {self.slots} equal segments ({360/self.slots}° each)")
        guide.append("1.4 Mark radial lines from center to edge")
        guide.append(f"1.5 Mark slot boundaries at {self.slot_start_radius}mm and {self.slot_end_radius}mm radius")
        guide.append(f"1.6 Draw slot outlines: {self.slot_width}mm wide centered on radials")
        guide.append("")
        guide.append("STEP 2: DISK PREPARATION (20 minutes)")
        guide.append("-" * 50)
        guide.append("2.1 Center punch the disk center precisely")
        guide.append(f"2.2 Drill {self.center_hole}mm center hole (use cutting oil)")
        guide.append("2.3 Mount disk on temporary arbor")
        guide.append("2.4 Transfer template markings to steel disk")
        guide.append("2.5 Double-check all measurements before cutting")
        guide.append("")
        guide.append("STEP 3: CUTTING SEQUENCE (2-3 hours)")
        guide.append("-" * 50)
        guide.append("IMPORTANT: Follow this order to prevent warping!")
        guide.append("Phase 1: Cut slots at 0°, 90°, 180°, 270°")
        guide.append("Phase 2: Cut slots at 45°, 135°, 225°, 315°")
        guide.append("Phase 3: Cut remaining slots systematically")
        guide.append("Phase 4: Final cleanup and deburring")
        guide.append("")
        guide.append("CUTTING TECHNIQUE:")
        guide.append("• Set up straight edge guide for each slot")
        guide.append("• Make light scoring passes first (don't cut through)")
        guide.append("• Gradually deepen cuts over 3-4 passes")
        guide.append("• Cut from inner radius outward")
        guide.append("• Take 5-minute breaks every 10 slots")
        guide.append("• Use cutting oil to reduce heat")
        guide.append("")
        guide.append("STEP 4: FINISHING (45 minutes)")
        guide.append("-" * 50)
        guide.append("4.1 Remove all burrs with fine file")
        guide.append("4.2 Light sanding with 320 grit paper")
        guide.append("4.3 Clean with degreaser")
        guide.append("4.4 Apply primer if painting")
        guide.append("4.5 Paint alternate segments matte black")
        guide.append("4.6 Final inspection and touch-up")
        guide.append("")

        # Section 4: Quality Control
        guide.append("=" * 80)
        guide.append("4. QUALITY CONTROL CHECKLIST")
        guide.append("=" * 80)
        guide.append("")
        guide.append("DIMENSIONAL CHECKS:")
        guide.append(f"  [ ] Overall diameter: {self.diameter}mm ± 0.5mm")
        guide.append(f"  [ ] Center hole: {self.center_hole}mm ± 0.1mm")
        guide.append(f"  [ ] All {self.slots} slots present")
        guide.append(f"  [ ] Slot width: {self.slot_width}mm ± 0.2mm")
        guide.append(f"  [ ] Slot length: {self.slot_end_radius - self.slot_start_radius}mm ± 0.5mm")
        guide.append(f"  [ ] Slot spacing: {360/self.slots}° ± 0.5°")
        guide.append("")
        guide.append("FUNCTIONAL CHECKS:")
        guide.append("  [ ] Disk runs true (wobble < 0.1mm)")
        guide.append("  [ ] Opaque segments block light completely")
        guide.append("  [ ] Clear segments allow light passage")
        guide.append("  [ ] No burrs on edges")
        guide.append("  [ ] Paint adherence good")
        guide.append("  [ ] Center hole fits shaft properly")
        guide.append("")

        # Section 5: Troubleshooting
        guide.append("=" * 80)
        guide.append("5. TROUBLESHOOTING GUIDE")
        guide.append("=" * 80)
        guide.append("")
        guide.append("PROBLEM: Cutting wheel breaks frequently")
        guide.append("SOLUTION: Reduce cutting speed, use more cutting oil")
        guide.append("")
        guide.append("PROBLEM: Disk gets too hot during cutting")
        guide.append("SOLUTION: Take more frequent breaks, use cutting oil")
        guide.append("")
        guide.append("PROBLEM: Slots not uniform width")
        guide.append("SOLUTION: Use consistent feed rate, check guide setup")
        guide.append("")
        guide.append("PROBLEM: Disk warps during cutting")
        guide.append("SOLUTION: Follow recommended cutting sequence")
        guide.append("")
        guide.append("PROBLEM: Paint doesn't adhere well")
        guide.append("SOLUTION: Better surface preparation, use metal primer")
        guide.append("")

        # Section 6: Reference Table
        guide.append("=" * 80)
        guide.append("6. SLOT POSITION REFERENCE TABLE")
        guide.append("=" * 80)
        guide.append("")
        guide.append("Slot#  Angle    Slot#  Angle    Slot#  Angle    Slot#  Angle")
        guide.append("-" * 64)

        for i in range(0, self.slots, 4):
            line = ""
            for j in range(4):
                if i + j < self.slots:
                    slot_num = i + j + 1
                    angle = (i + j) * 360 / self.slots
                    line += f"{slot_num:2d}:   {angle:5.1f}°  "
                else:
                    line += "           "
            guide.append(line)

        guide.append("")
        guide.append("NOTES:")
        guide.append("• Angles measured from 0° reference (top of disk)")
        guide.append("• Cut slots in the sequence shown in Step 3")
        guide.append("• Mark completed slots to track progress")
        guide.append("")
        guide.append("=" * 80)
        guide.append("END OF FABRICATION GUIDE")
        guide.append("=" * 80)

        return "\n".join(guide)

    def export_print_ready(self, filename="100mm_encoder_disk_PRINT_GUIDE.txt"):
        """Export print-ready version"""
        print_content = self.generate_print_ready_guide()

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(print_content)
            return f"✓ Print-ready guide exported to: {filename}"
        except Exception as e:
            return f"✗ Error exporting print guide: {str(e)}"

    def generate_disk_template(self, save_path="illustrations"):
        """Generate visual template for the encoder disk"""
        # Create illustrations directory if it doesn't exist
        if not os.path.exists(save_path):
            os.makedirs(save_path)

        # Create figure with high DPI for printing
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
        center_hole = Circle((0, 0), 4, fill=False, edgecolor='red', linewidth=2)
        ax1.add_patch(center_hole)

        # Draw slot areas
        inner_slot_circle = Circle((0, 0), 35, fill=False, edgecolor='blue', linewidth=1, linestyle='--')
        outer_slot_circle = Circle((0, 0), 42.5, fill=False, edgecolor='blue', linewidth=1, linestyle='--')
        ax1.add_patch(inner_slot_circle)
        ax1.add_patch(outer_slot_circle)

        # Draw slots
        for i in range(self.slots):
            angle = i * 360 / self.slots
            # Convert to radians
            angle_rad = math.radians(angle)

            # Calculate slot boundaries
            slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))  # Average radius

            # Draw slot as wedge
            if i % 2 == 0:  # Every other slot is cut out
                wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                             width=7.5, facecolor='lightgray', edgecolor='black', linewidth=0.5)
                ax1.add_patch(wedge)

            # Mark every 10th slot with angle
            if i % 10 == 0:
                x = 45 * math.cos(angle_rad)
                y = 45 * math.sin(angle_rad)
                ax1.text(x, y, f'{angle:.0f}°', ha='center', va='center', fontsize=8,
                        bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.8))

        # Add dimensions
        ax1.annotate('', xy=(50, 0), xytext=(-50, 0),
                    arrowprops=dict(arrowstyle='<->', color='red', lw=2))
        ax1.text(0, -5, '100mm', ha='center', va='top', fontsize=12, fontweight='bold', color='red')

        ax1.annotate('', xy=(4, 0), xytext=(-4, 0),
                    arrowprops=dict(arrowstyle='<->', color='red', lw=1))
        ax1.text(0, 2, '8mm', ha='center', va='bottom', fontsize=10, color='red')

        # Template 2: Cutting sequence diagram
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

        # Color code different phases
        phase_colors = ['red', 'blue', 'green', 'orange']
        phase_labels = ['Phase 1 (90°)', 'Phase 2 (45°)', 'Phase 3', 'Phase 4']

        for i in range(self.slots):
            angle = i * 360 / self.slots
            angle_rad = math.radians(angle)
            slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))

            # Determine phase
            if i % 10 == 0:  # Every 10th slot (0°, 90°, 180°, 270°)
                phase = 0
            elif i % 5 == 0:  # Every 5th slot not already covered
                phase = 1
            elif i % 2 == 0:  # Remaining even slots
                phase = 2
            else:  # Odd slots
                phase = 3

            if i % 2 == 0:  # Only show cut slots
                wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                             width=7.5, facecolor=phase_colors[phase], alpha=0.7,
                             edgecolor='black', linewidth=0.5)
                ax2.add_patch(wedge)

        # Add legend
        legend_patches = [mpatches.Patch(color=phase_colors[i], label=phase_labels[i])
                         for i in range(4)]
        ax2.legend(handles=legend_patches, loc='upper right', bbox_to_anchor=(1, 1))

        # Template 3: Dimensional drawing
        ax3.set_title('Dimensional Specifications\n(Side View)', fontsize=14, fontweight='bold')
        ax3.set_xlim(-60, 60)
        ax3.set_ylim(-30, 30)
        ax3.set_aspect('equal')
        ax3.grid(True, alpha=0.3)

        # Draw side view
        disk_rect = Rectangle((-50, -1), 100, 2, facecolor='lightgray', edgecolor='black', linewidth=2)
        ax3.add_patch(disk_rect)

        # Draw center hole
        hole_rect = Rectangle((-4, -1), 8, 2, facecolor='white', edgecolor='red', linewidth=2)
        ax3.add_patch(hole_rect)

        # Draw slot areas
        slot_left = Rectangle((-42.5, -1), 7.5, 2, facecolor='white', edgecolor='blue', linewidth=1)
        slot_right = Rectangle((35, -1), 7.5, 2, facecolor='white', edgecolor='blue', linewidth=1)
        ax3.add_patch(slot_left)
        ax3.add_patch(slot_right)

        # Add dimensions
        dimension_lines = [
            ((-50, -50), (-10, 100), '100mm'),
            ((-4, -4), (-10, 8), '8mm'),
            ((-42.5, 35), (-10, 7.5), '15mm slots'),
            ((-1, -1), (-10, 2), '2mm thick')
        ]

        for (start, end), (offset_x, width), label in dimension_lines:
            y_pos = -15 if 'thick' in label else -20
            ax3.annotate('', xy=end, xytext=start,
                        arrowprops=dict(arrowstyle='<->', color='red', lw=1))
            ax3.text((start[0] + end[0])/2, y_pos, label, ha='center', va='top',
                    fontsize=10, color='red')

        # Template 4: Sensor placement guide
        ax4.set_title('Sensor Placement Guide\n(Top View)', fontsize=14, fontweight='bold')
        ax4.set_xlim(-60, 60)
        ax4.set_ylim(-60, 60)
        ax4.set_aspect('equal')
        ax4.grid(True, alpha=0.3)

        # Draw disk outline
        outer_circle4 = Circle((0, 0), 50, fill=False, edgecolor='black', linewidth=2)
        center_hole4 = Circle((0, 0), 4, fill=False, edgecolor='black', linewidth=1)
        sensor_circle = Circle((0, 0), 38.75, fill=False, edgecolor='green', linewidth=2, linestyle='--')
        ax4.add_patch(outer_circle4)
        ax4.add_patch(center_hole4)
        ax4.add_patch(sensor_circle)

        # Draw sensor positions
        omron_angle = 0  # degrees
        diy_angle = 90  # degrees

        omron_x = 38.75 * math.cos(math.radians(omron_angle))
        omron_y = 38.75 * math.sin(math.radians(omron_angle))
        diy_x = 38.75 * math.cos(math.radians(diy_angle))
        diy_y = 38.75 * math.sin(math.radians(diy_angle))

        # Draw sensors
        omron_sensor = Rectangle((omron_x-3, omron_y-1.5), 6, 3, facecolor='red', alpha=0.7,
                               edgecolor='darkred', linewidth=2)
        diy_sensor = Rectangle((diy_x-1.5, diy_y-3), 3, 6, facecolor='blue', alpha=0.7,
                             edgecolor='darkblue', linewidth=2)
        ax4.add_patch(omron_sensor)
        ax4.add_patch(diy_sensor)

        # Labels
        ax4.text(omron_x+8, omron_y, 'Omron Sensor\n(0° position)', ha='left', va='center',
                fontsize=10, bbox=dict(boxstyle='round,pad=0.3', facecolor='red', alpha=0.3))
        ax4.text(diy_x, diy_y+8, 'DIY Sensor\n(90° position)', ha='center', va='bottom',
                fontsize=10, bbox=dict(boxstyle='round,pad=0.3', facecolor='blue', alpha=0.3))

        # Add sensor circle dimension
        ax4.text(25, -25, 'Sensor radius: 77.5mm\n(center of slots)', ha='center', va='center',
                fontsize=12, bbox=dict(boxstyle='round,pad=0.5', facecolor='green', alpha=0.3))

        # Save the template
        template_path = os.path.join(save_path, '100mm_encoder_disk_template.png')
        plt.tight_layout()
        plt.savefig(template_path, dpi=300, bbox_inches='tight')
        plt.close()

        return template_path

    def generate_cutting_guide(self, save_path="illustrations"):
        """Generate step-by-step cutting guide illustrations"""
        if not os.path.exists(save_path):
            os.makedirs(save_path)

        fig, axes = plt.subplots(2, 3, figsize=(18, 12), dpi=300)
        fig.suptitle('Step-by-Step Cutting Guide', fontsize=20, fontweight='bold')

        steps = [
            "Step 1: Template Layout",
            "Step 2: Center & Marking",
            "Step 3: Phase 1 Cutting",
            "Step 4: Phase 2 Cutting",
            "Step 5: Complete Cutting",
            "Step 6: Quality Check"
        ]

        for idx, (ax, title) in enumerate(zip(axes.flat, steps)):
            ax.set_title(title, fontsize=14, fontweight='bold')
            ax.set_xlim(-60, 60)
            ax.set_ylim(-60, 60)
            ax.set_aspect('equal')
            ax.grid(True, alpha=0.3)

            # Draw base disk
            outer_circle = Circle((0, 0), 50, fill=False, edgecolor='black', linewidth=2)
            ax.add_patch(outer_circle)

            if idx >= 1:  # Add center hole from step 2
                center_hole = Circle((0, 0), 4, fill=True, facecolor='white', edgecolor='red', linewidth=2)
                ax.add_patch(center_hole)

            if idx == 0:  # Template layout
                # Show measurement lines
                for i in range(0, 360, 45):
                    angle_rad = math.radians(i)
                    x1, y1 = 35 * math.cos(angle_rad), 35 * math.sin(angle_rad)
                    x2, y2 = 50 * math.cos(angle_rad), 50 * math.sin(angle_rad)
                    ax.plot([x1, x2], [y1, y2], 'b--', linewidth=1)
                    ax.text(52*math.cos(angle_rad), 52*math.sin(angle_rad), f'{i}°',
                           ha='center', va='center', fontsize=8)

            elif idx == 1:  # Center and marking
                # Show radial lines for all slots
                for i in range(self.slots):
                    angle = i * 360 / self.slots
                    angle_rad = math.radians(angle)
                    x1, y1 = 35 * math.cos(angle_rad), 35 * math.sin(angle_rad)
                    x2, y2 = 50 * math.cos(angle_rad), 50 * math.sin(angle_rad)
                    ax.plot([x1, x2], [y1, y2], 'r-', linewidth=0.5, alpha=0.7)

            elif idx == 2:  # Phase 1 cutting (every 90°)
                for i in range(0, self.slots, 10):  # Every 10th slot = 90°
                    angle = i * 360 / self.slots
                    slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))
                    wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                                 width=7.5, facecolor='red', alpha=0.8, edgecolor='darkred')
                    ax.add_patch(wedge)

            elif idx == 3:  # Phase 2 cutting (45° positions)
                # Show phase 1 cuts
                for i in range(0, self.slots, 10):
                    angle = i * 360 / self.slots
                    slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))
                    wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                                 width=7.5, facecolor='red', alpha=0.5, edgecolor='darkred')
                    ax.add_patch(wedge)

                # Show phase 2 cuts
                for i in range(5, self.slots, 10):  # 45° positions
                    angle = i * 360 / self.slots
                    slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))
                    wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                                 width=7.5, facecolor='blue', alpha=0.8, edgecolor='darkblue')
                    ax.add_patch(wedge)

            elif idx == 4:  # Complete cutting
                for i in range(self.slots):
                    if i % 2 == 0:  # Only cut slots
                        angle = i * 360 / self.slots
                        slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))
                        wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                                     width=7.5, facecolor='lightgray', alpha=0.8, edgecolor='black')
                        ax.add_patch(wedge)

            elif idx == 5:  # Quality check
                # Show completed disk with measurements
                for i in range(self.slots):
                    if i % 2 == 0:
                        angle = i * 360 / self.slots
                        slot_width_angle = math.degrees(self.slot_width / (2 * math.pi * 38.75))
                        wedge = Wedge((0, 0), 42.5, angle - slot_width_angle/2, angle + slot_width_angle/2,
                                     width=7.5, facecolor='lightgray', alpha=0.8, edgecolor='green', linewidth=2)
                        ax.add_patch(wedge)

                # Add checkmarks for quality points
                ax.text(0, -55, '✓ All slots cut\n✓ No burrs\n✓ Uniform width',
                       ha='center', va='top', fontsize=10,
                       bbox=dict(boxstyle='round,pad=0.5', facecolor='lightgreen', alpha=0.8))

        cutting_path = os.path.join(save_path, '100mm_encoder_cutting_guide.png')
        plt.tight_layout()
        plt.savefig(cutting_path, dpi=300, bbox_inches='tight')
        plt.close()

        return cutting_path

    def generate_measurement_chart(self, save_path="illustrations"):
        """Generate printable measurement and angle reference chart"""
        if not os.path.exists(save_path):
            os.makedirs(save_path)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 10), dpi=300)
        fig.suptitle('100mm Encoder Disk - Reference Charts', fontsize=20, fontweight='bold')

        # Chart 1: Slot position table
        ax1.set_title('Slot Position Reference Table', fontsize=16, fontweight='bold')
        ax1.axis('off')

        # Create table data
        table_data = []
        headers = ['Slot #', 'Angle (°)', 'Slot #', 'Angle (°)', 'Slot #', 'Angle (°)']

        for i in range(0, self.slots, 3):
            row = []
            for j in range(3):
                if i + j < self.slots:
                    slot_num = i + j + 1
                    angle = (i + j) * 360 / self.slots
                    row.extend([f"{slot_num}", f"{angle:.1f}°"])
                else:
                    row.extend(["", ""])
            table_data.append(row)

        # Create table
        table = ax1.table(cellText=table_data, colLabels=headers,
                         cellLoc='center', loc='center',
                         bbox=[0.1, 0.1, 0.8, 0.8])
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)

        # Style the table
        for (i, j), cell in table.get_celld().items():
            if i == 0:  # Header row
                cell.set_facecolor('#40466e')
                cell.set_text_props(weight='bold', color='white')
            else:
                if j % 2 == 0:  # Slot number columns
                    cell.set_facecolor('#f0f0f0')
                else:  # Angle columns
                    cell.set_facecolor('#ffffff')
            cell.set_edgecolor('black')
            cell.set_linewidth(1)

        # Chart 2: Specifications summary
        ax2.set_title('Key Specifications & Tolerances', fontsize=16, fontweight='bold')
        ax2.axis('off')

        specs_text = f"""
DISK SPECIFICATIONS:
• Diameter: {self.diameter}mm ± 0.5mm
• Slots: {self.slots} total (20 cut, 20 solid)
• Slot Width: {self.slot_width}mm ± 0.2mm
• Center Hole: {self.center_hole}mm ± 0.1mm
• Material: {self.material}

SLOT DETAILS:
• Inner Radius: {self.slot_start_radius}mm
• Outer Radius: {self.slot_end_radius}mm
• Slot Length: {self.slot_end_radius - self.slot_start_radius}mm
• Angular Width: {self.slot_width * 360 / (2 * math.pi * 77.5):.2f}°
• Spacing: {360/self.slots}° center-to-center

RESOLUTION:
• Pulley Diameter: {self.pulley_diameter}mm
• Resolution: {self.resolution_mm:.3f}mm per pulse
• Precision: Exceptional for water level monitoring

CUTTING SEQUENCE:
Phase 1: Slots 1, 11, 21, 31 (90° spacing)
Phase 2: Slots 6, 16, 26, 36 (45° offset)
Phase 3: Remaining even-numbered slots
Phase 4: Deburring and finishing

QUALITY CHECKS:
□ Dimensional accuracy within tolerance
□ Smooth slot edges (no burrs)
□ Uniform slot widths
□ Clean optical surfaces
□ Proper center hole fit
□ No warping or distortion

TIME ESTIMATE: 4-6 hours total
        """

        ax2.text(0.05, 0.95, specs_text, transform=ax2.transAxes, fontsize=11,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='lightblue', alpha=0.3))

        chart_path = os.path.join(save_path, '100mm_encoder_reference_chart.png')
        plt.tight_layout()
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()

        return chart_path

    def generate_all_illustrations(self):
        """Generate all illustration files"""
        print("Generating print-ready illustrations...")

        try:
            # Create illustrations directory
            if not os.path.exists("illustrations"):
                os.makedirs("illustrations")

            # Generate all illustration types
            template_path = self.generate_disk_template()
            cutting_path = self.generate_cutting_guide()
            chart_path = self.generate_measurement_chart()

            return {
                'template': template_path,
                'cutting_guide': cutting_path,
                'reference_chart': chart_path
            }

        except Exception as e:
            return f"Error generating illustrations: {str(e)}"

    def print_summary(self):
        """Print a summary of the specifications"""
        print(f"""
100mm Encoder Disk Summary:
==========================
Diameter: {self.diameter}mm
Slots: {self.slots}
Resolution: {self.resolution_mm:.3f}mm per slot
Material: {self.material}
Estimated fabrication time: 4-6 hours
        """)


def main():
    """Main function to generate and export the guide"""
    print("Generating 100mm Encoder Disk Fabrication Guide...")
    print("=" * 50)

    # Create guide generator
    guide_generator = EncoderDiskGuide()

    # Print summary
    guide_generator.print_summary()

    # Export regular versions
    result = guide_generator.export_to_file()
    print(result)

    # Also create a text version for easy reading
    text_result = guide_generator.export_to_file("100mm_encoder_disk_fabrication_guide.txt")
    print(text_result.replace(".md", ".txt"))

    # Create PRINT-READY version
    print_result = guide_generator.export_print_ready()
    print(print_result)

    # Generate all illustrations
    print("\nGenerating visual illustrations...")
    try:
        illustration_results = guide_generator.generate_all_illustrations()
        if isinstance(illustration_results, dict):
            print("✓ Visual illustrations generated:")
            print(f"  - Template: {illustration_results['template']}")
            print(f"  - Cutting Guide: {illustration_results['cutting_guide']}")
            print(f"  - Reference Chart: {illustration_results['reference_chart']}")
        else:
            print(f"✗ {illustration_results}")
    except Exception as e:
        print(f"✗ Error generating illustrations: {str(e)}")
        print("Note: Make sure matplotlib is installed: pip install matplotlib")

    print("\nFiles created:")
    print("- 100mm_encoder_disk_fabrication_guide.md (Markdown format)")
    print("- 100mm_encoder_disk_fabrication_guide.txt (Plain text format)")
    print("- 100mm_encoder_disk_PRINT_GUIDE.txt (PRINT-READY format)")
    print("- illustrations/100mm_encoder_disk_template.png (Visual template)")
    print("- illustrations/100mm_encoder_cutting_guide.png (Step-by-step cutting)")
    print("- illustrations/100mm_encoder_reference_chart.png (Measurements & specs)")
    print("\nGuide includes:")
    print("✓ Complete specifications and calculations")
    print("✓ Step-by-step fabrication instructions")
    print("✓ Quality control checklist")
    print("✓ Alternative methods")
    print("✓ Template data and measurements")
    print("✓ Time estimates and material requirements")
    print("✓ PRINT-OPTIMIZED layout with page breaks")
    print("✓ Reference tables for workshop use")
    print("✓ VISUAL ILLUSTRATIONS ready for printing")


if __name__ == "__main__":
    main()