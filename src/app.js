import { chart } from "./chart";
import { getChartData } from "./data";
import "./styles.scss";

const canvas = document.getElementById("chart");
const tgChart = chart(canvas, getChartData());
tgChart.init();
