
// ========================================
// POCKET PIANO
// ========================================

// SERIAL CONNECTION
let port;

// PROJECT SETTINGS
const canvasWidth = 900;
const canvasHeight = 600;

// MODES
let currentMode = "MANUAL";
let arpRunning = false;

// ACTIVE NOTE
let activeNote = null;
let activeSource = null;
let activeComputerKey = null;

// KEYBOARD ARRAYS
let whiteKeys = [];
let blackKeys = [];
let allKeys = [];

// KEYBOARD POSITION
const keyboardX = 62;
const keyboardY = 320;
const whiteKeyWidth = 97;
const whiteKeyHeight = 215;
const blackKeyWidth = 58;

// ARPEGGIATOR
const arpSequence = [
  1047, 1319, 1568, 2093,
  1976, 1568, 1319, 1047
];

let arpIndex = 0;
let arpInterval = 300;
let lastArpTime = 0;

// ========================================
// NOTE DEFINITIONS
// ========================================

const whiteNotes = [
  { note: "C6", key: "A", freq: 1047 },
  { note: "D6", key: "S", freq: 1175 },
  { note: "E6", key: "D", freq: 1319 },
  { note: "F6", key: "F", freq: 1397 },
  { note: "G6", key: "G", freq: 1568 },
  { note: "A6", key: "H", freq: 1760 },
  { note: "B6", key: "J", freq: 1976 },
  { note: "C7", key: "K", freq: 2093 }
];

const blackNotes = [
  { note: "C#6", key: "W", freq: 1109, after: 0 },
  { note: "D#6", key: "E", freq: 1245, after: 1 },
  { note: "F#6", key: "T", freq: 1480, after: 3 },
  { note: "G#6", key: "Y", freq: 1661, after: 4 },
  { note: "A#6", key: "U", freq: 1865, after: 5 }
];

// ========================================
// SETUP
// ========================================

function setup() {

  createCanvas(canvasWidth, canvasHeight);

  textAlign(CENTER, CENTER);
  textFont("Arial");

  // Initialize the direct Web Serial connection.
  port = createSerial();

  buildKeyboard();
}

// ========================================
// BUILD KEYBOARD
// ========================================

function buildKeyboard() {

  // Create white keys.
  for (let i = 0; i < whiteNotes.length; i++) {

    let note = whiteNotes[i];

    whiteKeys.push({
      ...note,
      x: keyboardX + i * whiteKeyWidth,
      y: keyboardY,
      w: whiteKeyWidth,
      h: whiteKeyHeight,
      black: false
    });
  }

  // Create black keys.
  for (let i = 0; i < blackNotes.length; i++) {

    let note = blackNotes[i];

    blackKeys.push({
      ...note,
      x: keyboardX +
         (note.after + 1) * whiteKeyWidth -
         blackKeyWidth / 2,
      y: keyboardY,
      w: blackKeyWidth,
      h: 130,
      black: true
    });
  }

  allKeys = [...whiteKeys, ...blackKeys];
}

// ========================================
// MAIN DRAW LOOP
// ========================================

function draw() {

  drawBackground();
  drawHeader();
  drawModeControls();

  // Automatic arpeggiator mode.
  if (
    currentMode === "ARPEGGIATOR" &&
    arpRunning &&
    millis() - lastArpTime >= arpInterval
  ) {

    let frequency = arpSequence[arpIndex];

    let note = allKeys.find(
      item => item.freq === frequency
    );

    activeNote = note;
    activeSource = "arp";

    sendFrequency(frequency);

    arpIndex = (arpIndex + 1) % arpSequence.length;

    lastArpTime = millis();
  }

  drawVisualizer();
  drawKeyboard();
  drawFooter();
}

// ========================================
// BACKGROUND
// ========================================

function drawBackground() {

  background(10, 18, 35);

  // Decorative background panel.
  noStroke();
  fill(18, 34, 58);
  rect(0, 75, width, height - 75);

  // Animated background dots.
  for (let i = 0; i < 12; i++) {

    let x = (i * 83 + frameCount * 0.25) % width;
    let y = 165 + sin(frameCount * 0.02 + i) * 20;

    fill(65, 160, 200, 90);
    circle(x, y, 4);
  }
}

