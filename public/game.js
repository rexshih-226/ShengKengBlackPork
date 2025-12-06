// ===============================
// Canvas 初始化
// ===============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// ===============================
// 載入圖片
// ===============================
const mapImg = new Image();
mapImg.src = "map.jpg";

const maskImg = new Image();
maskImg.src = "mask.jpg"; // 黑色 = 可走 (重要)

const characterFrames = [
    "character1.PNG",
    "character2.PNG",
    "character3.PNG",
    "character4.PNG"
];

const characterImgs = [];
characterFrames.forEach(src => {
    let img = new Image();
    img.src = src;
    characterImgs.push(img);
});

// ===============================
// 角色
// ===============================
let player = {
    x: 820,   // ✔ 出生點位於大路左下角（黑線上）
    y: 810,
    speed: 4,
    size: 80,
    frame: 0,
    dir: 1,
    timer: 0
};

// ===============================
// 鏡頭 Camera
// ===============================
let camera = { x: 0, y: 0 };

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    camera.x = Math.max(0, Math.min(camera.x, mapImg.width - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, mapImg.height - canvas.height));
}

// ===============================
// Mask 用來做像素碰撞判定
// ===============================
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

let maskLoaded = false;

maskImg.onload = () => {
    maskCanvas.width = maskImg.width;
    maskCanvas.height = maskImg.height;
    maskCtx.drawImage(maskImg, 0, 0);
    maskLoaded = true;
};

// ===============================
// 黑色像素 = 可以走
// ===============================
function canWalk(x, y) {
    if (!maskLoaded) return false;

    // 防止出界
    if (x < 0 || y < 0 || x >= maskCanvas.width || y >= maskCanvas.height)
        return false;

    const pixel = maskCtx.getImageData(x, y, 1, 1).data;
    let r = pixel[0], g = pixel[1], b = pixel[2];

    // 黑色
    return (r < 30 && g < 30 && b < 30);
}

// ===============================
// 移動
// ===============================
function move(dx, dy) {
    let nx = player.x + dx;
    let ny = player.y + dy;

    if (canWalk(nx, ny)) {
        player.x = nx;
        player.y = ny;
    }
}

// ===============================
// 角色動畫（站著也動）
// ===============================
function updateAnimation() {
    player.timer++;

    if (player.timer > 6) {
        player.frame += player.dir;

        if (player.frame === 3) player.dir = -1;
        if (player.frame === 0) player.dir = 1;

        player.timer = 0;
    }
}

// ===============================
// 鍵盤控制
// ===============================
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ===============================
// 主遊戲迴圈
// ===============================
function gameLoop() {
    if (keys["ArrowUp"]) move(0, -player.speed);
    if (keys["ArrowDown"]) move(0, player.speed);
    if (keys["ArrowLeft"]) move(-player.speed, 0);
    if (keys["ArrowRight"]) move(player.speed, 0);

    updateAnimation();
    updateCamera();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地圖
    ctx.drawImage(mapImg, -camera.x, -camera.y);

    // 角色
    ctx.drawImage(
        characterImgs[player.frame],
        player.x - camera.x - player.size / 2,
        player.y - camera.y - player.size / 2,
        player.size,
        player.size
    );

    requestAnimationFrame(gameLoop);
}

mapImg.onload = () => {
    requestAnimationFrame(gameLoop);
};
