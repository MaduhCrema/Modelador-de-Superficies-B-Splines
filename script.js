// B-Spline Surface class implementation - versão aprimorada
class BSplineSurface {
  constructor(
    nRows,
    nCols,
    uStep,
    vStep,
    degreeU = 3,
    degreeV = 3,
    randomize = false
  ) {
    this.nRows = nRows;
    this.nCols = nCols;
    this.uStep = uStep;
    this.vStep = vStep;
    // Permitir configurar o grau da superfície separadamente para U e V
    this.degreeU = degreeU;
    this.degreeV = degreeV;
    this.controlPoints = [];
    this.surfacePoints = [];
    this.knotsU = [];
    this.knotsV = [];
    this.randomize = randomize; // Flag para usar valores Z aleatórios
    this.initializeControlPoints();
    this.generateKnots();
  }

  // Gera um valor aleatório entre min e max
  random(min, max) {
    return min + Math.random() * (max - min);
  }

  initializeControlPoints() {
    const xSpacing = 1;
    const ySpacing = 1;

    for (let i = 0; i < this.nRows; i++) {
      this.controlPoints[i] = [];
      for (let j = 0; j < this.nCols; j++) {
        // Posições centralizadas
        const x = j * xSpacing - ((this.nCols - 1) * xSpacing) / 2;
        const y = i * ySpacing - ((this.nRows - 1) * ySpacing) / 2;

        // Calcular Z como uma função senoidal de X e Y
        const z = 0;

        this.controlPoints[i][j] = {
          x: x,
          y: y,
          z: z,
        };
      }
    }
  }

  generateKnots() {
    const nKnotsU = this.nRows + this.degreeU + 1;
    const nKnotsV = this.nCols + this.degreeV + 1;

    this.knotsU = BSplineUtils.generateUniformKnots(
      this.degreeU,
      this.nRows,
      nKnotsU
    );
    this.knotsV = BSplineUtils.generateUniformKnots(
      this.degreeV,
      this.nCols,
      nKnotsV
    );
  }

  basisFunction(t, i, k, knots) {
    return BSplineUtils.calculateBasisFunction(t, i, k, knots);
  }

  calculatePoint(u, v) {
    return BSplineUtils.calculateSurfacePoint(
      u,
      v,
      this.controlPoints,
      this.degreeU,
      this.degreeV,
      this.knotsU,
      this.knotsV,
      this.nRows,
      this.nCols
    );
  }

  // Calcular pontos da superfície com tratamento especial para bordas
  generateSurfacePoints() {
    // Calcular número de pontos baseado nos passos
    const resolutionU = Math.ceil(1 / this.uStep) + 1;
    const resolutionV = Math.ceil(1 / this.vStep) + 1;
    
    // Calcular a proporção dos incrementos baseada na fórmula do código C
    // mas mantendo a relação com uStep e vStep escolhidos pelo usuário
    const baseIncrementU = (this.nRows - this.degreeU + 2) / (resolutionU - 1);
    const baseIncrementV = (this.nCols - this.degreeV + 2) / (resolutionV - 1);
    
    // Normalizar para que o maior incremento seja 1
    const maxIncrement = Math.max(baseIncrementU, baseIncrementV);
    const factorU = baseIncrementU / maxIncrement;
    const factorV = baseIncrementV / maxIncrement;
    
    // Aplicar os fatores aos passos escolhidos pelo usuário
    const incrementU = this.uStep * factorU;
    const incrementV = this.vStep * factorV;
    
    // Inicializar matriz de pontos da superfície
    this.surfacePoints = [];
  
    // Calcular pontos internos da superfície
    let intervalU = 0;
    for (let i = 0; i < resolutionU - 1; i++) {
      let intervalV = 0;
      const row = [];
  
      for (let j = 0; j < resolutionV - 1; j++) {
        const point = { x: 0, y: 0, z: 0 };
  
        // Calcular o ponto usando as funções de base B-Spline
        for (let ki = 0; ki <= this.nRows - 1; ki++) {
          for (let kj = 0; kj <= this.nCols - 1; kj++) {
            const blendU = this.basisFunction(
              intervalU,
              ki,
              this.degreeU,
              this.knotsU
            );
            const blendV = this.basisFunction(
              intervalV,
              kj,
              this.degreeV,
              this.knotsV
            );
  
            point.x += this.controlPoints[ki][kj].x * blendU * blendV;
            point.y += this.controlPoints[ki][kj].y * blendU * blendV;
            point.z += this.controlPoints[ki][kj].z * blendU * blendV;
          }
        }
  
        row.push(point);
        intervalV += incrementV; // Use o incrementV ajustado
      }
  
      // Adicionar ponto na borda direita
      const rightBorderPoint = { x: 0, y: 0, z: 0 };
      for (let ki = 0; ki <= this.nRows - 1; ki++) {
        const blendU = this.basisFunction(
          intervalU,
          ki,
          this.degreeU,
          this.knotsU
        );
        rightBorderPoint.x += this.controlPoints[ki][this.nCols - 1].x * blendU;
        rightBorderPoint.y += this.controlPoints[ki][this.nCols - 1].y * blendU;
        rightBorderPoint.z += this.controlPoints[ki][this.nCols - 1].z * blendU;
      }
      row.push(rightBorderPoint);
  
      this.surfacePoints.push(row);
      intervalU += incrementU; // Use o incrementU ajustado
    }
  
    // Adicionar linha inferior de pontos
    const bottomRow = [];
    let intervalV = 0;
  
    for (let j = 0; j < resolutionV - 1; j++) {
      const bottomPoint = { x: 0, y: 0, z: 0 };
  
      for (let kj = 0; kj <= this.nCols - 1; kj++) {
        const blendV = this.basisFunction(
          intervalV,
          kj,
          this.degreeV,
          this.knotsV
        );
        bottomPoint.x += this.controlPoints[this.nRows - 1][kj].x * blendV;
        bottomPoint.y += this.controlPoints[this.nRows - 1][kj].y * blendV;
        bottomPoint.z += this.controlPoints[this.nRows - 1][kj].z * blendV;
      }
  
      bottomRow.push(bottomPoint);
      intervalV += incrementV; // Use o incrementV ajustado
    }
  
    // Adicionar o ponto do canto inferior direito
    bottomRow.push({
      x: this.controlPoints[this.nRows - 1][this.nCols - 1].x,
      y: this.controlPoints[this.nRows - 1][this.nCols - 1].y,
      z: this.controlPoints[this.nRows - 1][this.nCols - 1].z,
    });
  
    this.surfacePoints.push(bottomRow);
  
    return this.surfacePoints;
  }

