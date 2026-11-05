import { PLAYER_SIZE } from "./physics.js";
import { SOLIDS, WORLD } from "./world.js";
import { getCameraScale } from "./camera.js";

function drawCaveBackground(ctx, camera, scale, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#171d22");
  gradient.addColorStop(1, "#101418");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle fixed marks give the test cave depth without implying final art.
  ctx.save();
  ctx.translate(width / 2 - camera.x * scale, height / 2 - camera.y * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(176, 190, 198, 0.055)";
  for (let i = 0; i < 34; i += 1) {
    const x = 120 + i * 103;
    const y = -390 + Math.sin(i * 1.7) * 54;
    ctx.fillRect(x, y, 2 + (i % 3), 2 + (i % 2));
  }
  ctx.restore();
}

function drawTerrain(ctx) {
  for (const solid of SOLIDS) {
    if (solid.kind === "floor") {
      ctx.fillStyle = "#46515a";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.fillStyle = "#77838d";
      ctx.fillRect(solid.x, solid.y, solid.width, 5);
    } else if (solid.kind === "ceiling" || solid.kind === "wall") {
      ctx.fillStyle = "#303a43";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.fillStyle = "#52606b";
      if (solid.kind === "ceiling") ctx.fillRect(solid.x, solid.y + solid.height - 4, solid.width, 4);
      else ctx.fillRect(solid.x, solid.y, 4, solid.height);
    } else {
      ctx.fillStyle = "#515e68";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.fillStyle = "#84919b";
      ctx.fillRect(solid.x, solid.y, solid.width, 4);
      ctx.fillStyle = "rgba(12, 16, 20, 0.25)";
      ctx.fillRect(solid.x, solid.y + solid.height - 4, solid.width, 4);
    }
  }

  ctx.strokeStyle = "rgba(220, 230, 236, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(WORLD.left, WORLD.top, WORLD.right - WORLD.left, WORLD.bottom - WORLD.top);
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
  const stride = Math.sin(player.animationTime * 10) * speedRatio * 0.2;
  const armMotion = Math.sin(player.animationTime * 10 + Math.PI) * speedRatio * 0.12;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing || 1, 1);
  drawBlock(ctx, -7, 22, stride, "#87949e", 11, 25);
  drawBlock(ctx, 7, 22, -stride, "#87949e", 11, 25);
  drawBlock(ctx, -17, -3, armMotion, "#b5bec5", 9, 25);
  drawBlock(ctx, 17, -3, -armMotion, "#b5bec5", 9, 25);
  ctx.fillStyle = "#a7b1b9";
  ctx.fillRect(-12, -20, 24, 29);
  ctx.fillStyle = "#d2d8dc";
  ctx.fillRect(-10, -39, 20, 18);
  ctx.fillStyle = "#263039";
  ctx.fillRect(3, -33, 2, 2);
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
  const scale = getCameraScale(width, height);
  drawCaveBackground(ctx, camera, scale, width, height);

  ctx.save();
  ctx.translate(width / 2 - camera.x * scale, height / 2 - camera.y * scale);
  ctx.scale(scale, scale);
  drawTerrain(ctx);
  drawPlayer(ctx, player);
  ctx.restore();
}