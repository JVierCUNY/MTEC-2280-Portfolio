// ========================================
// BOAT NAVIGATOR SKETCH
// ========================================
// ========================================
// BOAT NAVIGATOR
// ESP32-S3 + 2 Potentiometers + 2 Buttons
// ========================================

// SERIAL CONNECTION
let serial;
let portName = "/dev/tty.usbmodem5CBC4014861";
// Replace this with the full port path that worked previously.

// SENSOR DATA
let xPotValue = 2048;
let yPotValue = 2048;
let previousButton = 0;
let nextButton = 0;

// BOAT SELECTION
let currentBoat = 0;

// THREE INDEPENDENT BOATS
let boats = [
  {
    x: 200,
    y: 200,
    type: "SAILBOAT",
    hullColor: [220, 65, 75]
  },
  {
    x: 400,
    y: 300,
    type: "MOTORBOAT",
    hullColor: [10, 80, 90]
  },
  {
    x: 600,
    y: 400,
    type: "SHIP",
    hullColor: [120, 55, 65]
  }
];

// BUTTON EDGE DETECTION
let lastPreviousButton = 0;
let lastNextButton = 0;

// CANVAS SETTINGS
const canvasWidth = 800;
const canvasHeight = 600;

// ========================================
// SETUP
// ========================================

function setup() {
  createCanvas(canvasWidth, canvasHeight);

  textAlign(CENTER, CENTER);
  colorMode(HSB, 360, 100, 100);

  // Initialize the serial connection.
  serial = new p5.SerialPort();

  serial.on("list", printList);
  serial.on("data", serialEvent);
  serial.on("open", serialOpened);
  serial.on("error", serialError);

  serial.list();
  serial.open(portName);
}

// ========================================
// MAIN DRAW LOOP
// ========================================

function draw() {
  drawOcean();

  // Convert potentiometer readings into canvas positions.
  // Keep each boat away from the edges.
  let mappedX = map(xPotValue, 0, 4095, 45, width - 45);
  let mappedY = map(yPotValue, 0, 4095, 85, height - 45);

  mappedX = constrain(mappedX, 45, width - 45);
  mappedY = constrain(mappedY, 85, height - 45);

  // Move ONLY the currently selected boat.
  // Smoothed the movement to reduce potentiometer jitter.
boats[currentBoat].x = lerp(
  boats[currentBoat].x,
  mappedX,
  0.15
);

boats[currentBoat].y = lerp(
  boats[currentBoat].y,
  mappedY,
  0.15
);

  // Draw all three boats.
  for (let i = 0; i < boats.length; i++) {
    if (i === currentBoat) {
      // Highlight the selected boat.
      noFill();
      stroke(55, 100, 100);
      strokeWeight(4);
      circle(boats[i].x, boats[i].y, 65);
    }

    drawBoat(boats[i]);
  }

  drawInterface();
}

// ========================================
// OCEAN BACKGROUND
// ========================================

function drawOcean() {
  background(205, 80, 65);

  // Horizontal water lines.
  stroke(195, 55, 85);
  strokeWeight(1);

  for (let y = 100; y < height; y += 65) {
    line(0, y, width, y);
  }

  // Small decorative waves.
  noStroke();
  fill(185, 40, 95);

  for (let x = 40; x < width; x += 100) {
    ellipse(x, 130, 25, 5);
    ellipse(x + 35, 280, 30, 5);
    ellipse(x + 10, 450, 25, 5);
  }

  // Title banner.
  fill(210, 75, 25);
  rect(0, 0, width, 65);

  fill(0, 0, 100);
  textSize(25);
  text("BOAT NAVIGATOR", width / 2, 28);
}

// ========================================
// DRAW A BOAT
// ========================================

