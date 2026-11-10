/*
  ==========================================
  SIGNAL STATION
  ESP32-S3 Serial Handshaking Project
  ==========================================

  Sensors:
    Potentiometer X: GPIO 1
    Potentiometer Y: GPIO 2

  Serial protocol:
    p5.js -> HELLO
    ESP32 -> READY

    p5.js -> POLL,sequence
    ESP32 -> DATA,sequence,x,y

    p5.js -> ACK,sequence
    ESP32 -> ACKED,sequence
*/

// ==========================================
// PIN SETTINGS
// ==========================================

const int potXPin = 1;
const int potYPin = 2;

// ==========================================
// HANDSHAKE VARIABLES
// ==========================================

String incomingLine = "";

bool waitingForAck = false;

int pendingSequence = -1;
int completedSequence = -1;


// ==========================================
// SETUP
// ==========================================

void setup() {

  Serial.begin(9600);

  analogReadResolution(12);

  // No debug messages here:
  // Serial is reserved for the handshake protocol.
}


// ==========================================
// MAIN LOOP
// ==========================================

void loop() {

  while (Serial.available() > 0) {

    char incomingChar = Serial.read();

    if (incomingChar == '\n') {

      incomingLine.trim();

      if (incomingLine.length() > 0) {
        processCommand(incomingLine);
      }

      incomingLine = "";
    }

    else if (incomingChar != '\r') {

      if (incomingLine.length() < 50) {
        incomingLine += incomingChar;
      } else {
        incomingLine = "";
      }
    }
  }
}


// ==========================================
// PROCESS COMMANDS
// ==========================================

void processCommand(String command) {

  // STEP 1: Initial handshake.
  if (command == "HELLO") {

    waitingForAck = false;
    pendingSequence = -1;
    completedSequence = -1;

    Serial.println("READY");

    return;
  }


  // STEP 2: Receive a sensor request.
  if (command.startsWith("POLL,")) {

    int sequence = command.substring(5).toInt();

    if (sequence <= 0) {
      return;
    }

    // If the previous response is still unacknowledged,
    // resend it only when the same request is repeated.
    if (waitingForAck) {

      if (sequence == pendingSequence) {
        sendSensorData(sequence);
      }

      return;
    }

    // Start a new request.
    pendingSequence = sequence;
    waitingForAck = true;

    sendSensorData(sequence);

    return;
  }


  // STEP 3: Receive acknowledgement from p5.js.
  if (command.startsWith("ACK,")) {

    int sequence = command.substring(4).toInt();

    // Normal acknowledgement.
    if (
      waitingForAck &&
      sequence == pendingSequence
    ) {

      waitingForAck = false;
      completedSequence = sequence;

      sendAcknowledgement(sequence);

      return;
    }

    // If the acknowledgement response was lost,
    // answer a repeated ACK for the completed sequence.
    if (sequence == completedSequence) {

      sendAcknowledgement(sequence);
    }
  }
}


// ==========================================
// SEND SENSOR DATA
// ==========================================

void sendSensorData(int sequence) {

  int xValue = analogRead(potXPin);
  int yValue = analogRead(potYPin);

  Serial.print("DATA,");
  Serial.print(sequence);
  Serial.print(",");
  Serial.print(xValue);
  Serial.print(",");
  Serial.println(yValue);
}


// ==========================================
// CONFIRM ACKNOWLEDGEMENT
// ==========================================

void sendAcknowledgement(int sequence) {

  Serial.print("ACKED,");
  Serial.println(sequence);
}
