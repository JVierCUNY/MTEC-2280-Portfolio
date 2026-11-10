// ========================================
// POCKET PIANO
// ESP32-S3 + Murata Piezoelectric Sounder
// ========================================

const int buzzerPin = 4;

const int serialBaudRate = 9600;
const int initialFrequency = 4000;

String incomingCommand = "";

bool buzzerReady = false;

// ========================================
// SETUP
// ========================================

void setup() {
  Serial.begin(serialBaudRate);

  // Configure ESP32 LEDC tone output.
  buzzerReady = ledcAttach(buzzerPin, initialFrequency, 8);

  // Start with the piezo silent.
  if (buzzerReady) {
    ledcWriteTone(buzzerPin, 0);
  }
}

// ========================================
// MAIN LOOP
// ========================================

void loop() {

  while (Serial.available() > 0) {

    char incomingCharacter = Serial.read();

    // A newline marks the end of a command.
    if (incomingCharacter == '\n') {

      incomingCommand.trim();

      if (incomingCommand.length() > 0) {
        processCommand(incomingCommand);
      }

      incomingCommand = "";
    }

    // Ignore carriage returns.
    else if (incomingCharacter != '\r') {

      if (incomingCommand.length() < 8) {
        incomingCommand += incomingCharacter;
      } else {
        incomingCommand = "";
      }
    }
  }
}

// ========================================
// PROCESS SERIAL COMMAND
// ========================================

void processCommand(String command) {

  if (!buzzerReady) {
    return;
  }

  int frequency = command.toInt();

  // Zero means stop playing.
  if (frequency == 0) {
    ledcWriteTone(buzzerPin, 0);
  }

  // Accept a reasonable musical frequency range.
  else if (frequency >= 1000 && frequency <= 5000) {

    ledcWriteTone(buzzerPin, frequency);
  }
}
