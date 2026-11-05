import { PLAYER_SIZE, ATTACK_DURATION } from "./physics.js";
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

function drawOres(ctx, ores) {
  for (const ore of ores) {
    const x = ore.x;
    const y = ore.y;
    if (!ore.alive) {
      ctx.fillStyle = "#202a30";
      ctx.fillRect(x - 14, y + 8, 28, 8);
      continue;
    }

    const crystal = ore.flashTime > 0 ? "#eafffa" : "#00ffc8";
    drawPolygon(ctx, [
      [x - 17, y + 10], [x - 14, y - 9], [x - 4, y - 19],
      [x + 8, y - 14], [x + 17, y + 7], [x + 7, y + 15],
      [x - 8, y + 16]
    ], "#263c3b");
    drawPolygon(ctx, [
      [x - 10, y + 7], [x - 7, y - 8], [x - 1, y - 16],
      [x + 7, y - 10], [x + 12, y + 5], [x + 3, y + 12]
    ], crystal);
    drawPolygon(ctx, [
      [x - 5, y - 7], [x - 1, y - 16], [x + 7, y - 10],
      [x + 4, y + 2]
    ], "rgba(235, 255, 251, 0.65)");

    ctx.fillStyle = "rgba(4, 10, 12, 0.85)";
    ctx.fillRect(x - 17, y - 30, 34, 4);
    ctx.fillStyle = "#00ffc8";
    ctx.fillRect(x - 17, y - 30, 34 * ore.health / ore.maxHealth, 4);
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

function drawPracticeCreatures(ctx, creatures) {
  for (const creature of creatures) {
    if (!creature.alive) continue;
    const x = creature.x;
    const y = creature.y;
    const damaged = creature.flashTime > 0;
    const bodyColor = damaged ? "#e3f3ef" : "#718d88";

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(x - creature.width / 2 - 5, y + creature.height / 2 - 2, creature.width + 10, 5);

    drawPolygon(ctx, [
      [x - 19, y + 12], [x - 17, y - 2], [x - 8, y - 13],
      [x + 7, y - 14], [x + 18, y - 4], [x + 20, y + 12],
      [x + 10, y + 21], [x - 9, y + 20]
    ], bodyColor);

    drawPolygon(ctx, [
      [x - 12, y - 11], [x - 17, y - 22], [x - 5, y - 17]
    ], "#8da49c");
    drawPolygon(ctx, [
      [x + 8, y - 12], [x + 16, y - 22], [x + 17, y - 6]
    ], "#8da49c");

    ctx.fillStyle = "#182229";
    ctx.fillRect(x - 8, y - 2, 4, 4);
    ctx.fillRect(x + 6, y - 2, 4, 4);
    ctx.fillStyle = "#d8e4df";
    ctx.fillRect(x - 7, y - 3, 2, 2);
    ctx.fillRect(x + 7, y - 3, 2, 2);

    const barWidth = 34;
    ctx.fillStyle = "rgba(5, 9, 12, 0.8)";
    ctx.fillRect(x - barWidth / 2, y - 34, barWidth, 5);
    ctx.fillStyle = "#00ffc8";
    ctx.fillRect(x - barWidth / 2, y - 34, barWidth * creature.health / creature.maxHealth, 5);
  }
}

function drawSword(ctx, player) {
  if (player.attackTime <= 0) return;
  const progress = Math.max(0, Math.min(1, 1 - player.attackTime / ATTACK_DURATION));
  const swing = -1.25 + progress * 2.35;

  ctx.save();
  ctx.translate(18, -4);
  ctx.rotate(swing);
  ctx.fillStyle = "#52616b";
  ctx.fillRect(-3, -4, 6, 15);
  ctx.fillStyle = "#d8e0e5";
  ctx.fillRect(-2, -38, 4, 34);
  ctx.fillStyle = "#94a3ad";
  ctx.fillRect(-5, -8, 10, 4);
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
  drawSword(ctx, player);
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

export function renderGame(canvas, player, camera, creatures = [], ores = []) {
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
  drawTerrain(ctx);
  drawCaveRockwork(ctx);
  drawOres(ctx, ores);
  drawPracticeCreatures(ctx, creatures);
  drawPlayer(ctx, player);
  ctx.restore();
}