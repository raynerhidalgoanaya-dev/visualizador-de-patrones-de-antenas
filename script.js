// ========= Estado =========
const appState = {
antennaType: "dipole",
viewMode: "gain",
dipoleLength: 0.5,
monopoleLength: 0.25,
elementSpacing: 0.5,
phaseDifference: 0,
directorElements: 3,
autoUpdate: true,
lastUpdateTime: new Date()
};

// ========= DOM =========
const elements = {
antennaTypeRadios: document.querySelectorAll('input[name="antenna-type"]'),
controlGroups: document.querySelectorAll(".control-group"),
resetBtn: document.getElementById("reset-btn"),
screenshotBtn: document.getElementById("screenshot-btn"),
azimuthCanvas: document.getElementById("azimuth-pattern"),
elevationCanvas: document.getElementById("elevation-pattern"),
pattern3DCanvas: document.getElementById("3d-pattern"),
gainValue: document.getElementById("gain-value"),
beamwidthValue: document.getElementById("beamwidth-value"),
fbRatioValue: document.getElementById("fb-ratio-value"),
efficiencyValue: document.getElementById("efficiency-value"),
lastUpdate: document.getElementById("last-update"),
sliders: {
dipole: {
el: document.getElementById("dipole-length"),
out: document.getElementById("dipole-length-value"),
format: v => v.toFixed(2),
set: v => { appState.dipoleLength = v; }
},
monopole: {
el: document.getElementById("monopole-length"),
out: document.getElementById("monopole-length-value"),
format: v => v.toFixed(2),
set: v => { appState.monopoleLength = v; }
},
spacing: {
el: document.getElementById("element-spacing"),
out: document.getElementById("element-spacing-value"),
format: v => v.toFixed(2),
set: v => { appState.elementSpacing = v; }
},
phase: {
el: document.getElementById("phase-difference"),
out: document.getElementById("phase-difference-value"),
format: v => `${v}°`,
set: v => { appState.phaseDifference = v; }
},
directors: {
el: document.getElementById("director-elements"),
out: document.getElementById("director-elements-value"),
format: v => String(v),
set: v => { appState.directorElements = v; }
}
},
panels: document.querySelectorAll(".visualization-panel"),
updateIndicators: document.querySelectorAll(".auto-update-indicator")
};
const azimuthCtx = elements.azimuthCanvas.getContext("2d");
const elevationCtx = elements.elevationCanvas.getContext("2d");
const pattern3DCtx = elements.pattern3DCanvas.getContext("2d");

// ========= Init =========
document.addEventListener("DOMContentLoaded", () => {
setupEventListeners();
updateVisualization();
updateParameters();
updateTimestamp();
setInterval(updateTimestamp, 1000);
});

// ========= Funciones de Actualización Automática =========
function updateTimestamp() {
const now = new Date();
const timeString = now.toLocaleTimeString('es-ES');
elements.lastUpdate.textContent = timeString;
}

function showUpdateIndicators() {
elements.updateIndicators.forEach(indicator => {
indicator.style.opacity = '1';
});
}

function hideUpdateIndicators() {
setTimeout(() => {
elements.updateIndicators.forEach(indicator => {
indicator.style.opacity = '0';
});
}, 500);
}

