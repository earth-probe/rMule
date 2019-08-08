const SerialPort = require('serialport');


let gPortArduino = false;
let gPortStm = false;

SerialPort.list((err, ports) => {
  console.log('ports=<',ports ,'>');
  for(let port of ports) {
    if(port.comName) {
      if(port.vendorId === '0483') {
        openSerial(port.comName,true);
      }
      if(port.vendorId === '1A86' || port.vendorId === '1a86') {
        openSerial(port.comName,false);
      }
    }
  }
});



const serialOption =
{
  baudRate: 115200,
  autoOpen: false
};

const whoTimer = {};

const openSerial = (portName,stm) => {
  let port = new SerialPort(portName, serialOption);
  //console.log('port=<',port ,'>');
  port.open(function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message);
    }
    /*
    setTimeout(()=> {
    trans2serial(port,'who:r\n');
    trans2serial(port,'who:');
    trans2serial(port,'who');
    },5000);
    */


    if(stm) {
      gPortStm = port;
    } else {
      gPortArduino = port;
    }
  });

  let dataBuffer = ''
  port.on('data', function (response) {
    //console.log('response=<',response ,'>');
    let resStr = response.toString('utf-8');
    //console.log('resStr=<',resStr ,'>');
    dataBuffer += resStr;
/*
    let stm = dataBuffer.search('stm');
    if(stm > -1) {
      gPortStm = port;
      console.log('gPortStm=<',gPortStm.path ,'>');
      if(gPortArduino) {
        setTimeout(onStartMotion,1000);
      }
    }
    let arduino = dataBuffer.search('arduino');
    if(arduino > -1) {
      gPortArduino = port;
      console.log('gPortArduino=<',gPortArduino.path ,'>');
      if(gPortStm) {
        setTimeout(onStartMotion,1000);
      }
    }
*/
    let nl = dataBuffer.search('\r\n');
    if(nl > -1) {
      console.log('[R]::dataBuffer=<',dataBuffer ,'>');
      dataBuffer = '';
    }
  });
}

const trans2serial = (port,msg) => {
  if(!port) {
    console.log('!!! not good port trans2serial msg=<', msg,'>');
    return
  }
  port.write(msg, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('[S]trans2serial msg=<', msg,'>');
    console.log('trans2serial port.path=<', port.path,'>');
  });
}

const PORT = 8666;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const onListen =() => {
  const address = server.address();
  console.log('onListen address=<', address,'>');
}

const onMsg = (message, remote) => {
  //console.log('onMsg remote=<', remote,'>');
  //console.log('onMsg message=<', message.toString('utf8'),'>');
  const jsonMsg = JSON.parse(message.toString('utf8'));
  console.log('onMsg jsonMsg=<', jsonMsg,'>');
  if(jsonMsg) {
    if(jsonMsg.port === 'stm' && jsonMsg.msg) {
      trans2serial(gPortStm,jsonMsg.msg);
    }
    if(jsonMsg.port === 'arduino' && jsonMsg.msg) {
      trans2serial(gPortArduino,jsonMsg.msg);
    }
  }
}

server.on('message', onMsg);
server.on('listening', onListen);
server.bind(PORT, HOST);
