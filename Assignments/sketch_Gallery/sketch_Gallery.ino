// ESP32-S3-DevKitC-1
// Button-controlled LED patterns (The Gallery)

// ---------------- VARIABLES ----------------

// -------- LED pins --------
int led1 = 4;
int led2 = 5;
int led3 = 6;
int led4 = 7;
int led5 = 15;
int led6 = 16;

// -------- Button --------
int buttonPin = 8;

// -------- Pattern variables --------
int pattern = 0;
int currentButtonState = HIGH;
int lastButtonState = HIGH;

void setup() {
  // Set all LED pins as OUTPUT
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);
  pinMode(led5, OUTPUT);
  pinMode(led6, OUTPUT);

  // Set button as INPUT with internal pull-up
  pinMode(buttonPin, INPUT_PULLUP);

  // Start with all LEDs OFF
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);
  digitalWrite(led4, LOW);
  digitalWrite(led5, LOW);
  digitalWrite(led6, LOW);
}

void loop() {

  // Read the pushbutton
  currentButtonState = digitalRead(buttonPin);

  // Detect a button press
  if (currentButtonState == LOW && lastButtonState == HIGH) {

    // Move to the next pattern
    pattern++;

    // If we go past Pattern 7, return to Pattern 1
    if (pattern >= 7) {
      pattern = 0;
    }

    // Small delay to help prevent button bouncing
    delay(50);
  }

  // Remember the current button state
  lastButtonState = currentButtonState;


  // -------- Pattern selection --------

  if (pattern == 0) {
    // Pattern 1: LED 1
    digitalWrite(led1, HIGH);
    digitalWrite(led2, LOW);
    digitalWrite(led3, LOW);
    digitalWrite(led4, LOW);
    digitalWrite(led5, LOW);
    digitalWrite(led6, LOW);

  } else if (pattern == 1) {
    // Pattern 2: LED 2
    digitalWrite(led1, LOW);
    digitalWrite(led2, HIGH);
    digitalWrite(led3, LOW);
    digitalWrite(led4, LOW);
    digitalWrite(led5, LOW);
    digitalWrite(led6, LOW);

  } else if (pattern == 2) {
    // Pattern 3: LED 3
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    digitalWrite(led3, HIGH);
    digitalWrite(led4, LOW);
    digitalWrite(led5, LOW);
    digitalWrite(led6, LOW);

  } else if (pattern == 3) {
    // Pattern 4: LED 4
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    digitalWrite(led3, LOW);
    digitalWrite(led4, HIGH);
    digitalWrite(led5, LOW);
    digitalWrite(led6, LOW);

  } else if (pattern == 4) {
    // Pattern 5: LED 5
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    digitalWrite(led3, LOW);
    digitalWrite(led4, LOW);
    digitalWrite(led5, HIGH);
    digitalWrite(led6, LOW);

  } else if (pattern == 5) {
    // Pattern 6: LED 6
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    digitalWrite(led3, LOW);
    digitalWrite(led4, LOW);
    digitalWrite(led5, LOW);
    digitalWrite(led6, HIGH);

  } else {
    // Pattern 7: LEDs 1, 3, and 5
    digitalWrite(led1, HIGH);
    digitalWrite(led2, LOW);
    digitalWrite(led3, HIGH);
    digitalWrite(led4, LOW);
    digitalWrite(led5, HIGH);
    digitalWrite(led6, LOW);
  }
}