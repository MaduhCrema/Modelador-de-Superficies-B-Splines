 // B-Spline Surface class implementation
 class BSplineSurface {
  constructor(nRows, nCols, uStep, vStep) {
      this.nRows = nRows;
      this.nCols = nCols;
      this.uStep = uStep;
      this.vStep = vStep;
      this.degree = 3;
      this.controlPoints = [];
      this.surfacePoints = []; 
      this.knotsU = [];
      this.knotsV = [];
      this.initializeControlPoints();
      this.generateKnots();
  }

  initializeControlPoints() {
    const xSpacing = 1; // Espaçamento uniforme no eixo X
    const ySpacing = 1; // Espaçamento uniforme no eixo Y
  
    for (let i = 0; i < this.nRows; i++) {
      this.controlPoints[i] = [];
      for (let j = 0; j < this.nCols; j++) {
        this.controlPoints[i][j] = {
          x: j * xSpacing,
          y: i * ySpacing,
          z: Math.random() * Math.min(this.nRows, this.nCols)
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

    if (weightSum !== 0) {
        point.x /= weightSum;
        point.y /= weightSum;
        point.z /= weightSum;
    }

    //console.log(`Calculated Point: (${point.x}, ${point.y}, ${point.z})`);

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

// Configuração da viewport e canvas
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;


// Configuração da viewport
const VIEWPORT = {
    minX: parseFloat(document.getElementById('xvMin').value),
    maxX: parseFloat(document.getElementById('xvMax').value),
    minY: parseFloat(document.getElementById('yvMin').value),
    maxY: parseFloat(document.getElementById('yvMax').value)
};

//////////// Mapeia do SRT para o Canva, para te rum proporção boa/////////////////////////////
function mapViewportToCanvas(point) {
    // Calcula as dimensões da viewport
    const viewportWidth = VIEWPORT.maxX - VIEWPORT.minX;
    const viewportHeight = VIEWPORT.maxY - VIEWPORT.minY;
    
    // Calcula a escala para manter a proporção
    const scaleX = CANVAS_WIDTH / viewportWidth;
    const scaleY = CANVAS_HEIGHT / viewportHeight;
    
    // Usa a menor escala para manter a proporção
    const scale = Math.min(scaleX, scaleY);
    
    // Calcula o deslocamento para centralizar
    const offsetX = (CANVAS_WIDTH - (viewportWidth * scale)) / 2;
    const offsetY = (CANVAS_HEIGHT - (viewportHeight * scale)) / 2;
    
    // Normaliza o ponto em relação aos limites da viewport antes de escalar
    return {
        x: ((point.x - VIEWPORT.minX) * scale) + offsetX,
        y: ((point.y - VIEWPORT.minY) * scale) + offsetY
    };
}

//////////////////////////Matriz do SRU - SRC ////////////////////////////// Mjp/////////////////////////Multiplicação de Matrizes//////////////////////
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

//////////////////////////////////DESENHA NO CANVA OS PONTOS DA SUPERFICIE E OS PONTOS DE CONTROLE
function drawSurface(surfacePoints, controlPoints) {
    console.log("pintou");
    const canvas = document.getElementById('surfaceCanvas');
    const ctx = canvas.getContext('2d');
    // Configurações do estilo
    const gridColor = '#333333';
    const controlPointColor = '#FF0000';
    const pointSize = 4;
    
    // Função auxiliar para desenhar um ponto
    function drawPoint(x, y, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, pointSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Desenhar a malha da superfície
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Desenhar linhas horizontais com pontos mapeados
    for (let i = 0; i < surfacePoints.length; i++) {
        ctx.beginPath();
        for (let j = 0; j < surfacePoints[i].length; j++) {
            const mappedPoint = mapViewportToCanvas(surfacePoints[i][j]);
            if (j === 0) {
                ctx.moveTo(mappedPoint.x, mappedPoint.y);
            } else {
                ctx.lineTo(mappedPoint.x, mappedPoint.y);
            }
        }
        ctx.stroke();
    }
    
    // Desenhar linhas verticais com pontos mapeados
    for (let j = 0; j < surfacePoints[0].length; j++) {
        ctx.beginPath();
        for (let i = 0; i < surfacePoints.length; i++) {
            const mappedPoint = mapViewportToCanvas(surfacePoints[i][j]);
            if (i === 0) {
                ctx.moveTo(mappedPoint.x, mappedPoint.y);
            } else {
                ctx.lineTo(mappedPoint.x, mappedPoint.y);
            }
        }
        ctx.stroke();
    }
    
    console.log(controlPoints)
    // Desenhar os pontos de controle
    for (let i = 0; i < controlPoints.length; i++) {
        for (let j = 0; j < controlPoints[i].length; j++) {
            const mappedPoint = mapViewportToCanvas(controlPoints[i][j]);
            drawPoint(mappedPoint.x, mappedPoint.y, controlPointColor);
        }
    }
}

//////////////////////////////////////PROJEÇÃO AXONOMETRICA ISOMETRICA///////////////////////////////////////////////
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

////////////////////////////ALGORITMO DO PINTOR////////////////////////////////////////////////////////////////////////
// Função para calcular a normal de uma face
function calculateFaceNormal(p1, p2, p3) {
    // Calcula dois vetores do triângulo
    const v1 = {
        x: p2.x - p1.x,
        y: p2.y - p1.y,
        z: p2.z - p1.z
    };
    const v2 = {
        x: p3.x - p1.x,
        y: p3.y - p1.y,
        z: p3.z - p1.z
    };

    // Produto vetorial
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };
}

// Função para verificar se uma face é visível
function isFaceVisible(normal, viewPoint = {x: 0, y: 0, z: 1}) {
    const dotProduct = normal.x * viewPoint.x + 
                      normal.y * viewPoint.y + 
                      normal.z * viewPoint.z;
    return dotProduct < 0;
}

// Função para gerar as faces da superfície
function generateFaces(surfacePoints) {
    const faces = [];
    
    for (let i = 0; i < surfacePoints.length - 1; i++) {
        for (let j = 0; j < surfacePoints[i].length - 1; j++) {
            // Criar face retangular
            const face = {
                vertices: [
                    surfacePoints[i][j],
                    surfacePoints[i][j + 1],
                    surfacePoints[i + 1][j + 1],
                    surfacePoints[i + 1][j]
                ],
                center: {
                    x: (surfacePoints[i][j].x + surfacePoints[i][j + 1].x + 
                       surfacePoints[i + 1][j + 1].x + surfacePoints[i + 1][j].x) / 4,
                    y: (surfacePoints[i][j].y + surfacePoints[i][j + 1].y + 
                       surfacePoints[i + 1][j + 1].y + surfacePoints[i + 1][j].y) / 4,
                    z: (surfacePoints[i][j].z + surfacePoints[i][j + 1].z + 
                       surfacePoints[i + 1][j + 1].z + surfacePoints[i + 1][j].z) / 4
                }
            };
            
            // Calcular normal
            face.normal = calculateFaceNormal(
                surfacePoints[i][j],
                surfacePoints[i][j + 1],
                surfacePoints[i + 1][j]
            );
            
            face.visible = isFaceVisible(face.normal);
            faces.push(face);
        }
    }
    return faces;
}

// Algoritmo do pintor - ordena as faces pela profundidade
function painterSort(faces) {
    return faces.sort((a, b) => b.center.z - a.center.z);
}

function Painter(surfacePoints) {
    
    const faces = generateFaces(surfacePoints);
    const sortedFaces = painterSort(faces);
    renderWireframe(sortedFaces,
        '#00FF00',  // visibleColor
        '#FF0000',  // hiddenColor
        '#FFFFFF'   // backgroundColor
    );

}

// Funções de Renderização Separadas
function renderFace(context, face, visibleColor, hiddenColor, backgroundColor) {
    const color = face.visible ? visibleColor : hiddenColor;
    
    context.beginPath();
    context.moveTo(face.vertices[0].x, face.vertices[0].y);
    
    for (let i = 1; i < face.vertices.length; i++) {
        context.lineTo(face.vertices[i].x, face.vertices[i].y);
    }
    context.closePath();

    // Preencher com cor de fundo
    context.fillStyle = backgroundColor;
    context.fill();

    // Desenhar arestas
    context.strokeStyle = color;
    context.stroke();
}

function renderWireframe(sortedFaces, visibleColor, hiddenColor, backgroundColor) {
    const ctx = canvas.getContext('2d');
    sortedFaces.forEach(face => {
        renderFace(ctx, face, visibleColor, hiddenColor, backgroundColor);
    });
}
////////////////////////////////CHAMADA PRINCIPAL////////////////////////////////////////////////
function generateSurface() {
    const nRows = parseInt(document.getElementById('nRows').value);
    const nCols = parseInt(document.getElementById('nCols').value);
    const uStep = parseFloat(document.getElementById('uStep').value);
    const vStep = parseFloat(document.getElementById('vStep').value);
    const canvas = document.getElementById('surfaceCanvas');
    const ctx = canvas.getContext('2d');

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

    // Aplicar projeção antes do algoritmo do pintor????
    const projectedPoints = projection(VRP, P, Y, points);
    const projecControl = projection(VRP, P, Y, controlPoints)
    //console.log("pontos da superficie PROJEÇÃO(SRT):", projectedPoints);

    //const visibleFaces = painterAlgorithm(projectedPoints);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Painter(projectedPoints);
    drawSurface(projectedPoints, projecControl);
}

/////////////////UPDATE QUANDO MUDA UMA COORDENADA DO PONTO DE CONTROLE/////////////////////////
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

//////////////REDESENHA QUANDO MUDA ALGUM PONTO DE CONTROLE////////////////////////////
  function redrawSurface() {
    const canvas = document.getElementById('surfaceCanvas');
    const ctx = canvas.getContext('2d');

    const controlPoints = surface.getControlPoints();    
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
    
    const projectedPoints = projection(VRP, P, Y, points);
    const projecControl = projection(VRP, P, Y, controlPoints)
    console.log("Pontos da superficie PROJEÇÃO(SRT):", projectedPoints);
    
    
    //const visibleFaces = painterAlgorithm(projectedPoints);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSurface(projectedPoints, projecControl);
}

/////////////////SELEÇÃO DO PONTO DE CONTROLE
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