// ========= Eventos =========
function setupEventListeners() {
elements.antennaTypeRadios.forEach(radio => {
radio.addEventListener("change", handleAntennaTypeChange);
});

Object.entries(elements.sliders).forEach(([key, slider]) => {
slider.el.addEventListener("input", () => {
const raw = slider.el.value;
const value = raw.includes(".") ? parseFloat(raw) : parseInt(raw, 10);
slider.out.textContent = slider.format(value);
slider.out.parentElement.classList.add('updating');
slider.set(value);
showUpdateIndicators();
appState.lastUpdateTime = new Date();
updateTimestamp();
updateVisualization();
updateParameters();
hideUpdateIndicators();
setTimeout(() => {
slider.out.parentElement.classList.remove('updating');
}, 500);
});
});

elements.panels.forEach(panel => {
const buttons = panel.querySelectorAll(".view-option");
buttons.forEach(btn => {
btn.addEventListener("click", () => {
buttons.forEach(b => b.classList.remove("active"));
btn.classList.add("active");
appState.viewMode = btn.dataset.view;
showUpdateIndicators();
appState.lastUpdateTime = new Date();
updateTimestamp();
updateVisualization();
hideUpdateIndicators();
});
});
});

elements.resetBtn.addEventListener("click", resetValues);
elements.screenshotBtn.addEventListener("click", captureScreenshot);
}

function handleAntennaTypeChange(e) {
appState.antennaType = e.target.value;
elements.controlGroups.forEach(g => g.classList.remove("active"));
const group = document.getElementById(`${appState.antennaType}-controls`);
if (group) group.classList.add("active");
showUpdateIndicators();
appState.lastUpdateTime = new Date();
updateTimestamp();
updateVisualization();
updateParameters();
hideUpdateIndicators();
}

function resetValues() {
const defaults = {
dipoleLength: 0.5,
monopoleLength: 0.25,
elementSpacing: 0.5,
phaseDifference: 0,
directorElements: 3
};
Object.assign(appState, defaults);
elements.sliders.dipole.el.value = defaults.dipoleLength;
elements.sliders.dipole.out.textContent = "0.50";
elements.sliders.monopole.el.value = defaults.monopoleLength;
elements.sliders.monopole.out.textContent = "0.25";
elements.sliders.spacing.el.value = defaults.elementSpacing;
elements.sliders.spacing.out.textContent = "0.50";
elements.sliders.phase.el.value = defaults.phaseDifference;
elements.sliders.phase.out.textContent = "0°";
elements.sliders.directors.el.value = defaults.directorElements;
elements.sliders.directors.out.textContent = "3";
showUpdateIndicators();
appState.lastUpdateTime = new Date();
updateTimestamp();
updateVisualization();
updateParameters();
hideUpdateIndicators();
}

// ========= Render =========
function updateVisualization() {
clearCanvas(azimuthCtx, elements.azimuthCanvas);
clearCanvas(elevationCtx, elements.elevationCanvas);
clearCanvas(pattern3DCtx, elements.pattern3DCanvas);

switch (appState.antennaType) {
case "dipole":
drawDipolePattern();
break;
case "monopole":
drawMonopolePattern();
break;
case "array":
drawArrayPattern();
break;
case "yagi":
drawYagiPattern();
break;
}
}

function updateParameters() {
switch (appState.antennaType) {
case "dipole":
calculateDipoleParameters();
break;
case "monopole":
calculateMonopoleParameters();
break;
case "array":
calculateArrayParameters();
break;
case "yagi":
calculateYagiParameters();
break;
}
document.querySelectorAll('.result-value').forEach(el => {
el.classList.add('updating');
setTimeout(() => el.classList.remove('updating'), 500);
});
}

