import './style.css';
import * as faceapi from 'face-api.js';

const rootHTML = document.getElementById("app") as HTMLDivElement;
const btn = document.createElement("button");
btn.setAttribute("class", "btn")
btn.disabled = true;
const labelPrompt = document.createElement("div");
labelPrompt.setAttribute("class", "label");
labelPrompt.innerHTML = `Loading...`
const loadingEle = document.querySelector(".loading");
const boxScannerAnimation = document.createElement("div");
boxScannerAnimation.setAttribute("class", "box");
const video = document.createElement("video");
video.setAttribute("autoplay", "true");
video.setAttribute("class", "video");
video.setAttribute("width", "500");
video.setAttribute("height", "500");
let isSendingImage = false;
let reScan = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function startWebcam(video: HTMLVideoElement) {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

// function loadLabeledImages() {
//   const labels = ['Fajrin', 'Not Fajrin'];
//   return Promise.all(
//     labels.map(async label => {
//       const descriptions = []
//       for (let i = 1; i <= 2; i++) {
//         const img = await faceapi.fetchImage(`/face/${label}/${i}.jpg`)
//         const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
//         descriptions.push(detections!.descriptor);
//       }

//       return new faceapi.LabeledFaceDescriptors(label, descriptions)
//     })
//   )
// }

function useToast(name: string) {
  const toast = document.createElement("div");
  toast.innerHTML = `Hi ${name}`;
  toast.setAttribute("id", "snackbar");
  document.body.appendChild(toast);
  toast.className = "show";
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");

  }, 3000);
}


async function sendImage() {
  if (timer) {
    clearTimeout(timer)
    timer = undefined;
  }
  let imageCanvas: HTMLCanvasElement | null = document.createElement("canvas");
  imageCanvas.width = video.videoWidth;
  imageCanvas.height = video.videoHeight;
  imageCanvas?.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  labelPrompt.innerHTML = "Processing..."
  loadingEle?.classList.add("show")
  isSendingImage = true;
  imageCanvas.toBlob(async (blob) => {
    if (blob) {
      const formData = new FormData();
      let file = new File([blob], "1.jpg", { type: "image/jpg" })
      formData.append("File1", file);
      try {
        const req = await fetch("https://face-recog-api.zodiac.com.sg/check-face", { method: "post", body: formData });
        const result = await req.json();
        console.log(result);
        if (result) {
          let label = result.result[0]._label;
          useToast(label);
          loadingEle?.classList.remove("show");
          reScan = true;
          document.body.insertBefore(btn, rootHTML.nextSibling);
          labelPrompt.innerHTML = "Idle"
          imageCanvas = null;
          isSendingImage = false;
        }
      } catch (error) {
        loadingEle?.classList.remove("show")
        imageCanvas = null;
        isSendingImage = false;
        console.log("eror fetch", error);
      }
    }
  })
}

async function main() {
  if (rootHTML) {
    rootHTML.appendChild(video);
    btn.innerHTML = "Try again";
    rootHTML.insertBefore(boxScannerAnimation, video.nextSibling)
    document.body.insertBefore(labelPrompt, rootHTML.nextSibling);
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    ]).then(() => startWebcam(video)).catch(error => console.log(error));

    video.addEventListener('play', () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      rootHTML.appendChild(canvas);

      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video)
        // .withFaceLandmarks()
        // .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        // canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);

        // const results = resizedDetections.map((d) => {
        //   return faceMatcher.findBestMatch(d.descriptor);
        // });
        // results.forEach((result, i) => {
        // const box = resizedDetections[i].detection.box;
        // const drawBox = new faceapi.draw.DrawBox(box, {
        //   label: result.toString(),
        // });
        // drawBox.draw(canvas);
        // console.log(result);
        // useToast(result.label);
        // });

        if (resizedDetections && !!resizedDetections.length && !isSendingImage) {
          // faceapi.draw.drawDetections(canvas, resizedDetections)
          // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          btn.disabled = false;
          if (!timer && !reScan) {
            labelPrompt.innerHTML = "Steady";
            timer = setTimeout(() => {
              sendImage();
            }, 3000);
          }
        } else {
          btn.disabled = true;
          if (timer) {
            clearTimeout(timer);
            timer = undefined;
          }
          if (!isSendingImage) {
            labelPrompt.innerHTML = "Face to the camera";
          }
        }
      }, 100);
    })

    btn.addEventListener("click", () => {
      loadingEle?.classList.add("show")
      btn.disabled = true;
      sendImage()
    });
  }
}

main();