const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline();

const port = new SerialPort('COM4', {
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


const linear = {
  L:{
    g:1,
    d:10
  }
};

/*
const linear = {
  L:{
    g:0,
    d:10
  }
};
*/

let counter = 0;
onWriteTimer = () => {
  port.write(JSON.stringify(linear), function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    //console.log('write linear=<', linear,'>');
  });  
};
