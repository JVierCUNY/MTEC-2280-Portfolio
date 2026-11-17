// CALL & LAMP
// Arduino sends the button state to p5.
// p5 replies with K when it receives the message.

const byte ledPins[4] = {4, 5, 6, 7};
const byte buttonPins[4] = {8, 9, 10, 11};

const unsigned long debounceMs = 30;

bool lastReading[4];
bool buttonPressed[4];
unsigned long debounceAt[4];

int lastSentMask = 0;
int sentMask = 0;
int acknowledgedMask = 0;

int ledMode = 0;  // 0 = STEADY, 1 = PULSE
bool waitingForResponse = false;

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    pinMode(ledPins[i], OUTPUT);
    pinMode(buttonPins[i], INPUT_PULLUP);

    lastReading[i] = (digitalRead(buttonPins[i]) == LOW);
    buttonPressed[i] = lastReading[i];

    digitalWrite(ledPins[i], LOW);
  }
}

void loop() {
  checkButtons();
  readFromP5();

  int currentMask = getButtonMask();

  // Send a CALL when the button state changes.
  if (!waitingForResponse && currentMask != lastSentMask) {
    sentMask = currentMask;

    Serial.println(sentMask);

    lastSentMask = currentMask;
    waitingForResponse = true;
  }

  updateLEDs();
}

void checkButtons() {
  for (int i = 0; i < 4; i++) {
    bool reading = (digitalRead(buttonPins[i]) == LOW);

    if (reading != lastReading[i]) {
      lastReading[i] = reading;
      debounceAt[i] = millis();
    }

    if (millis() - debounceAt[i] > debounceMs) {
      buttonPressed[i] = reading;
    }
  }
}

int getButtonMask() {
  int mask = 0;

  for (int i = 0; i < 4; i++) {
    if (buttonPressed[i]) {
      mask = mask | (1 << i);
    }
  }

  return mask;
}

void readFromP5() {
  // Only read when something has arrived.
  while (Serial.available() > 0) {
    char message = Serial.read();

    if (message == 'K') {
      acknowledgedMask = sentMask;
      waitingForResponse = false;
    }

    if (message == 'S') {
      ledMode = 0;
    }

    if (message == 'P') {
      ledMode = 1;
    }
  }
}

void updateLEDs() {
  bool pulseOn = (millis() % 800 < 400);

  for (int i = 0; i < 4; i++) {
    bool thisLedIsOn = (acknowledgedMask & (1 << i)) != 0;

    if (ledMode == 0) {
      digitalWrite(ledPins[i], thisLedIsOn ? HIGH : LOW);
    } else {
      digitalWrite(ledPins[i], (thisLedIsOn && pulseOn) ? HIGH : LOW);
    }
  }
}