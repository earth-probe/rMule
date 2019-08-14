let ws = new WebSocket('ws://127.0.0.1:18081');

ws.onopen = (evt) => {
  setTimeout(onWSReady,1);
}

ws.onmessage = (evt) => { 
  let received_msg = evt.data;
  //console.log('onmessage received_msg=<', received_msg,'>');
  try {
    let jsonMsg = JSON.parse(received_msg);
    console.log('onmessage jsonMsg=<', jsonMsg,'>');
    if(jsonMsg) {
      if(jsonMsg.serial) {
        if(jsonMsg.open) {
          readCarInfo();
        } else {
          onSerialPort(jsonMsg.serial);
        }
      }
      if(jsonMsg.info) {
        onCarInfo(jsonMsg.info);
      }
      if(jsonMsg.tof) {
        onTofDistance(jsonMsg.tof);
      }
    }
  } catch (e) {
    console.error('onmessage e=<', e,'>');
    console.error('onmessage received_msg=<', received_msg,'>');
  }
};


onWSReady = () => {
  let infoRead = 'serial:list,r\n';
  console.log('onWSReady infoRead=<', infoRead,'>');
  ws.send(infoRead);
}

readCarInfo = () => {
  let infoRead = 'info:r\n';
  console.log('readCarInfo infoRead=<', infoRead,'>');
  ws.send(infoRead);
}


onCarInfo = (info) => {
  console.log('onCarInfo info=<', info,'>');
  let carInfo = {};
  carInfo.log = info.lv
  carInfo.tofMax = info.tofMax
  carInfo.tofMin = info.tofMin
  //console.log('onCarInfo carInfo=<', carInfo,'>');
  if(typeof onVueUICarInfo === 'function') {
    onVueUICarInfo(carInfo);
  }
}

onSerialPort = (ports) => {
  console.log('onSerialPort ports=<', ports,'>');
  if(typeof onCarInfo === 'function') {
    onVueUISerialPort(ports);
  }
}


onTofDistance = (tof,index) => {
  console.log('onTofDistance tof=<', tof,'>');
  $('#vue-ui-current-position-label').text(tof.distance);
  $('#vue-ui-current-position-range').val(tof.distance);
}



function onUIClickSerialConnect(elem) {
  //console.log('onUIClickSerialConnect elem=<', elem,'>');
  const portName = elem.textContent.replace('Connect To ','').trim();
  console.log('onUIClickSerialConnect portName=<', portName,'>');
  ws.send('serial:open,' + portName);
}


function getInputUITool(elem) {
  let inputElem = elem.parentElement.parentElement.getElementsByTagName('input')[0];
  console.log('getInputUITool inputElem=<', inputElem,'>');
  return parseInt(inputElem.value.trim());
}

function getChannelUITool(elem) {
  let channelElem = elem.parentElement.parentElement.parentElement.parentElement.parentElement.getElementsByTagName('h5')[0];
  console.log('getChannelUITool channelElem=<', channelElem,'>');
  return parseInt(channelElem.textContent.replace('Channel of ','').trim());
}

function onUIChangeLegID(elem) {
  console.log('onUIChangeLegID elem=<', elem,'>');
  let legId = getInputUITool(elem);
  console.log('onUIChangeLegID legId=<', legId,'>');
  let channel = getChannelUITool(elem);
  console.log('onUIChangeLegID channel=<', channel,'>');
  if(!isNaN(channel) && !isNaN(legId)) {
    let legIdMsg = 'setting:id' + channel + ',' + legId + '\n';
    console.log('onUIChangeLegID legIdMsg=<', legIdMsg,'>');
    ws.send(legIdMsg);
  }
}


function onUIChangeLogLevel(elem) {
  console.log('onUIChangeLogLevel elem=<', elem,'>');
  let setVal = getInputUITool(elem);
  console.log('onUIChangeLogLevel setVal=<', setVal,'>');
  if(!isNaN(setVal)) {
    let log = 'setting:log,'+ setVal + '\n';
    console.log('onUIChangeLogLevel log=<', log,'>');
    ws.send(log);
  }
}

function onUIChangeTofMax(elem) {
  console.log('onUIChangeTofMax elem=<', elem,'>');
  let setVal = getInputUITool(elem);
  console.log('onUIChangeTofMax setVal=<', setVal,'>');
  if(!isNaN(setVal)) {
    let tofMax = 'setting:tofMax,'+ setVal + '\n';
    console.log('onUIChangeTofMax tofMax=<', tofMax,'>');
    ws.send(tofMax);
  }
}

function onUIChangeTofMin(elem) {
  console.log('onUIChangeTofMin elem=<', elem,'>');
  let setVal = getInputUITool(elem);
  console.log('onUIChangeTofMin setVal=<', setVal,'>');
  if(!isNaN(setVal)) {
    let tofMin = 'setting:tofMin,'+ setVal + '\n';
    console.log('onUIChangeTofMin tofMin=<', tofMin,'>');
    ws.send(tofMin);
  }
}

function onUIMovePosition(elem) {
  console.log('onUIMovePosition elem=<', elem,'>');
  let setVal = getInputUITool(elem);
  console.log('onUIMovePosition setVal=<', setVal,'>');
  if(!isNaN(setVal)) {
    let tofMove = 'tofMove:digital,'+ setVal + '\n';
    console.log('onUIMovePosition tofMove=<', tofMove,'>');
    ws.send(tofMove);
  }
}


