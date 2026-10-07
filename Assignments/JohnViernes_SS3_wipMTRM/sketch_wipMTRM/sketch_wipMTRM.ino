// ============================================================
// ESP32-S3 MIDTERM PROJECT
// 9-LED FIXED-COLOR LINE DISCO ARRAY
// WITH PHOTOCELL LIGHT SENSOR
// ============================================================


// ------------------------------------------------------------
// LED GPIO PINS
// ------------------------------------------------------------

int ledPins[9] = {
  4, 5, 6,       // Red LEDs
  7, 15, 16,     // White LEDs
  17, 18, 21     // Blue LEDs
};


// ------------------------------------------------------------
// INPUT PINS
// ------------------------------------------------------------

const int nextButtonPin = 8;
const int previousButtonPin = 9;

const int photoCellPin = 1;


// ------------------------------------------------------------
// MAIN PROGRAM VARIABLES
// ------------------------------------------------------------

int pattern = 0;
int frame = 0;

int lightLevel = 0;

unsigned long animationSpeed = 200;
unsigned long lastAnimationTime = 0;


// ------------------------------------------------------------
// BUTTON VARIABLES
// ------------------------------------------------------------

int lastNextReading = HIGH;
int nextButtonState = HIGH;
unsigned long nextLastChangeTime = 0;

int lastPreviousReading = HIGH;
int previousButtonState = HIGH;
unsigned long previousLastChangeTime = 0;

const unsigned long debounceTime = 40;


// ------------------------------------------------------------
// SENSOR DEBUG TIMER
// ------------------------------------------------------------

unsigned long lastSensorPrintTime = 0;

const unsigned long sensorPrintInterval = 500;


// ------------------------------------------------------------
// NUMBER OF ANIMATIONS
// ------------------------------------------------------------

const int numberOfPatterns = 7;


// ============================================================
// TURN ALL LEDs ON AT A SPECIFIC BRIGHTNESS
// ============================================================

void setAllLEDs(int brightness) {

  for (int i = 0; i < 9; i++) {

    analogWrite(ledPins[i], brightness);
  }
}


// ============================================================
// TURN ALL LEDs OFF
// ============================================================

void turnAllOff() {

  for (int i = 0; i < 9; i++) {

    analogWrite(ledPins[i], 0);
  }
}


// ============================================================
// PATTERN 1
// LEFT-TO-RIGHT CHASE
// ============================================================

void patternLeftToRight() {

  turnAllOff();

  int position = frame % 9;

  analogWrite(ledPins[position], 255);
}


// ============================================================
// PATTERN 2
// RIGHT-TO-LEFT CHASE
// ============================================================

void patternRightToLeft() {

  turnAllOff();

  int position = 8 - (frame % 9);

  analogWrite(ledPins[position], 255);
}


// ============================================================
// PATTERN 3
// ALTERNATING LEDS
// ============================================================

void patternAlternating() {

  if ((frame % 2) == 0) {

    for (int i = 0; i < 9; i++) {

      if ((i % 2) == 0) {

        analogWrite(ledPins[i], 255);
      }

      else {

        analogWrite(ledPins[i], 0);
      }
    }
  }

  else {

    for (int i = 0; i < 9; i++) {

      if ((i % 2) == 0) {

        analogWrite(ledPins[i], 0);
      }

      else {

        analogWrite(ledPins[i], 255);
      }
    }
  }
}


// ============================================================
// PATTERN 4
// BOUNCING SCANNER
// ============================================================

void patternBouncingScanner() {

  turnAllOff();

  int position;

  int cyclePosition = frame % 16;

  if (cyclePosition < 9) {

    position = cyclePosition;
  }

  else {

    position = 16 - cyclePosition;
  }

  analogWrite(ledPins[position], 255);
}


// ============================================================
// PATTERN 5
// ============================================================

void patternCenterExpand() {

  turnAllOff();

  int phase = frame % 9;


  if (phase == 0) {

    analogWrite(ledPins[4], 255);
  }


  else if (phase == 1) {

    analogWrite(ledPins[3], 255);
    analogWrite(ledPins[5], 255);
  }


  else if (phase == 2) {

    analogWrite(ledPins[2], 255);
    analogWrite(ledPins[6], 255);
  }


  else if (phase == 3) {

    analogWrite(ledPins[1], 255);
    analogWrite(ledPins[7], 255);
  }


  else if (phase == 4) {

    analogWrite(ledPins[0], 255);
    analogWrite(ledPins[8], 255);
  }


  else if (phase == 5) {

    analogWrite(ledPins[1], 255);
    analogWrite(ledPins[7], 255);
  }


  else if (phase == 6) {

    analogWrite(ledPins[2], 255);
    analogWrite(ledPins[6], 255);
  }


  else if (phase == 7) {

    analogWrite(ledPins[3], 255);
    analogWrite(ledPins[5], 255);
  }


  else {

    analogWrite(ledPins[4], 255);
  }
}


