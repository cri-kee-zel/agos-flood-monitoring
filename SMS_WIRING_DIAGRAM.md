# 🔌 AGOS SMS System - Wiring Diagram

```
═══════════════════════════════════════════════════════════════════════
                    COMPLETE WIRING DIAGRAM
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                        ARDUINO UNO R4 WIFI                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      [USB Port for Programming]                    │
│                                                                     │
│  Digital Pins:                    Analog Pins:                     │
│  ┌──────────────┐                ┌─────────────┐                  │
│  │ Pin 2  (RX) ──┼────────────────► SIM800L RX                    │
│  │ Pin 3  (TX) ──┼────────────────► SIM800L TX                    │
│  │              │                │             │                   │
│  │ Pin 9  (LED1)──┼───► ULN2803 ───► IR LED 1 │                  │
│  │ Pin 10 (LED2)──┼───► ULN2803 ───► IR LED 2 │                  │
│  │ Pin 13 (LED3)──┼───► ULN2803 ───► IR LED 3 │                  │
│  │              │                │             │                   │
│  │ GND ─────────┼────────────────┼─────────────┼─────► Common GND │
│  │              │                │             │                   │
│  └──────────────┘                │ A0 ◄─────────┼──TSOP38238 #1   │
│                                  │ A1 ◄─────────┼──TSOP38238 #2   │
│                                  │ A3 ◄─────────┼──TSOP38238 #3   │
│                                  │             │                   │
│                                  └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                        SIM800L GSM MODULE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                     [SIM Card Slot - Insert SIM Here]              │
│                                                                     │
│  ┌──────────┐                                                      │
│  │ VCC      │◄─────────────────────────[4.2V Power Supply]        │
│  │          │                          ⚠️  NOT FROM ARDUINO 5V!    │
│  │ GND      │◄─────────────────────────[Common Ground]            │
│  │          │                                                      │
│  │ RX       │◄─────────────────────────[Arduino Pin 2]            │
│  │ TX       │──────────────────────────►[Arduino Pin 3]            │
│  │          │                                                      │
│  │ ANTENNA  │◄─────────────────────────[GSM Antenna]              │
│  │          │                          ⚠️  REQUIRED for signal!    │
│  └──────────┘                                                      │
│                                                                     │
│  LED Indicators:                                                   │
│  • NET LED: Network status (blinking = searching, solid = ready)   │
│  • STATUS LED: Power status                                        │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    WATER LEVEL SENSOR SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Sensor 1 (10" - Half-knee):                                       │
│  ┌──────────────┐                      ┌─────────────┐            │
│  │ TSOP38238 #1 │◄─────(POF Cable)─────┤  IR LED 1   │            │
│  │    (A0)      │                      │  (Pin 9)    │            │
│  └──────────────┘                      └─────────────┘            │
│                                                                     │
│  Sensor 2 (19" - Knee) [MOST RELIABLE]:                           │
│  ┌──────────────┐                      ┌─────────────┐            │
│  │ TSOP38238 #2 │◄─────(POF Cable)─────┤  IR LED 2   │            │
│  │    (A1)      │                      │  (Pin 10)   │            │
│  └──────────────┘                      └─────────────┘            │
│                                                                     │
│  Sensor 3 (37" - Waist):                                           │
│  ┌──────────────┐                      ┌─────────────┐            │
│  │ TSOP38238 #3 │◄─────(POF Cable)─────┤  IR LED 3   │            │
│  │    (A3)      │                      │  (Pin 13)   │            │
│  └──────────────┘                      └─────────────┘            │
│                                                                     │
│  All IR LEDs connected via ULN2803 Darlington Array                │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                        POWER SUPPLY DIAGRAM
═══════════════════════════════════════════════════════════════════════

                    ┌──────────────────┐
                    │  USB Power Bank  │
                    │    or Adapter    │
                    │      5V 2A       │
                    └────────┬─────────┘
                            │
                    ┌───────┴────────┐
                    │                │
              ┌─────▼──────┐   ┌────▼──────────┐
              │  Arduino   │   │  4.2V Buck    │
              │  R4 WiFi   │   │  Converter    │
              │    5V      │   │  (LM2596)     │
              └────┬───────┘   └────┬──────────┘
                   │                │
                   │                │
                   │           ┌────▼──────┐
                   │           │  SIM800L  │
                   │           │    VCC    │
                   │           └───────────┘
                   │
              ┌────▼───────────────────┐
              │  Sensors & ULN2803    │
              │    (Powered by 5V)    │
              └────────────────────────┘

⚠️  CRITICAL: SIM800L needs 4.2V, NOT 5V from Arduino!
⚠️  Use buck converter (LM2596) to step down from 5V to 4.2V


═══════════════════════════════════════════════════════════════════════
                     PIN ASSIGNMENT SUMMARY
═══════════════════════════════════════════════════════════════════════

┌──────────────┬─────────────────────────────────────────────────────┐
│ Arduino Pin  │ Connection                                          │
├──────────────┼─────────────────────────────────────────────────────┤
│ Pin 2        │ SIM800L RX (SoftwareSerial)                        │
│ Pin 3        │ SIM800L TX (SoftwareSerial)                        │
│ Pin 9        │ IR LED 1 (10" sensor) via ULN2803                  │
│ Pin 10       │ IR LED 2 (19" sensor) via ULN2803                  │
│ Pin 13       │ IR LED 3 (37" sensor) via ULN2803                  │
│ A0           │ TSOP38238 Sensor 1 (10" Half-knee)                 │
│ A1           │ TSOP38238 Sensor 2 (19" Knee) [MOST RELIABLE]      │
│ A3           │ TSOP38238 Sensor 3 (37" Waist)                     │
│ GND          │ Common ground (Arduino + SIM800L + Sensors)        │
│ 5V           │ Arduino power ONLY (NOT for SIM800L!)              │
└──────────────┴─────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                    TESTING CHECKLIST
═══════════════════════════════════════════════════════════════════════

Before powering on:
[ ] All wires connected according to diagram
[ ] SIM card inserted into SIM800L
[ ] Antenna attached to SIM800L
[ ] Power supply is 4.2V for SIM800L (NOT 5V!)
[ ] Common ground connected between all components
[ ] POF cables connecting IR LEDs to TSOP sensors

After powering on:
[ ] Arduino power LED lights up
[ ] SIM800L STATUS LED lights up
[ ] SIM800L NET LED starts blinking (searching for network)
[ ] Serial Monitor shows "System Ready!" message
[ ] WiFi connects successfully
[ ] SIM800L registers to network
[ ] Sensors can be read without errors

Testing:
[ ] Send test SMS to your phone number
[ ] Trigger water level detection (cover sensors with hand/water)
[ ] Check Module 4 dashboard displays sensor data
[ ] Add recipient via Module 4 web interface
[ ] Press emergency button on Module 4
[ ] Verify SMS received on phone


═══════════════════════════════════════════════════════════════════════
                    TROUBLESHOOTING GUIDE
═══════════════════════════════════════════════════════════════════════

Problem: SIM800L not responding
Solution:
  ✓ Check 4.2V power supply (measure with multimeter)
  ✓ Verify RX/TX connections (Pin 2 → RX, Pin 3 → TX)
  ✓ Try swapping RX and TX wires
  ✓ Increase delay in setup() to 20 seconds
  ✓ Power cycle the module

Problem: No network registration
Solution:
  ✓ Attach antenna firmly
  ✓ Check SIM card has credit and is active
  ✓ Verify SIM PIN is disabled
  ✓ Move to location with better signal
  ✓ Check carrier supports 2G GSM network

Problem: SMS not sending
Solution:
  ✓ Verify network registration (check serial monitor)
  ✓ Confirm signal strength >10
  ✓ Use correct phone number format: +[country][number]
  ✓ Check SIM credit balance
  ✓ Wait longer for SMS prompt ">"

Problem: Sensors not detecting
Solution:
  ✓ Check POF cable connections
  ✓ Verify IR LEDs lighting up (check with phone camera)
  ✓ Clean POF cable ends
  ✓ Adjust threshold values in code (line 232)
  ✓ Test each sensor individually


═══════════════════════════════════════════════════════════════════════
                    COMPONENT SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════

Arduino UNO R4 WiFi:
  • Operating Voltage: 5V
  • Input Voltage: 6-24V (via barrel jack)
  • Digital I/O Pins: 14
  • Analog Input Pins: 6
  • WiFi: Built-in ESP32-S3

SIM800L GSM Module:
  • Operating Voltage: 3.4V - 4.4V (optimal: 4.2V)
  • Peak Current: 2A (during transmission)
  • Frequency Bands: GSM 850/900/1800/1900 MHz
  • SMS: Text mode supported
  • Communication: UART (9600 baud)

TSOP38238 IR Receiver:
  • Operating Voltage: 2.5V - 5.5V
  • Carrier Frequency: 38kHz
  • Output: Active low when signal detected
  • Viewing Angle: ±45°

ULN2803 Darlington Array:
  • Input Voltage: 5V (from Arduino)
  • Output Current: Up to 500mA per channel
  • Channels: 8 (using 3 for IR LEDs)


═══════════════════════════════════════════════════════════════════════
                    SAFETY WARNINGS
═══════════════════════════════════════════════════════════════════════

⚠️  NEVER connect SIM800L VCC to Arduino 5V pin - will damage module!
⚠️  Always use external 4.2V power supply or buck converter
⚠️  Ensure all components share common ground
⚠️  SIM800L requires 2A peak current - use adequate power supply
⚠️  Keep antenna away from metal objects and Arduino
⚠️  Do not hot-swap SIM card while module is powered
⚠️  Avoid static discharge when handling components


═══════════════════════════════════════════════════════════════════════

✅ Follow this wiring diagram exactly for successful integration!
📞 Test each component individually before full system integration
🎯 Use the SMS_INTEGRATION_GUIDE.md for software setup

═══════════════════════════════════════════════════════════════════════
```
