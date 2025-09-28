#ifndef MATRIX_ANIMATION_H
#define MATRIX_ANIMATION_H

#include <Arduino_LED_Matrix.h>

// External declarations for variables used across files
extern ArduinoLEDMatrix matrix;
extern byte frame_full[8][12];
extern byte frame_med[8][12];
extern byte frame_small[8][12];
extern byte frame_off[8][12];

// External timing constants
extern const unsigned long SHORT;
extern const unsigned long SHORT_GAP;
extern const unsigned long LONG_GAP;

// Function declarations
void initMatrix();
void updateMatrixAnimation();

#endif