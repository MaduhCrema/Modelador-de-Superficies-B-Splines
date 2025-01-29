 // B-Spline Surface class implementation
 class BSplineSurface {
  constructor(nRows, nCols, uStep, vStep) {
      this.nRows = nRows;
      this.nCols = nCols;
      this.uStep = uStep;
      this.vStep = vStep;
      this.degree = 3;
      this.controlPoints = [];
      this.knotsU = [];
      this.knotsV = [];
      this.initializeControlPoints();
      this.generateKnots();
  }

  initializeControlPoints() {
      for (let i = 0; i < this.nRows; i++) {
          this.controlPoints[i] = [];
          for (let j = 0; j < this.nCols; j++) {
              this.controlPoints[i][j] = {
                  x: (j - (this.nCols-1)/2) * 2,
                  y: (i - (this.nRows-1)/2) * 2,
                  z: Math.sin(Math.PI * i/this.nRows) * Math.cos(Math.PI * j/this.nCols) * 2
              };
          }
      }
  }

  generateKnots() {
      const nKnotsU = this.nRows + this.degree + 1;
      const nKnotsV = this.nCols + this.degree + 1;

      for (let i = 0; i < nKnotsU; i++) {
          if (i < this.degree) {
              this.knotsU[i] = 0;
          } else if (i > this.nRows) {
              this.knotsU[i] = 1;
          } else {
              this.knotsU[i] = (i - this.degree) / (this.nRows - this.degree + 1);
          }
      }

      for (let i = 0; i < nKnotsV; i++) {
          if (i < this.degree) {
              this.knotsV[i] = 0;
          } else if (i > this.nCols) {
              this.knotsV[i] = 1;
          } else {
              this.knotsV[i] = (i - this.degree) / (this.nCols - this.degree + 1);
          }
      }
  }

  basisFunction(t, i, k, knots) {
      if (k === 0) {
          return (t >= knots[i] && t < knots[i + 1]) ? 1 : 0;
      }

      let w1 = 0;
      let w2 = 0;

      if (knots[i + k] - knots[i] !== 0) {
          w1 = ((t - knots[i]) / (knots[i + k] - knots[i])) * 
               this.basisFunction(t, i, k - 1, knots);
      }

      if (knots[i + k + 1] - knots[i + 1] !== 0) {
          w2 = ((knots[i + k + 1] - t) / (knots[i + k + 1] - knots[i + 1])) * 
               this.basisFunction(t, i + 1, k - 1, knots);
      }

      return w1 + w2;
  }

  calculatePoint(u, v) {
      let point = { x: 0, y: 0, z: 0 };
      let weightSum = 0;

      for (let i = 0; i < this.nRows; i++) {
          for (let j = 0; j < this.nCols; j++) {
              const basisU = this.basisFunction(u, i, this.degree, this.knotsU);
              const basisV = this.basisFunction(v, j, this.degree, this.knotsV);
              const weight = basisU * basisV;

              point.x += this.controlPoints[i][j].x * weight;
              point.y += this.controlPoints[i][j].y * weight;
              point.z += this.controlPoints[i][j].z * weight;
              weightSum += weight;
          }
      }

      if (weightSum > 0) {
          point.x /= weightSum;
          point.y /= weightSum;
          point.z /= weightSum;
      }

      return point;
  }

  generateSurfacePoints() {
      const surfacePoints = [];
      for (let u = 0; u <= 1; u += this.uStep) {
          const row = [];
          for (let v = 0; v <= 1; v += this.vStep) {
              row.push(this.calculatePoint(u, v));
          }
          surfacePoints.push(row);
      }
      return surfacePoints;
  }

  getControlPoints() {
      return this.controlPoints;
  }

  updateControlPoint(i, j, newPoint) {
    this.controlPoints[i][j] = newPoint;
}
}

// Global variables for interaction
let surface;  // será nossa superfície global
let isDragging = false;
let selectedPoint = null;
let scale = 80;             // Adicione esta linha
let offsetX = 400;          // Adicione esta linha
let offsetY = 300;          // Adicione esta linha

// Canvas rendering functions
function project3DTo2D(point, scale = 100, rotationX = 0.5, rotationY = 0.5) {
  const x = point.x;
  const y = point.y * Math.cos(rotationX) - point.z * Math.sin(rotationX);
  const z = point.y * Math.sin(rotationX) + point.z * Math.cos(rotationX);
  
  return {
      x: x * Math.cos(rotationY) - z * Math.sin(rotationY),
      y: y
  };
}

