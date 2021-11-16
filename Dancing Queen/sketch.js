let fft = null;
let peakDetect = null;
let canPlay = false;

const canvasWidth = 480;//640
const canvasHeight = 360;//480

let video;
let poseNet;
let poses = [];
let isPlaying = false;
let song;
const squareSize = 160;
let gridIndicesToXY = {};

const confidenceThreshold = 0.2;
let eyeDist = 0;
const armWidth = 15;
const handSize = 60;

//Boxes
const boxFrequency = 750;
const boxLifeSpan = 50;
let allBoxes = [];
let boxSize = 50;

let score = 0;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
  

function preload() {
  song = loadSound('tracks/ABBA-2.mp3');
}

function setup() {

  createCanvas(canvasWidth, canvasHeight);  
  //Split screen into grid
  
  // p5.PeakDetect requires a p5.FFT
  fft = new p5.FFT();
  let framesPerPeak = 60 / (100 / 60 );
  peakDetect = new p5.PeakDetect(20, 20000,0.1, framesPerPeak);

  let eachW = canvasWidth / 3;
  let eachH = canvasHeight / 3;
  let mainInd = -1;
  
  for(let i = 0; i < 3; i++){
    for(let j = 0; j < 3; j++){
      mainInd++;
      let leftX = j * eachW;
      let rightX = (j+1) * eachW;
      let topY = i * eachH;
      let bottomY = (i+1) * eachH;
      gridIndicesToXY[mainInd] = {
        leftX, rightX, topY, bottomY
      };
    }
  }
  
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, 'single', modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    if(results.length > 0 ){
      poses = results;
      }
  });
  // Hide the video element, and just show the canvas
  video.hide();
  //generateNewBox();
}

function modelReady() {
  select('#status').html('Model Loaded');
  canPlay = true;
  
  timer = setInterval(()=>{
    generateNewBox();
  }, boxFrequency);
}

function calculateEyeDist(currPose){
  let eyeR = currPose.rightEye;
  let eyeL = currPose.leftEye;
  eyeDist = dist(eyeR.x, eyeR.y, eyeL.x, eyeL.y);
}

function drawHead(currPose){
   //Draw Head = Nose (but blown up)
    fill('black')
    let faceWidth = currPose.leftEar.y;
    let faceHeight = currPose.leftEye.y+30;
    ellipse(currPose.nose.x, currPose.nose.y,faceWidth, faceHeight );
  
  
}

function drawTorso(currPose){
  
  const hasJoints = (
    currPose.leftShoulder.confidence > confidenceThreshold &&
    currPose.rightShoulder.confidence >  confidenceThreshold &&
    currPose.leftHip.confidence >  confidenceThreshold &&
    currPose.rightHip.confidence > confidenceThreshold
  );
  
  if(!hasJoints){
     return;
  }
  
  let hipWidth = currPose.rightShoulder.x- currPose.leftShoulder.x;
  let hipHeight = currPose.leftHip.y- currPose.leftShoulder.y;
  fill('black');
  rect(currPose.leftShoulder.x, currPose.leftShoulder.y, hipWidth, hipHeight );
}

function drawLeftArm(currPose){
  
  const hasJoints = (
    currPose.leftShoulder.confidence > confidenceThreshold &&
    currPose.leftElbow.confidence >  confidenceThreshold &&
    currPose.leftWrist.confidence >  confidenceThreshold
  );
  if(!hasJoints){
    return;
  }
  const { leftShoulder, leftElbow, leftWrist } = currPose 
  stroke('black');
  strokeWeight(armWidth);
  line(leftShoulder.x, leftShoulder.y, leftElbow.x, leftElbow.y)
  line(leftElbow.x, leftElbow.y, leftWrist.x, leftWrist.y);
  let handY = leftElbow.y < leftWrist.y ? 
      leftWrist.y + (eyeDist*1.25)
      : leftWrist.y - (eyeDist*1.25);
  fill('red')
  strokeWeight(0);
  ellipse(leftWrist.x, handY, handSize,handSize);
}

function drawRightArm(currPose){
  const hasJoints = (
    currPose.rightShoulder.confidence > confidenceThreshold &&
    currPose.rightElbow.confidence >  confidenceThreshold &&
    currPose.rightWrist.confidence >  confidenceThreshold
  );
  if(!hasJoints){
    return;
  }
  const { rightShoulder, rightElbow, rightWrist } = currPose 
  stroke('black');
  strokeWeight(armWidth);
  line(rightShoulder.x, rightShoulder.y, rightElbow.x, rightElbow.y)
  line(rightElbow.x, rightElbow.y, rightWrist.x, rightWrist.y);

  let handY = rightElbow.y < rightWrist.y ? 
      rightWrist.y + (eyeDist*1.25)
      : rightWrist.y - (eyeDist*1.25);
  fill('blue')
  strokeWeight(0);
  ellipse(rightWrist.x, handY, handSize,handSize);
}

