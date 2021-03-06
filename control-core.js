
//avoid hardware PWM GPIO 12/13/18/19(pins 32/33/12/35) 
var Gpio = require('pigpio').Gpio,
    motorL1 = new Gpio(4, { mode: Gpio.OUTPUT }),
    motorL2 = new Gpio(17, { mode: Gpio.OUTPUT }),
    motorR1 = new Gpio(27, { mode: Gpio.OUTPUT }),
    motorR2 = new Gpio(22, { mode: Gpio.OUTPUT }),
    dutyCycle = 0;

const MAX_DUTYCYCLE = 255;

function lowestOutputCheck(value){
    return (value > 90 ? value : 90);
}

module.exports = function(){

    this.streaming_on = function() {
        exec = require('child_process').exec;
        web_vs = exec('python3 ./PiCam-Streamer.py', shell = false);
        pcs_pid = web_vs.pid + 1;
        console.log('pid=' + pcs_pid);
    
        // save pid of Web Video Streaming
        fs = require('fs');
        fs.writeFileSync('./PiCam-Streamer-pid', pcs_pid);
    
        // save Web Video Streaming status as on
        fs = require('fs');
        fs.writeFileSync('./PiCam-Streamer-status', 'on');
        console.log('The pid and status of web video streaming is saved!');
    }

    this.streaming_off = function() {
        // read pid of Web Video Streaming
        fs = require('fs');
        pcs_pid = fs.readFileSync('./PiCam-Streamer-pid', 'utf8');

        // kill Web Video Streaming with pid
        exec = require('child_process').exec;
        exec('sudo kill ' + pcs_pid);
        console.log('The ' + pcs_pid + ' process is killed!');

        // save Web Video Streaming status as off
        fs = require('fs');
        fs.writeFileSync('./PiCam-Streamer-status', 'off');
    }

    var targetPower;
    const DIR_RANGE = 60;

    this.move_on = function(directionAngle, powerDomain) {
        directionAngle = Math.round(directionAngle);
        powerDomain = (powerDomain > 1 ? 1 : powerDomain);
        targetPower = lowestOutputCheck( Math.round(MAX_DUTYCYCLE * powerDomain));

        if(powerDomain == 0){
            this.resetPWM();
            console.log('stop');

        } else if (directionAngle >= 345 || directionAngle <= 15) { //E
            motorL1.pwmWrite(targetPower);
            motorL2.pwmWrite(0);
            motorR1.pwmWrite(0);
            motorR2.pwmWrite(targetPower);
            console.log('E LeftOutput=' + targetPower + ' RightOutput=' + targetPower);

        } else if (directionAngle > 15 && directionAngle < 75) { //between E~N
            directionAngle -= 15;
            motorL1.pwmWrite(targetPower);
            motorL2.pwmWrite(0);

            var rightOutput = lowestOutputCheck(Math.round(targetPower * (directionAngle / DIR_RANGE)));
            motorR1.pwmWrite(rightOutput);
            motorR2.pwmWrite(0);
            console.log('between E~N LeftOutput=' + targetPower + ' RightOutput=' + rightOutput);

        } else if (directionAngle >= 75 && directionAngle <= 105) { //N
            motorL1.pwmWrite(targetPower);
            motorL2.pwmWrite(0);
            motorR1.pwmWrite(targetPower);
            motorR2.pwmWrite(0);
            console.log('N LeftOutput=' + targetPower + ' RightOutput=' + targetPower);

        } else if (directionAngle > 105 && directionAngle < 165) { //between N~W
            directionAngle = Math.abs(directionAngle - 165);
            var leftOutput = lowestOutputCheck(Math.round(targetPower * (directionAngle / DIR_RANGE)));
            motorL1.pwmWrite(leftOutput);
            motorL2.pwmWrite(0);
            motorR1.pwmWrite(targetPower);
            motorR2.pwmWrite(0);
            console.log('between N~W LeftOutput=' + leftOutput + ' RightOutput=' + targetPower);

        } else if (directionAngle >= 165 && directionAngle <= 195) { //W
            motorL1.pwmWrite(0);
            motorL2.pwmWrite(targetPower);
            motorR1.pwmWrite(targetPower);
            motorR2.pwmWrite(0);
            console.log('W LeftOutput=' + targetPower + ' RightOutput=' + targetPower);

        } else if (directionAngle > 195 && directionAngle < 255) { //between W~S
            directionAngle = Math.abs(directionAngle - 255);
            var leftOutput = lowestOutputCheck(Math.round(targetPower * (directionAngle / DIR_RANGE)));

            motorL1.pwmWrite(0);
            motorL2.pwmWrite(leftOutput);
            motorR1.pwmWrite(0);
            motorR2.pwmWrite(targetPower);
            console.log('between W~S LeftOutput=' + leftOutput + ' RightOutput=' + targetPower);

        } else if (directionAngle >= 255 && directionAngle <= 285) { //S
            motorL1.pwmWrite(0);
            motorL2.pwmWrite(targetPower);
            motorR1.pwmWrite(0);
            motorR2.pwmWrite(targetPower);
            console.log('S LeftOutput=' + targetPower + ' RightOutput=' + targetPower);
            
        } else if (directionAngle > 285 && directionAngle < 345) { //between S~E
            directionAngle = Math.abs(directionAngle - 345);
            motorL1.pwmWrite(0);
            motorL2.pwmWrite(targetPower);

            var rightOutput = lowestOutputCheck(Math.round(targetPower * (directionAngle / DIR_RANGE)));
            motorR1.pwmWrite(0);
            motorR2.pwmWrite(rightOutput);
            console.log('between S~E LeftOutput=' + targetPower + ' RightOutput=' + rightOutput);

        }
    }

    this.resetPWM = function(){
        motorL1.pwmWrite(0);
        motorL2.pwmWrite(0);
        motorR1.pwmWrite(0);
        motorR2.pwmWrite(0);
    }

    this.forceGC = function () {
        if (global.gc)
            global.gc();
        else
            console.warn('[Garbage Collection] NOT AVAILABLE ! Restart Vahana-KAI core as `node --expose-gc startup`.');
    }
}
