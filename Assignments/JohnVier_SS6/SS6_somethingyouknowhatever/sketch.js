
/*
  ==========================================
  SIGNAL STATION
  p5.js + ESP32-S3
  SERIAL HANDSHAKING
  ==========================================
*/

// ==========================================
// CANVAS
// ==========================================

const canvasWidth = 900;
const canvasHeight = 600;


// ==========================================
// SERIAL CONNECTION
// ==========================================

let port;

let serialBuffer = "";
let wasPortOpen = false;

let handshakeStage = "DISCONNECTED";

let currentSequence = 0;

let lastHelloTime = 0;
let lastRequestTime = 0;
let lastAckTime = 0;
let nextPollTime = 0;

let acknowledgementCount = 0;


// ==========================================
// SENSOR DATA
// ==========================================

let sensorX = 2048;
let sensorY = 2048;


// ==========================================
// VISUAL MODES
// ==========================================

let currentMode = "NAVIGATION";

// Submarine position.
let submarineX = 450;
let submarineY = 350;

// Sonar animation.
let sonarAngle = 0;


// ==========================================
// SETUP
// ==========================================

function setup() {

  createCanvas(canvasWidth, canvasHeight);

  textFont("monospace");
  textAlign(CENTER, CENTER);

  // Create direct Web Serial connection.
  port = createSerial();
}


// ==========================================
// MAIN DRAW LOOP
// ==========================================

function draw() {

  // Maintain the serial handshake.
  serviceSerial();

  background(7, 19, 35);

  drawHeader();
  drawModeButtons();

  // Display the selected mode.
  if (currentMode === "NAVIGATION") {

    drawNavigationMode();

  } else {

    drawSonarMode();

  }

  drawFooter();
}


// ==========================================
// SERIAL HANDSHAKING MANAGER
// ==========================================

function serviceSerial() {

  if (!port) return;

  // Check connection status.
  const isOpen = port.opened();

  // Detect disconnection.
  if (!isOpen) {

    if (wasPortOpen) {
      resetSerialState();
    }

    return;
  }

  // Detect a newly opened connection.
  if (!wasPortOpen) {

    wasPortOpen = true;

    handshakeStage = "WAIT_READY";

    serialBuffer = "";

    lastHelloTime = 0;
  }

  // Read incoming serial data.
  readSerialInput();

  const now = millis();


  // STEP 1: Keep requesting the initial handshake.
  if (
    handshakeStage === "WAIT_READY" &&
    now - lastHelloTime >= 500
  ) {

    port.println("HELLO");

    lastHelloTime = now;
  }


  // STEP 2: Send a new sensor request.
  if (
    handshakeStage === "READY_TO_POLL" &&
    now >= nextPollTime
  ) {

    currentSequence++;

    if (currentSequence > 999999) {
      currentSequence = 1;
    }

    port.println("POLL," + currentSequence);

    handshakeStage = "WAIT_DATA";

    lastRequestTime = now;
  }


  // STEP 3: Retry if the sensor response is delayed.
  if (
    handshakeStage === "WAIT_DATA" &&
    now - lastRequestTime > 800
  ) {

    // Repeat the same request number.
    port.println("POLL," + currentSequence);

    lastRequestTime = now;
  }


  // STEP 4: Retry the acknowledgement if necessary.
  if (
    handshakeStage === "WAIT_ACKED" &&
    now - lastAckTime > 800
  ) {

    port.println("ACK," + currentSequence);

    lastAckTime = now;
  }
}


// ==========================================
// READ SERIAL INPUT
// ==========================================

function readSerialInput() {

  if (port.available() <= 0) {
    return;
  }

  // Read all currently available characters.
  let incoming = port.read();

  if (incoming) {
    serialBuffer += incoming;
  }

  // Split complete messages using newline characters.
  let lines = serialBuffer.split("\n");

  // Keep any incomplete message.
  serialBuffer = lines.pop() || "";

  // Process every complete message.
  for (let line of lines) {

    line = line.trim();

    if (line.length > 0) {
      handleSerialMessage(line);
    }
  }

  // Safety limit for malformed messages.
  if (serialBuffer.length > 100) {
    serialBuffer = "";
  }
}


// ==========================================
// HANDLE ARDUINO RESPONSES
// ==========================================

