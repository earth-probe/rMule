#include <EEPROM.h>
#include <VL53L0X.h>
#include <Wire.h>
VL53L0X sensor;
uint8_t iEROMLogLevel = 0; 

#define DUMP_VAR(x)  { \
  if(iEROMLogLevel > 0 ) { \
    Serial.print(__LINE__);\
    Serial.print("@@"#x"=<");\
    Serial.print(x);\
    Serial.print(">&$");\
    Serial.print("\r\n");\
  }\
}



#define LOG_VAR(x)  { \
  Serial.print(__LINE__);\
  Serial.print("@@"#x"=<");\
  Serial.print(x);\
  Serial.print(">&$");\
  Serial.print("\r\n");\
}


#define GRAPH_VAR(x,y)  { \
  Serial.print(__LINE__);\
  Serial.print("@@"#x"=<");\
  Serial.print(x);\
  Serial.print(">");\
  Serial.print("@@"#y"=<");\
  Serial.print(y);\
  Serial.print(">&$");\
  Serial.print("\r\n");\
}


#define MAX_MOTOR_CH (2)

// Interrupt
const static char MOTER_FGS_WHEEL[MAX_MOTOR_CH] = {2,3};
const static char MOTER_PWM_WHEEL[MAX_MOTOR_CH] = {9,10};
const static char MOTER_CCW_WHEEL[MAX_MOTOR_CH] = {4,8};


void A_Motor_FGS_By_Interrupt(void);
void B_Motor_FGS_By_Interrupt(void);
void loadEROM(void);

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);
  // set pwm 9,10
  TCCR1B &= B11111000;
  TCCR1B |= B00000001;
  //TCCR1B |= B00000011;

  pin_motor_setup(0);
  attachInterrupt(digitalPinToInterrupt(MOTER_FGS_WHEEL[0]),A_Motor_FGS_By_Interrupt , FALLING);

  pin_motor_setup(1);
  attachInterrupt(digitalPinToInterrupt(MOTER_FGS_WHEEL[1]),B_Motor_FGS_By_Interrupt , FALLING);

  Serial.begin(115200);
  loadEROM();
  setupTof();
}

void pin_motor_setup(int index) {
  pinMode(MOTER_CCW_WHEEL[index], OUTPUT);
  pinMode(MOTER_FGS_WHEEL[index], INPUT_PULLUP);
  pinMode(MOTER_PWM_WHEEL[index], OUTPUT);
  analogWrite(MOTER_PWM_WHEEL[index], 0xff);
}


#define TOF_HIGH_SPEED
//#define TOF_HIGH_ACCURACY

const int TOF_TIME_OUT = 1;

void setupTof() {
  Wire.begin();
  sensor.init();
  sensor.setTimeout(TOF_TIME_OUT);
  sensor.setSignalRateLimit(0.5);
  int limit_Mcps = sensor.getSignalRateLimit();
  DUMP_VAR(limit_Mcps);

#if defined LONG_RANGE
  // lower the return signal rate limit (default is 0.25 MCPS)
  sensor.setSignalRateLimit(0.1);
  // increase laser pulse periods (defaults are 14 and 10 PCLKs)
  sensor.setVcselPulsePeriod(VL53L0X::VcselPeriodPreRange, 18);
  sensor.setVcselPulsePeriod(VL53L0X::VcselPeriodFinalRange, 14);
#endif


#if defined TOF_HIGH_SPEED
  // reduce timing budget to 1 ms (default is about 33 ms)
  sensor.setMeasurementTimingBudget(20L*1000L);
#elif defined TOF_HIGH_ACCURACY
  // increase timing budget to 200 ms
  sensor.setMeasurementTimingBudget(200L*1000L);
#endif
}





void checkOverRunMax(void);
void runSerialCommand(void);
void runByTofRange(void);
void loop() {
  readTof();
  runSerialCommand();
  checkOverRunMax();
  runByTofRange();
}




