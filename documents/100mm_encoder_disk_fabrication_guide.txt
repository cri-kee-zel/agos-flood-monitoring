# 100mm Encoder Disk Fabrication Guide
Generated on: 2025-08-22 06:33:30

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
✓ Professional appearance when finished

## Optimized Design Specifications

```
[Disk Specifications]
- Diameter: 100mm (10.0cm) - Perfect for manual work
- Slots: 40 (optimal for resolution and manual fabrication)
- Slot width: 3mm (easily visible and cuttable)
- Slot length: 15mm (from radius 70mm to 85mm)
- Center hole: 8mm (matches your bearings)
- Material: 2mm stainless steel - Perfect choice
- Total cutting area: 40 slots × 3mm × 15mm
```

### Angle Calculations:
- Degrees per slot: 9.0°
- Slot spacing: 9.0° center-to-center
- Arc length per slot at 77.5mm radius: 12.17mm

## Resolution Calculation

**With 100mm disk and 50mm diameter pulley:**
```
Pulley circumference = π × 5.0cm = 15.71cm
Each revolution = 15.71cm water level change
40 slots per revolution = 15.71cm ÷ 40 = 0.3927cm per slot
```

**Your resolution: 3.927mm per slot** - This is exceptional precision!

This means each encoder pulse represents 3.927mm of water level change.

## Manual Fabrication Guide for 100mm Disk

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
1. Draw 100mm circle on paper template
2. Mark center point precisely
3. Divide into 40 segments: 360° ÷ 40 = 9.0° per segment
4. Mark slot positions: 3mm wide, 15mm long
5. Slots from radius 70mm to 85mm
```

### Step 2: Marking the Steel Disk
```
Safety First:
- Wear safety glasses
- Secure work surface
- Good lighting essential

Marking Process:
1. Center punch exact center point
2. Drill 8mm center hole (use cutting oil)
3. Mount disk on temporary arbor for marking
4. Use protractor to mark every 9.0° (4.5° spacing for alternating pattern)
5. Draw radial lines from center to edge
6. Mark slot boundaries at 70mm and 85mm radius
7. Draw slot outlines: 1.5mm each side of radial line
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
4. Cut from inner radius (70mm) outward
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
```

## Quality Control Checklist

### Dimensional Checks:
```
[ ] Overall diameter: 100mm ± 0.5mm
[ ] Center hole: 8mm ± 0.1mm
[ ] All 40 slots present and accounted for
[ ] Slot width: 3mm ± 0.2mm
[ ] Slot length: 15mm ± 0.5mm
[ ] Slot spacing: 9.0° ± 0.5° between centers
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
```

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
- Material specification: 2mm stainless steel

Cost: Typically $20-50 for single disk
```

### Method 2: Segment Painting (Easier DIY)
```
If cutting 40 slots seems daunting:

1. Cut blank 100mm disk with 8mm center hole
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
```
## Template Data and Measurements

### Slot Position Table:
```
Slot  1:    0.0°    Slot 21:  180.0°
Slot  2:    9.0°    Slot 22:  189.0°
Slot  3:   18.0°    Slot 23:  198.0°
Slot  4:   27.0°    Slot 24:  207.0°
Slot  5:   36.0°    Slot 25:  216.0°
Slot  6:   45.0°    Slot 26:  225.0°
Slot  7:   54.0°    Slot 27:  234.0°
Slot  8:   63.0°    Slot 28:  243.0°
Slot  9:   72.0°    Slot 29:  252.0°
Slot 10:   81.0°    Slot 30:  261.0°
Slot 11:   90.0°    Slot 31:  270.0°
Slot 12:   99.0°    Slot 32:  279.0°
Slot 13:  108.0°    Slot 33:  288.0°
Slot 14:  117.0°    Slot 34:  297.0°
Slot 15:  126.0°    Slot 35:  306.0°
Slot 16:  135.0°    Slot 36:  315.0°
Slot 17:  144.0°    Slot 37:  324.0°
Slot 18:  153.0°    Slot 38:  333.0°
Slot 19:  162.0°    Slot 39:  342.0°
Slot 20:  171.0°    Slot 40:  351.0°
```

### Critical Measurements:
```
Center coordinates: (0, 0)
Slot inner radius: 70mm
Slot outer radius: 85mm
Slot width (arc): 4.06mm at center radius
Angular width: 2.22° at center radius
```

### Time Estimates:
```
Design and layout: 30-45 minutes
Marking the disk: 20-30 minutes
Cutting 40 slots: 2-3 hours (with breaks)
Deburring and finishing: 30-45 minutes
Painting (if applicable): 1 hour + drying time
Total project time: 4-6 hours over 1-2 days
```

### Material Requirements:
```
- 2mm stainless steel disk, 100mm diameter
- Cutting wheels: 10-15 pieces (spares for breakage)
- Primer: 50ml
- Paint: 100ml matte black
- Sandpaper: 320 and 400 grit
- Cutting oil: 100ml
```

### Sensor Placement Guide:
```
For 100mm disk with sensors:
- Place sensors at radius 77.5mm (center of slot area)
- Maintain 1-2mm gap from disk surface
- Omron sensor: Choose any convenient position
- DIY sensor: Place 90° from Omron sensor
- Ensure both sensors are at same radius for timing accuracy
```