function handleSerialMessage(message) {

  let values = message.split(",");

  // STEP 1: Arduino confirms connection.
  if (values[0] === "READY") {

    if (handshakeStage === "WAIT_READY") {

      handshakeStage = "READY_TO_POLL";

      nextPollTime = millis();

      console.log("Arduino is READY.");
    }

    return;
  }


  // STEP 2: Arduino returns sensor readings.
  if (
    values[0] === "DATA" &&
    values.length === 4
  ) {

    let sequence = Number(values[1]);
    let newX = Number(values[2]);
    let newY = Number(values[3]);

    // Check the sequence number.
    if (
      handshakeStage !== "WAIT_DATA" ||
      sequence !== currentSequence
    ) {

      console.log("Unexpected DATA message:", message);

      return;
    }

    // Validate sensor values.
    if (
      !Number.isFinite(newX) ||
      !Number.isFinite(newY) ||
      newX < 0 || newX > 4095 ||
      newY < 0 || newY > 4095
    ) {

      console.log("Invalid sensor readings:", message);

      return;
    }

    // Save sensor data.
    sensorX = newX;
    sensorY = newY;

    console.log(
      "Received DATA:",
      sequence,
      sensorX,
      sensorY
    );

    // STEP 3: Acknowledge the response.
    port.println("ACK," + sequence);

    handshakeStage = "WAIT_ACKED";

    lastAckTime = millis();

    return;
  }


  // STEP 4: Arduino confirms acknowledgement.
  if (
    values[0] === "ACKED" &&
    values.length === 2
  ) {

    let sequence = Number(values[1]);

    if (
      handshakeStage === "WAIT_ACKED" &&
      sequence === currentSequence
    ) {

      acknowledgementCount++;

      console.log("Handshake completed:", sequence);

      // The next request can now begin.
      handshakeStage = "READY_TO_POLL";

      nextPollTime = millis() + 50;
    }

    return;
  }

  console.log("Unknown serial message:", message);
}


// ==========================================
// RESET CONNECTION
// ==========================================

function resetSerialState() {

  wasPortOpen = false;

  handshakeStage = "DISCONNECTED";

  serialBuffer = "";

  console.log("Serial connection closed.");
}


// ==========================================
// HEADER
// ==========================================

function drawHeader() {

  noStroke();

  fill(14, 38, 60);
  rect(0, 0, width, 80);

  fill(100, 225, 220);
  textSize(25);

  text("SIGNAL STATION", 245, 30);

  fill(170, 195, 215);
  textSize(11);

  text("UNDERWATER CONTROL SYSTEM", 245, 56);

  // Connection button.
  if (port && port.opened()) {

    fill(35, 150, 110);

  } else {

    fill(70, 85, 105);

  }

  rect(700, 19, 165, 42, 8);

  fill(255);
  textSize(12);

  text(
    port && port.opened()
      ? "DISCONNECT"
      : "CONNECT ESP32",
    782,
    40
  );
}


// ==========================================
// MODE BUTTONS
// ==========================================

function drawModeButtons() {

  // Navigation mode.
  fill(
    currentMode === "NAVIGATION"
      ? color(35, 160, 170)
      : color(30, 55, 75)
  );

  rect(35, 100, 175, 42, 8);

  fill(255);
  textSize(13);
  text("NAVIGATION MODE", 122, 121);


  // Sonar mode.
  fill(
    currentMode === "SONAR"
      ? color(35, 160, 170)
      : color(30, 55, 75)
  );

  rect(220, 100, 155, 42, 8);

  fill(255);
  text("SONAR MODE", 297, 121);
}


// ==========================================
// NAVIGATION MODE
// ==========================================

function drawNavigationMode() {

  // Draw underwater environment.
  drawWater();

  // Convert sensor readings into coordinates.
  let targetX = map(
    sensorX,
    0,
    4095,
    85,
    width - 85
  );

  let targetY = map(
    sensorY,
    0,
    4095,
    205,
    height - 115
  );

  // Smooth the submarine movement.
  submarineX = lerp(submarineX, targetX, 0.08);

  submarineY = lerp(submarineY, targetY, 0.08);

  // Draw animated bubbles.
  drawBubbles();

  // Draw submarine.
  drawSubmarine(submarineX, submarineY);

  // Display current readings.
  fill(175, 220, 230);
  textSize(12);

  text(
    "STEERING X: " + sensorX +
    "     STEERING Y: " + sensorY,
    width / 2,
    530
  );
}


// ==========================================
// WATER BACKGROUND
// ==========================================

function drawWater() {

  noFill();

  strokeWeight(1);

  for (let y = 180; y < 520; y += 45) {

    stroke(30, 105, 145, 100);

    beginShape();

    for (let x = 20; x <= width - 20; x += 12) {

      let wave =
        sin(x * 0.018 + frameCount * 0.025) * 7;

      vertex(x, y + wave);
    }

    endShape();
  }

  // Decorative seabed.
  noStroke();

  fill(20, 65, 75);
  rect(0, 510, width, 25);
}


// ==========================================
// ANIMATED BUBBLES
// ==========================================

function drawBubbles() {

  noFill();

  strokeWeight(2);

  for (let i = 0; i < 9; i++) {

    let offset = (frameCount * 1.1 + i * 48) % 300;

    let bubbleX = submarineX - 75 - (i % 3) * 13;
    let bubbleY = submarineY + 35 - offset;

    if (bubbleY > 160) {

      stroke(130, 220, 230, 150);

      circle(
        bubbleX,
        bubbleY,
        5 + (i % 3) * 3
      );
    }
  }
}