function drawBoat(boat) {
  push();

  translate(boat.x, boat.y);

  // Boat hull.
  stroke(0, 0, 15);
  strokeWeight(2);
  fill(boat.hullColor[0], boat.hullColor[1], boat.hullColor[2]);

  if (boat.type === "SAILBOAT") {
    // Hull.
    triangle(-25, 5, 25, 5, 0, 25);

    // Mast.
    line(0, -25, 0, 5);

    // Sail.
    fill(0, 0, 100);
    triangle(-2, -23, -2, 0, -20, 0);

    fill(45, 90, 100);
    triangle(2, -18, 2, 0, 18, 0);

  } else if (boat.type === "MOTORBOAT") {
    // Hull.
    triangle(-25, -12, 25, -12, 0, 25);

    // Cabin.
    fill(0, 0, 90);
    rect(-12, -20, 24, 13);

    // Windows.
    fill(195, 70, 90);
    rect(-8, -17, 6, 7);
    rect(2, -17, 6, 7);

  } else {
    // Larger ship hull.
    quad(-28, -12, 28, -12, 20, 22, -20, 22);

    // Deck.
    fill(0, 0, 90);
    rect(-16, -25, 32, 15);

    // Bridge.
    fill(0, 0, 75);
    rect(-8, -35, 16, 10);

    // Smokestack.
    fill(0, 80, 85);
    rect(-4, -43, 8, 9);
  }

  pop();

  // Boat label.
  noStroke();
  fill(0, 0, 100);
  textSize(12);
  text(boat.type, boat.x, boat.y + 40);
}

// ========================================
// STATUS INTERFACE
// ========================================

function drawInterface() {
  // Bottom information panel.
  noStroke();
  fill(210, 75, 25);
  rect(0, height - 45, width, 45);

  fill(0, 0, 100);
  textSize(13);

  text(
    "Selected: " + boats[currentBoat].type,
    width / 2,
    height - 30
  );

  // Show the current potentiometer readings.
  fill(0, 0, 100);
  textSize(11);

  text(
    "X: " + xPotValue + "   Y: " + yPotValue,
    width / 2,
    height - 65
  );
}

// ========================================
// SERIAL PORT LIST
// ========================================

function printList(ports) {
  console.log("Available serial ports:");

  for (let i = 0; i < ports.length; i++) {
    console.log(ports[i]);
  }
}

// ========================================
// SERIAL DATA
// ========================================

function serialEvent() {
  let incoming = serial.readStringUntil("\n");

  if (incoming === null || incoming.length === 0) {
    return;
  }

  incoming = incoming.trim();

  // Expected format:
  // xPotValue,yPotValue,previousButton,nextButton

  let values = incoming.split(",");

  if (values.length !== 4) {
    console.log("Unexpected serial data:", incoming);
    return;
  }

  // Convert incoming text to numbers.
  let newX = Number(values[0]);
  let newY = Number(values[1]);
  let newPrevious = Number(values[2]);
  let newNext = Number(values[3]);

  // Reject invalid readings.
  if (
    !Number.isFinite(newX) ||
    !Number.isFinite(newY) ||
    !Number.isFinite(newPrevious) ||
    !Number.isFinite(newNext)
  ) {
    console.log("Invalid serial data:", incoming);
    return;
  }

  // Update sensor readings.
  xPotValue = constrain(newX, 0, 4095);
  yPotValue = constrain(newY, 0, 4095);

  previousButton = newPrevious;
  nextButton = newNext;

  // Previous button: move backward through the boat list.
  // Detect a change in button state.

if (previousButton === 1 && lastPreviousButton === 0) {
  currentBoat =
    (currentBoat + boats.length - 1) % boats.length;

  console.log("Selected boat:", boats[currentBoat].type);
}

if (nextButton === 1 && lastNextButton === 0) {
  currentBoat =
    (currentBoat + 1) % boats.length;

  console.log("Selected boat:", boats[currentBoat].type);
}

lastPreviousButton = previousButton;
lastNextButton = nextButton;
}

// ========================================
// CONNECTION MESSAGES
// ========================================

function serialOpened() {
  console.log("Serial connection opened:", portName);
}

function serialError(error) {
  console.error("Serial error:", error);
}
function serialClosed() {
  console.log("Serial connection closed.");
}