function drawBodyPoints(){

  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    // console.log(pose);
    calculateEyeDist(pose);
    drawHead(pose);
    drawTorso(pose);
    drawLeftArm(pose)
    drawRightArm(pose);
  }
}

function generateNewBox(){
  //console.log('in generate');
  const quad = getRandomInt(0, 9);
  const currQuad = gridIndicesToXY[quad];
  const canBeLeft = getRandomInt(0,2);
  
  let startingX = -1;
  let startingY = -1;
  let forLeft = null;
  
  let leftX = null;
  let rightX = null;
  let topY = null;
  let bottomY = null;
  //middle quadrant exclude
  switch(quad){
    case 0:
      leftX = currQuad.leftX;
      rightX = currQuad.rightX;
      topY = currQuad.topY-boxSize;
      bottomY = currQuad.bottomY;
      
      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);
      forLeft = true;
      break;
    case 1: 
      leftX = currQuad.leftX;
      rightX = currQuad.rightX;
      topY = currQuad.topY-boxSize;
      bottomY = currQuad.bottomY;
      
      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);
      
      forLeft = canBeLeft === 0 ? true : false;
      break;
    case 2:
      break;
    case 3:
      leftX = currQuad.leftX;
      rightX = currQuad.rightX-boxSize;
      topY = currQuad.topY;
      bottomY = currQuad.bottomY;
      
      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);
      forLeft = true;
    
      break;
    case 4:
      console.log('create a new box in quad 5');
    case 5:
      leftX = currQuad.leftX+boxSize;
      rightX = currQuad.rightX;
      topY = currQuad.topY;
      bottomY = currQuad.bottomY;
      
      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);
      forLeft = false;
      break;
      
    case 6:
      leftX = currQuad.leftX;
      rightX = currQuad.rightX;
      topY = currQuad.topY;
      bottomY = currQuad.bottomY-boxSize;
      
      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);
      forLeft = true;
    
      break;
    case 7:
      leftX = currQuad.leftX;
      rightX = currQuad.rightX;
      topY = currQuad.topY;
      bottomY = currQuad.bottomY-boxSize;

      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);

      forLeft = canBeLeft === 0 ? true : false;
      break;
    case 8:
      leftX = currQuad.leftX;
      rightX = currQuad.rightX;
      topY = currQuad.topY;
      bottomY = currQuad.bottomY-boxSize;

      startingX = getRandomInt(leftX,rightX);
      startingY = getRandomInt(topY, bottomY);

      forLeft = false;
      break;
  }
  
  let newBox = new Box(quad, startingX, startingY, boxSize, boxLifeSpan, forLeft);
  allBoxes.push(newBox);
  
}

function changeScore(){
  select('#score').html(score);
}
function checkCollision(box){
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
        
    if(box.isForLeftHand && pose.leftWrist && !box.isDead){      
      if(
        box.x > pose.leftWrist.x + handSize ||
        box.x + box.size > pose.leftWrist.x ||
        box.y > pose.leftWrist.y + handSize ||
        box.y + box.size > pose.leftWrist.y
      ){
        //console.log("left hand collided")
        box.isDead = true;
        score++;
        changeScore();
      }
       
    }//end of left hand
    
    else if(!box.isForLeftHand && pose.rightWrist && !box.isDead){
      // console.log(pose.rightWrist.x);
      // console.log(pose.rightWrist.y);
       
      if(
        box.x > pose.rightWrist.x + handSize ||
        box.x + box.size > pose.rightWrist.x ||
        box.y > pose.rightWrist.y + handSize ||
        box.y + box.size > pose.rightWrist.y
      ){
        //console.log("right hand collided")
        box.isDead = true;
        score++;
        changeScore();
      }
    
  

    }//end of else if
    
      
  }
  
}




// MAIN DRAW FUNCTION
function draw() {
  if (canPlay && !song.isPlaying()) {
    song.play();
  }
  
  push()
  translate(width, 0)
  scale(-1, 1);
  image(video, 0, 0, width, height);
  filter(GRAY)
  
  drawBodyPoints();
  pop();
  
  
  /* The Peak Detection was really wonky, just using timer instead
  // peakDetect accepts an fft post-analysis
  if(canPlay){
    fft.analyze();
    peakDetect.update(fft);
    //console.log(peakDetect.currentValue);
  }
  if (peakDetect.isDetected ) {
   generateNewBox();
  }
  */
  
  //Generate new boxes is done in timer
  for(let i = allBoxes.length-1; i >= 0; i--){
    allBoxes[i].decay();
    allBoxes[i].drawBox();
    
    //check collision:
    checkCollision(allBoxes[i]);
    
    if (allBoxes[i].isDead) {
      allBoxes.splice(i, 1);
    }
    
  }

  
}