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
const canvas = document.getElementById('surfaceCanvas');
let surface;
let isDragging = false;
let selectedPoint = null;
let scale = 80;
let offsetX = canvas.width/2;
let offsetY = canvas.height/2;


// Função auxiliar para obter a matriz de transformação SRC (OK)
function transformToSRCMatrix(VRP, P, Y) {
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

    //console.log("N/V/U - VECTORS")
    //console.log(N,V,U)
    return [
        [U.x, U.y, U.z, -(VRP.x * U.x + VRP.y * U.y + VRP.z * U.z)],
        [V.x, V.y, V.z, -(VRP.x * V.x + VRP.y * V.y + VRP.z * V.z)],
        [N.x, N.y, N.z, -(VRP.x * N.x + VRP.y * N.y + VRP.z * N.z)],
        [0, 0, 0, 1]
    ];
}

function applyMatrixToPoint(matrix, point) {
    const result = {
        x: matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2] * point.z + matrix[0][3],
        y: matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2] * point.z + matrix[1][3],
        z: matrix[2][0] * point.x + matrix[2][1] * point.y + matrix[2][2] * point.z + matrix[2][3]
    };
    
    const w = matrix[3][0] * point.x + matrix[3][1] * point.y + matrix[3][2] * point.z + matrix[3][3];
    if (w !== 1 && w !== 0) {
        result.x /= w;
        result.y /= w;
        result.z /= w;
    }
    
    return result;
}

