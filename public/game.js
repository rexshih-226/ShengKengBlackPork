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

const landmarkImg = new Image();
landmarkImg.src = "地標.png";

// ===============================
// 任務列表（從後端取）
// ===============================
let tasks = [
    { id: 1, name: "小屋旁的茶園", title: "晨光之芽・茶靈的最初祝福", x: 17, y: 12 },
    { id: 2, name: "店鋪旁的茶園", title: "萎凋之風・青氣散盡的試煉", x: 12, y: 28 },
    { id: 3, name: "炒菁小屋", title: "止醱之炎・火淬茶魂（炒菁）", x: 67, y: 27 },
    { id: 4, name: "深坑茶葉介紹館", title: "深坑百年製茶大歷史", x: 45, y: 42 },
    { id: 5, name: "焙茶廠", title: "焙火終章・香韻覺醒（乾燥 + 焙火 + 成茶）", x: 70, y: 70 }
];

let mapWidth = 1600;  // 地圖原始寬度（像素）
let mapHeight = 1200; // 地圖原始高度（像素）

// 任務座標轉換為像素座標
function getTaskPixelPos(task) {
    return {
        px: (task.x / 100) * mapWidth,
        py: (task.y / 100) * mapHeight
    };
}

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
    timer: 0,
    nearTask: null  // 附近的任務 ID
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

// 支援多組按鍵判定
function isPressed(...names) {
    return names.some(name => keys[name]);
}

// ===============================
// 檢查附近任務
// ===============================
function checkNearTask() {
    const interactRange = 100; // 互動範圍
    player.nearTask = null;

    for (let task of tasks) {
        const pos = getTaskPixelPos(task);
        const dist = Math.sqrt(
            Math.pow(player.x - pos.px, 2) +
            Math.pow(player.y - pos.py, 2)
        );

        if (dist < interactRange) {
            player.nearTask = task;
            break;
        }
    }
}

// ===============================
// 進入任務小遊戲
// ===============================
function enterTask(taskId) {
    // 存儲玩家位置，返回時使用
    localStorage.setItem('playerX', player.x);
    localStorage.setItem('playerY', player.y);

    // 根據不同 taskId 導向不同的任務頁面
    const taskPages = {
        1: 'task1.html',
        2: 'task2.html',
        3: 'task3.html',
        4: 'task4.html',
        5: 'task5.html'
    };

    window.location.href = taskPages[taskId] || 'game.html';
}

// ===============================
// 主遊戲迴圈
// ===============================
function gameLoop() {
    if (isPressed("ArrowUp", "w", "W")) move(0, -player.speed);
    if (isPressed("ArrowDown", "s", "S")) move(0, player.speed);
    if (isPressed("ArrowLeft", "a", "A")) move(-player.speed, 0);
    if (isPressed("ArrowRight", "d", "D")) move(player.speed, 0);

    // 按 E 鍵進入附近任務
    if (keys["e"] || keys["E"]) {
        if (player.nearTask) {
            enterTask(player.nearTask.id);
        }
        keys["e"] = keys["E"] = false; // 防止連續觸發
    }

    checkNearTask();
    updateAnimation();
    updateCamera();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地圖
    ctx.drawImage(mapImg, -camera.x, -camera.y);

    // 繪製任務指標（使用地標圖片）
    const landmarkSize = 50; // 地標圖片大小
    for (let task of tasks) {
        const pos = getTaskPixelPos(task);
        const screenX = pos.px - camera.x;
        const screenY = pos.py - camera.y;

        // 只在螢幕範圍內繪製
        if (screenX > -100 && screenX < canvas.width + 100 &&
            screenY > -100 && screenY < canvas.height + 100) {
            // 繪製地標圖片
            ctx.drawImage(
                landmarkImg,
                screenX - landmarkSize / 2,
                screenY - landmarkSize / 2,
                landmarkSize,
                landmarkSize
            );
        }
    }

    // 繪製互動提示（跟隨角色）
    if (player.nearTask) {
        const playerScreenX = player.x - camera.x;
        const playerScreenY = player.y - camera.y;
        
        // 對話框尺寸
        const boxWidth = 160;
        const boxHeight = 50;
        const offsetY = -80; // 對話框在角色上方
        
        // 計算對話框位置（在角色上方）
        let boxX = playerScreenX - boxWidth / 2;
        let boxY = playerScreenY + offsetY;
        
        // 防止對話框超出螢幕邊界
        if (boxX < 10) boxX = 10;
        if (boxX + boxWidth > canvas.width - 10) boxX = canvas.width - boxWidth - 10;
        if (boxY < 10) boxY = playerScreenY + player.size / 2 + 10; // 如果上方超出，放下方
        
        // 繪製半透明對話框
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // 對話框邊框
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // 文字
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`靠近: ${player.nearTask.name}`, boxX + boxWidth / 2, boxY + 20);
        ctx.fillText("按 E 進入", boxX + boxWidth / 2, boxY + 38);
    }

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

// ===============================
// 初始化遊戲
// ===============================
function initGame() {
    // 檢查是否從任務頁面返回
    const savedX = localStorage.getItem('playerX');
    const savedY = localStorage.getItem('playerY');

    if (savedX && savedY) {
        player.x = parseFloat(savedX);
        player.y = parseFloat(savedY);
        localStorage.removeItem('playerX');
        localStorage.removeItem('playerY');
    }

    requestAnimationFrame(gameLoop);
}

mapImg.onload = () => {
    initGame();
};
