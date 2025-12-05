// ===============================
// DeepSK RPG – 顯示角色 + 移動 + 持續動畫
// ===============================

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ------------------------------
// 地圖載入
// ------------------------------
const mapImg = new Image();
mapImg.src = "map.png";

// ------------------------------
// 角色動畫載入
// ------------------------------
const frameFiles = [
    "character1.PNG",
    "character2.PNG",
    "character3.PNG",
    "character4.PNG"
];

const playerFrames = frameFiles.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// ------------------------------
// 玩家資料
// ------------------------------
let player = {
    x: 300,
    y: 380,
    size: 80,
    speed: 4,

    frameIndex: 0,
    frameTimer: 0,
    frameSpeed: 6
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
// 鍵盤移動
// ===============================
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function movePlayer() {
    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;
}

// ===============================
// 持續動畫（不管有無移動）
// ===============================
let animationOrder = [0, 1, 2, 3, 2, 1];

function updateAnimation() {
    player.frameTimer++;

    if (player.frameTimer >= player.frameSpeed) {
        player.frameTimer = 0;

        player.frameIndex++;
        if (player.frameIndex >= animationOrder.length) {
            player.frameIndex = 0;
        }
    }
}

// ===============================
// 主遊戲迴圈
// ===============================
function gameLoop() {

    movePlayer();     // 移動角色
    updateCamera();   // 更新鏡頭
    updateAnimation(); // ⭐ 始終更新動畫（不管移動與否）

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 畫地圖
    ctx.drawImage(mapImg, -camera.x, -camera.y);

    // 畫角色
    const frame = playerFrames[animationOrder[player.frameIndex]];
    ctx.drawImage(
        frame,
        player.x - camera.x - player.size / 2,
        player.y - camera.y - player.size / 2,
        player.size,
        player.size
    );

    requestAnimationFrame(gameLoop);
}

// ===============================
// 開始遊戲
// ===============================
mapImg.onload = () => {
    requestAnimationFrame(gameLoop);
};