function findNearestControlPoint(x, y) {
  const controlPoints = surface.getControlPoints();
  let minDist = Infinity;
  let nearest = null;

  for (let i = 0; i < controlPoints.length; i++) {
      for (let j = 0; j < controlPoints[i].length; j++) {
          const point = project3DTo2D(controlPoints[i][j]);
          const screenX = point.x * scale + offsetX;
          const screenY = point.y * scale + offsetY;
          
          const dist = Math.sqrt(
              Math.pow(screenX - x, 2) + 
              Math.pow(screenY - y, 2)
          );

          if (dist < minDist && dist < 20) {
              minDist = dist;
              nearest = { i, j };
          }
      }
  }

  return nearest;
}

function drawSurface(points, controlPoints) {
  const canvas = document.getElementById('surfaceCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = 80;
  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;

  // Draw surface grid
  for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points[i].length; j++) {
          const current = project3DTo2D(points[i][j], scale);
          
          // Draw to next point in row
          if (j < points[i].length - 1) {
              const next = project3DTo2D(points[i][j + 1], scale);
              ctx.beginPath();
              ctx.moveTo(current.x * scale + offsetX, current.y * scale + offsetY);
              ctx.lineTo(next.x * scale + offsetX, next.y * scale + offsetY);
              ctx.strokeStyle = 'black';
              ctx.stroke();
          }

          // Draw to next point in column
          if (i < points.length - 1) {
              const next = project3DTo2D(points[i + 1][j], scale);
              ctx.beginPath();
              ctx.moveTo(current.x * scale + offsetX, current.y * scale + offsetY);
              ctx.lineTo(next.x * scale + offsetX, next.y * scale + offsetY);
              ctx.strokeStyle = 'black';
              ctx.stroke();
          }

          // Fill quadrilateral
          if (i < points.length - 1 && j < points[i].length - 1) {
              const p1 = project3DTo2D(points[i][j], scale);
              const p2 = project3DTo2D(points[i][j + 1], scale);
              const p3 = project3DTo2D(points[i + 1][j + 1], scale);
              const p4 = project3DTo2D(points[i + 1][j], scale);

              ctx.beginPath();
              ctx.moveTo(p1.x * scale + offsetX, p1.y * scale + offsetY);
              ctx.lineTo(p2.x * scale + offsetX, p2.y * scale + offsetY);
              ctx.lineTo(p3.x * scale + offsetX, p3.y * scale + offsetY);
              ctx.lineTo(p4.x * scale + offsetX, p4.y * scale + offsetY);
              ctx.closePath();
              ctx.fillStyle = 'white';
              ctx.fill();
              ctx.strokeStyle = 'black';
              ctx.stroke();
          }
      }
  }

  // Draw control points
  for (let i = 0; i < controlPoints.length; i++) {
      for (let j = 0; j < controlPoints[i].length; j++) {
          const point = project3DTo2D(controlPoints[i][j], scale);
          
          ctx.beginPath();
          ctx.arc(
              point.x * scale + offsetX,
              point.y * scale + offsetY,
              4, // radius
              0,
              2 * Math.PI
          );
          // No loop que desenha os pontos de controle, modifique a cor do preenchimento:
          ctx.fillStyle = selectedPoint && selectedPoint.i === i && selectedPoint.j === j ? 'yellow' : 'red';
          ctx.fill();
      }
  }
}

function generateSurface() {
  const nRows = parseInt(document.getElementById('nRows').value);
  const nCols = parseInt(document.getElementById('nCols').value);
  const uStep = parseFloat(document.getElementById('uStep').value);
  const vStep = parseFloat(document.getElementById('vStep').value);

  surface = new BSplineSurface(nRows, nCols, uStep, vStep);
  redrawSurface();
}

function redrawSurface() {
  const points = surface.generateSurfacePoints();
  const controlPoints = surface.getControlPoints();
  drawSurface(points, controlPoints);
}

const canvas = document.getElementById('surfaceCanvas');

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectedPoint = findNearestControlPoint(x, y);
    if (selectedPoint) {
        isDragging = true;
        redrawSurface();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedPoint) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - offsetX) / scale;
        const y = (e.clientY - rect.top - offsetY) / scale;
        
        const controlPoints = surface.getControlPoints();
        const currentPoint = controlPoints[selectedPoint.i][selectedPoint.j];
        
        // Atualiza apenas y e z mantendo x constante
        currentPoint.y = y;
        currentPoint.z += (y - currentPoint.y) * 0.5;
        
        surface.updateControlPoint(selectedPoint.i, selectedPoint.j, currentPoint);
        redrawSurface();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    selectedPoint = null;
    redrawSurface();
});