// ========================================
// HEADER
// ========================================

function drawHeader() {

  fill(255);
  textSize(28);
  textStyle(BOLD);

  text("POCKET PIANO", 220, 32);

  textStyle(NORMAL);
  textSize(12);
  fill(170, 190, 215);

  text("A USB SERIAL SYNTHESIZER", 220, 55);

  // Connection button.
  if (port && port.opened()) {
    fill(40, 170, 130);
  } else {
    fill(55, 85, 120);
  }

  noStroke();
  rect(700, 18, 160, 42, 8);

  fill(255);
  textSize(13);

  text(
    port && port.opened()
      ? "DISCONNECT"
      : "CONNECT ESP32",
    780,
    39
  );
}

// ========================================
// MODE CONTROLS
// ========================================

function drawModeControls() {

  // Manual mode button.
  fill(currentMode === "MANUAL" ? "#36BFC1" : "#263C59");

  rect(55, 108, 150, 42, 8);

  fill(255);
  textSize(14);
  text("MANUAL PIANO", 130, 129);

  // Arpeggiator mode button.
  fill(currentMode === "ARPEGGIATOR" ? "#36BFC1" : "#263C59");

  rect(220, 108, 165, 42, 8);

  fill(255);
  text("ARPEGGIATOR", 302, 129);

  // Arpeggiator play/stop button.
  if (currentMode === "ARPEGGIATOR") {

    fill(arpRunning ? "#D65A5A" : "#34A878");

    rect(405, 108, 155, 42, 8);

    fill(255);

    text(
      arpRunning ? "STOP SEQUENCE" : "START SEQUENCE",
      482,
      129
    );
  }
}

// ========================================
// VISUALIZER
// ========================================

function drawVisualizer() {

  let movement = millis() / 500;

  let strength = activeNote ? 1 : 0.25;

  // Animated sound waves.
  noFill();

  for (let i = 0; i < 5; i++) {

    let diameter =
      35 + i * 28 +
      sin(movement + i) * 10 * strength;

    stroke(55, 190, 220, 170 - i * 20);
    strokeWeight(2);

    ellipse(450, 225, diameter * 2, diameter);
  }

  // Animated waveform.
  stroke(90, 220, 230);
  strokeWeight(2);

  noFill();
  beginShape();

  for (let x = 55; x <= 845; x += 8) {

    let wave = sin(x * 0.025 - movement * 3);

    let y = 225 + wave * 18 * strength;

    vertex(x, y);
  }

  endShape();

  // Current note display.
  noStroke();
  fill(255);

  textSize(18);

  text(
    activeNote ? activeNote.note : "READY TO PLAY",
    450,
    180
  );
}

// ========================================
// DRAW VIRTUAL KEYBOARD
// ========================================

function drawKeyboard() {

  // Draw white keys first.
  for (let note of whiteKeys) {

    let isActive =
      activeNote && activeNote.note === note.note;

    fill(isActive ? "#58D7C4" : "#F0F1F4");

    stroke("#9AA7B5");
    strokeWeight(2);

    rect(
      note.x,
      note.y,
      note.w,
      note.h,
      0, 0, 8, 8
    );

    noStroke();
    fill("#263348");

    textSize(15);
    text(note.note, note.x + note.w / 2, note.y + 165);

    textSize(12);
    text(note.key, note.x + note.w / 2, note.y + 195);
  }

  // Black keys are drawn on top.
  for (let note of blackKeys) {

    let isActive =
      activeNote && activeNote.note === note.note;

    fill(isActive ? "#E8B94F" : "#172332");

    stroke("#0B101A");
    strokeWeight(2);

    rect(
      note.x,
      note.y,
      note.w,
      note.h,
      0, 0, 6, 6
    );

    noStroke();
    fill(255);

    textSize(11);
    text(note.note, note.x + note.w / 2, note.y + 95);

    textSize(11);
    text(note.key, note.x + note.w / 2, note.y + 113);
  }
}

// ========================================
// FOOTER
// ========================================