  // Atualiza todos os pontos de controle de uma vez
  updateAllControlPoints(newControlPoints) {
    if (
      Array.isArray(newControlPoints) &&
      newControlPoints.length === this.nRows &&
      newControlPoints[0].length === this.nCols
    ) {
      this.controlPoints = newControlPoints;
      this.surfacePoints = this.generateSurfacePoints();
    }
    return this.surfacePoints;
  }

  // Gerar valores Z aleatórios para todos os pontos de controle
  randomizeZValues(min = -1, max = 1) {
    for (let i = 0; i < this.nRows; i++) {
      for (let j = 0; j < this.nCols; j++) {
        this.controlPoints[i][j].z = this.random(min, max);
      }
    }
    this.surfacePoints = this.generateSurfacePoints();
    return this.surfacePoints;
  }

  getControlPoints() {
    return this.controlPoints;
  }

  getSurfacePoints() {
    return this.surfacePoints;
  }

  getControlPolygons() {
    // Gera os polígonos da grade de controle (similar ao código C)
    const polygons = [];
    for (let i = 0; i < this.nRows - 1; i++) {
      for (let j = 0; j < this.nCols - 1; j++) {
        polygons.push([
          this.controlPoints[i][j],
          this.controlPoints[i][j + 1],
          this.controlPoints[i + 1][j + 1],
          this.controlPoints[i + 1][j],
        ]);
      }
    }
    return polygons;
  }
}

// Classe utilitária para cálculos B-Spline (expandida)
class BSplineUtils {
  static generateUniformKnots(degree, n, nKnots) {
    const knots = [];
    for (let i = 0; i < nKnots; i++) {
      if (i < degree) {
        knots[i] = 0;
      } else if (i > n) {
        knots[i] = 1;
      } else {
        knots[i] = (i - degree) / (n - degree + 1);
      }
    }
    return knots;
  }

  static calculateBasisFunction(t, i, k, knots) {
    if (k === 0) {
      return t >= knots[i] && t < knots[i + 1] ? 1 : 0;
    }

    let w1 = 0;
    let w2 = 0;

    if (knots[i + k] - knots[i] !== 0) {
      w1 =
        ((t - knots[i]) / (knots[i + k] - knots[i])) *
        this.calculateBasisFunction(t, i, k - 1, knots);
    }

    if (knots[i + k + 1] - knots[i + 1] !== 0) {
      w2 =
        ((knots[i + k + 1] - t) / (knots[i + k + 1] - knots[i + 1])) *
        this.calculateBasisFunction(t, i + 1, k - 1, knots);
    }

    return w1 + w2;
  }

