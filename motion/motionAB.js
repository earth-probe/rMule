
const highStrokeAir = 100;
const lowStrokeAir = 0

const highStrokeEarth = 100;
const lowStrokeEarth = 0

const gMotionLoopMax = 4;

left_front_earth = [
  ["move",'bb',highStrokeEarth,1],
]

left_back_earth = [
  ["move",'bb',lowStrokeEarth,1],
]

left_front_air = [
  ["move",'bb',highStrokeAir,0],
]

left_back_air = [
  ["move",'bb',lowStrokeAir,0],
]


right_front_earth = [
  ["move",'aa',highStrokeEarth,1],
]

right_back_earth = [
  ["move",'aa',lowStrokeEarth,1],
]

right_front_air = [
  ["move",'aa',highStrokeAir,0],
]

right_back_air = [
  ["move",'aa',lowStrokeAir,0],
]



all_front_earth = [
  ["move",'ab',highStrokeEarth,1],
]

all_back_earth = [
  ["move",'ab',lowStrokeEarth,1],
]

all_front_air = [
  ["move",'ab',highStrokeAir,0],
]

all_back_air = [
  ["move",'ab',lowStrokeAir,0],
]



wait_space = 2.5
wait_space_air = 1.8

// walk in 3 step.
scenario_walk = [
//   move all leg to front by air.
    [["right"]],
    [["wait",wait_space]],
    right_front_air,
    [["wait",wait_space_air]],
    [["left"]],
    [["wait",wait_space]],
    left_front_air,
    [["wait",wait_space_air]],
//   move short down all legs.
    [["home"]],
    [["wait",wait_space]],
//   move short down all legs.
    all_back_earth,
    [["home"]],    
    [["wait",1.0]],
    [["finnish"]],
    
]


scenario_back = [
//   move all leg to front by air.
    [["right"]],
    [["wait",1.0]],
    left_back_air,
    [["wait",1.0]],
    [["left"]],
    [["wait",1.0]],
    right_back_air,
    [["wait",1.0]],
//   move short down all legs.
    [["alldown"]],
    [["wait",1.0]],
//   move short down all legs.
    all_front_earth,
    [["wait",1.0]],
    [["finnish"]],    
]

let gMotionLoop = 1;
const onPlayMotion =(motion) => {
  if(gMotionLoop++ > gMotionLoopMax) {
    return;
  }
  console.log('onPlayMotion motion=<',motion ,'>');
  onNextAction(motion,0);
}
const gPortStm = 'stm'
const gPortArduino = 'arduino'
const onNextAction = (motion,index) => {
  if(index >= motion.length) {
    return;
  }
  let action = motion[index];
  const indexNext = index +1;
  console.log('onNextAction action=<',action ,'>');
  if(action[0][0] === 'left') {
    trans2serial(gPortStm,'aa\r\n');
    onNextAction(motion,indexNext);
  }
  if(action[0][0] === 'right') {
    trans2serial(gPortStm,'bb\r\n');
    onNextAction(motion,indexNext);    
  }
  if(action[0][0] === 'home') {
    trans2serial(gPortStm,'cc\r\n');      
    onNextAction(motion,indexNext);    
  }
  if(action[0][0] === 'wait') {
    setTimeout(()=>{
      onNextAction(motion,indexNext);
    },action[0][1] * 1000)
  }
  if(action[0][0] === 'move') {
    for(let move of action) {
      trans2serial(gPortArduino,'groupM:id,' + move[1] + ':xmm,' + move[2] + ':payload,' + move[3] + '\r\n');
      console.log('onNextAction move=<',move ,'>');      
    }
    onNextAction(motion,indexNext);
  }
  if(action[0][0] === 'finnish') {
    setTimeout(()=>{
      onStartMotion(scenario_walk);
    },1000)
  }

}


const onStartMotion = () => {
  onPlayMotion(scenario_walk);
  /*
  setTimeout(()=> {
    console.log('onStartMotion finnish!!!!>');  
  },1000*10)
  */
}


const PORT = 8666;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const trans2serial = (port,msg) => {
  const msgJson = {port:port,msg:msg}
  const message = new Buffer.from(JSON.stringify(msgJson));
  client.send(message, 0, message.length, PORT, HOST,onSent);
}
const onSent = (err, bytes) =>{
  if (err) throw err;
  console.log('onSent bytes=<',bytes ,'>');
}

onStartMotion();