// ============================================================
// PATTERN 6
// MOVING 3-LED PULSE
// ============================================================

void patternPulseLine() {

  turnAllOff();

  int position = frame % 9;


  // Main bright LED

  analogWrite(ledPins[position], 255);


  // Dim LED to the left

  if (position > 0) {

    analogWrite(ledPins[position - 1], 80);
  }


  // Dim LED to the right

  if (position < 8) {

    analogWrite(ledPins[position + 1], 80);
  }
}


// ============================================================
// PATTERN 7
// RANDOM DISCO
// ============================================================

void patternDiscoRandom() {

  for (int i = 0; i < 9; i++) {

    int brightness = random(0, 256);

    analogWrite(ledPins[i], brightness);
  }
}


// ============================================================
// SELECT CURRENT PATTERN
// ============================================================

void runPattern() {

  if (pattern == 0) {

    patternLeftToRight();
  }

  else if (pattern == 1) {

    patternRightToLeft();
  }

  else if (pattern == 2) {

    patternAlternating();
  }

  else if (pattern == 3) {

    patternBouncingScanner();
  }

  else if (pattern == 4) {

    patternCenterExpand();
  }

  else if (pattern == 5) {

    patternPulseLine();
  }

  else {

    patternDiscoRandom();
  }
}


// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);


  // ----------------------------------------------------------
  // LED SETUP
  // ----------------------------------------------------------

  for (int i = 0; i < 9; i++) {

    pinMode(ledPins[i], OUTPUT);

    digitalWrite(ledPins[i], LOW);
  }


  // ----------------------------------------------------------
  // BUTTON SETUP
  // ----------------------------------------------------------

  pinMode(nextButtonPin, INPUT_PULLUP);

  pinMode(previousButtonPin, INPUT_PULLUP);


  // ----------------------------------------------------------
  // PHOTOCELL SETUP
  // ----------------------------------------------------------

  pinMode(photoCellPin, INPUT);

  analogReadResolution(12);


  // ----------------------------------------------------------
  // START WITH LEDs OFF
  // ----------------------------------------------------------

  turnAllOff();


  // ----------------------------------------------------------
  // RANDOM PATTERN INITIALIZATION
  // ----------------------------------------------------------

  randomSeed(micros());


  Serial.println("9-LED DISCO LIGHT READY");
}


// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  unsigned long currentTime = millis();


  // ==========================================================
  // READ PHOTOCELL
  // ==========================================================

  lightLevel = analogRead(photoCellPin);


  // ==========================================================
  // CONVERT LIGHT LEVEL INTO ANIMATION SPEED
  // ==========================================================

  animationSpeed = map(
    lightLevel,
    0,
    4095,
    500,
    60
  );


  // ==========================================================
  // PRINT SENSOR READING FOR DEBUGGING
  //
  // This happens every 500 ms without using delay().
  // ==========================================================

  if (currentTime - lastSensorPrintTime >= sensorPrintInterval) {

    lastSensorPrintTime = currentTime;

    Serial.print("Light level: ");
    Serial.print(lightLevel);

    Serial.print(" | Animation speed: ");
    Serial.println(animationSpeed);
  }


  // ==========================================================
  // NEXT BUTTON
  // ==========================================================

  int nextReading = digitalRead(nextButtonPin);


  if (nextReading != lastNextReading) {

    nextLastChangeTime = currentTime;
  }


  if (
    (currentTime - nextLastChangeTime > debounceTime) &&
    (nextReading != nextButtonState)
  ) {

    nextButtonState = nextReading;


    if (nextButtonState == LOW) {

      pattern++;


      if (pattern >= numberOfPatterns) {

        pattern = 0;
      }


      frame = 0;


      Serial.print("Pattern: ");
      Serial.println(pattern);
    }
  }


  lastNextReading = nextReading;


  // ==========================================================
  // PREVIOUS BUTTON
  // ==========================================================

  int previousReading = digitalRead(previousButtonPin);


  if (previousReading != lastPreviousReading) {

    previousLastChangeTime = currentTime;
  }


  if (
    (currentTime - previousLastChangeTime > debounceTime) &&
    (previousReading != previousButtonState)
  ) {

    previousButtonState = previousReading;


    if (previousButtonState == LOW) {

      pattern--;


      if (pattern < 0) {

        pattern = numberOfPatterns - 1;
      }


      frame = 0;


      Serial.print("Pattern: ");
      Serial.println(pattern);
    }
  }


  lastPreviousReading = previousReading;


  // ==========================================================
  // MILLIS() ANIMATION TIMER
  // ==========================================================

  if (currentTime - lastAnimationTime >= animationSpeed) {

    lastAnimationTime = currentTime;

    runPattern();

    frame++;
  }
}