  static calculateSurfacePoint(
    u,
    v,
    controlPoints,
    degreeU,
    degreeV,
    knotsU,
    knotsV,
    nRows,
    nCols
  ) {
    let point = { x: 0, y: 0, z: 0 };
    let weightSum = 0;

    for (let i = 0; i < nRows; i++) {
      for (let j = 0; j < nCols; j++) {
        const basisU = this.calculateBasisFunction(u, i, degreeU, knotsU);
        const basisV = this.calculateBasisFunction(v, j, degreeV, knotsV);
        const weight = basisU * basisV;

        point.x += controlPoints[i][j].x * weight;
        point.y += controlPoints[i][j].y * weight;
        point.z += controlPoints[i][j].z * weight;
        weightSum += weight;
      }
    }

    if (weightSum !== 0) {
      point.x /= weightSum;
      point.y /= weightSum;
      point.z /= weightSum;
    }

    return point;
  }

  static generateSurfacePoints(uStep, vStep, surface) {
    return surface.generateSurfacePoints();
  }
}

// Classe para gerenciar transformações geométricas
class TransformationPipeline {
  static transformToSRCMatrix(VRP, P, Y) {
    VRP = { x: VRP[0], y: VRP[1], z: VRP[2] };
    P = { x: P[0], y: P[1], z: P[2] };
    Y = { x: Y[0], y: Y[1], z: Y[2] };

    let N = { x: VRP.x - P.x, y: VRP.y - P.y, z: VRP.z - P.z };
    const nLength = Math.sqrt(N.x ** 2 + N.y ** 2 + N.z ** 2);
    N = { x: N.x / nLength, y: N.y / nLength, z: N.z / nLength };

    let YDotN = Y.x * N.x + Y.y * N.y + Y.z * N.z;
    let V = {
      x: Y.x - YDotN * N.x,
      y: Y.y - YDotN * N.y,
      z: Y.z - YDotN * N.z,
    };
    const vLength = Math.sqrt(V.x ** 2 + V.y ** 2 + V.z ** 2);
    V = { x: V.x / vLength, y: V.y / vLength, z: V.z / vLength };

    const U = {
      x: V.y * N.z - V.z * N.y,
      y: V.z * N.x - V.x * N.z,
      z: V.x * N.y - V.y * N.x,
    };

    //console.log("N/V/U - VECTORS")
    //console.log(N,V,U)
    return [
      [U.x, U.y, U.z, -(VRP.x * U.x + VRP.y * U.y + VRP.z * U.z)],
      [V.x, V.y, V.z, -(VRP.x * V.x + VRP.y * V.y + VRP.z * V.z)],
      [N.x, N.y, N.z, -(VRP.x * N.x + VRP.y * N.y + VRP.z * N.z)],
      [0, 0, 0, 1],
    ];
  }

  static applyMatrixToPoint(matrix, point) {
    const result = {
      x:
        matrix[0][0] * point.x +
        matrix[0][1] * point.y +
        matrix[0][2] * point.z +
        matrix[0][3],
      y:
        matrix[1][0] * point.x +
        matrix[1][1] * point.y +
        matrix[1][2] * point.z +
        matrix[1][3],
      z:
        matrix[2][0] * point.x +
        matrix[2][1] * point.y +
        matrix[2][2] * point.z +
        matrix[2][3],
    };

    const w =
      matrix[3][0] * point.x +
      matrix[3][1] * point.y +
      matrix[3][2] * point.z +
      matrix[3][3];
    if (w !== 1 && w !== 0) {
      result.x /= w;
      result.y /= w;
      result.z /= w;
    }

    return result;
  }