function clearCanvas(ctx, canvas) {
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "rgba(0,0,0,0.2)";
ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function canvasGeometry(canvas) {
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const maxRadius = Math.min(centerX, centerY) - 20;
return { centerX, centerY, maxRadius };
}

function drawDipolePattern() {
const { centerX, centerY, maxRadius } = canvasGeometry(elements.azimuthCanvas);
drawConcentricCircles(azimuthCtx, centerX, centerY, maxRadius);
drawConcentricCircles(elevationCtx, centerX, centerY, maxRadius);
const patternData = calculateDipolePattern(appState.dipoleLength);
drawPolarPattern(azimuthCtx, centerX, centerY, maxRadius, patternData.azimuth);
drawPolarPattern(elevationCtx, centerX, centerY, maxRadius, patternData.elevation);
draw3DPattern(patternData);
}

function drawMonopolePattern() {
const { centerX, centerY, maxRadius } = canvasGeometry(elements.azimuthCanvas);
drawConcentricCircles(azimuthCtx, centerX, centerY, maxRadius);
drawConcentricCircles(elevationCtx, centerX, centerY, maxRadius);
const patternData = calculateMonopolePattern(appState.monopoleLength);
drawPolarPattern(azimuthCtx, centerX, centerY, maxRadius, patternData.azimuth);
drawPolarPattern(elevationCtx, centerX, centerY, maxRadius, patternData.elevation);
draw3DPattern(patternData);
}

function drawArrayPattern() {
const { centerX, centerY, maxRadius } = canvasGeometry(elements.azimuthCanvas);
drawConcentricCircles(azimuthCtx, centerX, centerY, maxRadius);
drawConcentricCircles(elevationCtx, centerX, centerY, maxRadius);
const spacing = appState.elementSpacing;
const phaseDiffRad = (appState.phaseDifference * Math.PI) / 180;
const patternData = calculateArrayPattern(spacing, phaseDiffRad);
drawPolarPattern(azimuthCtx, centerX, centerY, maxRadius, patternData.azimuth);
drawPolarPattern(elevationCtx, centerX, centerY, maxRadius, patternData.elevation);
draw3DPattern(patternData);
}

function drawYagiPattern() {
const { centerX, centerY, maxRadius } = canvasGeometry(elements.azimuthCanvas);
drawConcentricCircles(azimuthCtx, centerX, centerY, maxRadius);
drawConcentricCircles(elevationCtx, centerX, centerY, maxRadius);
const patternData = calculateYagiPattern(appState.directorElements);
drawPolarPattern(azimuthCtx, centerX, centerY, maxRadius, patternData.azimuth);
drawPolarPattern(elevationCtx, centerX, centerY, maxRadius, patternData.elevation);
draw3DPattern(patternData);
}

function drawConcentricCircles(ctx, centerX, centerY, maxRadius) {
ctx.strokeStyle = "rgba(255,255,255,0.2)";
ctx.lineWidth = 1;
for (let i = 1; i <= 5; i++) {
ctx.beginPath();
ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, 2 * Math.PI);
ctx.stroke();
}
ctx.beginPath();
ctx.moveTo(centerX - maxRadius, centerY);
ctx.lineTo(centerX + maxRadius, centerY);
ctx.moveTo(centerX, centerY - maxRadius);
ctx.lineTo(centerX, centerY + maxRadius);
ctx.stroke();
ctx.fillStyle = "rgba(255,255,255,0.7)";
ctx.font = "12px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("0°", centerX + maxRadius + 15, centerY);
ctx.fillText("90°", centerX, centerY - maxRadius - 15);
ctx.fillText("180°", centerX - maxRadius - 15, centerY);
ctx.fillText("270°", centerX, centerY + maxRadius + 15);
}

function drawPolarPattern(ctx, centerX, centerY, maxRadius, patternData) {
ctx.save();
const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
gradient.addColorStop(0, "rgba(255,0,0,0.8)");
gradient.addColorStop(0.25, "rgba(255,255,0,0.8)");
gradient.addColorStop(0.5, "rgba(0,255,0,0.8)");
gradient.addColorStop(0.75, "rgba(0,255,255,0.8)");
gradient.addColorStop(1, "rgba(0,0,255,0.8)");
ctx.fillStyle = gradient;
ctx.strokeStyle = "rgba(255,255,255,0.8)";
ctx.lineWidth = 2;
ctx.beginPath();
for (let angle = 0; angle <= 360; angle += 2) {
const rad = (angle * Math.PI) / 180;
const value = patternData[angle] ?? 0;
const radius = maxRadius * clamp01(value);
const x = centerX + radius * Math.cos(rad);
const y = centerY + radius * Math.sin(rad);
if (angle === 0) {
ctx.moveTo(x, y);
} else {
ctx.lineTo(x, y);
}
}
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.restore();
}

