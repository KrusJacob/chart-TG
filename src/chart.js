import { sliderChart } from "./slider";
import "./styles.scss";
import { tooltip } from "./tooltip";
import { isOver, toDate, line, circle, boundaries, toCoords, computeYRatio, computeXRatio } from "./utils";

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 40;
const DPI_WIDTH = WIDTH * 2;
const DPI_HEIGHT = HEIGHT * 2;
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2;
const VIEW_WIDTH = DPI_WIDTH;
const ROWS_COUNT = 5;
const SPEED = 1000;

export function chart(root, data) {
  const canvas = root.querySelector('[data-el="main"]');
  const tip = tooltip(root.querySelector('[data-el="tooltip"]'));

  const slider = sliderChart(root.querySelector('[data-el="slider"]'), data, DPI_WIDTH);

  const ctx = canvas.getContext("2d");

  let raf;
  let prevMax;
  canvas.style.width = WIDTH + "px";
  canvas.style.height = HEIGHT + "px";
  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;

  const proxy = new Proxy(
    {},
    {
      set(...args) {
        const result = Reflect.set(...args);
        raf = requestAnimationFrame(paint);
        return result;
      },
    }
  );

  function mousemove(e) {
    proxy.mouse = {
      x: e.offsetX * 2,
    };
    proxy.tooltip = {
      left: e.offsetX,
      top: e.offsetY,
    };
  }

  function mouseleave() {
    proxy.mouse.x = null;

    tip.hide();
  }

  slider.subscribe((pos) => {
    proxy.pos = pos;
  });

  canvas.addEventListener("mousemove", mousemove);
  canvas.addEventListener("mouseleave", mouseleave);

  function clear() {
    ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT);
  }

  function getMax(yMax) {
    const step = (yMax - prevMax) / SPEED;

    if (proxy.max < yMax) {
      proxy.max += step;
    } else if (proxy.max > yMax) {
      proxy.max = yMax;
      prevMax = yMax;
    }

    return proxy.max;
  }

  function paint() {
    clear();
    const length = data.columns[0].length;
    const leftIndex = Math.round((length * proxy.pos[0]) / 100);
    const rightIndex = Math.round((length * proxy.pos[1]) / 100);

    const columns = data.columns.map((col) => {
      const res = col.slice(leftIndex, rightIndex);
      if (typeof res[0] !== "string") {
        res.unshift(col[0]);
      }
      return res;
    });

    const [yMin, yMax] = boundaries({ columns, types: data.types });
    if (!prevMax) {
      prevMax = yMax;
      proxy.max = yMax;
    }

    const max = getMax(yMax);

    const yRatio = computeYRatio(VIEW_HEIGHT, max, yMin);
    const xRatio = computeXRatio(VIEW_WIDTH, columns[0].length);

    const yData = columns.filter((col) => data.types[col[0]] === "line");
    const xData = columns.filter((col) => data.types[col[0]] !== "line")[0];

    yData.forEach((col) => {
      const name = col[0];

      const color = data.colors[name];
      const coords = col.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING, yMin)).slice(1);
      line(ctx, coords, { color: color });

      for (let [x, y] of coords) {
        if (isOver(proxy.mouse, x, coords.length, DPI_WIDTH)) {
          circle(ctx, [x, y], color);
          break;
        }
      }
    });

    yAxis(yMin, max);
    xAxis(xData, yData, xRatio);

    yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING, yMin));
  }

  function yAxis(yMin, yMax) {
    const step = VIEW_HEIGHT / ROWS_COUNT;
    const textStep = (yMax - yMin) / ROWS_COUNT;

    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#bbb";
    ctx.font = "normal 20px Helvetica, sans-serif";
    for (let i = 1; i <= ROWS_COUNT; i++) {
      const y = step * i;
      const text = Math.round(yMax - textStep * i);
      ctx.fillText(text, 5, y + PADDING - 5);
      ctx.moveTo(0, y + PADDING);
      ctx.lineTo(DPI_WIDTH, y + PADDING);
    }

    ctx.stroke();
    ctx.closePath();
  }

  function xAxis(xData, yData, xRatio) {
    const colsCount = 6;
    const colsStep = Math.round(xData.length / colsCount);

    ctx.beginPath();
    ctx.fillStyle = "#000";
    for (let i = 1; i < xData.length; i++) {
      const x = i * xRatio;

      if ((i - 1) % colsStep === 0) {
        const text = toDate(xData[i]);
        ctx.fillText(text.toString(), x, DPI_HEIGHT - 10);
      }

      if (isOver(proxy.mouse, x, xData.length, DPI_WIDTH)) {
        // ctx.save();
        ctx.moveTo(x, PADDING / 2);
        ctx.lineTo(x, DPI_HEIGHT - PADDING);

        // ctx.restore();

        tip.show(proxy.tooltip, {
          title: toDate(xData[i]),
          items: yData.map((col) => ({
            color: data.colors[col[0]],
            name: data.names[col[0]],
            value: col[i + 1],
          })),
        });
      }
    }
    ctx.stroke();
    ctx.closePath();
  }

  return {
    init() {
      paint();
    },
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", mousemove);
      canvas.removeEventListener("mouseleave", mouseleave);
    },
  };
}
