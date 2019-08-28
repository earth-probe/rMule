const fs=require("fs");
const fft = require('fft-js').fft;
const fftUtil = require('fft-js').util;
const ifft = require('fft-js').ifft;


const fConstMinValueDiff = 0.0000001;
// 2+1+2 顶点+两边各2各点 5点中心
//const fConstActiveThreshold = 1.0/2.0;
// 1+1+1 顶点+两边各1各点 3点中心
const fConstActiveThreshold = 1.0/1.0;

const fConstMinCenterHeight = 0.1;

module.exports = class ThresholdPreTrain {
  constructor(net) {
    //this.net_ = net;
    //this.inputLayer_ = this.net_.netJson_.layers.input;
    this.inputRange_ = 255;
    this.outNode_ = 4;
    this.centers_ = [];
    this.bigPeaks_ = [];
    this.hexPeaks_ = [];
    /*
    this.centers_ = [];
    this.initWidth_ = this.inputRange_/ (this.outNode_ + 1);
    //console.log('ThresholdPreTrain::constructor this.initWidth_=<',this.initWidth_,'>');
    for(let i = 0;i < this.outNode_ ;i++) {
      this.centers_[i] = Math.floor(this.initWidth_ *(i+1));
    }
    console.log('ThresholdPreTrain::constructor this.centers_=<',this.centers_,'>');
    */
  }
  
  
  step(inputVectors) {
    //console.log('ThresholdPreTrain::step inputVectors.pix.length=<',inputVectors.pix.length,'>');
    const inputStats = new Array(255);
    inputStats.fill(0);
    for(let imgInput of inputVectors.pix) {
      //console.log('ThresholdPreTrain::step imgInput=<',imgInput,'>');
      if(inputStats[imgInput]) {
        inputStats[imgInput]++;
      } else {
        inputStats[imgInput] = 1;;
      }
    }
    //console.log('ThresholdPreTrain::step inputStats=<',inputStats,'>');
    //this.fft_(inputStats);
    this.topPeaks_ =  this.peak_(inputStats);
    //console.log('ThresholdPreTrain::step this.topPeaks_=<',this.topPeaks_,'>');
    const hexOut = this.learHex16_(inputVectors.pix);
    //console.log('ThresholdPreTrain::step hexOut=<',hexOut,'>');
    //console.log('ThresholdPreTrain::step inputVectors=<',inputVectors,'>');
    this.dumpBinary2Png_(inputVectors,hexOut)
  }
  
  
  lear_(inputVectors) {
    let hintAtCenter = this.caclPeakCenterHint_(inputVectors,this.topPeaks_);
    console.log('ThresholdPreTrain::lear_ hintAtCenter=<',hintAtCenter,'>');
    const maxHint = Math.max(...hintAtCenter);
    //console.log('ThresholdPreTrain::lear_ maxHint=<',maxHint,'>');
    for(let index = 0;index < hintAtCenter.length;index++) {
      const heightHint = hintAtCenter[index]/maxHint;
      //console.log('ThresholdPreTrain::lear_ heightHint=<',heightHint,'>');
      if(heightHint > fConstMinCenterHeight) {
        this.bigPeaks_.push(this.topPeaks_[index]);
      }
    }
    console.log('ThresholdPreTrain::lear_ this.bigPeaks_=<',this.bigPeaks_,'>');
    
    let hintBigPeak = this.caclPeakCenterHint_(inputVectors,this.bigPeaks_);
    console.log('ThresholdPreTrain::lear_ hintBigPeak=<',hintBigPeak,'>');
    const maxHint2 = Math.max(...hintBigPeak);
    console.log('ThresholdPreTrain::lear_ maxHint2=<',maxHint2,'>');
    console.log('ThresholdPreTrain::lear_ inputVectors.length=<',inputVectors.length,'>');
    for(let index = 0;index < hintBigPeak.length;index++) {
      const heightHint2 = hintBigPeak[index]/maxHint2;
      console.log('ThresholdPreTrain::lear_ heightHint2=<',heightHint2,'>');
    }
  }


  learHex16_(inputVectors) {
    let hintAtCenter = this.caclPeakCenterHint_(inputVectors,this.topPeaks_);
    console.log('ThresholdPreTrain::learHex16_ hintAtCenter=<',hintAtCenter,'>');
    console.log('ThresholdPreTrain::learHex16_ this.topPeaks_=<',this.topPeaks_,'>');
    const maxHint = Math.max(...hintAtCenter);
    //console.log('ThresholdPreTrain::learHex16_ maxHint=<',maxHint,'>');
    const topPeakHint = [];
    for(let index = 0;index < hintAtCenter.length;index++) {
      /*
      const heightHint = hintAtCenter[index]/maxHint;
      //console.log('ThresholdPreTrain::learHex16_ heightHint=<',heightHint,'>');
      if(heightHint > fConstMinCenterHeight) {
        this.hexPeaks_.push(this.topPeaks_[index]);
      }
      */
      const peak = this.topPeaks_[index];
      const hint = hintAtCenter[index];
      topPeakHint.push({peak:peak,hint:hint});
    }
    //console.log('ThresholdPreTrain::learHex16_ topPeakHint=<',topPeakHint,'>');
    topPeakHint.sort((a,b)=>{
      if( a.hint < b.hint ) return 1;
      if( a.hint > b.hint ) return -1;
      return 0;      
    })
    //console.log('ThresholdPreTrain::learHex16_ topPeakHint=<',topPeakHint,'>');
    let sliceEnd = 16;
    if(topPeakHint.length < 16) {
      sliceEnd = topPeakHint.length
    }
    this.hexPeaks_ = topPeakHint.slice(0,sliceEnd);
    console.log('ThresholdPreTrain::learHex16_ this.hexPeaks_=<',this.hexPeaks_,'>');
    
    let hexPeakOut = this.caclHexOutput_(inputVectors,this.hexPeaks_);
    //console.log('ThresholdPreTrain::learHex16_ hexPeakOut=<',hexPeakOut,'>');
    return hexPeakOut;
  }
  
  
  showHintPeaks_() {
    
  }


  caclPeakCenterHint_(inputVectors,peaks) {
    //console.log('ThresholdPreTrain::caclPeakCenterHint_ peaks=<',peaks,'>');
    let hintCounter = 0;
    let hintAtCenter = new Array(peaks.length);
    hintAtCenter.fill(0);
    for(let imgInput of inputVectors) {
      let outVectory = [];
      let hint = 0;
      for(let index = 0;index < peaks.length;index++) {
        const center = peaks[index];
        let diff =  Math.abs(center-imgInput);
        if(diff < fConstMinValueDiff) {
          diff = fConstMinValueDiff;
        }
        let out = 1.0/diff;
        if(out >= fConstActiveThreshold) {
          outVectory = true;
          hint++;
          hintAtCenter[index]++;
        } else {
          outVectory = false;
        }
      }
      //console.log('ThresholdPreTrain::caclPeakCenterHint_ outVectory=<',outVectory,'>');
      if(hint > 0) {
        //console.log('ThresholdPreTrain::caclPeakCenterHint_ outVectory=<',outVectory,'>');
        hintCounter++
      } else {
        
      }
    }    
    //console.log('ThresholdPreTrain::caclPeakCenterHint_ inputVectors.length=<',inputVectors.length,'>');
    //console.log('ThresholdPreTrain::caclPeakCenterHint_ hintCounter=<',hintCounter,'>');
    const hintRate = hintCounter/inputVectors.length;
    console.log('ThresholdPreTrain::caclPeakCenterHint_ hintRate=<',hintRate,'>');
    //console.log('ThresholdPreTrain::caclPeakCenterHint_ hintAtCenter=<',hintAtCenter,'>');
    return hintAtCenter;
  }


  caclHexOutput_(inputVectors,peaks) {
    console.log('ThresholdPreTrain::caclHexOutput_ peaks=<',peaks,'>');
    let output = {};
    for(let peak of peaks) {
      console.log('ThresholdPreTrain::caclHexOutput_ peak=<',peak,'>');
      output[peak.peak] = new Array(inputVectors.length);
      output[peak.peak].fill(0);
    }
    let hintCounter = 0;
    
    for(let indexInput = 0;indexInput < inputVectors.length;indexInput++ ) {
      let imgInput = inputVectors[indexInput];
      let hint = false;
      for(let index = 0;index < peaks.length;index++) {
        const center = peaks[index].peak;
        let diff =  Math.abs(center-imgInput);
        if(diff < fConstMinValueDiff) {
          diff = fConstMinValueDiff;
        }
        let out = 1.0/diff;
        if(out >= fConstActiveThreshold) {
          output[peaks[index].peak][indexInput] = 1;
          hint = true;
        } else {
          output[peaks[index].peak][indexInput] = 0;
        }
      }
      if(hint) {
        hintCounter++;
      }
    }    
    const hintRate = hintCounter/inputVectors.length;
    //console.log('ThresholdPreTrain::caclHexOutput_ hintRate=<',hintRate,'>');
    //console.log('ThresholdPreTrain::caclHexOutput_ output=<',output,'>');
    output.hintRate = hintRate;
    return output;
  }


  
  peak_(inputStats) {
    let topPeaks = [];
    let bottomPeaks = [];
    for(let i = 1;i < inputStats.length -1 ;i++) {
      let center = inputStats[i];
      let left = inputStats[i-1];
      let right = inputStats[i+1];
      if(center >= left && center >= right) {
        topPeaks.push(i);
      }
      if(center <= left && center <= right) {
        bottomPeaks.push(i);
      }
    }
    //console.log('ThresholdPreTrain::step bottomPeaks=<',bottomPeaks,'>');
    //console.log('ThresholdPreTrain::step topPeaks=<',topPeaks,'>');
    for( let bPeak of bottomPeaks) {
      //console.log('ThresholdPreTrain::step bPeak=<',bPeak,'>');
      let index = topPeaks.indexOf(bPeak);
      //console.log('ThresholdPreTrain::step index=<',index,'>');
      if(index !== -1 ) {
        topPeaks.splice(index,1);
      }
    }
    //console.log('ThresholdPreTrain::step topPeaks=<',topPeaks,'>');
    return topPeaks;
  }
  
  fft_(statsFFT) {
    //console.log('PreTrain::step statsFFT=<',statsFFT,'>');
    const phasors = fft(statsFFT);
    //console.log('PreTrain::step phasors=<',phasors,'>');
    const magnitudes = fftUtil.fftMag(phasors);
    //console.log('PreTrain::step magnitudes=<',JSON.stringify(magnitudes,undefined,'  '),'>');
    magnitudes.sort((a,b)=>{
      if( a < b ) return 1;
      if( a > b ) return -1;
      return 0;
    });
    console.log('PreTrain::step magnitudes=<',JSON.stringify(magnitudes,undefined,'  '),'>');
    console.log('PreTrain::step statsFFT=<',JSON.stringify(statsFFT,undefined,'  '),'>');
    const statsFFT_inverse =ifft(phasors);
    console.log('PreTrain::step statsFFT_inverse=<',JSON.stringify(statsFFT_inverse,undefined,'  '),'>');
    /*
    const frequencies = fftUtil.fftFreq(phasors, 8000);
    console.log('PreTrain::step frequencies=<',frequencies,'>');
    */
  }
  dumpBinary2Png_(pixs,binaris) {
    console.log('ThresholdPreTrain::dumpBinary2Png_ pixs=<',pixs,'>');
    console.log('ThresholdPreTrain::dumpBinary2Png_ binaris=<',binaris,'>');
  }
};