// ========= 3D =========
function draw3DPattern(patternData) {
const centerX = elements.pattern3DCanvas.width / 2;
const centerY = elements.pattern3DCanvas.height / 2;
const maxRadius = Math.min(centerX, centerY) - 40;
clearCanvas(pattern3DCtx, elements.pattern3DCanvas);
draw3DAxes(centerX, centerY, maxRadius);
const thetaSteps = 36;
const phiSteps = 18;
for (let i = 0; i < thetaSteps; i++) {
const theta = (i / thetaSteps) * 2 * Math.PI;
const thetaNext = ((i + 1) / thetaSteps) * 2 * Math.PI;
for (let j = 0; j < phiSteps; j++) {
const phi = (j / phiSteps) * Math.PI;
const phiNext = ((j + 1) / phiSteps) * Math.PI;
const degT = Math.round((theta * 180 / Math.PI) % 360);
const degT2 = Math.round((thetaNext * 180 / Math.PI) % 360);
const v1 = patternData.azimuth[degT] ?? 0;
const v2 = patternData.azimuth[degT2] ?? 0;
const e1 = Math.sin(phi);
const e2 = Math.sin(phiNext);
const r1 = maxRadius * v1 * e1;
const r2 = maxRadius * v2 * e1;
const r3 = maxRadius * v1 * e2;
const r4 = maxRadius * v2 * e2;
const p1 = project3DTo2D(r1 * Math.cos(theta), r1 * Math.sin(theta), r1 * Math.cos(phi));
const p2 = project3DTo2D(r2 * Math.cos(thetaNext), r2 * Math.sin(thetaNext), r2 * Math.cos(phi));
const p3 = project3DTo2D(r3 * Math.cos(theta), r3 * Math.sin(theta), r3 * Math.cos(phiNext));
const p4 = project3DTo2D(r4 * Math.cos(thetaNext), r4 * Math.sin(thetaNext), r4 * Math.cos(phiNext));
pattern3DCtx.beginPath();
pattern3DCtx.moveTo(centerX + p1.x, centerY - p1.y);
pattern3DCtx.lineTo(centerX + p2.x, centerY - p2.y);
pattern3DCtx.lineTo(centerX + p4.x, centerY - p4.y);
pattern3DCtx.lineTo(centerX + p3.x, centerY - p3.y);
pattern3DCtx.closePath();
const intensity = clamp01((v1 + v2) / 2) * clamp01((e1 + e2) / 2);
pattern3DCtx.fillStyle = getColorForIntensity(intensity);
pattern3DCtx.fill();
pattern3DCtx.strokeStyle = "rgba(255,255,255,0.2)";
pattern3DCtx.lineWidth = 0.5;
pattern3DCtx.stroke();
}
}
}

function draw3DAxes(centerX, centerY, maxRadius) {
pattern3DCtx.strokeStyle = "rgba(255,255,255,0.5)";
pattern3DCtx.lineWidth = 1;
const xEnd = project3DTo2D(maxRadius, 0, 0);
pattern3DCtx.beginPath();
pattern3DCtx.moveTo(centerX, centerY);
pattern3DCtx.lineTo(centerX + xEnd.x, centerY - xEnd.y);
pattern3DCtx.stroke();
const yEnd = project3DTo2D(0, maxRadius, 0);
pattern3DCtx.beginPath();
pattern3DCtx.moveTo(centerX, centerY);
pattern3DCtx.lineTo(centerX + yEnd.x, centerY - yEnd.y);
pattern3DCtx.stroke();
const zEnd = project3DTo2D(0, 0, maxRadius);
pattern3DCtx.beginPath();
pattern3DCtx.moveTo(centerX, centerY);
pattern3DCtx.lineTo(centerX + zEnd.x, centerY - zEnd.y);
pattern3DCtx.stroke();
pattern3DCtx.fillStyle = "rgba(255,255,255,0.7)";
pattern3DCtx.font = "12px Arial";
pattern3DCtx.fillText("X", centerX + xEnd.x + 10, centerY - xEnd.y);
pattern3DCtx.fillText("Y", centerX + yEnd.x + 10, centerY - yEnd.y);
pattern3DCtx.fillText("Z", centerX + zEnd.x + 10, centerY - zEnd.y);
}

