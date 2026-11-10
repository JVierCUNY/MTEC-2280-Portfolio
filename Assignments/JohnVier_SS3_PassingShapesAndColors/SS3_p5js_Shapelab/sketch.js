// ShapeLab - p5.js

let serial;

let portName = "/dev/tty.usbmodem5CBC4014861";

let colorPotValue = 2048;
let sizePotValue = 2048;

let shapeIndex = 0;
const shapeNames = ["TRIANGLE", "CIRCLE", "SQUARE"];

let previousWasPressed = false;
let nextWasPressed = false;

let serialStatus = "Waiting for serial connection...";

function setup() {
  // Meets the assignment's display size requirements
  createCanvas(800, 600);

  // Use hue, saturation, brightness and alpha for colors
  colorMode(HSB, 360, 100, 100, 100);

  textFont("sans-serif");

  // Set up the serial connection
  serial = new p5.SerialPort();

  serial.on("list", printList);
  serial.on("data", serialEvent);
  serial.on("open", serialOpened);
  serial.on("error", serialError);

  serial.list();
  serial.open(portName);
}

function draw() {
  // Required background()
  background(225, 30, 11);

  // Main panel
  noStroke();
  fill(225, 28, 17);
  rect(22, 22, width - 44, height - 44, 22);

  // Convert raw potentiometer values into useful visual values
  let hueValue = int(map(colorPotValue, 0, 4095, 0, 359));
  let objectSize = int(map(sizePotValue, 0, 4095, 70, 290));

  // Header
  fill(0, 0, 96);
  textAlign(LEFT, CENTER);
  textSize(22);
  text("SHAPE LAB", 50, 60);

  fill(0, 0, 65);
  textSize(11);
  text("A PHYSICAL INTERFACE FOR DIGITAL ART", 50, 82);

  fill(hueValue, 65, 100);
  textAlign(RIGHT, CENTER);
  textSize(13);
  text(shapeNames[shapeIndex], width - 50, 62);

  // Fourth graphics primitive: line()
  stroke(220, 10, 38);
  strokeWeight(1);
  line(50, 110, width - 50, 110);

  // Decorative ellipse around the main object
  noFill();
  stroke(hueValue, 60, 100, 35);
  strokeWeight(2);
  ellipse(width / 2, 300, objectSize + 30, objectSize + 30);

  // Draw the selected shape
  push();
  translate(width / 2, 300);

  // Required fill()
  fill(hueValue, 78, 100);
  stroke(0, 0, 98);
  strokeWeight(3);

  if (shapeIndex === 0) {
    // Graphics primitive 1: triangle()
    triangle(
      0, -objectSize * 0.58,
      -objectSize * 0.55, objectSize * 0.42,
      objectSize * 0.55, objectSize * 0.42
    );
  } else if (shapeIndex === 1) {
    // Graphics primitive 2: circle()
    circle(0, 0, objectSize);
  } else {
    // Graphics primitive 3: rect()
    rectMode(CENTER);
    rect(0, 0, objectSize, objectSize, 10);
  }

  pop();

  // Bottom control panel
  noStroke();
  fill(0, 0, 88);
  textAlign(LEFT, CENTER);
  textSize(12);
  text("COLOR", 50, 480);

  fill(0, 0, 62);
  textAlign(RIGHT, CENTER);
  text(hueValue + "°", 300, 480);

  // Color indicator bar
  fill(220, 15, 30);
  rect(50, 497, 250, 8, 4);

  fill(hueValue, 78, 100);
  rect(50, 497, map(colorPotValue, 0, 4095, 0, 250), 8, 4);

  fill(0, 0, 88);
  textAlign(LEFT, CENTER);
  text("SIZE", 450, 480);

  fill(0, 0, 62);
  textAlign(RIGHT, CENTER);
  text(objectSize + " px", 750, 480);

  // Size indicator bar
  fill(220, 15, 30);
  rect(450, 497, 300, 8, 4);

  fill(hueValue, 78, 100);
  rect(450, 497, map(sizePotValue, 0, 4095, 0, 300), 8, 4);

  // Serial connection status
  fill(0, 0, 65);
  textAlign(LEFT, CENTER);
  textSize(10);
  text(serialStatus, 50, 545);

  fill(0, 0, 65);
  textAlign(RIGHT, CENTER);
  text("PREVIOUS  /  NEXT", 750, 545);
}

// Called when serial data arrives
function serialEvent() {
  let raw = serial.readStringUntil("\n");

  if (raw === null || raw === undefined || raw.length === 0) {
    return;
  }

  // Split the CSV line into four values
  let parts = raw.trim().split(",");

  if (parts.length !== 4) {
    return;
  }

  // DATA TYPE CONVERSION: text received over serial becomes numbers
  let values = parts.map(value => Number(value));

  if (values.some(value => !Number.isFinite(value))) {
    return;
  }

  colorPotValue = constrain(values[0], 0, 4095);
  sizePotValue = constrain(values[1], 0, 4095);

  let previousPressed = values[2] === 1;
  let nextPressed = values[3] === 1;

  // Cycle backward once per press
  if (previousPressed && !previousWasPressed) {
    shapeIndex = (shapeIndex + shapeNames.length - 1)
      % shapeNames.length;
  }

  // Cycle forward once per press
  if (nextPressed && !nextWasPressed) {
    shapeIndex = (shapeIndex + 1) % shapeNames.length;
  }

  previousWasPressed = previousPressed;
  nextWasPressed = nextPressed;
}

function printList(ports) {
  console.log("Available serial ports:", ports);
}

function serialOpened() {
  serialStatus = "Serial connected";
  console.log("ESP32 serial connection opened.");
}

function serialError(error) {
  serialStatus = "Serial connection error";
  console.error("Serial error:", error);
}