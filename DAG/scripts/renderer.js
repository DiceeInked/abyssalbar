import { PLAYER_SIZE, ROOM } from "./physics.js";

const roomWidth = ROOM.right - ROOM.left;
const roomHeight = ROOM.bottom - ROOM.top;

function drawRoom(ctx) {
  ctx.fillStyle = "#191f24";
  ctx.fillRect(ROOM.left, ROOM.top, roomWidth, roomHeight);

  ctx.fillStyle = "#66727d";
  ctx.fillRect(ROOM.left - 12, ROOM.top - 12, roomWidth + 24, 12);
  ctx.fillRect(ROOM.left - 12, ROOM.bottom, roomWidth + 24, 12);
  ctx.fillRect(ROOM.left - 12, ROOM.top, 12, roomHeight);
  ctx.fillRect(ROOM.right, ROOM.top, 12, roomHeight);

  ctx.strokeStyle = "rgba(220, 230, 236, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(ROOM.left, ROOM.top, roomWidth, roomHeight);
}

function drawLimb(ctx, x, y, rotation, color, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, 4);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, player) {
  const speedRatio = Math.min(1, Math.abs(player.vx) / 285);
  const stride = Math.sin(player.animationTime * 12) * speedRatio * 0.42;
  const armMotion = Math.sin(player.animationTime * 12 + 1.2) * speedRatio * 0.16;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing || 1, 1);

  drawLimb(ctx, -7, 22, stride, "#8e9aa4", 11, 27);
  drawLimb(ctx, 7, 22, -stride, "#8e9aa4", 11, 27);
  drawLimb(ctx, -17, -3, -armMotion, "#b5bec5", 9, 25);
  drawLimb(ctx, 17, -3, armMotion, "#b5bec5", 9, 25);

  ctx.fillStyle = "#a7b1b9";
  ctx.beginPath();
  ctx.roundRect(-12, -20, 24, 31, 5);
  ctx.fill();

  ctx.fillStyle = "#d2d8dc";
  ctx.beginPath();
  ctx.arc(0, -29, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(122, 211, 190, 0.32)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  ctx.strokeRect(
    player.x - PLAYER_SIZE.width / 2,
    player.y - PLAYER_SIZE.height / 2,
    PLAYER_SIZE.width,
    PLAYER_SIZE.height
  );
  ctx.restore();
}

export function renderGame(canvas, player) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.round(width * pixelRatio)
      || canvas.height !== Math.round(height * pixelRatio)) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#14181c";
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(
    (width - 52) / (roomWidth + 24),
    (height - 70) / (roomHeight + 24)
  );

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);

  drawRoom(ctx);
  drawPlayer(ctx, player);

  ctx.restore();
}
