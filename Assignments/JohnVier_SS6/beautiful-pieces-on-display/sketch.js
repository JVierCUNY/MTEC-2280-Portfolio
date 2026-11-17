// CALL & LAMP, AKA. bieautiful-pieces-on-display
// Arduino sends CALL messages. p5.js answers with ACK messages.

let port;
let lamps = [false, false, false, false];
let mode = 0; // 0 = STEADY, 1 = PULSE
let lastModeSent = -1;
let lastMessage = "Waiting for Arduino...";
let lastSequence = "--";

let lampColors = [
  [255, 85, 85],
  [255, 190, 65],
  [90, 170, 255],
  [100, 235, 155]
];

let connectBox = { x: 40, y: 42, w: 190, h: 52 };
let modeBox = { x: 670, y: 42, w: 190, h: 52 };

function setup() {
  createCanvas(900, 600);
  textFont("monospace");
  port = createSerial();
}

function draw() {
  background(17, 22, 34);

  // ONLY when connection is ready.
  if (port.opened() && lastModeSent !== mode) {
    port.println("MODE," + mode);
    lastModeSent = mode;
  }

  // read only complete arduino commands.
  if (port.opened()) {
    while (port.available() > 0) {
      let message = port.readUntil("\n");
      if (message.length === 0) break;
      handleMessage(trim(message));
    }
  }

  drawHeader();
  drawControls();
  drawLamps();
  drawFooter();
}

function drawHeader() {
  noStroke();
  fill(235);
  textSize(28);
  textAlign(LEFT, CENTER);
  text("CALL & LAMP", 40, 135);

  fill(145, 158, 180);
  textSize(13);
  text("FOUR BUTTONS / FOUR LAMPS / ONE HANDSHAKE", 42, 164);

  stroke(65, 75, 95);
  line(40, 195, 860, 195);
}

function drawControls() {
  // button coorespond
  noStroke();
  fill(port.opened() ? color(40, 105, 85) : color(55, 70, 95));
  rect(connectBox.x, connectBox.y, connectBox.w, connectBox.h, 10);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(port.opened() ? "CONNECTED" : "CONNECT ARDUINO",
       connectBox.x + connectBox.w / 2, connectBox.y + connectBox.h / 2);

  // Mode button
  fill(mode === 0 ? color(65, 75, 105) : color(120, 75, 45));
  rect(modeBox.x, modeBox.y, modeBox.w, modeBox.h, 10);
  fill(255);
  text("MODE: " + (mode === 0 ? "STEADY" : "PULSE"),
       modeBox.x + modeBox.w / 2, modeBox.y + modeBox.h / 2);
}

function drawLamps() {
  let lampX = [150, 350, 550, 750];
  let lampY = 345;

  for (let i = 0; i < 4; i++) {
    let x = lampX[i];
    let c = lampColors[i];
    let glow = 1;

    if (lamps[i] && mode === 1) {
      glow = map(sin(frameCount * 0.09 + i), -1, 1, 0.55, 1.0);
    }

    // Glow, lamp housing, bezel, and bulb.
    noStroke();
    fill(c[0], c[1], c[2], lamps[i] ? 34 : 7);
    ellipse(x, lampY, 155 * glow, 155 * glow);

    fill(39, 46, 62);
    rect(x - 62, lampY - 62, 124, 124, 18);

    fill(18, 23, 35);
    ellipse(x, lampY, 92, 92);

    if (lamps[i]) {
      fill(c[0] * glow, c[1] * glow, c[2] * glow);
    } else {
      fill(68, 75, 87);
    }
    ellipse(x, lampY, 66, 66);

    // A little reflection line on each bulb.
    stroke(255, lamps[i] ? 150 : 35);
    strokeWeight(3);
    line(x - 15, lampY - 16, x + 2, lampY - 27);

    noStroke();
    fill(225);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("LAMP " + (i + 1), x, 445);

    fill(lamps[i] ? color(c[0], c[1], c[2]) : color(125, 135, 150));
    textSize(12);
    text(lamps[i] ? "ON" : "OFF", x, 469);
  }
}

function drawFooter() {
  stroke(65, 75, 95);
  line(40, 510, 860, 510);

  noStroke();
  fill(190, 200, 215);
  textAlign(LEFT, CENTER);
  textSize(12);
  text("SERIAL: " + (port.opened() ? "OPEN" : "CLOSED"), 42, 540);
  text("LAST CALL: " + lastSequence, 260, 540);

  fill(145, 158, 180);
  textSize(11);
  text(lastMessage, 42, 570);
}

function handleMessage(message) {
  let parts = message.split(",");

  if (parts[0] === "CALL" && parts.length >= 3) {
    let sequence = Number(parts[1]);
    let mask = Number(parts[2]);

    if (Number.isNaN(sequence) || Number.isNaN(mask)) return;

    for (let i = 0; i < 4; i++) {
      lamps[i] = (mask & (1 << i)) !== 0;
    }

    // This is the response part of the handshake.
    port.println("ACK," + sequence + "," + mask);

    lastSequence = sequence;
    lastMessage = "CALL received. ACK sent back to Arduino.";
  }
}

function mousePressed() {
  if (insideBox(mouseX, mouseY, connectBox) && !port.opened()) {
    port.open(115200);
  } else if (insideBox(mouseX, mouseY, modeBox)) {
    changeMode();
  }
}

function keyPressed() {
  if (key === " ") {
    changeMode();
  }
}

function changeMode() {
  mode = 1 - mode;
  if (port.opened()) {
    port.println("MODE," + mode);
    lastModeSent = mode;
  }
}

function insideBox(x, y, box) {
  return x >= box.x && x <= box.x + box.w &&
         y >= box.y && y <= box.y + box.h;
}