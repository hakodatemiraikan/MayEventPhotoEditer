const SUPABASE_URL = "https://zzyaahceaktnrlirqfwe.supabase.co";
const SUPABASE_KEY = "sb_publishable_gaVl-RciMV33k2_venKg8w_oIl8xWWZ";

const BUCKET_NAME = "MayEventPhoto";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const cameraArea = document.getElementById("cameraArea");
const captureBtn = document.getElementById("captureBtn");
const resultArea = document.getElementById("resultArea");
const resultImage = document.getElementById("resultImage");
const resetBtn = document.getElementById("resetBtn");
const qrcodeArea = document.getElementById("qrcode");

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });

    video.srcObject = stream;
  } catch (error) {
    alert("カメラを起動できませんでした。ブラウザのカメラ許可を確認してください。");
    console.error(error);
  }
}

captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;
  captureBtn.textContent = "保存中...";

  canvas.width = 1080;
  canvas.height = 1920;

  ctx.drawImage(video, 0, 0, 1080, 1920);

  const frame = new Image();
  frame.src = "frame.png";

  frame.onload = async () => {
    ctx.drawImage(frame, 0, 0, 1080, 1920);

    const now = new Date();

    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.fillText(now.toLocaleString("ja-JP"), 50, 1850);

    const dataUrl = canvas.toDataURL("image/png");
    resultImage.src = dataUrl;

    const blob = await (await fetch(dataUrl)).blob();

    const fileName = `photo-${Date.now()}.png`;

    const { error } = await client
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: "image/png"
      });

    if (error) {
      alert("アップロード失敗：\n" + JSON.stringify(error, null, 2));
      console.error(error);

      captureBtn.disabled = false;
      captureBtn.textContent = "撮影する";
      return;
    }

    const { data: publicUrlData } = client
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    qrcodeArea.innerHTML = "";

    new QRCode(qrcodeArea, {
      text: imageUrl,
      width: 200,
      height: 200
    });

    cameraArea.style.display = "none";
    captureBtn.style.display = "none";
    resultArea.style.display = "block";
  };

  frame.onerror = () => {
    alert("frame.png が読み込めませんでした。ファイル名と場所を確認してください。");

    captureBtn.disabled = false;
    captureBtn.textContent = "撮影する";
  };
});

resetBtn.addEventListener("click", () => {
  resultArea.style.display = "none";
  cameraArea.style.display = "block";
  captureBtn.style.display = "inline-block";
  captureBtn.disabled = false;
  captureBtn.textContent = "撮影する";

  resultImage.src = "";
  qrcodeArea.innerHTML = "";
});

startCamera();