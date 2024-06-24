import { boundaries, computeXRatio, computeYRatio, css, isOver, line, toCoords } from "./utils";

function noop() {}

const HEIGHT = 40;
const DPI_HEIGHT = HEIGHT * 2;

export function sliderChart(root, data, DPI_WIDTH) {
  const WIDTH = DPI_WIDTH / 2;
  const MIN_WIDTH = WIDTH * 0.1;
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  let nextFn = noop;
  canvas.style.width = WIDTH + "px";
  canvas.style.height = HEIGHT + "px";
  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;

  const $left = root.querySelector('[data-el="left"]');
  const $window = root.querySelector('[data-el="window"]');
  const $right = root.querySelector('[data-el="right"]');

  function mousedown(e) {
    const type = e.target.dataset.type;
    const dimensions = {
      left: parseInt($window.style.left),
      right: parseInt($window.style.right),
      width: parseInt($window.style.width),
    };

    if (type === "window") {
      const startX = e.pageX;
      document.onmousemove = (e) => {
        const delta = startX - e.pageX;
        if (delta === 0) {
          return;
        }
        const left = dimensions.left - delta;
        const right = WIDTH - left - dimensions.width;

        setPosition(left, right);
        next();
      };
    } else if (type === "left" || type === "right") {
      const startX = e.pageX;
      document.onmousemove = (e) => {
        const delta = startX - e.pageX;
        if (delta === 0) {
          return;
        }

        if (type === "left") {
          const left = WIDTH - (dimensions.width + delta) - dimensions.right;
          const right = dimensions.right;

          setPosition(left, right);
        }
        if (type === "right") {
          const left = dimensions.left;
          const right = WIDTH - (dimensions.width - delta) - dimensions.left;

          setPosition(left, right);
        }
        next();
      };
    }
  }

  function mouseup() {
    document.onmousemove = null;
  }

  root.addEventListener("mousedown", mousedown);
  document.addEventListener("mouseup", mouseup);

  const defaultWidth = WIDTH * 0.3;
  setPosition(0, WIDTH - defaultWidth);

  function setPosition(left, right) {
    const w = WIDTH - right - left;

    if (w < MIN_WIDTH) {
      css($window, { width: MIN_WIDTH + "px" });
      return;
    }
    if (left < 0) {
      css($window, { left: "0px" });
      css($left, { width: "0px" });
      return;
    }
    if (right < 0) {
      css($window, { right: "0px" });
      css($right, { width: "0px" });
      return;
    }
    css($window, {
      width: w + "px",
      left: left + "px",
      right: right + "px",
    });

    css($right, {
      width: right + "px",
    });
    css($left, {
      width: left + "px",
    });
  }

  function getPosition() {
    const left = parseInt($window.style.left);
    const right = WIDTH - parseInt($window.style.right);

    return [(left * 100) / WIDTH, (right * 100) / WIDTH];
  }

  const [yMin, yMax] = boundaries(data);

  const yRatio = computeYRatio(DPI_HEIGHT, yMax, yMin);
  const xRatio = computeXRatio(DPI_WIDTH, data.columns[0].length);

  const yData = data.columns.filter((col) => data.types[col[0]] === "line");

  yData.forEach((col) => {
    const name = col[0];
    const color = data.colors[name];
    const coords = col.map(toCoords(xRatio, yRatio, DPI_HEIGHT, 0, yMin)).slice(1);
    line(ctx, coords, { color: color });
  });

  function next() {
    nextFn(getPosition());
  }

  return {
    subscribe(fn) {
      nextFn = fn;
      fn(getPosition());
    },
  };
}