  static calculateMappingMatrix() {
    // Pegar valores da janela e viewport dos inputs - u = x v = y, w - window v - viewport
    const xwMin = parseFloat(document.getElementById("xwMin").value);
    const xwMax = parseFloat(document.getElementById("xwMax").value);
    const ywMin = parseFloat(document.getElementById("ywMin").value);
    const ywMax = parseFloat(document.getElementById("ywMax").value);
    const xvMin = parseFloat(document.getElementById("xvMin").value);
    const xvMax = parseFloat(document.getElementById("xvMax").value);
    const yvMin = parseFloat(document.getElementById("yvMin").value);
    const yvMax = parseFloat(document.getElementById("yvMax").value);

    // Calcular escalas
    const sx = (xvMax - xvMin) / (xwMax - xwMin);
    const sy = (yvMax - yvMin) / (ywMax - ywMin);
    // Calcular centros
    const wcx = (xwMax + xwMin) / 2; // centro da window
    const wcy = (ywMax + ywMin) / 2;
    const vcx = (xvMax + xvMin) / 2; // centro do viewport
    const vcy = (yvMax + yvMin) / 2;

    // Matriz de centralização na origem
    const T1 = [
      [1, 0, 0, -wcx],
      [0, 1, 0, -wcy],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // Matriz de Mapeamento (Mjp)
    const S = [
      [sx, 0, 0, -sx * xwMin + xvMin],
      [0, -sy, 0, sy * ywMin + yvMax],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // Matriz de retorno ao viewport
    const T2 = [
      [1, 0, 0, vcx],
      [0, 1, 0, vcy],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // Multiplicar as matrizes: T2 * S * T1
    const M1 = this.multiplyMatrices(S, T1);
    const Mjp = this.multiplyMatrices(T2, M1);

    return Mjp;
  }

  static multiplyMatrices(m1, m2) {
    const result = [];
    for (let i = 0; i < 4; i++) {
      result[i] = [];
      for (let j = 0; j < 4; j++) {
        result[i][j] =
          m1[i][0] * m2[0][j] +
          m1[i][1] * m2[1][j] +
          m1[i][2] * m2[2][j] +
          m1[i][3] * m2[3][j];
      }
    }
    return result;
  }

  static getIsometricMatrix() {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  static projection(VRP, P, Y, points) {
    const srcMatrix = this.transformToSRCMatrix(VRP, P, Y);
    console.log("MATRIZ SRU - SRC");
    console.log(srcMatrix);
    const projMatrix = this.getIsometricMatrix();
    console.log("MATRIZ DE PROJECAO");
    console.log(projMatrix);
    const Mjp = this.calculateMappingMatrix();
    console.log("MATRIZ MJP");
    console.log(Mjp);
    const M = this.multiplyMatrices(
      Mjp,
      srcMatrix
    );
    console.log("MATRIZ SRU-SRT");
    console.log(M);

    return points.map((row) =>
      row.map((point) => this.applyMatrixToPoint(M, point))
    );
  }
}
/////////////////////rotação - translação - escala////////////////////////////////////////////////////
// Classe para gerenciar transformações geométricas
class TransformationsManager {
  constructor() {
    // Matrizes de transformação
    this.translationMatrix = this.createIdentityMatrix();
    this.rotationMatrixX = this.createIdentityMatrix();
    this.rotationMatrixY = this.createIdentityMatrix();
    this.rotationMatrixZ = this.createIdentityMatrix();
    this.scaleMatrix = this.createIdentityMatrix();
    
    // Valores atuais
    this.translationValues = { x: 0, y: 0, z: 0 };
    this.rotationValues = { x: 0, y: 0, z: 0 };
    this.scaleValue = 1;
  }
  
  // Cria uma matriz identidade 4x4
  createIdentityMatrix() {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  }
  
  // Converte graus para radianos
  degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }
  
  // Atualiza a matriz de translação
  setTranslation(tx, ty, tz) {
    this.translationValues = { x: tx, y: ty, z: tz };
    this.translationMatrix = [
      [1, 0, 0, tx],
      [0, 1, 0, ty],
      [0, 0, 1, tz],
      [0, 0, 0, 1]
    ];
  }
  
  // Atualiza a matriz de rotação em X
  setRotationX(degrees) {
    this.rotationValues.x = degrees;
    const radians = this.degreesToRadians(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    this.rotationMatrixX = [
      [1, 0, 0, 0],
      [0, cos, -sin, 0],
      [0, sin, cos, 0],
      [0, 0, 0, 1]
    ];
  }
  
  // Atualiza a matriz de rotação em Y
  setRotationY(degrees) {
    this.rotationValues.y = degrees;
    const radians = this.degreesToRadians(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    this.rotationMatrixY = [
      [cos, 0, sin, 0],
      [0, 1, 0, 0],
      [-sin, 0, cos, 0],
      [0, 0, 0, 1]
    ];
  }
  
  // Atualiza a matriz de rotação em Z
  setRotationZ(degrees) {
    this.rotationValues.z = degrees;
    const radians = this.degreesToRadians(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    this.rotationMatrixZ = [
      [cos, -sin, 0, 0],
      [sin, cos, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  }
  
  // Atualiza a matriz de escala (uniforme)
  setScale(scale) {
    this.scaleValue = scale;
    this.scaleMatrix = [
      [scale, 0, 0, 0],
      [0, scale, 0, 0],
      [0, 0, scale, 0],
      [0, 0, 0, 1]
    ];
  }
  
  // Multiplica duas matrizes 4x4
  multiplyMatrices(m1, m2) {
    const result = this.createIdentityMatrix();
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i][j] = 0;
        for (let k = 0; k < 4; k++) {
          result[i][j] += m1[i][k] * m2[k][j];
        }
      }
    }
    
    return result;
  }
  
  // Aplica uma matriz de transformação a um ponto
  applyTransformToPoint(matrix, point) {
    // Converter ponto para coordenadas homogêneas
    const p = [point.x, point.y, point.z, 1];
    const result = [0, 0, 0, 0];
    
    // Multiplicar matriz pelo ponto
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i] += matrix[i][j] * p[j];
      }
    }
    
    // Converter de volta para coordenadas cartesianas
    if (result[3] !== 0) {
      return {
        x: result[0] / result[3],
        y: result[1] / result[3],
        z: result[2] / result[3]
      };
    } else {
      return { x: result[0], y: result[1], z: result[2] };
    }
  }
  
  // Obtém a matriz de transformação combinada
  getCombinedTransformMatrix() {
    // Ordem de aplicação: Escala -> Rotação Z -> Rotação Y -> Rotação X -> Translação
    let combinedMatrix = this.scaleMatrix;
    combinedMatrix = this.multiplyMatrices(this.rotationMatrixZ, combinedMatrix);
    combinedMatrix = this.multiplyMatrices(this.rotationMatrixY, combinedMatrix);
    combinedMatrix = this.multiplyMatrices(this.rotationMatrixX, combinedMatrix);
    combinedMatrix = this.multiplyMatrices(this.translationMatrix, combinedMatrix);
    
    return combinedMatrix;
  }
  
  // Aplica todas as transformações a um ponto
  transformPoint(point) {
    const matrix = this.getCombinedTransformMatrix();
    return this.applyTransformToPoint(matrix, point);
  }
  
  // Aplica todas as transformações a uma matriz de pontos
  transformPoints(points) {
    if (Array.isArray(points[0])) {
      // É uma matriz 2D (como pontos de superfície)
      return points.map(row => 
        row.map(point => this.transformPoint(point))
      );
    } else {
      // É um array simples de pontos
      return points.map(point => this.transformPoint(point));
    }
  }
  
  // Reseta todas as transformações
  resetTransformations() {
    this.translationValues = { x: 0, y: 0, z: 0 };
    this.rotationValues = { x: 0, y: 0, z: 0 };
    this.scaleValue = 1;
    
    this.translationMatrix = this.createIdentityMatrix();
    this.rotationMatrixX = this.createIdentityMatrix();
    this.rotationMatrixY = this.createIdentityMatrix();
    this.rotationMatrixZ = this.createIdentityMatrix();
    this.scaleMatrix = this.createIdentityMatrix();
  }
}

// Classe para o algoritmo do pintor
class PainterAlgorithm {
  static calculateFaceNormal(p1, p2, p3) {
    // Calcula dois vetores do triângulo
    const v1 = {
      x: p2.x - p1.x,
      y: p2.y - p1.y,
      z: p2.z - p1.z,
    };
    const v2 = {
      x: p3.x - p1.x,
      y: p3.y - p1.y,
      z: p3.z - p1.z,
    };

    // Produto vetorial
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
  }

  static isFaceVisible(normal, viewPoint = { x: 0, y: 0, z: 1 }) {
    const dotProduct =
      normal.x * viewPoint.x + normal.y * viewPoint.y + normal.z * viewPoint.z;
    return dotProduct < 0;
  }

  static generateFaces(surfacePoints) {
    const faces = [];

    for (let i = 0; i < surfacePoints.length - 1; i++) {
      for (let j = 0; j < surfacePoints[i].length - 1; j++) {
        // Criar face retangular
        const face = {
          vertices: [
            surfacePoints[i][j],
            surfacePoints[i][j + 1],
            surfacePoints[i + 1][j + 1],
            surfacePoints[i + 1][j],
          ],
          center: {
            x:
              (surfacePoints[i][j].x +
                surfacePoints[i][j + 1].x +
                surfacePoints[i + 1][j + 1].x +
                surfacePoints[i + 1][j].x) /
              4,
            y:
              (surfacePoints[i][j].y +
                surfacePoints[i][j + 1].y +
                surfacePoints[i + 1][j + 1].y +
                surfacePoints[i + 1][j].y) /
              4,
            z:
              (surfacePoints[i][j].z +
                surfacePoints[i][j + 1].z +
                surfacePoints[i + 1][j + 1].z +
                surfacePoints[i + 1][j].z) /
              4,
          },
        };

        // Calcular normal
        face.normal = this.calculateFaceNormal(
          surfacePoints[i][j],
          surfacePoints[i][j + 1],
          surfacePoints[i + 1][j]
        );

        face.visible = this.isFaceVisible(face.normal);
        faces.push(face);
      }
    }
    return faces;
  }

  static painterSort(faces) {
    return faces.sort((a, b) => b.center.z - a.center.z);
  }

  static renderFace(context, face, visibleColor, hiddenColor, backgroundColor) {
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

  static renderWireframe(
    canvas,
    sortedFaces,
    visibleColor,
    hiddenColor,
    backgroundColor
  ) {
    const ctx = canvas.getContext("2d");
    sortedFaces.forEach((face) => {
      this.renderFace(ctx, face, visibleColor, hiddenColor, backgroundColor); // Precisa do this
    });
  }
}

// Classe para renderização da superfície
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    // Cores padrão
    this.pointSize = 2; // Tamanho dos pontos de controle

    // Viewport padrão
    this.viewport = {
      minX: document.getElementById("xvMin").value,
      maxX: document.getElementById("xvMax").value,
      minY: document.getElementById("yvMin").value,
      maxY: document.getElementById("yvMax").value,
    };
  }

  // Define as cores para renderização
  setColors(visibleColor, hiddenColor, backgroundColor) {
    this.visibleColor = visibleColor;
    this.hiddenColor = hiddenColor;
    this.backgroundColor = backgroundColor;
  }

  // Define a cor da grade
  setGridColor(color) {
    this.gridColor = color;
  }

  // Define a cor dos pontos de controle
  setControlPointColor(color) {
    this.controlPointColor = color;
  }

  // Define o tamanho dos pontos
  setPointSize(size) {
    this.pointSize = size;
  }

  // Define o viewport
  setViewport(viewport) {
    this.viewport = viewport;

    // Ajustar dimensões do canvas para o viewport
    // Isso garante que o canvas ocupe todo o espaço disponível
    if (this.canvas.parentElement) {
      this.canvas.width = this.canvas.parentElement.clientWidth;
      this.canvas.height = this.canvas.parentElement.clientHeight;
    }
  }

  // Limpa o canvas
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Desenha a superfície (malha wireframe) e pontos de controle
  drawSurface(surfacePoints, controlPoints) {
    // Desenhar a grade da superfície (wireframe)
    this.drawWireframeGrid(surfacePoints);

    // Desenhar pontos de controle
    this.drawControlPoints(controlPoints);
  }

  // Desenha a grade de wireframe
  drawWireframeGrid(points) {
    if (!points || points.length === 0) return;

    const ctx = this.context;
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;

    // Desenhar linhas horizontais
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.moveTo(points[i][0].x, points[i][0].y);

      for (let j = 1; j < points[i].length; j++) {
        ctx.lineTo(points[i][j].x, points[i][j].y);
      }

      ctx.stroke();
    }

    // Desenhar linhas verticais
    for (let j = 0; j < points[0].length; j++) {
      ctx.beginPath();
      ctx.moveTo(points[0][j].x, points[0][j].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][j].x, points[i][j].y);
      }