const int  iEROMLegIdAddress[MAX_MOTOR_CH] = {0,2};
const int  iEROMGroupAddress[MAX_MOTOR_CH] = {iEROMLegIdAddress[1] + 38,iEROMLegIdAddress[1] + 40};
const int  iEROMLogLevelAddress = iEROMLegIdAddress[1] + 256;
const int  iEROMTofRangeMaxAddress = iEROMLegIdAddress[1] + 258;
const int  iEROMTofRangeMinAddress = iEROMLegIdAddress[1] + 260;

uint16_t  iEROMLegId[MAX_MOTOR_CH] = {0,0};
uint16_t  iEROMTofRangeMax = 0;
uint16_t  iEROMTofRangeMin = 0;



void loadEROM1Byte(int address,uint8_t *dst) {
  uint8_t value1 = EEPROM.read(address);
  *dst = value1;
}

void loadEROM2ByteSingle(int address,uint16_t *dst) {
  uint16_t value1 = EEPROM.read(address);
  uint16_t value2 = EEPROM.read(address + 1);
  *dst = value1 | value2 << 8;;
}

void loadEROM2Byte(int index,int address[],uint16_t dst[]) {
  uint16_t value1 = EEPROM.read(address[index]);
  uint16_t value2 = EEPROM.read(address[index]+1);
  dst[index] = value1 | value2 << 8;;
}

void loadEROM2ByteSign(int index,int address[],int16_t dst[]) {
  int16_t value1 = EEPROM.read(address[index]);
  int16_t value2 = EEPROM.read(address[index]+1);
  dst[index] = value1 | value2 << 8;;
}

void loadEROMFloat(int index,int address[],float dst[]) {
  uint32_t value1 = EEPROM.read(address[index]);
  uint32_t value2 = EEPROM.read(address[index]+1);
  uint32_t value3 = EEPROM.read(address[index]+2);
  uint32_t value4 = EEPROM.read(address[index]+3);
  uint32_t saveValue = value1 | value2 << 8 | value2 << 16 | value2 << 24;
  float value = saveValue;
  dst[index] = value;
}


void loadEROM(void) {
  loadEROM1Byte(iEROMLogLevelAddress,&iEROMLogLevel);
  loadEROM2Byte(0,iEROMLegIdAddress,iEROMLegId);
  loadEROM2Byte(1,iEROMLegIdAddress,iEROMLegId);
  loadEROM2ByteSingle(iEROMTofRangeMaxAddress,&iEROMTofRangeMax);
  loadEROM2ByteSingle(iEROMTofRangeMinAddress,&iEROMTofRangeMin);
}


void saveEROM(int address,uint16_t value) {
  byte value1 =  value & 0xff;
  EEPROM.write(address,value1);
  byte value2 = (value >> 8) & 0xff;
  EEPROM.write(address+1,value2);
}

void saveEROM1Byte(int address,uint8_t *valueRam,String tag) {
  int valueTag = 0;
  if(readTagValue(tag,"",&valueTag)) {
    saveEROM(address,valueTag);
    *valueRam =  valueTag;
  }
}

void saveEROM2Byte(int index,int address[],uint16_t valueRam[],String tag) {
  int valueTag = 0;
  if(readTagValue(tag,"",&valueTag)) {
    saveEROM(address[index],valueTag);
    valueRam[index] =  valueTag;
  }
}

void saveEROM2ByteSingle(int address,uint16_t *valueRam,String tag) {
  int valueTag = 0;
  if(readTagValue(tag,"",&valueTag)) {
    saveEROM(address,valueTag);
    *valueRam =  valueTag;
  }
}


void saveEROM2ByteSign(int index,int address[],int16_t valueRam[],String tag) {
  int16_t valueTag = 0;
  if(readTagValue(tag,"",&valueTag)) {
    uint16_t save = valueTag;
    saveEROM(address[index],save);
    valueRam[index] =  valueTag;
  }
}

void runSetting(void) {
  saveEROM1Byte(iEROMLogLevelAddress,&iEROMLogLevel,":debug,");
  saveEROM1Byte(iEROMLogLevelAddress,&iEROMLogLevel,":log,");

  saveEROM2Byte(0,iEROMLegIdAddress,iEROMLegId,":id0,");
  saveEROM2Byte(1,iEROMLegIdAddress,iEROMLegId,":id1,");

  saveEROM2ByteSingle(iEROMTofRangeMaxAddress,&iEROMTofRangeMax,":tofMax,");
  saveEROM2ByteSingle(iEROMTofRangeMinAddress,&iEROMTofRangeMin,":tofMin,");
}