function drawFooter() {

  fill(180, 200, 220);
  textSize(12);

  if (currentMode === "MANUAL") {
    text(
      "Click and hold a key, or use A S D F G H J K.",
      width / 2,
      565
    );
  } else {
    text(
      "The arpeggiator automatically cycles through notes.",
      width / 2,
      565
    );
  }

  textSize(10);

  fill(port && port.opened() ? "#65D9AE" : "#E7BC62");

  text(
    port && port.opened()
      ? "ESP32 SERIAL CONNECTED"
      : "ESP32 NOT CONNECTED",
    width / 2,
    585
  );
}

// ========================================
// SERIAL COMMUNICATION
// ========================================

function sendFrequency(frequency) {

  if (port && port.opened()) {

    port.println(String(frequency));

  } else {
    console.log(
      "ESP32 not connected. Requested frequency:",
      frequency
    );
  }
}

// ========================================
// PLAY AND STOP NOTES
// ========================================

function playNote(note, source, computerKey = null) {

  activeNote = note;
  activeSource = source;
  activeComputerKey = computerKey;

  sendFrequency(note.freq);
}

function stopCurrentSound() {

  sendFrequency(0);

  activeNote = null;
  activeSource = null;
  activeComputerKey = null;
}

// ========================================
// MOUSE CONTROLS
// ========================================

function mousePressed() {

  // Connect / disconnect button.
  if (
    mouseX >= 700 && mouseX <= 860 &&
    mouseY >= 18 && mouseY <= 60
  ) {

    if (port.opened()) {

      stopCurrentSound();
      port.close();

    } else {

      // Browser asks user to choose the ESP32.
      port.open(9600);
    }

    return false;
  }

  // Manual mode.
  if (
    mouseX >= 55 && mouseX <= 205 &&
    mouseY >= 108 && mouseY <= 150
  ) {

    stopCurrentSound();
    arpRunning = false;
    currentMode = "MANUAL";

    return false;
  }

  // Arpeggiator mode.
  if (
    mouseX >= 220 && mouseX <= 385 &&
    mouseY >= 108 && mouseY <= 150
  ) {

    stopCurrentSound();
    arpRunning = false;
    currentMode = "ARPEGGIATOR";

    return false;
  }

  // Start/stop arpeggiator.
  if (
    currentMode === "ARPEGGIATOR" &&
    mouseX >= 405 && mouseX <= 560 &&
    mouseY >= 108 && mouseY <= 150
  ) {

    if (arpRunning) {

      arpRunning = false;
      stopCurrentSound();

    } else {

      arpRunning = true;
      arpIndex = 0;
      lastArpTime = millis() - arpInterval;
    }

    return false;
  }

  // Play clicked piano keys.
  if (currentMode === "MANUAL") {

    let selectedKey = findKeyAt(mouseX, mouseY);

    if (selectedKey) {
      playNote(selectedKey, "mouse");
    }
  }

  return false;
}

function mouseReleased() {

  if (activeSource === "mouse") {
    stopCurrentSound();
  }
}

// ========================================
// FIND CLICKED KEY
// ========================================

function findKeyAt(x, y) {

  // Test black keys first, since they overlap white keys.
  for (let note of blackKeys) {

    if (
      x >= note.x && x <= note.x + note.w &&
      y >= note.y && y <= note.y + note.h
    ) {
      return note;
    }
  }

  for (let note of whiteKeys) {

    if (
      x >= note.x && x <= note.x + note.w &&
      y >= note.y && y <= note.y + note.h
    ) {
      return note;
    }
  }

  return null;
}

// ========================================
// PHYSICAL COMPUTER KEYBOARD
// ========================================

function keyPressed() {

  if (currentMode !== "MANUAL") {
    return;
  }

  let pressedKey = key.toUpperCase();

  let selectedNote = allKeys.find(
    note => note.key === pressedKey
  );

  if (!selectedNote) {
    return;
  }

  if (
    activeSource === "keyboard" &&
    activeComputerKey === pressedKey
  ) {
    return;
  }

  playNote(selectedNote, "keyboard", pressedKey);

  return false;
}

function keyReleased() {

  if (
    activeSource === "keyboard" &&
    activeComputerKey === key.toUpperCase()
  ) {
    stopCurrentSound();
  }

  return false;
}
