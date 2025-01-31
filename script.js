 // B-Spline Surface class implementation
 class BSplineSurface {
  constructor(nRows, nCols, uStep, vStep) {
      this.nRows = nRows;
      this.nCols = nCols;
      this.uStep = uStep;
      this.vStep = vStep;
      this.degree = 3;
      this.controlPoints = [];
      this.surfacePoints = []; // Nova estrutura
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

  getSurfacePoints() {
    return this.surfacePoints;
}

updateControlPoint(i, j, newPoint) {
    // Atualiza as coordenadas x e y do ponto de controle, mantendo z
    this.controlPoints[i][j] = {
        x: newPoint.x,
        y: newPoint.y,
        z: this.controlPoints[i][j].z
    };
    
    // Recalcula os pontos da superfície com base nos pontos de controle atualizados
    this.surfacePoints = this.generateSurfacePoints();
    return this.surfacePoints;
}
}

// Global variables for interaction
let surface;
let isDragging = false;
let selectedPoint = null;
let scale = 80;
let offsetX = 400;
let offsetY = 300;
const canvas = document.getElementById('surfaceCanvas');

function findNearestControlPoint(x, y) {
    const controlPoints = surface.getControlPoints();
    let minDist = Infinity;
    let nearest = null;

    for (let i = 0; i < controlPoints.length; i++) {
        for (let j = 0; j < controlPoints[i].length; j++) {
            const point = controlPoints[i][j];
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

    // Draw surface grid
    for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points[i].length; j++) {
            const current = points[i][j];
            
            // Draw to next point in row
            if (j < points[i].length - 1) {
                const next = points[i][j + 1];
                ctx.beginPath();
                ctx.moveTo(current.x * scale + offsetX, current.y * scale + offsetY);
                ctx.lineTo(next.x * scale + offsetX, next.y * scale + offsetY);
                ctx.strokeStyle = 'black';
                ctx.stroke();
            }

            // Draw to next point in column
            if (i < points.length - 1) {
                const next = points[i + 1][j];
                ctx.beginPath();
                ctx.moveTo(current.x * scale + offsetX, current.y * scale + offsetY);
                ctx.lineTo(next.x * scale + offsetX, next.y * scale + offsetY);
                ctx.strokeStyle = 'black';
                ctx.stroke();
            }

            // Fill quadrilateral
            if (i < points.length - 1 && j < points[i].length - 1) {
                const p1 = points[i][j];
                const p2 = points[i][j + 1];
                const p3 = points[i + 1][j + 1];
                const p4 = points[i + 1][j];

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
            const point = controlPoints[i][j];
            
            ctx.beginPath();
            ctx.arc(
                point.x * scale + offsetX,
                point.y * scale + offsetY,
                4, // radius
                0,
                2 * Math.PI
            );
            ctx.fillStyle = selectedPoint && selectedPoint.i === i && selectedPoint.j === j ? 'yellow' : 'red';
            ctx.fill();
        }
    }
}

function transformToSRC(VRP, P, Y, points) {
    VRP = { x: VRP[0], y: VRP[1], z: VRP[2] };
    P = { x: P[0], y: P[1], z: P[2] };
    Y = { x: Y[0], y: Y[1], z: Y[2] };

    let N = { x: VRP.x - P.x, y: VRP.y - P.y, z: VRP.z - P.z };
    const nLength = Math.sqrt(N.x ** 2 + N.y ** 2 + N.z ** 2);
    N = { x: N.x / nLength, y: N.y / nLength, z: N.z / nLength };

    let YDotN = Y.x * N.x + Y.y * N.y + Y.z * N.z;
    let V = { x: Y.x - YDotN * N.x, y: Y.y - YDotN * N.y, z: Y.z - YDotN * N.z };
    const vLength = Math.sqrt(V.x ** 2 + V.y ** 2 + V.z ** 2);
    V = { x: V.x / vLength, y: V.y / vLength, z: V.z / vLength };

    const U = { x: V.y * N.z - V.z * N.y, y: V.z * N.x - V.x * N.z, z: V.x * N.y - V.y * N.x };

    const transformationMatrix = [
        [U.x, U.y, U.z, -(VRP.x * U.x + VRP.y * U.y + VRP.z * U.z)],
        [V.x, V.y, V.z, -(VRP.x * V.x + VRP.y * V.y + VRP.z * V.z)],
        [N.x, N.y, N.z, -(VRP.x * N.x + VRP.y * N.y + VRP.z * N.z)],
        [0, 0, 0, 1]
    ];

    // Transformar pontos da superfície (array bidimensional)
    return points.map(row => 
        row.map(point => {
            const { x, y, z } = point;
            return {
                x: transformationMatrix[0][0] * x + transformationMatrix[0][1] * y + transformationMatrix[0][2] * z + transformationMatrix[0][3],
                y: transformationMatrix[1][0] * x + transformationMatrix[1][1] * y + transformationMatrix[1][2] * z + transformationMatrix[1][3],
                z: transformationMatrix[2][0] * x + transformationMatrix[2][1] * y + transformationMatrix[2][2] * z + transformationMatrix[2][3]
            };
        })
    );
}



function generateSurface() {
    const nRows = parseInt(document.getElementById('nRows').value);
    const nCols = parseInt(document.getElementById('nCols').value);
    const uStep = parseFloat(document.getElementById('uStep').value);
    const vStep = parseFloat(document.getElementById('vStep').value);

    surface = new BSplineSurface(nRows, nCols, uStep, vStep);
    surface.surfacePoints = surface.generateSurfacePoints();
    const points = surface.getSurfacePoints();
    const controlPoints = surface.getControlPoints();

    const controlPointSelect = document.getElementById('controlPointSelect');
      controlPointSelect.innerHTML = '';

      for (let i = 0; i < controlPoints.length; i++) {
        for (let j = 0; j < controlPoints[i].length; j++) {
          const option = document.createElement('option');
          option.value = `${i},${j}`;
          option.text = `Control Point (${i}, ${j})`;
          controlPointSelect.add(option);
        }
      }

    const selectedControlPoint = controlPoints[0][0];
    document.getElementById('controlPointX').value = selectedControlPoint.x.toFixed(1);
    document.getElementById('controlPointY').value = selectedControlPoint.y.toFixed(1);
    document.getElementById('controlPointZ').value = selectedControlPoint.z.toFixed(1);

    const VRP = [25, 15, 80];
    const P = [20, 10, 25];
    const Y = [0, 1, 0]

    console.log("pontos da superficie antes de mover os pontos de controle(SRU):", points)
    const srcPoints = transformToSRC(VRP, P, Y, points);
    console.log("pontos da superficie antes de mover os pontos de controle(SRC):", srcPoints)
    drawSurface(srcPoints, controlPoints);
}

function updateSelectedControlPoint() {
    const controlPointSelect = document.getElementById('controlPointSelect');
    const selectedIndex = controlPointSelect.value.split(',');
    const i = parseInt(selectedIndex[0]);
    const j = parseInt(selectedIndex[1]);

    const newX = parseFloat(document.getElementById('controlPointX').value);
    const newY = parseFloat(document.getElementById('controlPointY').value);
    const newZ = parseFloat(document.getElementById('controlPointZ').value);

    surface.updateControlPoint(i, j, { x: newX, y: newY, z: newZ });
    redrawSurface();
  }

function redrawSurface() {
    const points = surface.getSurfacePoints();
    console.log("Pontos da superficie apos mover ponto de controle(SRU):", points);
    const VRP = [25, 15, 80];
    const P = [20, 10, 25];
    const Y = [0, 1, 0];
    const srcPoints = transformToSRC(VRP, P, Y, points);
    console.log("Pontos da superficie apos mover ponto de controle(SRC):", srcPoints);
    drawSurface(srcPoints, surface.getControlPoints());
}

const controlPointSelect = document.getElementById('controlPointSelect');
    controlPointSelect.addEventListener('change', function() {
      const selectedIndex = this.value.split(',');
      const i = parseInt(selectedIndex[0]);
      const j = parseInt(selectedIndex[1]);

      const selectedControlPoint = surface.getControlPoints()[i][j];
      document.getElementById('controlPointX').value = selectedControlPoint.x.toFixed(1);
      document.getElementById('controlPointY').value = selectedControlPoint.y.toFixed(1);
      document.getElementById('controlPointZ').value = selectedControlPoint.z.toFixed(1);
    });

