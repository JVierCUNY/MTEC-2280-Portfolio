//NOTICE! This project was done using a DevKit that's too big for the breadboard ordered. Jumper cables are especially advised for those with such kinds of DevKits.

// LED numbers
int led1 = 4;
int led2 = 5;
int led3 = 6;
int led4 = 7;

// Vars for the pattern system
int pattern = 0;
int waitTime = 500;

void setup() {
  // All four of these are MEANT to be Outputs.
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);

  // all LEDs OFF
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);
  digitalWrite(led4, LOW);
}

void loop() {

  // Pattern 1: 1 0 0 0
  if (pattern == 0) {
    digitalWrite(led1, HIGH);
    digitalWrite(led2, LOW);
    digitalWrite(led3, LOW);
    digitalWrite(led4, LOW);
  }

  // Pattern 2: 0 1 0 1
  else if (pattern == 1) {
    digitalWrite(led1, LOW);
    digitalWrite(led2, HIGH);
    digitalWrite(led3, LOW);
    digitalWrite(led4, HIGH);
  }

  // Pattern 3: 1 1 1 1
  else if (pattern == 2) {
    digitalWrite(led1, HIGH);
    digitalWrite(led2, HIGH);
    digitalWrite(led3, HIGH);
    digitalWrite(led4, HIGH);
  }

  // Pattern 4: 0 1 1 0
  else if (pattern == 3) {
    digitalWrite(led1, LOW);
    digitalWrite(led2, HIGH);
    digitalWrite(led3, HIGH);
    digitalWrite(led4, LOW);
  }

  // Pattern 5: 1 0 1 0
  else if (pattern == 4) {
    digitalWrite(led1, HIGH);
    digitalWrite(led2, LOW);
    digitalWrite(led3, HIGH);
    digitalWrite(led4, LOW);
  }

  // where our Delay comes in
  delay(waitTime);

  // pattern-cycling
  pattern++;

  // return to 0 once 5 is reached
  if (pattern >= 5) {
    pattern = 0;
  }
}