// ==========================================
// DRAW SUBMARINE
// ==========================================

function drawSubmarine(x, y) {

  push();

  translate(x, y);

  noStroke();

  // Rear fin.
  fill(220, 150, 55);

  triangle(
    -48, 0,
    -72, -19,
    -72, 19
  );

  // Main submarine hull.
  fill(220, 155, 65);

  ellipse(0, 0, 115, 43);

  // Top cabin.
  fill(195, 130, 55);

  rect(-22, -30, 43, 22, 5);

  // Periscope.
  stroke(220, 220, 210);
  strokeWeight(3);

  line(-1, -30, -1, -43);
  line(-1, -43, 12, -43);

  // Portholes.
  noStroke();

  fill(35, 110, 155);

  circle(-19, 1, 13);
  circle(0, 1, 13);
  circle(19, 1, 13);

  // Nose detail.
  fill(245, 205, 105);

  circle(53, 0, 8);

  pop();
}


// ==========================================
// SONAR MODE
// ==========================================

function drawSonarMode() {

  let centerX = width / 2;
  let centerY = 350;

  // Sensor 1 controls radar range.
  let radarRange = map(
    sensorX,
    0,
    4095,
    55,
    190
  );

  // Sensor 2 controls sweep speed.
  let sweepSpeed = map(
    sensorY,
    0,
    4095,
    0.008,
    0.075
  );

  sonarAngle += sweepSpeed;

  // Radar rings.
  noFill();

  stroke(45, 160, 130);

  strokeWeight(1);

  for (let radius = 45; radius <= 190; radius += 45) {

    circle(centerX, centerY, radius * 2);
  }

  // Radar crosshairs.
  stroke(45, 120, 110);

  line(centerX - 200, centerY, centerX + 200, centerY);

  line(centerX, centerY - 200, centerX, centerY + 200);

  // Radar sweep trail.
  for (let i = 0; i < 9; i++) {

    let angle = sonarAngle - i * 0.045;

    stroke(
      60,
      240,
      155,
      190 - i * 19
    );

    strokeWeight(i === 0 ? 3 : 1);

    line(
      centerX,
      centerY,
      centerX + cos(angle) * radarRange,
      centerY + sin(angle) * radarRange
    );
  }

  // Sonar targets.
  drawSonarTarget(centerX + 90, centerY - 65, 0);
  drawSonarTarget(centerX - 115, centerY + 40, 1);
  drawSonarTarget(centerX + 25, centerY + 130, 2);

  // Readout panel.
  noStroke();

  fill(110, 240, 165);
  textSize(13);

  text(
    "RADAR RANGE: " + round(radarRange) +
    "     SWEEP SPEED: " + nf(sweepSpeed, 1, 3),
    centerX,
    555
  );
}


// ==========================================
// SONAR TARGETS
// ==========================================

function drawSonarTarget(x, y, offset) {

  let pulse = sin(frameCount * 0.08 + offset) * 3;

  noStroke();

  fill(80, 255, 160, 70);

  circle(x, y, 18 + pulse);

  fill(100, 255, 175);

  circle(x, y, 6);
}


// ==========================================
// FOOTER / HANDSHAKE STATUS
// ==========================================

function drawFooter() {

  noStroke();

  fill(12, 30, 48);

  rect(0, 570, width, 30);

  fill(185, 205, 220);

  textSize(10);

  text(
    "HANDSHAKE: " + handshakeStage +
    "     ACKNOWLEDGEMENTS: " + acknowledgementCount +
    "     X: " + sensorX +
    "     Y: " + sensorY,
    width / 2,
    585
  );
}


// ==========================================
// MOUSE INTERACTION
// ==========================================

function mousePressed() {

  // Connect / disconnect button.
  if (
    mouseX >= 700 && mouseX <= 865 &&
    mouseY >= 19 && mouseY <= 61
  ) {

    if (port.opened()) {

      port.close();

      resetSerialState();

    } else {

      port.open(9600);

      handshakeStage = "WAIT_READY";
    }

    return false;
  }


  // Navigation mode.
  if (
    mouseX >= 35 && mouseX <= 210 &&
    mouseY >= 100 && mouseY <= 142
  ) {

    currentMode = "NAVIGATION";

    return false;
  }


  // Sonar mode.
  if (
    mouseX >= 220 && mouseX <= 375 &&
    mouseY >= 100 && mouseY <= 142
  ) {

    currentMode = "SONAR";

    return false;
  }
}


// ==========================================
// COMPUTER KEYBOARD MODE SWITCHING
// ==========================================

function keyPressed() {

  if (key === "1") {
    currentMode = "NAVIGATION";
  }

  if (key === "2") {
    currentMode = "SONAR";
  }
}