function project3DTo2D(x, y, z) {
const scale = 0.866;
return { x: (x - y) * scale, y: (x + y) * 0.5 - z };
}

function getColorForIntensity(intensity) {
const t = clamp01(intensity);
let r, g, b;
if (t < 0.25) {
const u = t * 4; r = 0; g = Math.round(255 * u); b = 255;
} else if (t < 0.5) {
const u = (t - 0.25) * 4; r = 0; g = 255; b = Math.round(255 * (1 - u));
} else if (t < 0.75) {
const u = (t - 0.5) * 4; r = Math.round(255 * u); g = 255; b = 0;
} else {
const u = (t - 0.75) * 4; r = 255; g = Math.round(255 * (1 - u)); b = 0;
}
return `rgba(${r},${g},${b},0.7)`;
}

function clamp01(x){ return Math.max(0, Math.min(1, x)); }

// ========= Patrones =========
function calculateDipolePattern(lengthRatio) {
const azimuth = {};
const elevation = {};
for (let a = 0; a <= 360; a++) azimuth[a] = 1.0;
let max = 0;
const tmp = [];
for (let a = 0; a <= 360; a++) {
const theta = (a * Math.PI) / 180;
const kl = Math.PI * lengthRatio;
const num = Math.cos(kl * Math.cos(theta)) - Math.cos(kl);
const den = Math.sin(theta);
let v = 0;
if (Math.abs(den) > 1e-6) {
v = Math.abs(num / den);
}
tmp[a] = v;
max = Math.max(max, v);
}
max = max || 1;
for (let a = 0; a <= 360; a++) {
elevation[a] = tmp[a] / max;
}
return { azimuth, elevation };
}

function calculateMonopolePattern(lengthRatio) {
const azimuth = {};
const elevation = {};
for (let a = 0; a <= 360; a++) azimuth[a] = 1.0;
let max = 0;
const tmp = [];
for (let a = 0; a <= 360; a++) {
const theta = (a * Math.PI) / 180;
let v = 0;
if (theta >= 0 && theta <= Math.PI) {
const kl = Math.PI * lengthRatio;
const num = Math.cos(kl * Math.cos(theta)) - Math.cos(kl);
const den = Math.sin(theta);
if (Math.abs(den) > 1e-6) {
v = Math.abs(num / den);
}
}
tmp[a] = v;
max = Math.max(max, v);
}
max = max || 1;
for (let a = 0; a <= 360; a++) {
elevation[a] = tmp[a] / max;
}
return { azimuth, elevation };
}

function calculateArrayPattern(spacing, phaseDiffRad) {
const azimuth = {};
const elevation = {};
let maxA = 0, maxE = 0;
const tmpA = [], tmpE = [];
for (let angle = 0; angle <= 360; angle++) {
const theta = (angle * Math.PI) / 180;
const psiA = 2 * Math.PI * spacing * Math.cos(theta) + phaseDiffRad;
const afA = Math.abs(2 * Math.cos(psiA / 2));
const epA = Math.abs(Math.sin(theta));
const vA = afA * epA;
tmpA[angle] = vA;
maxA = Math.max(maxA, vA);
const psiE = 2 * Math.PI * spacing * Math.sin(theta) + phaseDiffRad;
const afE = Math.abs(2 * Math.cos(psiE / 2));
const epE = Math.abs(Math.sin(theta));
const vE = afE * epE;
tmpE[angle] = vE;
maxE = Math.max(maxE, vE);
}
maxA = maxA || 1;
maxE = maxE || 1;
for (let a = 0; a <= 360; a++) {
azimuth[a] = tmpA[a] / maxA;
elevation[a] = tmpE[a] / maxE;
}
return { azimuth, elevation };
}

