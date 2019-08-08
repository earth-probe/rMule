
#define DUMP_VAR(x)  { \
  Serial.print(__LINE__);\
  Serial.print("@@"#x"=<");\
  Serial.print(x);\
  Serial.print(">&$");\
  Serial.print("\r\n");\
}

#define DUMP_VAR(x) {}

void setup() {
  Serial.begin(115200);
  Serial1.begin(115200);
  Serial2.begin(115200);
  Serial3.begin(115200);
  Serial.print("arduino\r\n");
  Serial.print("serialsync\r\n");
}

static String gResponse_1 = "";
static String gResponse_2 = "";
static String gResponse_3 = "";
//static const String PackageSpace("&$");

bool isReadyToRelay(const String & response) {
  //Serial.print(response);
  int lastIndex = response.length() -1;
  int preLastIndex = response.length() -2;
  if(preLastIndex >= 0) {
    //Serial.write(response.charAt(lastIndex));
    //Serial.print("\r\n");
    if(response.charAt(lastIndex) == '$' && response.charAt(preLastIndex) == '&') {
      //Serial.write(true);
      return true;
    }
    if(response.charAt(lastIndex) == '\n' && response.charAt(preLastIndex) == '\r') {
      //Serial.write(true);
      return true;
    }
  }
  if(lastIndex > 255) {
    //Serial.write(true);
    return true;
  }
  //Serial.write(false);
  return false;
}

void response(const String & response) {
  Serial.print(response);
  /*
  for(byte ch:response){
    Serial.write(ch);
  }
  */
}

void loop() {
  if (Serial.available()) {      // If anything comes in Serial (USB),
    char broadcast = Serial.read();
    Serial1.write(broadcast);   // read it and send it out Serial1 (pins 0 & 1)
    //runSerialCommand();
  }

  /*

  if (Serial1.available()) {     // If anything comes in Serial1 (pins 0 & 1)
    char incomming = Serial1.read();
    Serial.write(incomming);
    gResponse_1 += incomming;
    bool ready = isReadyToRelay(gResponse_1);
    //DUMP_VAR(ready);
    if(ready) {
      response(gResponse_1);
      gResponse_1 = "";
    }
  }
  if (Serial2.available()) {     // If anything comes in Serial1 (pins 0 & 1)
    //Serial.write(Serial2.peek());
    char incomming = Serial2.read();
    gResponse_2 += incomming;
    bool ready = isReadyToRelay(gResponse_2);
    //DUMP_VAR(ready);
    if(ready) {
      response(gResponse_2);
      gResponse_2 = "";
    }
  }
  if (Serial3.available()) {     // If anything comes in Serial1 (pins 0 & 1)
    //Serial.write(Serial3.peek());
    char incomming = Serial3.read();
    gResponse_3 += incomming;
    bool ready = isReadyToRelay(gResponse_3);
    //DUMP_VAR(ready);
    if(ready) {
      response(gResponse_3);
      gResponse_3 = "";
    }
  }
  //Serial.print("\r\n");
  */
}

static String gSerialInputCommand = "";
void runSerialCommand(void) {
  if (Serial.available() > 0) {
    char incomingByte = Serial.read();
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

void run_comand(void) {
  if(gSerialInputCommand.startsWith("legM:") || gSerialInputCommand.startsWith("M:")) {
    parseAdvanceLegCommand();
  }
}


void parseAdvanceLegCommand() {
  String legCombi;
  if(readTagString(":id,",":id,",&legCombi)) {
    DUMP_VAR(legCombi);
    if(legCombi == "aa") {
      String New1(gSerialInputCommand);
      New1.replace("aa","2");
      String New2(gSerialInputCommand);
      New2.replace("aa","4");
      String New3(gSerialInputCommand);
      New3.replace("aa","6");
      DUMP_VAR(New3);
      DUMP_VAR(New2);
      DUMP_VAR(New1);
    }
    if(legCombi == "bb") {
      String New1(gSerialInputCommand);
      New1.replace("bb","3");
      String New2(gSerialInputCommand);
      New2.replace("bb","5");
      String New3(gSerialInputCommand);
      New3.replace("bb","7");
      DUMP_VAR(New3);
      DUMP_VAR(New2);
      DUMP_VAR(New1);
    }
    if(legCombi == "ab") {
      String New1(gSerialInputCommand);
      New1.replace("ab","2");
      String New2(gSerialInputCommand);
      New2.replace("ab","4");
      String New3(gSerialInputCommand);
      New3.replace("ab","6");
      String New4(gSerialInputCommand);
      New4.replace("ab","3");
      String New5(gSerialInputCommand);
      New5.replace("ab","5");
      String New6(gSerialInputCommand);
      New6.replace("ab","7");
      DUMP_VAR(New6);
      DUMP_VAR(New5);
      DUMP_VAR(New4);
      DUMP_VAR(New3);
      DUMP_VAR(New2);
      DUMP_VAR(New1);
    }
  }
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
