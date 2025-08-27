// let start = performance.now();


// let elapsed = performance.now() - start; // in ms, with fractions
// console.log(`Elapsed: ${elapsed.toFixed(3)} ms`);

const startButton = document.getElementById("popOutBtn");
const stopButton = document.getElementById("stopButton");
const resetButton = document.getElementById("resetButton");
const timerText = document.getElementById("timerText");
const canvas = document.getElementById("timerCanvas");
const pipVideo = document.createElement("video");
const targetFps = 30;
const frameInterval = 1000 / targetFps;
let lastFrameTime = performance.now();
const ctx = canvas.getContext("2d");
const w = 3840;
const h = 2160;

let startTime;

let canvasTrack;

let elapsedWhenStopped = 0;
let animationFrameId; // seconds
let running = false;

let tabVisible = true;

// Can't get this working in the background without PiP window open
// document.addEventListener("visibilitychange", (event) => {
//   if (document.visibilityState == "visible") {
//     console.log("tab is active");
//     tabVisible = true;

//   } else {
//     console.log("tab is inactive");
//     tabVisible = false;
//     pipVideo.play();
//   }
// });

stopButton.onclick = async () => {
  if (running) {
    running = false;
    cancelAnimationFrame(animationFrameId);
    elapsedWhenStopped = (performance.now() - startTime) / 1000;
  }
}

startButton.onclick = async () => {

  if (!running) {
    running = true;
    startTime = performance.now() - elapsedWhenStopped * 1000;
    animate();
    await popOut();
  }


}

function animate(now = performance.now()) {
    if (!running) return; 

    let elapsed = (performance.now() - startTime) / 1000; // sec = ms / 1000
    timerText.textContent = formatTime(elapsed)
    if (tabVisible) {
        document.title = "PiP Timer"
    } else {
        document.title = formatTime(elapsed);
    }
    drawFrame(formatTime(elapsed));
    if (canvasTrack?.requestFrame) { try { canvasTrack.requestFrame(); } catch {} }
    // if (running) {
        animationFrameId = requestAnimationFrame(animate);
    }



resetButton.onclick = async () => {

    if (!running) {
    await pipVideo.play();
    }

    running = false;
    cancelAnimationFrame(animationFrameId); // stop loop if running
    elapsedWhenStopped = 0; // clear saved time
    timerText.textContent = formatTime(0); // reset display
   
        requestAnimationFrame(() => {
            drawFrame(formatTime(0));
            canvasTrack.requestFrame();
            requestAnimationFrame(() => {
                    pipVideo.pause();
            })
    });
};

function formatTime(elapsed_seconds) {
  const hours = Math.floor(elapsed_seconds / 60 / 60).toLocaleString(undefined, { minimumIntegerDigits: 2, useGrouping: false });
  const minutes = Math.floor((elapsed_seconds / 60) % 60).toLocaleString(undefined, { minimumIntegerDigits: 2, useGrouping: false });
  const seconds = Math.floor(elapsed_seconds % 60).toLocaleString(undefined, { minimumIntegerDigits: 2, useGrouping: false });

  // console.log(hours + ":" + minutes + ":" + seconds);
  return hours + ":" + minutes + ":" + seconds
}

function drawFrame(seconds) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#222";
  ctx.font = '220px "Inter", sans-serif';
  ctx.textAlign = "left";
  ctx.letterSpacing = "-0.04em";
  ctx.textBaseline = "middle";

  const s = String(seconds)
  // const textWidth = (ctx.measureText(s).width).toFixed(0); // 760
  const textWidth = 720;
  ctx.fillText(seconds, (canvas.width / 2) - textWidth / 2, canvas.height / 2);
}

async function popOut() {

  if (!('pictureInPictureEnabled' in document)) {
    console.log('The Picture-in-Picture Web API is not available.');
  } else if (!document.pictureInPictureEnabled) {
    console.log('The Picture-in-Picture Web API is disabled.');
  } else {
    console.log('tf is available.');
  }

  const stream = canvas.captureStream(5);
  canvasTrack = stream.getVideoTracks()[0];

  // document.body.appendChild(pipVideo);
  pipVideo.srcObject = stream;
  await pipVideo.play();

  await pipVideo.requestPictureInPicture();

  // show a play/pause button in pip
  navigator.mediaSession.setActionHandler('play', function () {
    // console.log('play');
    startButton.click();
    navigator.mediaSession.playbackState = 'playing';
  });
  navigator.mediaSession.setActionHandler('pause', function () {
    // User clicked "Pause" button.
    // console.log('pause');
    // pipVideo.pause();
    stopButton.click();
    navigator.mediaSession.playbackState = 'paused';
    pipVideo.pause();
  });

  navigator.mediaSession.setActionHandler('previoustrack', async function () {
    resetButton.click();
  });
  // pipVideo.webkitSetPresentationMode('picture-in-picture');
}
