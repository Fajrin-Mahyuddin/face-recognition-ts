import './style.css';
import * as faceapi from 'face-api.js';

const rootHTML = document.getElementById("app") as HTMLDivElement;

const videoFiles: File[] = [];
let isPreview = false;
let isSendingImage = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const btn = document.createElement("button");
btn.setAttribute("class", "btn");
btn.disabled = true;
const labelPrompt = document.createElement("div");
labelPrompt.setAttribute("class", "label");
labelPrompt.innerHTML = `Loading...`
const btnWrapper = document.createElement("div");
btnWrapper.style.display = "flex";
btnWrapper.style.gap = "10px"
const tryBtn = document.createElement("button");
tryBtn.innerHTML = "Retake"
const nextBtn = document.createElement("button");
nextBtn.innerHTML = "Next"
nextBtn.setAttribute("class", "btn");
tryBtn.setAttribute("class", "btn");

btnWrapper.appendChild(tryBtn)
btnWrapper.appendChild(nextBtn)

const loadingEle = document.querySelector(".loading");
document.body.insertBefore(labelPrompt, rootHTML.nextSibling);
const inputElement = document.getElementById("name") as HTMLInputElement;
let imageCanvas: HTMLCanvasElement | null = document.createElement("canvas");
let img: HTMLImageElement | null = document.createElement("img");
const video = document.createElement("video");
video.setAttribute("autoplay", "true");
video.setAttribute("class", "video");
video.setAttribute("width", "500");
video.setAttribute("height", "500");
rootHTML.appendChild(video);
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

const toast = document.createElement("div");
toast.setAttribute("id", "snackbar");
document.body.appendChild(toast);
function useToast(text: string) {
  toast.innerHTML = `${text}`;
  toast.className = "show";
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

function setFilesToArray(filename: string) {
  imageCanvas?.toBlob(async (blob) => {
    if (blob) {
      let file = new File([blob], `${filename}.jpg`, { type: "image/jpg" })
      videoFiles.push(file);
      if (videoFiles.length >= 3) {
        sendImage()
      } else {
        resetElement()
      }
    }
  })
}


async function sendImage() {
  // let backgroudBlur = document.createElement("div") as HTMLElement;
  // backgroudBlur.classList.add("background-blur");

  if (videoFiles.length >= 3 && inputElement.value !== "" && inputElement.value) {
    loadingEle?.classList.add("show");
    labelPrompt.innerHTML = "Submitting...";
    nextBtn.disabled = true;
    tryBtn.disabled = true;
    const formData = new FormData();
    formData.append("File1", videoFiles[0]);
    formData.append("File2", videoFiles[1]);
    formData.append("File3", videoFiles[2]);
    formData.append("label", inputElement.value);
    isSendingImage = true;
    try {
      const req = await fetch("https://face-recog-api.zodiac.com.sg/post-face", { method: "post", body: formData });
      const result = await req.json();
      console.log(result);
      if (result) {
        useToast("Face stored successfully !");
        loadingEle?.classList.remove("show")
        isSendingImage = false;
        resetElement();
        inputElement.value = "";
        videoFiles.length = 0
        nextBtn.disabled = false;
        tryBtn.disabled = false;
      }
    } catch (error) {
      loadingEle?.classList.remove("show")
      isSendingImage = false;
      console.log("eror fetch", error);
      labelPrompt.innerHTML = "Preview";
      nextBtn.disabled = false;
      tryBtn.disabled = false;
    }
  } else {
    useToast("Complete all three step !");
    isSendingImage = false;

  }
}

img = document.createElement("img");
img.classList.add("img-preview");

async function previewImage() {
  imageCanvas = document.createElement("canvas");
  if (imageCanvas && img) {
    imageCanvas.style.objectFit = "cover";
    imageCanvas.width = video.videoWidth;
    imageCanvas.height = video.videoHeight;
    imageCanvas.getContext('2d')?.drawImage(video, 0, 0, imageCanvas.width, imageCanvas.height);
    img.width = video.width;
    img.height = video.height;
    img.style.opacity = "1";
    img.src = imageCanvas.toDataURL();
    labelPrompt.innerHTML = `Preview`;
    if (videoFiles.length >= 2) {
      inputElement.focus();
      nextBtn.innerHTML = "Submit"
    }
    document.body.appendChild(btnWrapper);
    rootHTML.insertBefore(img, video.nextSibling);
    video.srcObject = null;
  }
}

function resetElement() {
  imageCanvas = null;
  isPreview = false;
  timer = undefined;
  loadingEle?.classList.remove("show");
  document.body.removeChild(btnWrapper);
  if (img) {
    img.style.opacity = "0";
    img.src = "";
  }
  startWebcam(video);
}

// async function main() {
//   if (rootHTML) {

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  rootHTML.appendChild(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    if (!isPreview) {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ maxResults: 1, minConfidence: isPreview ? 0.999 : 0.9 }))


      // canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      // const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // const results = resizedDetections.map((d) => {
      //   return faceMatcher.findBestMatch(d.descriptor);
      // });

      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      console.log(detections);
      if (detections && !isSendingImage) {
        // faceapi.draw.drawDetections(canvas, resizedDetections);
        // resizedDetections.forEach(() => {
        console.log(timer, isPreview);
        if (!isPreview && !timer) {
          if (videoFiles.length > 0) {
            labelPrompt.innerHTML = "Try another pose !"
            timer = setTimeout(() => {
              labelPrompt.innerHTML = "Steady";
              timer = setTimeout(() => {
                console.log("takee it....");
                isPreview = true;
                previewImage();
              }, 3000)
            }, 2000)
          } else {
            labelPrompt.innerHTML = "Steady";
            timer = setTimeout(() => {
              console.log("takee it....");
              isPreview = true;
              previewImage();
            }, 3000)
          }
        }
        // });
        btn.disabled = false;
      } else {
        btn.disabled = true;
        clearTimeout(timer);
        timer = undefined;
        console.log("clearrrr", timer);
        if (!isPreview) {
          labelPrompt.innerHTML = "Face to the camera"
        }
      }

    }
  }, 500);
})
//   }
// }
// btn.addEventListener("click", () => {
//   loadingEle?.classList.add("show")
//   btn.disabled = true;
//   sendImage()
// });

tryBtn.addEventListener("click", () => {
  resetElement()
});

nextBtn.addEventListener("click", () => {
  setFilesToArray(`${videoFiles.length + 1}`);
})

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    // faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]).then(() => startWebcam(video)).catch(error => console.log(error));
})