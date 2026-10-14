// Pure functions for the heatmap maths. No React in here, so they are easy to reason about.
//
// Problem: visitors have different screen sizes. A click at x=700 on a 1400px-wide
// page is in the middle; on a 1000px-wide page it is far right. So we store each
// click's page width and convert x into a RATIO (x / pageWidth), then multiply by
// one common "reference" width to draw all clicks on the same canvas.
//
// Vertical position (y) is kept in pixels: pages normally keep their height even
// when the width changes, and scroll depth is what we want to see.

export const CELL_SIZE = 40; // grid cell size in reference pixels
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;

// The reference page: median width of the clicks, tallest page height.
export function getReferenceSize(clicks) {
  const widths = clicks.map((c) => c.pageWidth).filter(Boolean).sort((a, b) => a - b);
  const heights = clicks.map((c) => c.pageHeight).filter(Boolean);
  const maxClickY = clicks.reduce((max, c) => Math.max(max, c.y), 0);

  return {
    width: widths.length ? widths[Math.floor(widths.length / 2)] : DEFAULT_WIDTH,
    height: Math.max(heights.length ? Math.max(...heights) : DEFAULT_HEIGHT, maxClickY + 40),
  };
}

// Converts raw clicks to positions on the reference page.
export function projectClicks(clicks, reference) {
  return clicks.map((click) => ({
    x: (click.x / (click.pageWidth || reference.width)) * reference.width,
    y: click.y,
  }));
}

// Counts clicks per grid cell. Returns { cells: [{col,row,count}], max }.
export function binClicks(points, cellSize = CELL_SIZE) {
  const counts = new Map();
  for (const point of points) {
    const col = Math.floor(point.x / cellSize);
    const row = Math.floor(point.y / cellSize);
    const key = `${col}:${row}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let max = 0;
  const cells = [];
  for (const [key, count] of counts) {
    const [col, row] = key.split(":").map(Number);
    cells.push({ col, row, count });
    if (count > max) max = count;
  }
  return { cells, max };
}

const HEAT_RGB = "228, 87, 46";

// Soft glowing dots: overlapping translucent circles add up, so busy areas look hotter.
export function drawDots(ctx, points, scale) {
  const radius = Math.max(10, 20 * scale);
  for (const point of points) {
    const cx = point.x * scale;
    const cy = point.y * scale;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(${HEAT_RGB}, 0.5)`);
    glow.addColorStop(1, `rgba(${HEAT_RGB}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${HEAT_RGB}, 0.95)`; // crisp centre so exact click spots stay visible
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Square cells, darker = more clicks.
export function drawGrid(ctx, points, scale) {
  const { cells, max } = binClicks(points);
  const size = CELL_SIZE * scale;
  for (const { col, row, count } of cells) {
    ctx.fillStyle = `rgba(${HEAT_RGB}, ${0.15 + 0.75 * (count / max)})`;
    ctx.fillRect(col * size, row * size, size - 1, size - 1);
  }
}