int iMotorTurnCounter[MAX_MOTOR_CH] = {0,0};
void A_Motor_FGS_By_Interrupt(void) {
  iMotorTurnCounter[0]++;
}
void B_Motor_FGS_By_Interrupt(void) {
  iMotorTurnCounter[1]++;
}


unsigned char speed_wheel[MAX_MOTOR_CH] = {0,0};
static long wheelRunCounter[MAX_MOTOR_CH] = {-1,-1};
static long const iRunTimeoutCounter = 100L;

#define FRONT_WHEEL(index) { \
  analogWrite(MOTER_PWM_WHEEL[index], 0x0);\
  wheelRunCounter[index] = iRunTimeoutCounter; \
  if(index == 0) {\
    digitalWrite(MOTER_CCW_WHEEL[index], LOW);\
  } else {\
    digitalWrite(MOTER_CCW_WHEEL[index], HIGH);\
  }\
}
#define BACK_WHEEL(index) { \
  analogWrite(MOTER_PWM_WHEEL[index], 0x0);\
  wheelRunCounter[index] = iRunTimeoutCounter; \
  if(index == 0) {\
    digitalWrite(MOTER_CCW_WHEEL[index], HIGH);\
  } else {\
    digitalWrite(MOTER_CCW_WHEEL[index], LOW);\
  }\
}
#define STOP_WHEEL(index) {\
  analogWrite(MOTER_PWM_WHEEL[index], 0xff);\
}



int iVolumeDistanceWheel[2] = {};



int runMotorFGSignlCouter = 0;
int runMotorFGSignlCouter_NOT = 0;

void runWheel(int spd,bool front,int index) {
  speed_wheel[index] = spd;
  if(front) {
    digitalWrite(MOTER_CCW_WHEEL[index] , HIGH);
    //DUMP_VAR(front);
  } else {
    digitalWrite(MOTER_CCW_WHEEL[index], LOW);
    //DUMP_VAR(front);
  }
  analogWrite(MOTER_PWM_WHEEL[index], spd);
}


static String gSerialInputCommand = "";
void runSerialCommand(void) {
  if (Serial.available() > 0) {
    char incomingByte = Serial.read();
    //Serial.print(incomingByte);
    if(incomingByte =='\n' || incomingByte =='\r') {
      run_comand();
      gSerialInputCommand = "";
    } else {
      gSerialInputCommand += incomingByte;
    }
    if(gSerialInputCommand.length() > 128) {
      gSerialInputCommand = "";
    }
  }
}


void responseTextTag(String &res) {
  res = "&$" + res;
  res += "&$\r\n";
  Serial.print(res);
}

void responseTextStart(String &res) {
  res = "&$" + res;
  Serial.print(res);
}
void responseTextContinue(String &res) {
  res = res;
  Serial.print(res);
}

void responseTextFinnish(String &res) {
  res = res;
  res += "&$\r\n";
  Serial.print(res);
}


void run_simple_command(void) {
  if(gSerialInputCommand=="uu") {
    speed_wheel[0] -= 5;
    analogWrite(MOTER_CCW_WHEEL[0], speed_wheel[0]);  
  }
  if(gSerialInputCommand=="dd") {
    speed_wheel[0] += 5;
    analogWrite(MOTER_CCW_WHEEL[0], speed_wheel[0]);  
  }
  if(gSerialInputCommand=="ff") {
    FRONT_WHEEL(0);
    wheelRunCounter[0] = iRunTimeoutCounter;
  }
  if(gSerialInputCommand=="bb") {
    BACK_WHEEL(0);
    wheelRunCounter[0] = iRunTimeoutCounter;
  }
  if(gSerialInputCommand=="ss") {
    speed_wheel[0] =0xff;
    analogWrite(MOTER_CCW_WHEEL[0], speed_wheel[0]);  
  }
  if(gSerialInputCommand=="gg") {
    speed_wheel[0] =0;
    analogWrite(MOTER_CCW_WHEEL[0], speed_wheel[0]);  
  }
}


