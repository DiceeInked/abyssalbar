"use client";

import { useEffect, useRef, useState } from "react";

type Ball = {
  baseRadius: number;
  currentRadius: number;
  targetRadius: number;
  radiusVelocity: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: { r: number; g: number; b: number };
};

const MAX_BALLS = 60;
const INITIAL_COLORS = [
  { r: 0, g: 255, b: 200 },
  { r: 255, g: 238, b: 0 },
  { r: 255, g: 0, b: 85 },
];

const hsbToRgb = (h: number, s: number, b: number) => {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: return { r: b, g: t, b: p };
    case 1: return { r: q, g: b, b: p };
    case 2: return { r: p, g: b, b: t };
    case 3: return { r: p, g: q, b };
    case 4: return { r: t, g: p, b };
    default: return { r: b, g: p, b: q };
  }
};

const getBaseRadius = (width: number, height: number) => Math.max(Math.min(width, height) * 0.12, 60);

const createBall = (canvas: HTMLCanvasElement, color: Ball["color"]): Ball => {
  const baseRadius = getBaseRadius(canvas.width, canvas.height);
  const angle = Math.random() * Math.PI * 2;
  const speed = 4;

  return {
    baseRadius,
    currentRadius: baseRadius,
    targetRadius: baseRadius,
    radiusVelocity: 0,
    x: Math.random() * Math.max(canvas.width - baseRadius * 2, 1) + baseRadius,
    y: Math.random() * Math.max(canvas.height - baseRadius * 2, 1) + baseRadius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color: { r: color.r / 255, g: color.g / 255, b: color.b / 255 },
  };
};

export default function BallsPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      setWebglError(true);
      return;
    }

    const vertexSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;
      #define MAX_BALLS 60
      uniform int u_ballCount;
      uniform vec3 u_ballsPosRad[MAX_BALLS];
      uniform vec3 u_ballsColor[MAX_BALLS];

      void main() {
        vec2 st = gl_FragCoord.xy;
        float totalInfluence = 0.0;
        vec3 colorSum = vec3(0.0);

        for (int i = 0; i < MAX_BALLS; i++) {
          if (i >= u_ballCount) break;

          vec3 ball = u_ballsPosRad[i];
          vec3 ballColor = u_ballsColor[i];
          vec2 delta = st - ball.xy;
          float distanceSq = dot(delta, delta);

          if (distanceSq > 0.0) {
            float influence = (ball.z * ball.z) / distanceSq;
            totalInfluence += influence;
            colorSum += ballColor * influence;
          }
        }

        if (totalInfluence > 1.2) {
          gl_FragColor = vec4(colorSum / totalInfluence, 1.0);
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      setWebglError(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglError(true);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setWebglError(true);
      return;
    }

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "position");
    const ballCountLocation = gl.getUniformLocation(program, "u_ballCount");
    const ballsPositionLocation = gl.getUniformLocation(program, "u_ballsPosRad");
    const ballsColorLocation = gl.getUniformLocation(program, "u_ballsColor");

    if (positionLocation < 0 || !ballCountLocation || !ballsPositionLocation || !ballsColorLocation) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setWebglError(true);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setWebglError(true);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const balls = INITIAL_COLORS.map((color) => createBall(canvas, color));
    const positionArray = new Float32Array(MAX_BALLS * 3);
    const colorArray = new Float32Array(MAX_BALLS * 3);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);

      for (const ball of balls) {
        const scale = getBaseRadius(canvas.width, canvas.height) / ball.baseRadius;
        ball.baseRadius = getBaseRadius(canvas.width, canvas.height);
        ball.currentRadius *= scale;
        ball.targetRadius = ball.baseRadius;
        ball.x = Math.min(Math.max(ball.x * (canvas.width / Math.max(canvas.width, 1)), ball.baseRadius), canvas.width - ball.baseRadius);
        ball.y = Math.min(Math.max(ball.y * (canvas.height / Math.max(canvas.height, 1)), ball.baseRadius), canvas.height - ball.baseRadius);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let animationFrame = 0;
    const animate = () => {
      for (const ball of balls) {
        const force = (ball.targetRadius - ball.currentRadius) * 0.1;
        ball.radiusVelocity = (ball.radiusVelocity + force) * 0.85;
        ball.currentRadius += ball.radiusVelocity;

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.currentRadius <= 0) {
          ball.x = ball.currentRadius;
          ball.vx *= -1;
        } else if (ball.x + ball.currentRadius >= canvas.width) {
          ball.x = canvas.width - ball.currentRadius;
          ball.vx *= -1;
        }

        if (ball.y - ball.currentRadius <= 0) {
          ball.y = ball.currentRadius;
          ball.vy *= -1;
        } else if (ball.y + ball.currentRadius >= canvas.height) {
          ball.y = canvas.height - ball.currentRadius;
          ball.vy *= -1;
        }
      }

      const count = Math.min(balls.length, MAX_BALLS);
      for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        positionArray[offset] = balls[index].x;
        positionArray[offset + 1] = balls[index].y;
        positionArray[offset + 2] = balls[index].currentRadius;
        colorArray[offset] = balls[index].color.r;
        colorArray[offset + 1] = balls[index].color.g;
        colorArray[offset + 2] = balls[index].color.b;
      }

      gl.uniform1i(ballCountLocation, count);
      gl.uniform3fv(ballsPositionLocation, positionArray);
      gl.uniform3fv(ballsColorLocation, colorArray);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = window.requestAnimationFrame(animate);
    };

    animate();

    const handleClick = (event: MouseEvent) => {
      if (balls.length >= MAX_BALLS) return;

      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const x = (event.clientX - rect.left) * pixelRatio;
      const y = (rect.height - (event.clientY - rect.top)) * pixelRatio;
      const color = hsbToRgb(Math.random(), 0.75, 1);
      const ball = createBall(canvas, color);
      ball.x = x;
      ball.y = y;
      ball.currentRadius = ball.baseRadius * 1.8;
      ball.targetRadius = ball.baseRadius;
      balls.push(ball);
    };

    canvas.addEventListener("click", handleClick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Animated metaballs"
        style={{ display: "block", width: "100vw", height: "100vh" }}
      />
      {webglError && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#000",
            color: "#00ffc8",
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          WebGL is not available in this browser.
        </div>
      )}
    </main>
  );
}
