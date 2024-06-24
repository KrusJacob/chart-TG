export function computeYRatio(height, max, min) {
  return (max - min) / height;
}
export function computeXRatio(width, length) {
  return width / (length - 2);
}

export function toDate(timestamp) {
  const shortMouths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date(timestamp);

  return `${shortMouths[date.getMonth()]} ${date.getDate()} `;
}

export function isOver(mouse, x, length, dWidth) {
  if (!mouse) {
    return false;
  }
  const width = dWidth / length;

  return Math.abs(x - mouse.x) < width / 2;
}

export function line(ctx, coords, { color }) {
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;

  for (let [x, y] of coords) {
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.closePath();
}

export function circle(ctx, [x, y], color) {
  const CIRCLE_RADIUS = 8;
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = color;
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}

export function boundaries({ columns, types }) {
  let min;
  let max;

  columns.forEach((col) => {
    if (types[col[0]] !== "line") {
      return;
    }

    if (typeof min !== "number") min = col[1];
    if (typeof max !== "number") max = col[1];

    for (let i = 1; i < col.length; i++) {
      if (min > col[i]) min = col[i];
      if (max < col[i]) max = col[i];
    }
  });

  return [min, max];
}

export function css(el, styles = {}) {
  Object.assign(el.style, styles);
}

export function toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING, yMin) {
  return (coordY, i) => {
    const x = Math.floor((i - 1) * xRatio);
    const y = Math.floor(DPI_HEIGHT - PADDING - (coordY - yMin) / yRatio);
    return [x, y];
  };
}