void run_comand(void) {
  //DUMP_VAR(InputCommand);
  //DUMP_VAR(speed_wheel[0]);
  run_simple_command();
  
  if(gSerialInputCommand.startsWith("info:") || gSerialInputCommand.startsWith("I:")) {
    runInfo();
  }
  if(gSerialInputCommand.startsWith("setting:") || gSerialInputCommand.startsWith("S:")) {
    runSetting();
  }

  if(gSerialInputCommand.startsWith("gpio:") || gSerialInputCommand.startsWith("G:")) {
    runGPIO();
  }
  if(gSerialInputCommand.startsWith("who:") || gSerialInputCommand.startsWith("H:")) {
    whois();
  }
  if(gSerialInputCommand.startsWith("tofMove:") || gSerialInputCommand.startsWith("TM:")) {
    runWheelByTof();
  }
}

int iDistanceTof = 0;

void runInfo(void) {
  String resTex;
  responseTextStart(resTex);
  resTex += "info";
  resTex += ":ch,";
  resTex += String(MAX_MOTOR_CH);      
  resTex += ":id0,";
  resTex += String(iEROMLegId[0]);      
  resTex += ":id1,";
  resTex += String(iEROMLegId[1]);      
  resTex += ":lv,";
  resTex += String(iEROMLogLevel);
  resTex += ":tof,";
  resTex += String(iDistanceTof);
  resTex += ":tofMax,";
  resTex += String(iEROMTofRangeMax);
  resTex += ":tofMin,";
  resTex += String(iEROMTofRangeMin);
  responseTextFinnish(resTex);
}

void whois(void) {
  String resTex;
  resTex += "arduino";
  responseTextTag(resTex);
}

int iOutPutPWM[MAX_MOTOR_CH] = {0,0};




void runWheelByTof(void) {
  int digital = 0;
  if(readTagValue(":v0,",":digital,",&digital)) {
    DUMP_VAR(digital);
    String resTex;
    resTex += "dummy:digital,";
    resTex += String(digital);
    responseTextTag(resTex);
    if(digital == 0) {
      STOP_WHEEL(0);
      STOP_WHEEL(1);
    }
    if(digital == 1) {
      FRONT_WHEEL(0);
      FRONT_WHEEL(1);
    }
    if(digital == -1) {
      BACK_WHEEL(0);
      BACK_WHEEL(1);
    }
  }
}



bool bIsRunWheelByVolume[MAX_MOTOR_CH] = {false,false};

/*
void checkOverRunMaxWheel(int index) {
  if(iVolumeDistanceWheel[index] > iEROMWheelMaxBack[index]) {
    bIsRunWheelByVolume[index] = false;
    STOP_WHEEL(index);
  }
  if(iVolumeDistanceWheel[index] < iEROMWheelMaxFront[index]) {
    bIsRunWheelByVolume[index] = false;
    STOP_WHEEL(index);
  }  
}
*/


void checkOverRunMax(void) {
  // stop
  if(wheelRunCounter[0]-- <= 0 ) {
/*
    String resTex;
    resTex += "dummy:wheelRunCounter[0],";
    resTex += String(wheelRunCounter[0]);
    responseTextTag(resTex);
*/
    STOP_WHEEL(0);
    digitalWrite(LED_BUILTIN, LOW);
  } else {
/*    
    String resTex;
    resTex += "dummy:wheelRunCounter[0],";
    resTex += String(wheelRunCounter[0]);
    responseTextTag(resTex);
*/
  } 
  if(wheelRunCounter[1]-- <= 0 ) {
/*
    String resTex;
    resTex += "dummy:wheelRunCounter[1],";
    resTex += String(wheelRunCounter[1]);
    responseTextTag(resTex);
*/
    STOP_WHEEL(1);
    digitalWrite(LED_BUILTIN, LOW);
  } else {
/*    
    String resTex;
    resTex += "dummy:wheelRunCounter[1],";
    resTex += String(wheelRunCounter[1]);
    responseTextTag(resTex);
*/
  }
}







