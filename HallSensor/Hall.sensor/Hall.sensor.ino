#define DUMP_VAR(x)  { \
  Serial.print(__LINE__);\
  Serial.print("@@"#x"=<");\
  Serial.print(x);\
  Serial.print(">&$");\
  Serial.print("\r\n");\
}


const int HallPinD = 6;
const int HallPinA = A0;


void setup() {
  pinMode(HallPinD, INPUT);
  pinMode(HallPinA, INPUT);
  Serial.begin(115200);
  Serial.print("goto start!!!\n");
  DUMP_VAR(HallPinD);
  DUMP_VAR(HallPinA);
}

void loop() {
  int hallD = digitalRead(HallPinD);
  int hallA = analogRead(HallPinA);
  if(hallD < 1) {
    DUMP_VAR(hallD);
  }
  if(hallA < 1000) {
    DUMP_VAR(hallA);
  }
}
