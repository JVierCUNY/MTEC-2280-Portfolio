// CALL & LAMP
// Four buttons send a CALL to p5.js.
// p5.js sends an ACK back. The LEDs only follow the acknowledged state.

const byte ledPins[4] = {4, 5, 6, 7};
const byte buttonPins[4] = {8, 9, 10, 11};

const unsigned long debounceMs = 30;
const unsigned long retryMs = 700;

bool lastReading[4];
bool buttonPressed[4];
unsigned long debounceAt[4];

int sequenceNumber = 0;
int pendingSequence = 0;
int pendingMask = 0;
int lastSentMask = 0;
int acknowledgedMask = 0;
int ledMode = 0;            // 0 = steady, 1 = pulse
bool waitingForAck = false;
unsigned long lastCallTime = 0;

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

  // Only send a new CALL after the last one was acknowledged.
  if (!waitingForAck && currentMask != lastSentMask) {
    sequenceNumber++;
    pendingSequence = sequenceNumber;
    pendingMask = currentMask;
    lastSentMask = currentMask;
    waitingForAck = true;
    sendPendingCall();
  }

  // If p5 misses a CALL, send it again with the same sequence number.
  if (waitingForAck && millis() - lastCallTime > retryMs) {
    sendPendingCall();
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

void sendPendingCall() {
  Serial.print("CALL,");
  Serial.print(pendingSequence);
  Serial.print(",");
  Serial.println(pendingMask);
  lastCallTime = millis();
}

void readFromP5() {
  if (Serial.available() == 0) return;

  String message = Serial.readStringUntil('\n');
  message.trim();

  if (message.startsWith("ACK,")) {
    int firstComma = message.indexOf(',');
    int secondComma = message.indexOf(',', firstComma + 1);

    if (secondComma > 0) {
      int receivedSequence = message.substring(firstComma + 1, secondComma).toInt();
      int receivedMask = message.substring(secondComma + 1).toInt();

      if (waitingForAck && receivedSequence == pendingSequence) {
        acknowledgedMask = receivedMask;
        waitingForAck = false;
      }
    }
  }

  if (message.startsWith("MODE,")) {
    ledMode = message.substring(5).toInt();
    ledMode = constrain(ledMode, 0, 1);
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