function calculateMappingMatrix() { //(OK)
    // Pegar valores da janela e viewport dos inputs
    const xwMin = parseFloat(document.getElementById('xwMin').value);
    const xwMax = parseFloat(document.getElementById('xwMax').value);
    const ywMin = parseFloat(document.getElementById('ywMin').value);
    const ywMax = parseFloat(document.getElementById('ywMax').value);
    const xvMin = parseFloat(document.getElementById('xvMin').value);
    const xvMax = parseFloat(document.getElementById('xvMax').value);
    const yvMin = parseFloat(document.getElementById('yvMin').value);
    const yvMax = parseFloat(document.getElementById('yvMax').value);

    // Calcular escalas
    const sx = (xvMax - xvMin) / (xwMax - xwMin);
    const sy = (yvMax - yvMin) / (ywMax - ywMin);

    // Matriz de Mapeamento (Mjp)
    return [
        [sx, 0, 0, -sx * xwMin + xvMin],
        [0, -sy, 0, sy * ywMax + yvMin],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

function multiplyMatrices(m1, m2) { //(OK)
    const result = [];
    for (let i = 0; i < 4; i++) {
        result[i] = [];
        for (let j = 0; j < 4; j++) {
            result[i][j] = m1[i][0] * m2[0][j] + 
                          m1[i][1] * m2[1][j] + 
                          m1[i][2] * m2[2][j] + 
                          m1[i][3] * m2[3][j];
        }
    }
    return result;
}

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

function painterAlgorithm(points) {
    const faces = [];
  
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = 0; j < points[i].length - 1; j++) {
        const p1 = points[i][j];
        const p2 = points[i][j + 1];
        const p3 = points[i + 1][j + 1];
        const p4 = points[i + 1][j];
  
        const face = [p1, p2, p3, p4];
  
        // Calculate face normal
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
        const v2 = { x: p4.x - p1.x, y: p4.y - p1.y, z: p4.z - p1.z };
        const normal = {
          x: v1.y * v2.z - v1.z * v2.y,
          y: v1.z * v2.x - v1.x * v2.z,
          z: v1.x * v2.y - v1.y * v2.x
        };
  
        // Calculate face center
        const center = {
          x: (p1.x + p2.x + p3.x + p4.x) / 4,
          y: (p1.y + p2.y + p3.y + p4.y) / 4,
          z: (p1.z + p2.z + p3.z + p4.z) / 4
        };
  
        faces.push({ face, normal, center });
      }
    }
  
    // Sort faces from back to front
    faces.sort((a, b) => b.center.z - a.center.z);
    
    console.log("Visible faces returned by painterAlgorithm:", faces);
    return faces;
  }

  function drawSurface(projectedPoints, controlPoints) {
    console.log("pintou")
    const canvas = document.getElementById('surfaceCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const xwMin = parseFloat(document.getElementById('xwMin').value);
    const xwMax = parseFloat(document.getElementById('xwMax').value);
    const ywMin = parseFloat(document.getElementById('ywMin').value);
    const ywMax = parseFloat(document.getElementById('ywMax').value);
    const xvMin = parseFloat(document.getElementById('xvMin').value);
    const xvMax = parseFloat(document.getElementById('xvMax').value);
    const yvMin = parseFloat(document.getElementById('yvMin').value);
    const yvMax = parseFloat(document.getElementById('yvMax').value);
  
    const scaleX = (xvMax - xvMin) / (xwMax - xwMin);
    const scaleY = (yvMax - yvMin) / (ywMax - ywMin);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
     // Desenhar pontos projetados
     ctx.fillStyle = 'blue';
     for (let i = 0; i < projectedPoints.length; i++) {
         for (let j = 0; j < projectedPoints[i].length; j++) {
             const point = projectedPoints[i][j];
             ctx.beginPath();
             ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
             ctx.fill();
         }
     }
    
    // Desenhar pontos de controle
    ctx.fillStyle = 'red';
    for (let i = 0; i < controlPoints.length; i++) {
        for (let j = 0; j < controlPoints[i].length; j++) {
            const point = controlPoints[i][j];
            const screenX = point.x * scaleX + xvMin;
            const screenY = ywMax - point.y * scaleY + yvMin;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2, 0, 2 * Math.PI);
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

function projection(VRP, P, Y, points){
    // Transformar pontos para SRC e obter a matriz M(SRU,SRC)
    const srcMatrix = transformToSRCMatrix(VRP, P, Y);
    //console.log("MATRIZ to SRC")
    //console.log(srcMatrix)
     // 2. Calcular a matriz de mapeamento Mjp
     const Mjp = calculateMappingMatrix();

    //console.log("MATRIZ to MJP")
    //console.log(Mjp)
     // 3. Calcular a matriz composta M = Mjp * M(SRU,SRC)
    const M = multiplyMatrices(Mjp, srcMatrix);

    //console.log("MATRIZ Composta")
    //console.log(M)

    // 4. Aplicar a matriz composta em todos os pontos
    const transformedPoints = points.map(row => 
        row.map(point => applyMatrixToPoint(M, point))
    );

    //console.log("PONTOS FINAIS")
    //console.log(transformedPoints)
    return transformedPoints;
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

    const VRP = [
        parseFloat(document.getElementById('vrpX').value),
        parseFloat(document.getElementById('vrpY').value),
        parseFloat(document.getElementById('vrpZ').value)
    ];
    const P = [
        parseFloat(document.getElementById('focalX').value),
        parseFloat(document.getElementById('focalY').value),
        parseFloat(document.getElementById('focalZ').value)
    ];
    const Y = [
        parseFloat(document.getElementById('viewUpX').value),
        parseFloat(document.getElementById('viewUpY').value),
        parseFloat(document.getElementById('viewUpZ').value)
    ];

    //TESTES//
    console.log("pontos da superficie antes de mover os pontos de controle(SRU):", points);
    const srcPoints = transformToSRC(VRP, P, Y, points);
    console.log("pontos da superficie antes de mover os pontos de controle(SRC):", srcPoints);

    // Aplicar projeção antes do algoritmo do pintor????
    const projectedPoints = projection(VRP, P, Y, points);
    console.log("pontos da superficie PROJEÇÃO(SRT):", projectedPoints);

    //const visibleFaces = painterAlgorithm(projectedPoints);
    drawSurface(projectedPoints, controlPoints);
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
    const VRP = [
        parseFloat(document.getElementById('vrpX').value),
        parseFloat(document.getElementById('vrpY').value),
        parseFloat(document.getElementById('vrpZ').value)
    ];
    const P = [
        parseFloat(document.getElementById('focalX').value),
        parseFloat(document.getElementById('focalY').value),
        parseFloat(document.getElementById('focalZ').value)
    ];
    const Y = [
        parseFloat(document.getElementById('viewUpX').value),
        parseFloat(document.getElementById('viewUpY').value),
        parseFloat(document.getElementById('viewUpZ').value)
    ];
    
    console.log("Pontos da superficie apos mover ponto de controle(SRU):", points);
    const srcPoints = transformToSRC(VRP, P, Y, points);
    console.log("Pontos da superficie apos mover ponto de controle(SRC):", srcPoints);
    
    const projectedPoints = projection(VRP, P, Y, srcPoints);
    console.log("Pontos da superficie PROJEÇÃO(SRT):", projectedPoints);
    
    //const visibleFaces = painterAlgorithm(projectedPoints);
    drawSurface(projectedPoints, surface.getControlPoints());
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