function calculateYagiPattern(directors) {
const azimuth = {};
const elevation = {};
const directivity = 0.15 * directors;
const bwA = 180 / (1 + 2 * directivity);
const bwE = 120 / (1 + 2 * directivity);
for (let a = 0; a <= 360; a++) {
const theta = (a * Math.PI) / 180;
let vA = 0;
if (Math.abs(theta) < (bwA * Math.PI / 180) / 2 ||
Math.abs(theta - 2*Math.PI) < (bwA * Math.PI / 180) / 2) {
const normAngle = (theta * 180 / Math.PI) / bwA;
vA = Math.cos(normAngle * Math.PI / 2);
vA = Math.max(0, vA);
vA = Math.pow(vA, 1 / (1 + directivity));
}
const sideLobeLevel = 0.15 / (1 + directivity);
if (vA < sideLobeLevel) {
vA = sideLobeLevel * Math.abs(Math.sin(theta * (3 + directors)));
}
azimuth[a] = vA;
let vE = 0;
if (Math.abs(theta - Math.PI/2) < (bwE * Math.PI / 180) / 2) {
const normAngle = ((theta - Math.PI/2) * 180 / Math.PI) / bwE;
vE = Math.cos(normAngle * Math.PI / 2);
vE = Math.max(0, vE);
vE = Math.pow(vE, 1 / (1 + directivity));
}
const sideLobeLevelE = 0.1 / (1 + directivity);
if (vE < sideLobeLevelE) {
vE = sideLobeLevelE * Math.abs(Math.sin((theta - Math.PI/2) * (3 + directors)));
}
elevation[a] = vE;
}
const maxA = Math.max(...Object.values(azimuth)) || 1;
const maxE = Math.max(...Object.values(elevation)) || 1;
for (let a = 0; a <= 360; a++) {
azimuth[a] = azimuth[a] / maxA;
elevation[a] = elevation[a] / maxE;
}
return { azimuth, elevation };
}

// ========= Cálculos de Parámetros =========
function calculateDipoleParameters() {
const L = appState.dipoleLength;
let gain = 2.15;
if (L < 0.5) {
gain = 2.15 - 4 * Math.abs(0.5 - L);
} else if (L > 0.5) {
gain = 2.15 - 3 * (L - 0.5);
}
gain = Math.max(0, gain);
const beamwidth = 78 * Math.exp(-0.5 * Math.abs(L - 0.5));
const fbRatio = 20 + 15 * Math.exp(-2 * Math.abs(L - 0.5));
const efficiency = 95 - 20 * Math.abs(L - 0.5);
elements.gainValue.textContent = `${gain.toFixed(2)} dBi`;
elements.beamwidthValue.textContent = `${Math.round(beamwidth)}°`;
elements.fbRatioValue.textContent = `${fbRatio.toFixed(1)} dB`;
elements.efficiencyValue.textContent = `${Math.max(50, Math.round(efficiency))}%`;
}

function calculateMonopoleParameters() {
const L = appState.monopoleLength;
let gain = 5.15;
if (L < 0.25) {
gain = 5.15 - 4 * Math.abs(0.25 - L);
} else if (L > 0.25) {
gain = 5.15 - 3 * (L - 0.25);
}
gain = Math.max(0, gain);
const beamwidth = 78 * Math.exp(-0.5 * Math.abs(L - 0.25));
const fbRatio = 30 + 20 * Math.exp(-2 * Math.abs(L - 0.25));
const efficiency = 95 - 20 * Math.abs(L - 0.25);
elements.gainValue.textContent = `${gain.toFixed(2)} dBi`;
elements.beamwidthValue.textContent = `${Math.round(beamwidth)}°`;
elements.fbRatioValue.textContent = `${fbRatio.toFixed(1)} dB`;
elements.efficiencyValue.textContent = `${Math.max(50, Math.round(efficiency))}%`;
}