      ctx.stroke();
    }
  }

  // Desenha os pontos de controle
  drawControlPoints(points) {
    if (!points) return;

    const ctx = this.context;
    ctx.fillStyle = this.controlPointColor;

    // Para cada ponto de controle
    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points[i].length; j++) {
        if (points[i][j]) {
          // Desenhar ponto como um círculo preenchido
          ctx.beginPath();
          ctx.arc(
            points[i][j].x,
            points[i][j].y,
            this.pointSize,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }
  }

  // Visualização de debug - útil para mostrar os valores de Z
  drawDebugInfo(points, debugInfo) {
    if (!points || !debugInfo) return;

    const ctx = this.context;
    ctx.fillStyle = "#000000";
    ctx.font = "10px Arial";

    // Mostrar informações de debug na tela
    let yPos = 20;
    for (const info of debugInfo) {
      ctx.fillText(info, 10, yPos);
      yPos += 15;
    }
  }
}

////////////////////////////////CHAMADA PRINCIPAL////////////////////////////////////////////////
// Classe principal para controle da aplicação
class SurfaceController {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.surface = null;
    this.surfaces = []; // Preparando para suporte a múltiplas superfícies
    this.transformManager = new TransformationsManager(); // Nova instância do gerenciador de transformações
    this.initializeViewport();
    this.setupDefaultColors();
  }

  setupDefaultColors() {
    this.renderer.setColors(document.getElementById("visibleColor").value, document.getElementById("hiddenColor").value, "#FFFFFF"); // visível, oculto, background
    this.renderer.setGridColor("#333333");
    this.renderer.setControlPointColor("#FF0000");
    this.renderer.setPointSize(2);
  }

  initializeViewport() {
    try {
      const viewport = {
        minX: parseFloat(document.getElementById("xvMin").value) || -10,
        maxX: parseFloat(document.getElementById("xvMax").value) || 10,
        minY: parseFloat(document.getElementById("yvMin").value) || -10,
        maxY: parseFloat(document.getElementById("yvMax").value) || 10,
      };
      this.renderer.setViewport(viewport);
    } catch (error) {
      console.error("Erro ao inicializar viewport:", error);
      // Usar valores padrão em caso de erro
      this.renderer.setViewport({
        minX: -10,
        maxX: 10,
        minY: -10,
        maxY: 10,
      });
    }
  }

  generateSurface(params) {
    try {
      // Validação dos parâmetros
      if (
        params.nRows < 4 ||
        params.nRows > 100 ||
        params.nCols < 4 ||
        params.nCols > 100
      ) {
        throw new Error(
          "Número de pontos de controle deve estar entre 4 e 100"
        );
      }
      if (params.uStep <= 0 || params.vStep <= 0) {
        throw new Error("Passos U e V devem ser maiores que zero");
      }

      // Criar nova superfície
      this.surface = new BSplineSurface(
        params.nRows,
        params.nCols,
        params.uStep,
        params.vStep
      );
      this.surface.surfacePoints = this.surface.generateSurfacePoints();

      // Atualizar interface
      this.updateControlPointsUI();
      this.redrawSurface();
    } catch (error) {
      console.error("Erro ao gerar superfície:", error);
      this.showError(error.message);
    }
  }

  updateControlPointsUI() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície foi gerada");
      }

      const controlPoints = this.surface.getControlPoints();
      const controlPointSelect = document.getElementById("controlPointSelect");

      // Limpar seleção atual
      controlPointSelect.innerHTML = "";

      // Adicionar novos pontos de controle
      for (let i = 0; i < controlPoints.length; i++) {
        for (let j = 0; j < controlPoints[i].length; j++) {
          const option = document.createElement("option");
          option.value = `${i},${j}`;
          option.text = `Ponto de Controle (${i}, ${j})`;
          controlPointSelect.add(option);
        }
      }

      // Atualizar campos de coordenadas com o primeiro ponto
      this.updateCoordinateFields(controlPoints[0][0]);
    } catch (error) {
      console.error("Erro ao atualizar UI:", error);
      this.showError(error.message);
    }
  }

  updateCoordinateFields(point) {
    document.getElementById("controlPointX").value = point.x.toFixed(2);
    document.getElementById("controlPointY").value = point.y.toFixed(2);
    document.getElementById("controlPointZ").value = point.z.toFixed(2);
  }

  updateSelectedControlPoint(i, j, newPoint) {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície selecionada");
      }

      this.surface.updateControlPoint(i, j, newPoint);
      this.redrawSurface();
    } catch (error) {
      console.error("Erro ao atualizar ponto de controle:", error);
      this.showError(error.message);
    }
  }
  // Método para aplicar transformações da interface
  applyTransformations() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície para transformar");
      }

      // Obter valores da interface
      const tx = parseFloat(document.getElementById("translationX").value) || 0;
      const ty = parseFloat(document.getElementById("translationY").value) || 0;
      const tz = parseFloat(document.getElementById("translationZ").value) || 0;
      
      const rx = parseFloat(document.getElementById("rotationX").value) || 0;
      const ry = parseFloat(document.getElementById("rotationY").value) || 0;
      const rz = parseFloat(document.getElementById("rotationZ").value) || 0;
      
      const scale = parseFloat(document.getElementById("scale").value) || 1;

      // Aplicar transformações
      this.transformManager.setTranslation(tx, ty, tz);
      this.transformManager.setRotationX(rx);
      this.transformManager.setRotationY(ry);
      this.transformManager.setRotationZ(rz);
      this.transformManager.setScale(scale);

      // Redesenhar superfície
      this.redrawSurface();
    } catch (error) {
      console.error("Erro ao aplicar transformações:", error);
      this.showError(error.message);
    }
  }

  // Método para resetar transformações
  resetTransformations() {
    try {
      // Resetar valores na interface
      document.getElementById("translationX").value = "0";
      document.getElementById("translationY").value = "0";
      document.getElementById("translationZ").value = "0";
      
      document.getElementById("rotationX").value = "0";
      document.getElementById("rotationY").value = "0";
      document.getElementById("rotationZ").value = "0";
      
      document.getElementById("scale").value = "1";

      // Resetar transformações no gerenciador
      this.transformManager.resetTransformations();

      // Redesenhar superfície
      this.redrawSurface();
    } catch (error) {
      console.error("Erro ao resetar transformações:", error);
      this.showError(error.message);
    }
  }
  redrawSurface() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície para desenhar");
      }
  
      const viewParams = this.getViewParameters();
      let points = this.surface.getSurfacePoints();
      let controlPoints = this.surface.getControlPoints();
      
      // Aplicar transformações geométricas (novo)
      points = this.transformManager.transformPoints(points);
      controlPoints = this.transformManager.transformPoints(controlPoints);
      
      // Projetar pontos
      const projectedPoints = TransformationPipeline.projection(
        viewParams.VRP,
        viewParams.P,
        viewParams.Y,
        points
      );
      
      const projectedControlPoints = TransformationPipeline.projection(
        viewParams.VRP,
        viewParams.P,
        viewParams.Y,
        controlPoints
      );
  
      // Limpar canvas
      this.renderer.clear();
  
      // Gerar e ordenar faces
      const faces = PainterAlgorithm.generateFaces(projectedPoints);
      const sortedFaces = PainterAlgorithm.painterSort(faces);
  
      // Renderizar wireframe
      PainterAlgorithm.renderWireframe(
        this.canvas,
        sortedFaces,
        this.renderer.visibleColor,
        this.renderer.hiddenColor,
        this.renderer.backgroundColor
      );
  
      // Desenhar superfície e pontos de controle
      this.renderer.drawSurface(projectedPoints, projectedControlPoints);
    } catch (error) {
      console.error("Erro ao redesenhar superfície:", error);
      this.showError(error.message);
    }
  }

  getViewParameters() {
    try {
      return {
        VRP: [
          parseFloat(document.getElementById("vrpX").value) || 0,
          parseFloat(document.getElementById("vrpY").value) || 0,
          parseFloat(document.getElementById("vrpZ").value) || 5,
        ],
        P: [
          parseFloat(document.getElementById("focalX").value) || 0,
          parseFloat(document.getElementById("focalY").value) || 0,
          parseFloat(document.getElementById("focalZ").value) || 0,
        ],
        Y: [
          parseFloat(document.getElementById("viewUpX").value) || 0,
          parseFloat(document.getElementById("viewUpY").value) || 1,
          parseFloat(document.getElementById("viewUpZ").value) || 0,
        ],
      };
    } catch (error) {
      console.error("Erro ao obter parâmetros de visualização:", error);
      // Retornar valores padrão em caso de erro
      return {
        VRP: [25, 25, 25],
        P: [0, 0, 0],
        Y: [0, 1, 0],
      };
    }
  }

  showError(message) {
    // Implementar exibição de erro na interface
    alert(message);
  }

  // Métodos para suporte futuro a múltiplas superfícies
  addSurface(surface) {
    this.surfaces.push(surface);
  }

  removeSurface(index) {
    this.surfaces.splice(index, 1);
  }
}

