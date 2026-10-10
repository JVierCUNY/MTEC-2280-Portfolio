
const int piezoPin = 1;
const int potPin1 = 2;
const int potPin2 = 4;

const int resolutionPWM = 12;
const int fixedDuty = 2048;  // 50% duty cycle

// One LED and button for each key:
// Index 0 = C1/red, 1 = E/white,
// Index 2 = G/blue, 3 = C2/green

const int ledPins[] = {5, 7, 15, 16};
const int buttonPins[] = {6, 8, 9, 10};

const int baseFrequencies[] = {
  675, 830, 945, 1215
};

const char* keyNames[] = {
  "C1 - Red",
  "E - White",
  "G - Blue",
  "C2 - Green"
};

const int numberOfKeys = 4;

// Button debounce states
int rawButtonStates[4] = {HIGH, HIGH, HIGH, HIGH};
int stableButtonStates[4] = {HIGH, HIGH, HIGH, HIGH};
int lastRawButtonStates[4] = {HIGH, HIGH, HIGH, HIGH};

unsigned long lastButtonChange[4] = {0, 0, 0, 0};
const unsigned long debounceTime = 30;

// Timing and sound variables
unsigned long lastReport = 0;
const unsigned long reportInterval = 250;

int lastAppliedFrequency = 0;
int activeKey = -1;

void setup() {
  Serial.begin(115200);
  analogReadResolution(8);

  // To make sure the LEDs and Buzzer WORK TOGETHER.
  for (int i = 0; i < numberOfKeys; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);

    pinMode(buttonPins[i], INPUT_PULLUP);
  }

  // Just in case the Buzzer (miraculously) BREAKS.
  if (!ledcAttach(piezoPin, 2400, resolutionPWM)) {
    Serial.println("ERROR: Buzzer setup failed!");
  }

  // Begin every loop silent.
  ledcWrite(piezoPin, 0);
}

void loop() {
  unsigned long now = millis();

  // Potentiometers: Pitch and Brightness
  int pot1Value = analogRead(potPin1);
  int pot2Value = analogRead(potPin2);

  // Pot 1 adjusts the pitch
  int tuningOffset = map(pot1Value, 0, 255, -150, 150);

  // Pot 2 controls LED brightness (frequency on old code was unrecognizable.)
  int brightness = map(pot2Value, 0, 255, 15, 255);

  // Read and debounce each button
  for (int i = 0; i < numberOfKeys; i++) {
    rawButtonStates[i] = digitalRead(buttonPins[i]);

    if (rawButtonStates[i] != lastRawButtonStates[i]) {
      lastButtonChange[i] = now;
      lastRawButtonStates[i] = rawButtonStates[i];
    }

    if (now - lastButtonChange[i] >= debounceTime) {
      stableButtonStates[i] = rawButtonStates[i];
    }
  }

  // The key to be pressed first takes priority.
  // If more than one is held, the lowest in the index wins.
  activeKey = -1;

  for (int i = 0; i < numberOfKeys; i++) {
    if (stableButtonStates[i] == LOW) {
      activeKey = i;
      break;
    }
  }

  // Shows the selected key with its matching LED
  for (int i = 0; i < numberOfKeys; i++) {
    if (i == activeKey) {
      analogWrite(ledPins[i], brightness);
    } else {
      analogWrite(ledPins[i], 0);
    }
  }

  // Generate sound only when a key is being held
  if (activeKey >= 0) {
    int targetFrequency =
        baseFrequencies[activeKey] + tuningOffset;

    // Update frequency only when needed
    if (lastAppliedFrequency == 0 ||
        abs(targetFrequency - lastAppliedFrequency) >= 8) {

      unsigned long actualFrequency =
          ledcChangeFrequency(
            piezoPin, targetFrequency, resolutionPWM
          );

      if (actualFrequency != 0) {
        lastAppliedFrequency = targetFrequency;
      }
    }

    // Hold approximately 50% duty while playing
    ledcWrite(piezoPin, fixedDuty);

  } else {
    // No key pressed: silence the buzzer
    ledcWrite(piezoPin, 0);
    lastAppliedFrequency = 0;
  }

  // Print diagnostics without blocking with delay()
  if (now - lastReport >= reportInterval) {
    lastReport = now;

    Serial.printf(
      "Pot1=%d | Pot2=%d | Key=%s | Frequency=%d Hz\n",
      pot1Value,
      pot2Value,
      activeKey >= 0 ? keyNames[activeKey] : "NONE",
      activeKey >= 0
          ? baseFrequencies[activeKey] + tuningOffset
          : 0
    );
  }
}