function calculateArrayParameters() {
const spacing = appState.elementSpacing;
const phaseDeg = appState.phaseDifference;
const phaseRad = phaseDeg * Math.PI / 180;
const arrayFactor = 2 * Math.cos(phaseRad / 2);
const elementGain = 2.15;
const arrayGain = 10 * Math.log10(2 * Math.abs(arrayFactor));
const gain = elementGain + arrayGain;
const beamwidth = 78 / (1 + spacing);
const fbRatio = 20 + 30 * Math.abs(Math.cos(phaseRad));
const efficiency = 90 + 5 * Math.abs(Math.cos(phaseRad));
elements.gainValue.textContent = `${gain.toFixed(2)} dBi`;
elements.beamwidthValue.textContent = `${Math.round(beamwidth)}°`;
elements.fbRatioValue.textContent = `${fbRatio.toFixed(1)} dB`;
elements.efficiencyValue.textContent = `${Math.round(efficiency)}%`;
}

function calculateYagiParameters() {
const directors = appState.directorElements;
const gain = 7.5 + 2.2 * directors;
const beamwidth = 65 / (1 + 0.4 * directors);
const fbRatio = 12 + 6 * directors;
const efficiency = Math.min(95, 80 + 1.5 * directors);
elements.gainValue.textContent = `${gain.toFixed(2)} dBi`;
elements.beamwidthValue.textContent = `${Math.round(beamwidth)}°`;
elements.fbRatioValue.textContent = `${fbRatio.toFixed(1)} dB`;
elements.efficiencyValue.textContent = `${Math.round(efficiency)}%`;
}

// ========= Screenshot =========
function captureScreenshot() {
const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d");
tempCanvas.width = 1200;
tempCanvas.height = 1000;
const bg = tempCtx.createLinearGradient(0, 0, 1200, 1000);
bg.addColorStop(0, "#0a2463");
bg.addColorStop(1, "#000000");
tempCtx.fillStyle = bg;
tempCtx.fillRect(0, 0, 1200, 1000);
tempCtx.fillStyle = "#ffffff";
tempCtx.font = "bold 24px Arial";
tempCtx.textAlign = "center";
tempCtx.fillText(`Patrón de Radiación - ${getAntennaTypeName()}`, 600, 40);
tempCtx.drawImage(elements.azimuthCanvas, 50, 80);
tempCtx.drawImage(elements.elevationCanvas, 650, 80);
tempCtx.drawImage(elements.pattern3DCanvas, 200, 500);
tempCtx.fillStyle = "#ffffff";
tempCtx.font = "16px Arial";
tempCtx.textAlign = "left";
tempCtx.fillText("Parámetros:", 50, 950);
tempCtx.fillText(`Ganancia: ${elements.gainValue.textContent}`, 200, 950);
tempCtx.fillText(`Ancho de Haz: ${elements.beamwidthValue.textContent}`, 400, 950);
tempCtx.fillText(`Frente-Espalda: ${elements.fbRatioValue.textContent}`, 600, 950);
tempCtx.fillText(`Eficiencia: ${elements.efficiencyValue.textContent}`, 850, 950);
tempCanvas.toBlob(blob => {
if (!blob) return;
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `antenna-pattern-${appState.antennaType}-${Date.now()}.png`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
});
}

function getAntennaTypeName() {
switch (appState.antennaType) {
case "dipole": return "Dipolo Simple";
case "monopole": return "Monopolo";
case "array": return "Arreglo de Dos Elementos";
case "yagi": return "Antena Yagi";
default: return "Desconocido";
}
}