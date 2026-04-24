const canvas = document.getElementById("rain") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const STAR_COLORS = [
  "102,186,255", // 青白
  "255,180,100", // オレンジ
  "180,130,255", // 紫
  "120,255,180", // 緑
  "255,230,100", // 黄
  "255,120,160", // ピンク
];
const RAIN_COLOR = "102,186,255";

// ---- フェーズ定義 ----
// 0: 真下の雨  1: 斜め下の強い雨  2: 横向き流れ星
// phase値 0→1→2 で連続的に補間
const T_RAIN = 8; // 真下の雨
const T_RAIN_TRANS = 8; // 真下→斜め
const T_SLANT = 10; // 斜め下の強い雨
const T_STAR_TRANS = 13; // 斜め→流れ星（長めにとってクロスフェード）
const T_STAR = 12; // 流れ星
const T_BACK = 12; // 流れ星→真下（長めにとってクロスフェード）
const CYCLE = T_RAIN + T_RAIN_TRANS + T_SLANT + T_STAR_TRANS + T_STAR + T_BACK;

type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  opacity: number;
  trailDots: number;
  trailLen: number;
  curve: number;
  color: string;
  trail: Array<{ x: number; y: number }>;
};

let drops: Drop[] = [];
let W = 0,
  H = 0;
const startTime = performance.now();

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function smoothstep(x: number) {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
}

// phase: 0=真下の雨, 1=斜め下の雨, 2=流れ星
function getPhase(now: number): number {
  const t = ((now - startTime) / 1000) % CYCLE;
  if (t < T_RAIN) {
    return 0;
  } else if (t < T_RAIN + T_RAIN_TRANS) {
    return smoothstep((t - T_RAIN) / T_RAIN_TRANS);
  } else if (t < T_RAIN + T_RAIN_TRANS + T_SLANT) {
    return 1;
  } else if (t < T_RAIN + T_RAIN_TRANS + T_SLANT + T_STAR_TRANS) {
    return 1 + smoothstep((t - T_RAIN - T_RAIN_TRANS - T_SLANT) / T_STAR_TRANS);
  } else if (t < T_RAIN + T_RAIN_TRANS + T_SLANT + T_STAR_TRANS + T_STAR) {
    return 2;
  } else {
    return (
      2 - 2 * smoothstep((t - T_RAIN - T_RAIN_TRANS - T_SLANT - T_STAR_TRANS - T_STAR) / T_BACK)
    );
  }
}

// phase→ベース移動方向（単位ベクトル）
// phase 0: 真下(90°), phase 1: 斜め(45°), phase 2: 横(10°)
function getAngleDeg(phase: number): number {
  if (phase <= 1) return 90 - 45 * phase; // 90°→45°
  return 45 - 35 * (phase - 1); // 45°→10°
}

function spawn(randomPos = true): Drop {
  const x = randomPos ? Math.random() * W : Math.random() * W;
  const y = randomPos ? Math.random() * H : -20;
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    speed: 2 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.6,
    trailDots: 5 + Math.floor(Math.random() * 6),
    trailLen: 70 + Math.random() * 100,
    curve: (Math.random() - 0.5) * 0.04,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    trail: [],
  };
}

function init() {
  resize();
  drops = Array.from({ length: 120 }, () => spawn(true));
}

