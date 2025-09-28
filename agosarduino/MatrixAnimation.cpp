#include "MatrixAnimation.h"

ArduinoLEDMatrix matrix;

// Heart bitmaps (8 rows x 12 columns)
byte frame_full[8][12] = {
  { 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0 },
  { 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0 },
  { 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 },
  { 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }
};

byte frame_med[8][12] = {
  { 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0 },
  { 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 },
  { 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }
};

byte frame_small[8][12] = {
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }
};

byte frame_off[8][12] = { {0} };

// Timings (ms)
const unsigned long SHORT = 100;
const unsigned long SHORT_GAP = 100;
const unsigned long LONG_GAP = 700;

void initMatrix() {
  matrix.begin();
}

void updateMatrixAnimation() {
  // Heartbeat: small -> med -> full (quick) -> med -> off (pause)
  matrix.renderBitmap(frame_small, 8, 12);
  delay(SHORT);
  matrix.renderBitmap(frame_med, 8, 12);
  delay(SHORT_GAP);
  matrix.renderBitmap(frame_full, 8, 12);
  delay(SHORT);
  matrix.renderBitmap(frame_med, 8, 12);
  delay(LONG_GAP);
  matrix.renderBitmap(frame_off, 8, 12);
}