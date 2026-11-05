import { PLAYER_SIZE } from "./physics.js";
import { SOLIDS, WORLD } from "./world.js";
import { getCameraScale } from "./camera.js";

function drawCaveBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#080d12");
  gradient.addColorStop(0.55, "#151e25");
  gradient.addColorStop(1, "#080c10");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const light = ctx.createRadialGradient(width * 0.5, height * 0.55, 8, width * 0.5, height * 0.55, width * 0.65);
  light.addColorStop(0, "rgba(76, 103, 116, 0.12)");
  light.addColorStop(1, "rgba(3, 6, 9, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);
}

function drawPolygon(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCaveRockwork(ctx) {
  // Simple angular rock shapes make the test room read as a cave.
  drawPolygon(ctx, [
    [WORLD.left, WORLD.top + 75], [WORLD.left + 120, WORLD.top + 30],
    [WORLD.left + 245, WORLD.top + 66], [WORLD.left + 390, WORLD.top + 24],
    [WORLD.left + 540, WORLD.top + 68], [WORLD.left + 710, WORLD.top + 35],
    [WORLD.left + 880, WORLD.top + 72], [WORLD.left + 1050, WORLD.top + 28],
    [WORLD.left + 1240, WORLD.top + 65], [WORLD.left + 1420, WORLD.top + 31],
    [WORLD.left + 1600, WORLD.top + 70], [WORLD.left + 1790, WORLD.top + 25],
    [WORLD.left + 1980, WORLD.top + 64], [WORLD.left + 2180, WORLD.top + 34],
    [WORLD.left + 2380, WORLD.top + 71], [WORLD.left + 2580, WORLD.top + 30],
    [WORLD.left + 2780, WORLD.top + 67], [WORLD.left + 2980, WORLD.top + 28],
    [WORLD.right, WORLD.top + 72], [WORLD.right, WORLD.top], [WORLD.left, WORLD.top]
  ], "#111920");

  for (let i = 0; i < 24; i += 1) {
    const x = 45 + i * 151;
    const width = 18 + (i * 7 % 24);
    const depth = 22 + (i * 11 % 44);
    drawPolygon(ctx, [
      [x, WORLD.top + 2],
      [x + width, WORLD.top + 2],
      [x + width * 0.52, WORLD.top + depth],
      [x + width * 0.36, WORLD.top + depth * 0.72]
    ], i % 2 ? "#1a252d" : "#202b33");
  }

  // A few matching rock teeth rise from the floor without changing collision geometry.
  for (let i = 0; i < 18; i += 1) {
    const x = 80 + i * 197;
    const width = 18 + (i * 5 % 27);
    const height = 14 + (i * 9 % 30);
    drawPolygon(ctx, [
      [x, 180], [x + width, 180],
      [x + width * 0.58, 180 - height],
      [x + width * 0.32, 180 - height * 0.65]
    ], "#242f36");
  }

  // Rock flecks are sparse and fixed, not animated decoration.
  for (let i = 0; i < 92; i += 1) {
    const x = 55 + (i * 137 % 3480);
    const y = -430 + (i * 71 % 560);
    ctx.fillStyle = i % 3 ? "rgba(172, 188, 195, 0.09)" : "rgba(3, 7, 10, 0.3)";
    ctx.fillRect(x, y, 3 + (i % 3), 2 + (i % 2));
  }
}

function drawTerrain(ctx) {
  for (const solid of SOLIDS) {
    if (solid.kind === "floor") {
      ctx.fillStyle = "#343d43";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.fillStyle = "#69767d";
      ctx.fillRect(solid.x, solid.y, solid.width, 5);
      for (let i = 0; i < 60; i += 1) {
        const x = solid.x + i * 61 + (i % 4) * 5;
        const y = solid.y + 11 + (i * 7 % 19);
        ctx.fillStyle = i % 2 ? "rgba(5, 9, 12, 0.24)" : "rgba(177, 188, 191, 0.11)";
        ctx.fillRect(x, y, 13 + (i % 3) * 4, 2 + (i % 2));
      }
    } else if (solid.kind === "ceiling" || solid.kind === "wall") {
      ctx.fillStyle = "#27323a";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.fillStyle = "#3c4952";
      if (solid.kind === "ceiling") ctx.fillRect(solid.x, solid.y + solid.height - 4, solid.width, 4);
      else ctx.fillRect(solid.x, solid.y, 4, solid.height);
    } else {
      ctx.fillStyle = "#515e68";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.fillStyle = "#89959d";
      ctx.fillRect(solid.x, solid.y, solid.width, 4);
      ctx.fillStyle = "rgba(9, 13, 17, 0.3)";
      ctx.fillRect(solid.x, solid.y + solid.height - 4, solid.width, 4);
    }
  }
}

function drawBlock(ctx, x, y, rotation, color, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawPlayer(ctx, player) {
  const speedRatio = Math.min(1, Math.abs(player.vx) / 285);
  const moving = speedRatio > 0.08;
  const runningCycle = Math.sin(player.animationTime * 11);
  const airborne = !player.grounded;
  const rising = airborne && player.vy < -80;
  const falling = airborne && player.vy > 100;

  const legSwing = moving && player.grounded ? runningCycle * 0.34 : 0;
  const armSwing = moving && player.grounded ? -runningCycle * 0.25 : 0;
  const bodyBob = player.grounded && moving ? Math.abs(runningCycle) * 2 : Math.sin(player.animationTime * 2.2) * 1.1;
  const bodyTilt = player.grounded && moving ? -runningCycle * 0.035 : 0;

  let leftLeg = legSwing;
  let rightLeg = -legSwing;
  let leftArm = armSwing;
  let rightArm = -armSwing;

  if (rising) {
    leftLeg = -0.28;
    rightLeg = 0.28;
    leftArm = -0.55;
    rightArm = 0.55;
  } else if (falling) {
    leftLeg = 0.18;
    rightLeg = -0.18;
    leftArm = -0.72;
    rightArm = 0.72;
  }

  ctx.save();
  ctx.translate(player.x, player.y + bodyBob);
  ctx.scale(player.facing || 1, 1);
  ctx.rotate(bodyTilt);

  drawBlock(ctx, -7, 22, leftLeg, "#87949e", 11, 25);
  drawBlock(ctx, 7, 22, rightLeg, "#87949e", 11, 25);
  drawBlock(ctx, -17, -3, leftArm, "#b5bec5", 9, 25);
  drawBlock(ctx, 17, -3, rightArm, "#b5bec5", 9, 25);

  ctx.fillStyle = "#a7b1b9";
  ctx.fillRect(-12, -20, 24, 29);
  ctx.fillStyle = "#d2d8dc";
  ctx.fillRect(-10, -39, 20, 18);
  ctx.fillStyle = "#263039";
  ctx.fillRect(3, -33, 2, 2);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(122, 211, 190, 0.24)";
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

export function renderGame(canvas, player, camera) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width <= 0 || height <= 0) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.round(width * pixelRatio)
      || canvas.height !== Math.round(height * pixelRatio)) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawCaveBackground(ctx, width, height);

  const scale = getCameraScale(width, height);
  ctx.save();
  ctx.translate(width / 2 - camera.x * scale, height / 2 - camera.y * scale);
  ctx.scale(scale, scale);
  drawCaveRockwork(ctx);
  drawTerrain(ctx);
  drawPlayer(ctx, player);
  ctx.restore();
}