// Inicialização e Event Listeners
window.addEventListener("load", () => {
  const canvas = document.getElementById("surfaceCanvas");
  const controller = new SurfaceController(canvas);

  // Event Listener para geração de superfície
  document.getElementById("generateButton").addEventListener("click", () => {
    controller.generateSurface({
      nRows: parseInt(document.getElementById("nRows").value) || 4,
      nCols: parseInt(document.getElementById("nCols").value) || 4,
      uStep: parseFloat(document.getElementById("uStep").value) || 0.1,
      vStep: parseFloat(document.getElementById("vStep").value) || 0.1,
    });
  });

  // Event Listener para seleção de ponto de controle
  document.getElementById("controlPointSelect").addEventListener("change", function() {
    const [i, j] = this.value.split(",").map(Number);
    const controlPoint = controller.surface.getControlPoints()[i][j];
    controller.updateCoordinateFields(controlPoint);
  });

  // Event Listener para atualização de ponto de controle
  const updateControlPoint = () => {
    const [i, j] = document.getElementById("controlPointSelect").value.split(",").map(Number);
    const newPoint = {
      x: parseFloat(document.getElementById("controlPointX").value),
      y: parseFloat(document.getElementById("controlPointY").value),
      z: parseFloat(document.getElementById("controlPointZ").value),
    };
    controller.updateSelectedControlPoint(i, j, newPoint);
  };

  // Adicionar listeners para campos de coordenadas
  ["controlPointX", "controlPointY", "controlPointZ"].forEach((id) => {
    document.getElementById(id).addEventListener("change", updateControlPoint);
  });

  // Event Listener para atualização de visualização
  document.getElementById("updateViewButton").addEventListener("click", () => {
    controller.redrawSurface();
  });

  // Event Listener para atualização de window/viewport
  document.getElementById("updateWindowButton").addEventListener("click", () => {
    controller.initializeViewport();
    controller.redrawSurface();
  });

  // Event Listener para atualização de cores
  document.getElementById("updateColorsButton").addEventListener("click", () => {
    controller.renderer.setColors(
      document.getElementById("visibleColor").value,
      document.getElementById("hiddenColor").value,
      document.getElementById("backgroundColor").value
    );
    controller.redrawSurface();
  });

  // NOVOS EVENT LISTENERS PARA TRANSFORMAÇÕES
  document.getElementById("applyTransformButton").addEventListener("click", () => {
    controller.applyTransformations();
  });

  document.getElementById("resetTransformButton").addEventListener("click", () => {
    controller.resetTransformations();
  });
});