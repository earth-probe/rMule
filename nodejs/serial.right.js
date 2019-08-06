const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline();

const port = new SerialPort('COM3', {
  baudRate: 115200,
  autoOpen: false
});



port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message);
  }
  port.pipe(parser);
  setTimeout(onWriteTimer,1000);
});


port.on('data', function (response) {
  console.log('response=<', response.toString('utf-8'),'>');
});


const wheel = {
  wheel:{
    f:0,
    s:140
  },
  L:{
    g:1,
    d:0
  }
};

const wheelStop = {
  wheel:{
    f:1,
    s:0
  },
  L:{
    g:1,
    d:0
  }
};


onWriteTimer = () => {
  port.write(JSON.stringify(wheel), function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    //console.log('write wheel=<', wheel,'>');
    setTimeout(onWriteTimerStop,300);
  });  
};

onWriteTimerStop = () => {
  port.write(JSON.stringify(wheelStop), function(err) {
    if (err) {
      console.log('Error on write: ', err.message);
    }
    console.log('write wheelStop=<', wheelStop,'>');
  });
}