function draw(now: number) {
  const phase = getPhase(now);
  const angleDeg = getAngleDeg(phase);
  const angleRad = (angleDeg * Math.PI) / 180;
  const baseDx = Math.cos(angleRad);
  const baseDy = Math.sin(angleRad);

  // starRatio: 0=完全に雨, 1=完全に流れ星  (phase 1→2 で 0→1)
  const starRatio = Math.max(0, Math.min(1, phase - 1));

  ctx.clearRect(0, 0, W, H);

  // 流れ星は先頭5粒、雨は常に100粒
  const starCount = Math.round(starRatio * 7);
  const visibleStar = Math.min(starCount, drops.length);
  const visibleRain = Math.min(visibleStar + 100, drops.length);

  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    const isSelf = i < visibleStar ? "star" : i < visibleRain ? "rain" : "skip";
    if (isSelf === "skip") continue;

    if (isSelf === "rain") {
      // ---- 雨：ドット列 ----
      // phase1のとき太く速く（強い雨）、流れ星フェーズでは薄く細く
      const intensity = phase <= 1 ? phase : 2 - phase;
      const dots = d.trailDots + Math.round(intensity * 4);
      const gap = 5 + intensity * 2;
      const r = 1.2 + intensity * 0.6;
      const spd = d.speed * (1 + intensity * 1.2);
      const rainOpacity = 1;

      for (let k = 0; k < dots; k++) {
        const ratio = 1 - k / dots;
        ctx.beginPath();
        ctx.arc(d.x - baseDx * k * gap, d.y - baseDy * k * gap, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${RAIN_COLOR},${d.opacity * ratio * (0.8 + intensity * 0.4) * rainOpacity})`;
        ctx.fill();
      }

      d.x += baseDx * spd;
      d.y += baseDy * spd;
    } else {
      // ---- 流れ星：曲線軌跡 ----
      const starPhase = Math.max(0, Math.min(1, phase - 1)); // 0→1
      const spd = d.speed * (2.5 + starPhase * 2);

      // カーブ：速度ベクトルを少しずつ回転させる
      if (d.vx === 0 && d.vy === 0) {
        d.vx = baseDx * spd;
        d.vy = baseDy * spd;
      }
      // 重力的な下向きバイアス＋個体曲率
      d.vx += d.curve * spd * 0.1;
      d.vy += 0.03 * starPhase;
      // 速度の大きさをspdに正規化
      const vlen = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      d.vx = (d.vx / vlen) * spd;
      d.vy = (d.vy / vlen) * spd;

      d.x += d.vx;
      d.y += d.vy;

      // 軌跡記録（最大30点）
      d.trail.push({ x: d.x, y: d.y });
      if (d.trail.length > 30) d.trail.shift();

      // 軌跡を曲線で描画
      if (d.trail.length >= 2) {
        const len = d.trail.length;
        const tailLen = Math.min(len, Math.round(8 + starPhase * 22));
        const start = len - tailLen;
        ctx.beginPath();
        ctx.moveTo(d.trail[start].x, d.trail[start].y);
        for (let k = start + 1; k < len; k++) {
          ctx.lineTo(d.trail[k].x, d.trail[k].y);
        }
        const grad = ctx.createLinearGradient(d.trail[start].x, d.trail[start].y, d.x, d.y);
        grad.addColorStop(0, `rgba(${d.color},0)`);
        grad.addColorStop(0.5, `rgba(${d.color},${d.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(${d.color},${d.opacity * 1.4})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 + starPhase;
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // 先端輝点
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2 + starPhase, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${d.color},${d.opacity * 1.8})`;
      ctx.fill();
    }

    // 画面外リスポーン
    const pad = 250;
    if (d.x > W + pad || d.x < -pad || d.y > H + pad || d.y < -pad) {
      const nd = spawn(false);
      if (phase > 1.2) {
        // 流れ星：左上付近からスポーン
        nd.x = -30 + Math.random() * W * 0.6;
        nd.y = -30 + Math.random() * H * 0.7;
        nd.vx = baseDx * (nd.speed * 3);
        nd.vy = baseDy * (nd.speed * 3);
      } else {
        // 雨：移動方向に合わせて上端・左端からスポーン
        // angleDeg が小さい（斜め）ほど左端からも出す
        const fromLeft = Math.random() < 1 - angleDeg / 90;
        if (fromLeft) {
          nd.x = -20;
          nd.y = Math.random() * H;
        } else {
          nd.x = Math.random() * W;
          nd.y = -20;
        }
      }
      drops[i] = nd;
    }
  }

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
init();
requestAnimationFrame(draw);
