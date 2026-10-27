// ShapeLab.ino
// ESP32-S3: 2 potentiometers + 2 buttons

const int colorPotPin = 1;
const int sizePotPin = 2;
const int previousButtonPin = 6;
const int nextButtonPin = 7;

const unsigned long sendInterval = 20;
const unsigned long debounceDelay = 35;

unsigned long lastSendTime = 0;

// Button debouncing variables
int previousStableState = HIGH;
int previousLastReading = HIGH;
unsigned long previousDebounceTime = 0;

int nextStableState = HIGH;
int nextLastReading = HIGH;
unsigned long nextDebounceTime = 0;

void setup() {
  Serial.begin(9600);

  // ESP32-S3 analog readings: 0 through 4095
  analogReadResolution(12);

  // Buttons connect their pins to GND when pressed
  pinMode(previousButtonPin, INPUT_PULLUP);
  pinMode(nextButtonPin, INPUT_PULLUP);
}

void loop() {
  unsigned long currentTime = millis();

  // Read and debounce the Previous button
  int previousReading = digitalRead(previousButtonPin);

  if (previousReading != previousLastReading) {
    previousDebounceTime = currentTime;
    previousLastReading = previousReading;
  }

  if (currentTime - previousDebounceTime >= debounceDelay) {
    previousStableState = previousReading;
  }

  // Read and debounce the Next button
  int nextReading = digitalRead(nextButtonPin);

  if (nextReading != nextLastReading) {
    nextDebounceTime = currentTime;
    nextLastReading = nextReading;
  }

  if (currentTime - nextDebounceTime >= debounceDelay) {
    nextStableState = nextReading;
  }

  // Send sensor data every 20 milliseconds
  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;

    int colorValue = analogRead(colorPotPin);
    int sizeValue = analogRead(sizePotPin);

    // Convert INPUT_PULLUP states into 1 = pressed, 0 = released
    int previousPressed = (previousStableState == LOW) ? 1 : 0;
    int nextPressed = (nextStableState == LOW) ? 1 : 0;

    // Format: color,size,previous,next
    Serial.print(colorValue);
    Serial.print(",");

    Serial.print(sizeValue);
    Serial.print(",");

    Serial.print(previousPressed);
    Serial.print(",");

    Serial.println(nextPressed);
  }
}