int iDistanceTofReportCounter = 1;
const int iDistanceTofReportSkip = 50;

void readTof() {
  int distance = sensor.readRangeSingleMillimeters();
  DUMP_VAR(distance);
  if(distance <= 0 || distance >= 8191) {
    return ;
  }
  bool isReport = (iDistanceTofReportCounter++%iDistanceTofReportSkip) == 0;
  DUMP_VAR(isReport);
  if(isReport) {
    String resTex;
    resTex += "tof:distance,";
    resTex += String(distance);
    responseTextTag(resTex);
  }
  iDistanceTof = distance;
}

void runByTofRange(void) {
  if(iDistanceTof > iEROMTofRangeMax) {
    return ;
  }
  if(iDistanceTof < iEROMTofRangeMin) {
    return ;
  }
  FRONT_WHEEL(0);
  FRONT_WHEEL(1);
  static int blinkCounter = 0;
  if(blinkCounter++%2) {
    digitalWrite(LED_BUILTIN, HIGH);
  } else {
    digitalWrite(LED_BUILTIN, LOW);
  }
}




bool readTagValue(String tag,String shortTag , int16_t *val) {
  int firstTag = gSerialInputCommand.indexOf(tag);
  if(firstTag > 0) {
    String tagStr = gSerialInputCommand.substring(firstTag+tag.length());
    DUMP_VAR(tagStr);
    int16_t tagNum = tagStr.toInt();
    DUMP_VAR(tagNum);
    *val =tagNum;
    return true;
  }
  int firstShortTag = gSerialInputCommand.indexOf(shortTag);
  if(firstShortTag > 0) {
    String tagStr = gSerialInputCommand.substring(firstShortTag+shortTag.length());
    DUMP_VAR(tagStr);
    int16_t tagNum = tagStr.toInt();
    DUMP_VAR(tagNum);
    *val =tagNum;
    return true;
  }
  return false;
}

bool readTagString(String tag,String shortTag , String *val) {
  int firstTag = gSerialInputCommand.indexOf(tag);
  if(firstTag > 0) {
    String tagStr = gSerialInputCommand.substring(firstTag+tag.length());
    int nextTag = tagStr.indexOf(":");
    if(nextTag > 0) {
      //DUMP_VAR(tagStr);
      String value = tagStr.substring(0,nextTag);
      *val =value;
      return true;
    }
  }
  int firstShortTag = gSerialInputCommand.indexOf(shortTag);
  if(firstShortTag > 0) {
    String tagStr = gSerialInputCommand.substring(firstShortTag+shortTag.length());
    DUMP_VAR(tagStr);
    int nextTag = tagStr.indexOf(":");
    if(nextTag > 0) {
      //DUMP_VAR(tagStr);
      String value = tagStr.substring(0,nextTag);
      *val =value;
      return true;
    }
  }
  return false;
}


void runGPIO(void) {
  //DUMP_VAR(gSerialInputCommand);
  int first = gSerialInputCommand.indexOf(":");
  int last = gSerialInputCommand.indexOf(",");
  if(first < 0 && last > gSerialInputCommand.length() -1) {
    return;
  }
  
  String portStr = gSerialInputCommand.substring(first+1,last);
  //DUMP_VAR(portStr);
  int port  = portStr.toInt();
  //DUMP_VAR(port);
  String valStr = gSerialInputCommand.substring(last);
  int val  = valStr.toInt();
  //DUMP_VAR(val);
  if(port > 2 && port < 14) {
    if(val == 0) {
      digitalWrite(port,LOW);
    } else {
      digitalWrite(port,HIGH);        
    }
  }
  if(port > 0xA0 && port < 0xA7) {
    if(val == 0) {
      int valRes = analogRead(port);
      //DUMP_VAR(valRes);
      String resTex;
      resTex += "gpio:";
      resTex += String(port,HEX);      
      resTex += ",";
      resTex += String(valRes);      
      responseTextTag(resTex);
    } else {
      analogWrite(port,val);
    }
  }
}
