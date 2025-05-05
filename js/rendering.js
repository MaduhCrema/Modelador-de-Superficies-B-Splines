/**
 * Algoritmos de recorte (clipping)
 */
class Clipping {
  static inside(point, edge, xMin, xMax, yMin, yMax) {
    const epsilon = 0.001;

    switch (edge) {
      case "LEFT":
        return point.x >= xMin - epsilon;
      case "RIGHT":
        return point.x <= xMax + epsilon;
      case "BOTTOM":
        return point.y >= yMin - epsilon;
      case "TOP":
        return point.y <= yMax + epsilon;
    }
    return false;
  }

  static intersection(p1, p2, edge, xMin, xMax, yMin, yMax) {
    let x, y, z;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const dz = p2.z !== undefined && p1.z !== undefined ? p2.z - p1.z : 0;

    let t = 0;

    switch (edge) {
      case "LEFT":
        if (Math.abs(dx) < 0.0001) {
          x = p1.x;
        } else {
          t = (xMin - p1.x) / dx;
          x = xMin;
        }
        y = p1.y + t * dy;
        break;
      case "RIGHT":
        if (Math.abs(dx) < 0.0001) {
          x = p1.x;
        } else {
          t = (xMax - p1.x) / dx;
          x = xMax;
        }
        y = p1.y + t * dy;
        break;
      case "BOTTOM":
        if (Math.abs(dy) < 0.0001) {
          y = p1.y;
        } else {
          t = (yMin - p1.y) / dy;
          y = yMin;
        }
        x = p1.x + t * dx;
        break;
      case "TOP":
        if (Math.abs(dy) < 0.0001) {
          y = p1.y;
        } else {
          t = (yMax - p1.y) / dy;
          y = yMax;
        }
        x = p1.x + t * dx;
        break;
    }

    z = p1.z !== undefined && p2.z !== undefined ? p1.z + t * dz : 0;

    return { x, y, z };
  }

  static intersectionGouraud(v0, v1, vetor_y) {
    if (!v0 || !v1 || v0.y === undefined || v1.y === undefined) {
      console.error("Vértices inválidos:", v0, v1);
      return;
    }

    if (Math.abs(v0.y - v1.y) < 0.001) return;

    if (!vetor_y || vetor_y.length === 0) {
      console.error("vetor_y inválido");
      return;
    }

    if (v0.y > v1.y) [v0, v1] = [v1, v0];

    if (
      Math.ceil(v0.y) > vetor_y[vetor_y.length - 1].y ||
      Math.floor(v1.y) < vetor_y[0].y
    ) {
      return; // Fora dos limites do vetor_y
    }

    const deltaY = v1.y - v0.y;

    const taxaX = (v1.x - v0.x) / deltaY;
    const taxaZ = (v1.z - v0.z) / deltaY;

    let taxaIlum = 0;
    if (v0.iluminacao !== undefined && v1.iluminacao !== undefined) {
      taxaIlum = (v1.iluminacao - v0.iluminacao) / deltaY;
    } else {
      v0.iluminacao = 255;
      v1.iluminacao = 255;
    }

    const yInicio = Math.max(Math.ceil(v0.y), vetor_y[0].y);

    let xAtual = v0.x;
    let zAtual = v0.z;
    let ilumAtual = v0.iluminacao;

    for (let y = Math.ceil(v0.y); y < yInicio; y++) {
      xAtual += taxaX;
      zAtual += taxaZ;
      ilumAtual += taxaIlum;
    }

    for (
      let y = yInicio;
      y <= Math.min(Math.floor(v1.y), vetor_y[vetor_y.length - 1].y);
      y++
    ) {
      const index = y - vetor_y[0].y;

      if (index >= 0 && index < vetor_y.length) {
        if (
          !isNaN(xAtual) &&
          !isNaN(zAtual) &&
          !isNaN(ilumAtual) &&
          isFinite(xAtual) &&
          isFinite(zAtual) &&
          isFinite(ilumAtual)
        ) {
          vetor_y[index].x.push({
            x: xAtual,
            z: zAtual,
            iluminacao: ilumAtual,
          });
        }

        xAtual += taxaX;
        zAtual += taxaZ;
        ilumAtual += taxaIlum;
      }
    }
  }
  static clipPolygonGouraud(polygon, xMin, xMax, yMin, yMax) {
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      console.warn("Polígono inválido para recorte Gouraud");
      return [];
    }

    let edges = ["LEFT", "RIGHT", "BOTTOM", "TOP"];
    let clippedPolygon = [...polygon]; // Clone o polígono original

    for (let edge of edges) {
      let inputList = [...clippedPolygon]; // Clone a lista atual
      clippedPolygon = [];

      if (inputList.length < 3) {
        console.warn(`Polígono foi completamente recortado na borda ${edge}`);
        break; // Polígono já foi completamente recortado
      }

      for (let i = 0; i < inputList.length; i++) {
        let p1 = inputList[i];
        let p2 = inputList[(i + 1) % inputList.length];

        if (
          !p1 ||
          !p2 ||
          p1.x === undefined ||
          p1.y === undefined ||
          p2.x === undefined ||
          p2.y === undefined
        ) {
          console.error("Pontos inválidos encontrados para Gouraud:", p1, p2);
          continue;
        }

        let p1Inside = this.inside(p1, edge, xMin, xMax, yMin, yMax);
        let p2Inside = this.inside(p2, edge, xMin, xMax, yMin, yMax);

        if (p1Inside && p2Inside) {
          clippedPolygon.push(p2);
        } else if (p1Inside && !p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );

          if (p1.iluminacao !== undefined && p2.iluminacao !== undefined) {
            let t;
            if (edge === "LEFT" || edge === "RIGHT") {
              t = Math.abs((intersection.x - p1.x) / (p2.x - p1.x));
            } else {
              t = Math.abs((intersection.y - p1.y) / (p2.y - p1.y));
            }

            intersection.iluminacao =
              p1.iluminacao + t * (p2.iluminacao - p1.iluminacao);
          }

          clippedPolygon.push(intersection);
        } else if (!p1Inside && p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );

          if (p1.iluminacao !== undefined && p2.iluminacao !== undefined) {
            let t;
            if (edge === "LEFT" || edge === "RIGHT") {
              t = Math.abs((intersection.x - p1.x) / (p2.x - p1.x));
            } else {
              t = Math.abs((intersection.y - p1.y) / (p2.y - p1.y));
            }

            // Interpolar a iluminação
            intersection.iluminacao =
              p1.iluminacao + t * (p2.iluminacao - p1.iluminacao);
          }

          clippedPolygon.push(intersection);
          clippedPolygon.push(p2);
        }
      }
    }

    if (clippedPolygon.length < 3) {
      console.warn("Polígono Gouraud recortado tem menos de 3 vértices");
      return [];
    }

    return clippedPolygon;
  }
  static clipPolygon(polygon, xMin, xMax, yMin, yMax) {

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      console.warn("Polígono inválido para recorte");
      return [];
    }

    let edges = ["LEFT", "RIGHT", "BOTTOM", "TOP"];
    let clippedPolygon = [...polygon]; // Clone o polígono original

    for (let edge of edges) {
      let inputList = [...clippedPolygon]; // Clone a lista atual
      clippedPolygon = [];

      if (inputList.length < 3) {
        console.warn(`Polígono foi completamente recortado na borda ${edge}`);
        break; // Polígono já foi completamente recortado
      }

      for (let i = 0; i < inputList.length; i++) {
        let p1 = inputList[i];
        let p2 = inputList[(i + 1) % inputList.length];

        if (
          !p1 ||
          !p2 ||
          p1.x === undefined ||
          p1.y === undefined ||
          p2.x === undefined ||
          p2.y === undefined
        ) {
          console.error("Pontos inválidos encontrados:", p1, p2);
          continue;
        }

        let p1Inside = this.inside(p1, edge, xMin, xMax, yMin, yMax);
        let p2Inside = this.inside(p2, edge, xMin, xMax, yMin, yMax);

        if (p1Inside && p2Inside) {
          clippedPolygon.push(p2);
        } else if (p1Inside && !p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );
          clippedPolygon.push(intersection);
        } else if (!p1Inside && p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );
          clippedPolygon.push(intersection);
          clippedPolygon.push(p2);
        }
      }

    }

    if (clippedPolygon.length < 3) {
      console.warn(
        "Polígono recortado tem menos de 3 vértices, não pode ser renderizado"
      );
      return [];
    }

    return clippedPolygon;
  }
}

/**
 * Algoritmo do pintor para renderização
 */
class PainterAlgorithm {
  static calculateFaceNormal(p1, p2, p3) {
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
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
  }
  static debugPainterAlgorithm(surfacePoints, vrp = { x: 0, y: 0, z: 1 }) {

    const viewPoint = {
      x: vrp.x,
      y: vrp.y,
      z: vrp.z,
    };

    const faces = this.generateFaces(surfacePoints);

    const sampleIndices = [
      0, // Primeira face
      Math.floor(faces.length / 2), // Face central
      faces.length - 1, // Última face
    ];

    for (const idx of sampleIndices) {
      const face = faces[idx];


      const toViewer = {
        x: vrp.x - face.center.x,
        y: vrp.y - face.center.y,
        z: vrp.z - face.center.z,
      };

      const length = Math.sqrt(
        toViewer.x * toViewer.x +
          toViewer.y * toViewer.y +
          toViewer.z * toViewer.z
      );
      if (length > 0) {
        toViewer.x /= length;
        toViewer.y /= length;
        toViewer.z /= length;
      }

           
    }

    // Ordenação pelo algoritmo do pintor
    return this.painterSort(faces);
  }

  static normalizeVector(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return length !== 0
      ? { x: v.x / length, y: v.y / length, z: v.z / length }
      : { x: 0, y: 0, z: 0 };
  }

  static dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  static isFaceVisible(normal, viewPoint = { x: 0, y: 0, z: 1 }) {
    if (!normal || !viewPoint) {
      return true; // Por segurança
    }

    // Calcular o vetor do centro da face para o ponto de vista
    const dotProduct =
      normal.x * viewPoint.x + normal.y * viewPoint.y + normal.z * viewPoint.z;

    // Um produto escalar negativo significa que a normal e o vetor de visualização
    return dotProduct < 0;
  }

  static generateFaces(surfacePoints) {
    const faces = [];

    for (let i = 0; i < surfacePoints.length - 1; i++) {
      for (let j = 0; j < surfacePoints[i].length - 1; j++) {
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

  static calculateCentroid(vertices) {
    const sum = vertices.reduce(
      (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }),
      { x: 0, y: 0, z: 0 }
    );
    return {
      x: sum.x / vertices.length,
      y: sum.y / vertices.length,
      z: sum.z / vertices.length,
    };
  }

  static calculateConstantShading(
    vertices,
    vrp,
    light = { x: 70, y: 20, z: 35, intensity: 150 },
    material = { Ka: 0.4, Kd: 0.7, Ks: 0.5, n: 2.15 },
    ambientIntensity = 120
  ) {
    const face = {
      center: this.calculateCentroid(vertices),
      normal: this.normalizeVector(
        this.calculateFaceNormal(vertices[0], vertices[1], vertices[2])
      ),
    };

    const ambientLight = ambientIntensity * material.Ka;

    const L = this.normalizeVector({
      x: light.x - face.center.x,
      y: light.y - face.center.y,
      z: light.z - face.center.z,
    });

    const N = face.normal;

    const diffuseDot = this.dotProduct(N, L);
    const diffuseLight =
      diffuseDot > 0 ? light.intensity * material.Kd * diffuseDot : 0;

    let specularLight = 0;
    if (diffuseDot > 0) {
      const S = this.normalizeVector({
        x: vrp.x - face.center.x,
        y: vrp.y - face.center.y,
        z: vrp.z - face.center.z,
      });

      const R = this.normalizeVector({
        x: 2 * diffuseDot * N.x - L.x,
        y: 2 * diffuseDot * N.y - L.y,
        z: 2 * diffuseDot * N.z - L.z,
      });

      const cosAlpha = this.dotProduct(R, S);
      specularLight =
        cosAlpha > 0
          ? light.intensity * material.Ks * Math.pow(cosAlpha, material.n)
          : 0;
    }

    const totalLight = ambientLight + diffuseLight + specularLight;

    return totalLight;
  }

  static renderFace(context, face, visibleColor, hiddenColor, backgroundColor) {
    const color = face.visible ? visibleColor : hiddenColor;

    context.beginPath();
    context.moveTo(face.vertices[0].x, face.vertices[0].y);

    for (let i = 1; i < face.vertices.length; i++) {
      context.lineTo(face.vertices[i].x, face.vertices[i].y);
    }
    context.closePath();

    context.fillStyle = backgroundColor;
    context.fill();

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

    const xMin = 0;
    const yMin = 0;
    const xMax = canvas.width;
    const yMax = canvas.height;

    sortedFaces.forEach((face) => {
      const clippedVertices = Clipping.clipPolygon(
        face.vertices,
        xMin,
        xMax,
        yMin,
        yMax
      );

      if (clippedVertices.length > 2) {
        const clippedFace = { ...face, vertices: clippedVertices };
        this.renderFace(
          ctx,
          clippedFace,
          visibleColor,
          hiddenColor,
          backgroundColor
        );
      }
    });
  }
}

/**
 * Implementação do Rasterizador com iluminação RGB
 * A cor é calculada apenas pelos parâmetros de iluminação e material
 */
class Rasterizador {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.frameBuffer = [];
    this.zBuffer = [];

    for (let i = 0; i < width * height; i++) {
      this.frameBuffer.push([0, 0, 0]);
      this.zBuffer.push(Infinity);
    }

    this.light = {
      x: 70,
      y: 20,
      z: 35,
      intensity: [220, 220, 220], // RGB, branco por padrão
    };

    this.material = {
      Ka: [0.2, 0.4, 0.3], // RGB para ambiente
      Kd: [0.7, 0.7, 0.6], // RGB para difuso
      Ks: [0.5, 0.5, 0.5], // RGB para especular
      n: 2.15, // expoente especular
    };

    this.ambientIntensity = [120, 120, 120]; // RGB
    this.vrp = { x: 25, y: 25, z: 25 };
  }

  clearBuffers() {
    for (let i = 0; i < this.width * this.height; i++) {
      this.frameBuffer[i] = [0, 0, 0];
      this.zBuffer[i] = Infinity;
    }
  }

  setLight(light) {
    if (typeof light.intensity === "number") {
      light.intensity = [light.intensity, light.intensity, light.intensity];
    }
    this.light = light;
  }

  setMaterial(material) {
    const ensureRGB = (value) => {
      if (typeof value === "number") {
        return [value, value, value];
      }
      return value;
    };

    this.material = {
      Ka: ensureRGB(material.Ka),
      Kd: ensureRGB(material.Kd),
      Ks: ensureRGB(material.Ks),
      n: material.n,
    };
  }

  setAmbientIntensity(intensity) {
    if (typeof intensity === "number") {
      this.ambientIntensity = [intensity, intensity, intensity];
    } else {
      this.ambientIntensity = intensity;
    }
  }

  setVRP(vrp) {
    this.vrp = vrp;
  }

  setPixel(x, y, z, color) {
    x = Math.round(x);
    y = Math.round(y);

    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }

    const index = y * this.width + x;

    // Adicionar um pequeno bias para evitar z-fighting
    const zWithBias = z - 0.00001 * Math.abs(z);

    // Z-buffer test
    if (zWithBias < this.zBuffer[index]) {
      this.zBuffer[index] = zWithBias;
      this.frameBuffer[index] = color;
    }
  }
  rasterizarFace(vertices, faceNormal) {
    if (!vertices || vertices.length < 3) {
      console.error("Erro: Vertices insuficientes para face", vertices);
      return;
    }

    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      if (
        !v ||
        v.x === undefined ||
        v.y === undefined ||
        v.z === undefined ||
        isNaN(v.x) ||
        isNaN(v.y) ||
        isNaN(v.z)
      ) {
        console.error("Erro: Vértice inválido", v);
        return;
      }
    }

    // *** APLICAR CLIPPING AQUI ***
    const xMin = 0;
    const yMin = 0;
    const xMax = parseFloat(document.getElementById("xvMax").value);
    const yMax = parseFloat(document.getElementById("yvMax").value);

    const clippedVertices = Clipping.clipPolygon(
      vertices,
      xMin,
      xMax,
      yMin,
      yMax
    );

    if (clippedVertices.length < 3) {
      return;
    }

    if (!faceNormal || !this.isValidVector(faceNormal)) {
      faceNormal = this.calculateFaceNormal(
        clippedVertices[0],
        clippedVertices[1],
        clippedVertices[2]
      );
    }

    faceNormal = this.normalizeVector(faceNormal);

    const rgbLight = this.calculateShadingRGB(clippedVertices, faceNormal);

    let ymin = Infinity;
    let ymax = -Infinity;

    for (let v of clippedVertices) {
      if (v.y < ymin) ymin = v.y;
      if (v.y > ymax) ymax = v.y;
    }

    ymin = Math.floor(ymin);
    ymax = Math.ceil(ymax);

    ymin = Math.max(0, ymin);
    ymax = Math.min(this.height - 1, ymax);

    if (ymin >= ymax) {
      return;
    }

    let vetor_y = this.mapeamentoVertical(ymin, ymax);

    for (let i = 0; i < clippedVertices.length; i++) {
      let j = (i + 1) % clippedVertices.length;
      this.intersecao(clippedVertices[i], clippedVertices[j], vetor_y);
    }

    vetor_y = this.ordenarVetoresX(vetor_y);

    this.preencherFace(vetor_y, rgbLight);
  }

  isValidVector(vector) {
    return (
      vector &&
      !isNaN(vector.x) &&
      isFinite(vector.x) &&
      !isNaN(vector.y) &&
      isFinite(vector.y) &&
      !isNaN(vector.z) &&
      isFinite(vector.z)
    );
  }

  // Método para calcular sombreamento RGB
  calculateShadingRGB(vertices, normal) {
    if (!vertices || vertices.length < 3 || !this.isValidVector(normal)) {
      return [128, 128, 128]; // Cinza como valor padrão
    }

    const center = this.calculateCentroid(vertices);

    const ambientLight = [
      this.ambientIntensity[0] * this.material.Ka[0],
      this.ambientIntensity[1] * this.material.Ka[1],
      this.ambientIntensity[2] * this.material.Ka[2],
    ];

    const lightDirection = this.normalizeVector({
      x: this.light.x - center.x,
      y: this.light.y - center.y,
      z: this.light.z - center.z,
    });

    const normalizedNormal = this.normalizeVector(normal);

    const cosAngle = this.dotProduct(normalizedNormal, lightDirection);

    const diffuseLight = [0, 0, 0];
    if (cosAngle > 0) {
      const factorR = cosAngle * this.material.Kd[0];
      const factorG = cosAngle * this.material.Kd[1];
      const factorB = cosAngle * this.material.Kd[2];

      diffuseLight[0] = factorR * this.light.intensity[0];
      diffuseLight[1] = factorG * this.light.intensity[1];
      diffuseLight[2] = factorB * this.light.intensity[2];
    }

    const specularLight = [0, 0, 0];

    if (cosAngle > 0) {
      const viewDirection = this.normalizeVector({
        x: this.vrp.x - center.x,
        y: this.vrp.y - center.y,
        z: this.vrp.z - center.z,
      });

      // Calcular vetor de reflexão R = 2(N·L)N - L
      const twoCosProdN = {
        x: 2 * cosAngle * normalizedNormal.x,
        y: 2 * cosAngle * normalizedNormal.y,
        z: 2 * cosAngle * normalizedNormal.z,
      };

      const reflectionDirection = this.normalizeVector({
        x: twoCosProdN.x - lightDirection.x,
        y: twoCosProdN.y - lightDirection.y,
        z: twoCosProdN.z - lightDirection.z,
      });

      const specularFactor = this.dotProduct(
        reflectionDirection,
        viewDirection
      );

      if (specularFactor > 0) {
        let specPower = specularFactor;
        for (let i = 1; i < this.material.n; i++) {
          specPower *= specularFactor;
        }

        specularLight[0] =
          this.material.Ks[0] * this.light.intensity[0] * specPower;
        specularLight[1] =
          this.material.Ks[1] * this.light.intensity[1] * specPower;
        specularLight[2] =
          this.material.Ks[2] * this.light.intensity[2] * specPower;
      }
    }

    // Combinar todas as componentes de iluminação
    return [
      Math.min(
        255,
        Math.round(ambientLight[0] + diffuseLight[0] + specularLight[0])
      ),
      Math.min(
        255,
        Math.round(ambientLight[1] + diffuseLight[1] + specularLight[1])
      ),
      Math.min(
        255,
        Math.round(ambientLight[2] + diffuseLight[2] + specularLight[2])
      ),
    ];
  }

  rasterizarMalha(malha) {
    // Para cada face na malha
    for (let face of malha) {
      // Verificar se a face tem pelo menos 3 vértices
      if (face.length < 3) continue;

      // Calcular a normal da face
      const normal = this.calculateFaceNormal(face[0], face[1], face[2]);

      // Verificar se a face é visível ao observador (backface culling)
      if (this.isFaceVisible(normal, this.vrp)) {
        this.rasterizarFace(face, normal);
      }
    }
  }

  // Verifica se uma face é visível ao observador
  isFaceVisible(normal, viewPoint) {
    // Calcular vetor da face para o observador
    const viewVector = {
      x: viewPoint.x - normal.x,
      y: viewPoint.y - normal.y,
      z: viewPoint.z - normal.z,
    };

    // Se o produto escalar for negativo, a face é visível
    return this.dotProduct(normal, viewVector) < 0;
  }

  mapeamentoVertical(y_min, y_max) {
    let vetorDeY = [];
    for (let y = y_min; y <= y_max; y++) {
      vetorDeY.push({ y: y, x: [] });
    }
    return vetorDeY;
  }

  intersecao(v0, v1, vetor_y) {
    // Verificar se os vértices são válidos
    if (!v0 || !v1 || v0.y === undefined || v1.y === undefined) {
      console.error("Vértices inválidos:", v0, v1);
      return;
    }

    if (Math.abs(v0.y - v1.y) < 0.001) return;

    if (v0.y > v1.y) [v0, v1] = [v1, v0];

    if (
      !vetor_y ||
      vetor_y.length === 0 ||
      Math.ceil(v0.y) > vetor_y[vetor_y.length - 1].y ||
      Math.floor(v1.y) < vetor_y[0].y
    ) {
      return; // Fora dos limites do vetor_y
    }

    const deltaY = v1.y - v0.y;
    const taxaX = (v1.x - v0.x) / deltaY;
    const taxaZ = (v1.z - v0.z) / deltaY;

    const yInicio = Math.max(Math.ceil(v0.y), vetor_y[0].y);

    let xAtual = v0.x;
    let zAtual = v0.z;

    if (yInicio > Math.ceil(v0.y)) {
      const avancoY = yInicio - v0.y;
      xAtual += taxaX * avancoY;
      zAtual += taxaZ * avancoY;
    } else {
      const ajuste = Math.ceil(v0.y) - v0.y;
      if (ajuste > 0) {
        xAtual += taxaX * ajuste;
        zAtual += taxaZ * ajuste;
      }
    }

    for (
      let y = yInicio;
      y <= Math.min(Math.floor(v1.y), vetor_y[vetor_y.length - 1].y);
      y++
    ) {
      const index = y - vetor_y[0].y;

      if (index >= 0 && index < vetor_y.length) {
        if (
          !isNaN(xAtual) &&
          !isNaN(zAtual) &&
          isFinite(xAtual) &&
          isFinite(zAtual)
        ) {
          vetor_y[index].x.push({ x: xAtual, z: zAtual });
        }

        xAtual += taxaX;
        zAtual += taxaZ;
      }
    }
  }
  ordenarVetoresX(vetor_y) {
    for (let scan of vetor_y) {
      scan.x.sort((a, b) => a.x - b.x);
    }
    return vetor_y;
  }

  preencherFace(vetor_y, corRGB) {
    if (
      !vetor_y ||
      !Array.isArray(vetor_y) ||
      vetor_y.length === 0 ||
      !corRGB
    ) {
      console.error("Parâmetros inválidos em preencherFace:", vetor_y, corRGB);
      return;
    }

    for (let scan of vetor_y) {
      if (
        !scan ||
        !Array.isArray(scan.x) ||
        scan.x.length === 0 ||
        scan.y === undefined
      ) {
        continue;
      }

      for (let i = 0; i < scan.x.length - 1; i += 2) {
        if (i + 1 < scan.x.length) {
          this.preencherScanline(scan.x[i], scan.x[i + 1], scan.y, corRGB);
        }
      }
    }
  }

  preencherScanline(x0, x1, y, corRGB) {
    if (
      !x0 ||
      !x1 ||
      x0.x === undefined ||
      x1.x === undefined ||
      x0.z === undefined ||
      x1.z === undefined ||
      isNaN(y)
    ) {
      return;
    }

    if (x0.x > x1.x) [x0, x1] = [x1, x0];

    const xStart = Math.max(0, Math.floor(x0.x) - 1); // -1 para expandir levemente
    const xEnd = Math.min(this.width - 1, Math.ceil(x1.x) + 1); // +1 para expandir levemente

    // Se a scanline está fora dos limites ou invertida, ignorar
    if (xStart > xEnd) return;

    const deltaX = x1.x - x0.x;

    // Evitar divisão por zero
    if (Math.abs(deltaX) < 0.001) return;

    // Taxa de variação para Z
    const taxaZ = (x1.z - x0.z) / deltaX;

    let zAtual = x0.z;

    if (xStart > Math.ceil(x0.x)) {
      const avancoX = xStart - x0.x;
      zAtual += taxaZ * avancoX;
    } else {
      const ajuste = Math.ceil(x0.x) - x0.x;
      if (ajuste > 0) {
        zAtual += taxaZ * ajuste;
      }
    }

    for (let x = xStart; x <= xEnd; x++) {
      this.setPixel(x, y, zAtual, corRGB);

      zAtual += taxaZ;
    }
  }

  calculateFaceNormal(p1, p2, p3) {
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

    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
  }

  normalizeVector(v) {
    if (!v || isNaN(v.x) || isNaN(v.y) || isNaN(v.z)) {
      return { x: 0, y: 0, z: 1 }; // Vetor padrão seguro
    }

    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

    if (length < 0.0001) {
      return { x: 0, y: 0, z: 1 }; // Vetor padrão seguro
    }

    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length,
    };
  }

  dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  calculateCentroid(vertices) {
    if (!vertices || vertices.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const sum = vertices.reduce(
      (acc, v) => ({
        x: acc.x + (v.x || 0),
        y: acc.y + (v.y || 0),
        z: acc.z + (v.z || 0),
      }),
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: sum.x / vertices.length,
      y: sum.y / vertices.length,
      z: sum.z / vertices.length,
    };
  }

  renderToCanvas(canvas) {
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        const offset = index * 4;

        const color = this.frameBuffer[index];

        if (
          Array.isArray(color) &&
          color.length >= 3 &&
          !(color[0] === 0 && color[1] === 0 && color[2] === 0)
        ) {
          // RGBA - Opaco
          data[offset] = color[0]; // R
          data[offset + 1] = color[1]; // G
          data[offset + 2] = color[2]; // B
          data[offset + 3] = 255; // A
        } else {
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
          data[offset + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }


  // Calcular normais dos vértices como média das normais das faces adjacentes
  calcularNormaisVertices(malha) {
    const verticeMap = new Map();
    const verticeNormaisMap = new Map();

    for (let faceIndex = 0; faceIndex < malha.length; faceIndex++) {
      const face = malha[faceIndex];

      const faceNormal = this.calculateFaceNormal(face[0], face[1], face[2]);

      for (let i = 0; i < face.length; i++) {
        const vertice = face[i];
        const chave = `${vertice.x.toFixed(4)},${vertice.y.toFixed(
          4
        )},${vertice.z.toFixed(4)}`;

        if (!verticeNormaisMap.has(chave)) {
          verticeNormaisMap.set(chave, []);
        }
        verticeNormaisMap.get(chave).push(faceNormal);

        verticeMap.set(chave, vertice);
      }
    }

    const verticeNormais = new Map();
    for (const [chave, normais] of verticeNormaisMap.entries()) {
      const normaSoma = { x: 0, y: 0, z: 0 };
      for (const normal of normais) {
        normaSoma.x += normal.x;
        normaSoma.y += normal.y;
        normaSoma.z += normal.z;
      }

      const normalMedia = {
        x: normaSoma.x / normais.length,
        y: normaSoma.y / normais.length,
        z: normaSoma.z / normais.length,
      };

      const normalUnitaria = this.normalizeVector(normalMedia);

      verticeNormais.set(chave, normalUnitaria);
    }

    return { verticeMap, verticeNormais };
  }

  calcularIluminacaoVerticeRGB(vertice, normal) {
    const ambientLight = [
      this.ambientIntensity[0] * this.material.Ka[0],
      this.ambientIntensity[1] * this.material.Ka[1],
      this.ambientIntensity[2] * this.material.Ka[2],
    ];

    const lightDirection = this.normalizeVector({
      x: this.light.x - vertice.x,
      y: this.light.y - vertice.y,
      z: this.light.z - vertice.z,
    });

    const cosAngulo = this.dotProduct(normal, lightDirection);

    const diffuseLight = [0, 0, 0];
    if (cosAngulo > 0) {
      // Abordagem mais incremental - calcular fatores uma vez
      const factorR = cosAngulo * this.material.Kd[0];
      const factorG = cosAngulo * this.material.Kd[1];
      const factorB = cosAngulo * this.material.Kd[2];

      diffuseLight[0] = factorR * this.light.intensity[0];
      diffuseLight[1] = factorG * this.light.intensity[1];
      diffuseLight[2] = factorB * this.light.intensity[2];
    }

    const specularLight = [0, 0, 0];

    if (cosAngulo > 0) {
      const viewDirection = this.normalizeVector({
        x: this.vrp.x - vertice.x,
        y: this.vrp.y - vertice.y,
        z: this.vrp.z - vertice.z,
      });

      const twoCosProdN = {
        x: 2 * cosAngulo * normal.x,
        y: 2 * cosAngulo * normal.y,
        z: 2 * cosAngulo * normal.z,
      };

      const reflectionDirection = this.normalizeVector({
        x: twoCosProdN.x - lightDirection.x,
        y: twoCosProdN.y - lightDirection.y,
        z: twoCosProdN.z - lightDirection.z,
      });

      const specularFactor = this.dotProduct(
        reflectionDirection,
        viewDirection
      );

      if (specularFactor > 0) {
        let specPower = specularFactor;
        for (let i = 1; i < this.material.n; i++) {
          specPower *= specularFactor;
        }

        specularLight[0] =
          this.material.Ks[0] * this.light.intensity[0] * specPower;
        specularLight[1] =
          this.material.Ks[1] * this.light.intensity[1] * specPower;
        specularLight[2] =
          this.material.Ks[2] * this.light.intensity[2] * specPower;
      }
    }

    return [
      Math.min(
        255,
        Math.round(ambientLight[0] + diffuseLight[0] + specularLight[0])
      ),
      Math.min(
        255,
        Math.round(ambientLight[1] + diffuseLight[1] + specularLight[1])
      ),
      Math.min(
        255,
        Math.round(ambientLight[2] + diffuseLight[2] + specularLight[2])
      ),
    ];
  }

  interpolarRGB(rgb1, rgb2, t) {
    return [
      rgb1[0] + t * (rgb2[0] - rgb1[0]),
      rgb1[1] + t * (rgb2[1] - rgb1[1]),
      rgb1[2] + t * (rgb2[2] - rgb1[2]),
    ];
  }

  // Modificação do método rasterizarMalha para usar sombreamento Gouraud com RGB
  rasterizarMalhaGouraudRGB(malha) {
    const { verticeMap, verticeNormais } = this.calcularNormaisVertices(malha);

    for (let face of malha) {
      if (face.length < 3) continue;

      const faceNormal = this.calculateFaceNormal(face[0], face[1], face[2]);

      if (this.isFaceVisible(faceNormal, this.vrp)) {
        const verticesComIluminacao = face.map((vertice) => {
          const chave = `${vertice.x.toFixed(4)},${vertice.y.toFixed(
            4
          )},${vertice.z.toFixed(4)}`;

          const normal = verticeNormais.get(chave);

          const iluminacaoRGB = this.calcularIluminacaoVerticeRGB(
            vertice,
            normal
          );

          return {
            ...vertice,
            iluminacaoRGB: iluminacaoRGB,
          };
        });

        this.rasterizarFaceGouraudRGB(verticesComIluminacao);
      }
    }
  }

  rasterizarFaceGouraudRGB(vertices) {
    if (!vertices || vertices.length < 3) {
      console.error("Parâmetros inválidos em rasterizarFaceGouraudRGB");
      return;
    }

    const xMin = 0;
    const yMin = 0;
    const xMax = parseFloat(document.getElementById("xvMax").value);
    const yMax = parseFloat(document.getElementById("yvMax").value);

    const clippedVertices = this.clipPolygonGouraudRGB(
      vertices,
      xMin,
      xMax,
      yMin,
      yMax
    );

    if (clippedVertices.length < 3) {
      return;
    }

    let ymin = Infinity;
    let ymax = -Infinity;

    for (let v of clippedVertices) {
      if (v.y < ymin) ymin = v.y;
      if (v.y > ymax) ymax = v.y;
    }

    ymin = Math.floor(ymin);
    ymax = Math.ceil(ymax);

    ymin = Math.max(0, ymin);
    ymax = Math.min(this.height - 1, ymax);

    if (ymin >= ymax) {
      return;
    }

    let vetor_y = this.mapeamentoVertical(ymin, ymax);

    for (let i = 0; i < clippedVertices.length; i++) {
      let j = (i + 1) % clippedVertices.length;
      this.intersecaoGouraudRGB(
        clippedVertices[i],
        clippedVertices[j],
        vetor_y
      );
    }

    vetor_y = this.ordenarVetoresX(vetor_y);

    this.preencherFaceGouraudRGB(vetor_y);
  }

  // Recorte específico para Gouraud com RGB
  clipPolygonGouraudRGB(polygon, xMin, xMax, yMin, yMax) {
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      console.warn("Polígono inválido para recorte Gouraud RGB");
      return [];
    }

    let edges = ["LEFT", "RIGHT", "BOTTOM", "TOP"];
    let clippedPolygon = [...polygon]; // Clone o polígono original

    for (let edge of edges) {
      let inputList = [...clippedPolygon]; // Clone a lista atual
      clippedPolygon = [];

      if (inputList.length < 3) {
        console.warn(`Polígono foi completamente recortado na borda ${edge}`);
        break; // Polígono já foi completamente recortado
      }

      for (let i = 0; i < inputList.length; i++) {
        let p1 = inputList[i];
        let p2 = inputList[(i + 1) % inputList.length];

        if (
          !p1 ||
          !p2 ||
          p1.x === undefined ||
          p1.y === undefined ||
          p2.x === undefined ||
          p2.y === undefined
        ) {
          console.error(
            "Pontos inválidos encontrados para Gouraud RGB:",
            p1,
            p2
          );
          continue;
        }

        let p1Inside = this.inside(p1, edge, xMin, xMax, yMin, yMax);
        let p2Inside = this.inside(p2, edge, xMin, xMax, yMin, yMax);

        if (p1Inside && p2Inside) {
          clippedPolygon.push(p2);
        } else if (p1Inside && !p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );

          if (p1.iluminacaoRGB && p2.iluminacaoRGB) {
            let t;
            if (edge === "LEFT" || edge === "RIGHT") {
              t = Math.abs((intersection.x - p1.x) / (p2.x - p1.x));
            } else {
              t = Math.abs((intersection.y - p1.y) / (p2.y - p1.y));
            }

            intersection.iluminacaoRGB = this.interpolarRGB(
              p1.iluminacaoRGB,
              p2.iluminacaoRGB,
              t
            );
          }

          clippedPolygon.push(intersection);
        } else if (!p1Inside && p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );

          if (p1.iluminacaoRGB && p2.iluminacaoRGB) {
            let t;
            if (edge === "LEFT" || edge === "RIGHT") {
              t = Math.abs((intersection.x - p1.x) / (p2.x - p1.x));
            } else {
              t = Math.abs((intersection.y - p1.y) / (p2.y - p1.y));
            }

            intersection.iluminacaoRGB = this.interpolarRGB(
              p1.iluminacaoRGB,
              p2.iluminacaoRGB,
              t
            );
          }

          clippedPolygon.push(intersection);
          clippedPolygon.push(p2);
        }
      }
    }

    if (clippedPolygon.length < 3) {
      console.warn("Polígono Gouraud RGB recortado tem menos de 3 vértices");
      return [];
    }

    return clippedPolygon;
  }

  // Método para calcular intersecções com iluminação RGB para Gouraud
  intersecaoGouraudRGB(v0, v1, vetor_y) {
    if (!v0 || !v1 || v0.y === undefined || v1.y === undefined) {
      console.error("Vértices inválidos:", v0, v1);
      return;
    }

    if (Math.abs(v0.y - v1.y) < 0.001) return;

    if (!vetor_y || vetor_y.length === 0) {
      console.error("vetor_y inválido");
      return;
    }

    if (v0.y > v1.y) [v0, v1] = [v1, v0];

    if (
      Math.ceil(v0.y) > vetor_y[vetor_y.length - 1].y ||
      Math.floor(v1.y) < vetor_y[0].y
    ) {
      return; // Fora dos limites do vetor_y
    }

    const deltaY = v1.y - v0.y;

    const taxaX = (v1.x - v0.x) / deltaY;
    const taxaZ = (v1.z - v0.z) / deltaY;

    let taxaR = 0,
      taxaG = 0,
      taxaB = 0;
    if (v0.iluminacaoRGB && v1.iluminacaoRGB) {
      taxaR = (v1.iluminacaoRGB[0] - v0.iluminacaoRGB[0]) / deltaY;
      taxaG = (v1.iluminacaoRGB[1] - v0.iluminacaoRGB[1]) / deltaY;
      taxaB = (v1.iluminacaoRGB[2] - v0.iluminacaoRGB[2]) / deltaY;
    } else {
      v0.iluminacaoRGB = [255, 255, 255];
      v1.iluminacaoRGB = [255, 255, 255];
    }

    const yInicio = Math.max(Math.ceil(v0.y), vetor_y[0].y);

    let xAtual = v0.x;
    let zAtual = v0.z;
    let rAtual = v0.iluminacaoRGB[0];
    let gAtual = v0.iluminacaoRGB[1];
    let bAtual = v0.iluminacaoRGB[2];

    if (yInicio > Math.ceil(v0.y)) {
      const avancoY = yInicio - v0.y;
      xAtual += taxaX * avancoY;
      zAtual += taxaZ * avancoY;
      rAtual += taxaR * avancoY;
      gAtual += taxaG * avancoY;
      bAtual += taxaB * avancoY;
    } else {
      const ajuste = Math.ceil(v0.y) - v0.y;
      if (ajuste > 0) {
        xAtual += taxaX * ajuste;
        zAtual += taxaZ * ajuste;
        rAtual += taxaR * ajuste;
        gAtual += taxaG * ajuste;
        bAtual += taxaB * ajuste;
      }
    }

    for (
      let y = yInicio;
      y <= Math.min(Math.floor(v1.y), vetor_y[vetor_y.length - 1].y);
      y++
    ) {
      const index = y - vetor_y[0].y;

      if (index >= 0 && index < vetor_y.length) {
        if (
          !isNaN(xAtual) &&
          !isNaN(zAtual) &&
          isFinite(xAtual) &&
          isFinite(zAtual)
        ) {
          vetor_y[index].x.push({
            x: xAtual,
            z: zAtual,
            iluminacaoRGB: [
              Math.min(255, Math.max(0, Math.round(rAtual))),
              Math.min(255, Math.max(0, Math.round(gAtual))),
              Math.min(255, Math.max(0, Math.round(bAtual))),
            ],
          });
        }

        xAtual += taxaX;
        zAtual += taxaZ;
        rAtual += taxaR;
        gAtual += taxaG;
        bAtual += taxaB;
      }
    }
  }

  preencherFaceGouraudRGB(vetor_y) {
    if (!vetor_y || !Array.isArray(vetor_y) || vetor_y.length === 0) {
      console.error("Parâmetros inválidos em preencherFaceGouraudRGB");
      return;
    }

    for (let scan of vetor_y) {
      if (
        !scan ||
        !Array.isArray(scan.x) ||
        scan.x.length === 0 ||
        scan.y === undefined
      ) {
        continue;
      }

      for (let i = 0; i < scan.x.length - 1; i += 2) {
        if (i + 1 < scan.x.length) {
          this.preencherScanlineGouraudRGB(scan.x[i], scan.x[i + 1], scan.y);
        }
      }
    }
  }

  // Preenchimento de scanline com interpolação de cores RGB para Gouraud
  preencherScanlineGouraudRGB(x0, x1, y) {
    if (
      !x0 ||
      !x1 ||
      x0.x === undefined ||
      x1.x === undefined ||
      x0.z === undefined ||
      x1.z === undefined ||
      isNaN(y)
    ) {
      return;
    }

    if (x0.x > x1.x) [x0, x1] = [x1, x0];

    // Calcular os limites da scanline com um pequeno sobrepasso para evitar buracos
    const xStart = Math.max(0, Math.floor(x0.x) - 1); // -1 para expandir levemente
    const xEnd = Math.min(this.width - 1, Math.ceil(x1.x) + 1); // +1 para expandir levemente

    if (xStart > xEnd) return;

    const deltaX = x1.x - x0.x;

    if (Math.abs(deltaX) < 0.001) return;

    const taxaZ = (x1.z - x0.z) / deltaX;

    let taxaR = 0,
      taxaG = 0,
      taxaB = 0;

    if (x0.iluminacaoRGB && x1.iluminacaoRGB) {
      taxaR = (x1.iluminacaoRGB[0] - x0.iluminacaoRGB[0]) / deltaX;
      taxaG = (x1.iluminacaoRGB[1] - x0.iluminacaoRGB[1]) / deltaX;
      taxaB = (x1.iluminacaoRGB[2] - x0.iluminacaoRGB[2]) / deltaX;
    } else {
      x0.iluminacaoRGB = [255, 255, 255];
      x1.iluminacaoRGB = [255, 255, 255];
    }

    let zAtual = x0.z;
    let rAtual = x0.iluminacaoRGB[0];
    let gAtual = x0.iluminacaoRGB[1];
    let bAtual = x0.iluminacaoRGB[2];

    if (xStart > Math.ceil(x0.x)) {
      const avancoX = xStart - x0.x;
      zAtual += taxaZ * avancoX;
      rAtual += taxaR * avancoX;
      gAtual += taxaG * avancoX;
      bAtual += taxaB * avancoX;
    }

    for (let x = xStart; x <= xEnd; x++) {
      const corRGB = [
        Math.min(255, Math.max(0, Math.round(rAtual))),
        Math.min(255, Math.max(0, Math.round(gAtual))),
        Math.min(255, Math.max(0, Math.round(bAtual))),
      ];

      this.setPixel(x, y, zAtual, corRGB);

      zAtual += taxaZ;
      rAtual += taxaR;
      gAtual += taxaG;
      bAtual += taxaB;
    }
  }

  // verificar se um ponto está dentro da janela de recorte
  inside(point, edge, xMin, xMax, yMin, yMax) {
    const epsilon = 0.0001;

    switch (edge) {
      case "LEFT":
        return point.x >= xMin - epsilon;
      case "RIGHT":
        return point.x <= xMax + epsilon;
      case "BOTTOM":
        return point.y >= yMin - epsilon;
      case "TOP":
        return point.y <= yMax + epsilon;
    }
    return false;
  }

  intersection(p1, p2, edge, xMin, xMax, yMin, yMax) {
    let x, y, z;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const dz = p2.z !== undefined && p1.z !== undefined ? p2.z - p1.z : 0;

    let t = 0;

    switch (edge) {
      case "LEFT":
        if (Math.abs(dx) < 0.0001) {
          x = p1.x;
        } else {
          t = (xMin - p1.x) / dx;
          x = xMin;
        }
        y = p1.y + t * dy;
        break;
      case "RIGHT":
        if (Math.abs(dx) < 0.0001) {
          x = p1.x;
        } else {
          t = (xMax - p1.x) / dx;
          x = xMax;
        }
        y = p1.y + t * dy;
        break;
      case "BOTTOM":
        if (Math.abs(dy) < 0.0001) {
          y = p1.y;
        } else {
          t = (yMin - p1.y) / dy;
          y = yMin;
        }
        x = p1.x + t * dx;
        break;
      case "TOP":
        if (Math.abs(dy) < 0.0001) {
          y = p1.y;
        } else {
          t = (yMax - p1.y) / dy;
          y = yMax;
        }
        x = p1.x + t * dx;
        break;
    }

    z = p1.z !== undefined && p2.z !== undefined ? p1.z + t * dz : 0;

    return { x, y, z };
  }


  calcularNormaisVerticesPhong(malha) {
    const verticeMap = new Map();
    const verticeNormaisMap = new Map();

    for (let faceIndex = 0; faceIndex < malha.length; faceIndex++) {
      const face = malha[faceIndex];

      const faceNormal = this.calculateFaceNormal(face[0], face[1], face[2]);

      for (let i = 0; i < face.length; i++) {
        const vertice = face[i];
        const chave = `${vertice.x.toFixed(4)},${vertice.y.toFixed(
          4
        )},${vertice.z.toFixed(4)}`;

        if (!verticeNormaisMap.has(chave)) {
          verticeNormaisMap.set(chave, []);
        }
        verticeNormaisMap.get(chave).push(faceNormal);

        verticeMap.set(chave, vertice);
      }
    }

    const verticeNormais = new Map();
    for (const [chave, normais] of verticeNormaisMap.entries()) {
      const normaSoma = { x: 0, y: 0, z: 0 };
      for (const normal of normais) {
        normaSoma.x += normal.x;
        normaSoma.y += normal.y;
        normaSoma.z += normal.z;
      }

      const normalMedia = {
        x: normaSoma.x / normais.length,
        y: normaSoma.y / normais.length,
        z: normaSoma.z / normais.length,
      };

      const normalUnitaria = this.normalizeVector(normalMedia);

      verticeNormais.set(chave, normalUnitaria);
    }

    return { verticeMap, verticeNormais };
  }

  calcularVetorH(L, V) {
    const H = {
      x: L.x + V.x,
      y: L.y + V.y,
      z: L.z + V.z,
    };

    return this.normalizeVector(H);
  }

  prepararVerticesComNormaisPhong(vertices, verticeNormais) {
    return vertices.map((vertice) => {
      const chave = `${vertice.x.toFixed(4)},${vertice.y.toFixed(
        4
      )},${vertice.z.toFixed(4)}`;
      const normal = verticeNormais.get(chave) || { x: 0, y: 0, z: 1 }; // Valor padrão se não encontrar

      return {
        ...vertice,
        normal: normal,
      };
    });
  }

  // recorte Phong
  clipPolygonPhong(polygon, xMin, xMax, yMin, yMax) {
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      console.warn("Polígono inválido para recorte Phong");
      return [];
    }

    let edges = ["LEFT", "RIGHT", "BOTTOM", "TOP"];
    let clippedPolygon = [...polygon]; // Clone o polígono original

    for (let edge of edges) {
      let inputList = [...clippedPolygon]; // Clone a lista atual
      clippedPolygon = [];

      if (inputList.length < 3) {
        console.warn(`Polígono foi completamente recortado na borda ${edge}`);
        break; // Polígono já foi completamente recortado
      }

      for (let i = 0; i < inputList.length; i++) {
        let p1 = inputList[i];
        let p2 = inputList[(i + 1) % inputList.length];

        if (
          !p1 ||
          !p2 ||
          p1.x === undefined ||
          p1.y === undefined ||
          p2.x === undefined ||
          p2.y === undefined
        ) {
          console.error("Pontos inválidos encontrados para Phong:", p1, p2);
          continue;
        }

        let p1Inside = this.inside(p1, edge, xMin, xMax, yMin, yMax);
        let p2Inside = this.inside(p2, edge, xMin, xMax, yMin, yMax);

        if (p1Inside && p2Inside) {
          clippedPolygon.push(p2);
        } else if (p1Inside && !p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );

          if (p1.normal && p2.normal) {
            let t;
            if (edge === "LEFT" || edge === "RIGHT") {
              t = Math.abs((intersection.x - p1.x) / (p2.x - p1.x));
            } else {
              t = Math.abs((intersection.y - p1.y) / (p2.y - p1.y));
            }

            intersection.normal = {
              x: p1.normal.x + t * (p2.normal.x - p1.normal.x),
              y: p1.normal.y + t * (p2.normal.y - p1.normal.y),
              z: p1.normal.z + t * (p2.normal.z - p1.normal.z),
            };

            intersection.normal = this.normalizeVector(intersection.normal);
          }

          clippedPolygon.push(intersection);
        } else if (!p1Inside && p2Inside) {
          const intersection = this.intersection(
            p1,
            p2,
            edge,
            xMin,
            xMax,
            yMin,
            yMax
          );

          if (p1.normal && p2.normal) {
            let t;
            if (edge === "LEFT" || edge === "RIGHT") {
              t = Math.abs((intersection.x - p1.x) / (p2.x - p1.x));
            } else {
              t = Math.abs((intersection.y - p1.y) / (p2.y - p1.y));
            }

            intersection.normal = {
              x: p1.normal.x + t * (p2.normal.x - p1.normal.x),
              y: p1.normal.y + t * (p2.normal.y - p1.normal.y),
              z: p1.normal.z + t * (p2.normal.z - p1.normal.z),
            };

            intersection.normal = this.normalizeVector(intersection.normal);
          }

          clippedPolygon.push(intersection);
          clippedPolygon.push(p2);
        }
      }
    }

    if (clippedPolygon.length < 3) {
      console.warn("Polígono Phong recortado tem menos de 3 vértices");
      return [];
    }

    return clippedPolygon;
  }

  //calcular intersecções entre arestas e scanlines para Phong
  intersecaoPhong(v0, v1, vetor_y) {
    if (!v0 || !v1 || v0.y === undefined || v1.y === undefined) {
      console.error("Vértices inválidos:", v0, v1);
      return;
    }

    if (!v0.normal || !v1.normal) {
      console.error("Normais inválidas para Phong:", v0.normal, v1.normal);
      return;
    }

    if (Math.abs(v0.y - v1.y) < 0.001) return;

    if (!vetor_y || vetor_y.length === 0) {
      console.error("vetor_y inválido");
      return;
    }

    if (v0.y > v1.y) [v0, v1] = [v1, v0];

    if (
      Math.ceil(v0.y) > vetor_y[vetor_y.length - 1].y ||
      Math.floor(v1.y) < vetor_y[0].y
    ) {
      return; // Fora dos limites do vetor_y
    }

    const deltaY = v1.y - v0.y;

    const taxaX = (v1.x - v0.x) / deltaY;
    const taxaZ = (v1.z - v0.z) / deltaY;

    const taxaNx = (v1.normal.x - v0.normal.x) / deltaY;
    const taxaNy = (v1.normal.y - v0.normal.y) / deltaY;
    const taxaNz = (v1.normal.z - v0.normal.z) / deltaY;

    const yInicio = Math.max(Math.ceil(v0.y), vetor_y[0].y);

    let xAtual = v0.x;
    let zAtual = v0.z;
    let nxAtual = v0.normal.x;
    let nyAtual = v0.normal.y;
    let nzAtual = v0.normal.z;

    if (yInicio > Math.ceil(v0.y)) {
      const avancoY = yInicio - v0.y;
      xAtual += taxaX * avancoY;
      zAtual += taxaZ * avancoY;
      nxAtual += taxaNx * avancoY;
      nyAtual += taxaNy * avancoY;
      nzAtual += taxaNz * avancoY;
    } else {
      const ajuste = Math.ceil(v0.y) - v0.y;
      if (ajuste > 0) {
        xAtual += taxaX * ajuste;
        zAtual += taxaZ * ajuste;
        nxAtual += taxaNx * ajuste;
        nyAtual += taxaNy * ajuste;
        nzAtual += taxaNz * ajuste;
      }
    }

    for (
      let y = yInicio;
      y <= Math.min(Math.floor(v1.y), vetor_y[vetor_y.length - 1].y);
      y++
    ) {
      const index = y - vetor_y[0].y;

      if (index >= 0 && index < vetor_y.length) {
        if (
          !isNaN(xAtual) &&
          !isNaN(zAtual) &&
          !isNaN(nxAtual) &&
          !isNaN(nyAtual) &&
          !isNaN(nzAtual) &&
          isFinite(xAtual) &&
          isFinite(zAtual) &&
          isFinite(nxAtual) &&
          isFinite(nyAtual) &&
          isFinite(nzAtual)
        ) {
          vetor_y[index].x.push({
            x: xAtual,
            z: zAtual,
            normal: {
              x: nxAtual,
              y: nyAtual,
              z: nzAtual,
            },
          });
        }

        xAtual += taxaX;
        zAtual += taxaZ;
        nxAtual += taxaNx;
        nyAtual += taxaNy;
        nzAtual += taxaNz;
      }
    }
  }

  // Método para preencher face com Phong 
  preencherFacePhong(vetor_y) {
    if (!vetor_y || !Array.isArray(vetor_y) || vetor_y.length === 0) {
      console.error("Parâmetros inválidos em preencherFacePhong");
      return;
    }

    for (let scan of vetor_y) {
      if (
        !scan ||
        !Array.isArray(scan.x) ||
        scan.x.length === 0 ||
        scan.y === undefined
      ) {
        continue;
      }

      for (let i = 0; i < scan.x.length - 1; i += 2) {
        if (i + 1 < scan.x.length) {
          this.preencherScanlinePhong(scan.x[i], scan.x[i + 1], scan.y);
        }
      }
    }
  }

  preencherScanlinePhong(x0, x1, y) {
    if (
      !x0 ||
      !x1 ||
      x0.x === undefined ||
      x1.x === undefined ||
      x0.z === undefined ||
      x1.z === undefined ||
      isNaN(y)
    ) {
      return;
    }

    if (!x0.normal || !x1.normal) {
      console.error(
        "Normais inválidas para Phong em scanline:",
        x0.normal,
        x1.normal
      );
      return;
    }

    if (x0.x > x1.x) [x0, x1] = [x1, x0];

    const xStart = Math.max(0, Math.ceil(x0.x));
    const xEnd = Math.min(this.width - 1, Math.floor(x1.x));

    if (xStart > xEnd) return;

    const deltaX = x1.x - x0.x;

    if (Math.abs(deltaX) < 0.001) return;

    const taxaZ = (x1.z - x0.z) / deltaX;
    const taxaNx = (x1.normal.x - x0.normal.x) / deltaX;
    const taxaNy = (x1.normal.y - x0.normal.y) / deltaX;
    const taxaNz = (x1.normal.z - x0.normal.z) / deltaX;

    let zAtual = x0.z;
    let nxAtual = x0.normal.x;
    let nyAtual = x0.normal.y;
    let nzAtual = x0.normal.z;

    if (xStart > Math.ceil(x0.x)) {
      const avancoX = xStart - x0.x;
      zAtual += taxaZ * avancoX;
      nxAtual += taxaNx * avancoX;
      nyAtual += taxaNy * avancoX;
      nzAtual += taxaNz * avancoX;
    } else {
      const ajuste = Math.ceil(x0.x) - x0.x;
      if (ajuste > 0) {
        zAtual += taxaZ * ajuste;
        nxAtual += taxaNx * ajuste;
        nyAtual += taxaNy * ajuste;
        nzAtual += taxaNz * ajuste;
      }
    }

    for (let x = xStart; x <= xEnd; x++) {
      const normalLength = Math.sqrt(
        nxAtual * nxAtual + nyAtual * nyAtual + nzAtual * nzAtual
      );

      if (normalLength > 0.001) {
        const normalizedN = {
          x: nxAtual / normalLength,
          y: nyAtual / normalLength,
          z: nzAtual / normalLength,
        };

        const pixelPoint = { x, y, z: zAtual };

        const rgbLight = this.calcularIluminacaoPhong(pixelPoint, normalizedN);

        this.setPixel(x, y, zAtual, rgbLight);
      }

      zAtual += taxaZ;
      nxAtual += taxaNx;
      nyAtual += taxaNy;
      nzAtual += taxaNz;
    }
  }

  calcularIluminacaoPhong(ponto, normal) {
    const ambientLight = [
      this.ambientIntensity[0] * this.material.Ka[0],
      this.ambientIntensity[1] * this.material.Ka[1],
      this.ambientIntensity[2] * this.material.Ka[2],
    ];

    const L = this.normalizeVector({
      x: this.light.x - ponto.x,
      y: this.light.y - ponto.y,
      z: this.light.z - ponto.z,
    });

    const cosAngulo = this.dotProduct(normal, L);

    const diffuseLight = [0, 0, 0];
    if (cosAngulo > 0) {
      diffuseLight[0] =
        this.light.intensity[0] * this.material.Kd[0] * cosAngulo;
      diffuseLight[1] =
        this.light.intensity[1] * this.material.Kd[1] * cosAngulo;
      diffuseLight[2] =
        this.light.intensity[2] * this.material.Kd[2] * cosAngulo;
    }

    const specularLight = [0, 0, 0];

    if (cosAngulo > 0) {
      const S = this.normalizeVector({
        x: this.vrp.x - ponto.x,
        y: this.vrp.y - ponto.y,
        z: this.vrp.z - ponto.z,
      });

      const H = this.calcularVetorH(L, S);

      const specularFactor = this.dotProduct(normal, H);

      if (specularFactor > 0) {
        let specPower = specularFactor;
        for (let i = 1; i < this.material.n; i++) {
          specPower *= specularFactor;
        }

        specularLight[0] =
          this.light.intensity[0] * this.material.Ks[0] * specPower;
        specularLight[1] =
          this.light.intensity[1] * this.material.Ks[1] * specPower;
        specularLight[2] =
          this.light.intensity[2] * this.material.Ks[2] * specPower;
      }
    }

    return [
      Math.min(
        255,
        Math.round(ambientLight[0] + diffuseLight[0] + specularLight[0])
      ),
      Math.min(
        255,
        Math.round(ambientLight[1] + diffuseLight[1] + specularLight[1])
      ),
      Math.min(
        255,
        Math.round(ambientLight[2] + diffuseLight[2] + specularLight[2])
      ),
    ];
  }

  // Método principal para renderizar malha com Phong
  rasterizarMalhaPhong(malha) {
    const { verticeMap, verticeNormais } =
      this.calcularNormaisVerticesPhong(malha);

    for (let face of malha) {
      if (face.length < 3) continue;

      const faceNormal = this.calculateFaceNormal(face[0], face[1], face[2]);

      if (this.isFaceVisible(faceNormal, this.vrp)) {
        const verticesComNormais = this.prepararVerticesComNormaisPhong(
          face,
          verticeNormais
        );

        this.rasterizarFacePhong(verticesComNormais);
      }
    }
  }

  // rasterizar uma face com Phong shading
  rasterizarFacePhong(vertices) {
    if (!vertices || vertices.length < 3) {
      console.error("Parâmetros inválidos em rasterizarFacePhong");
      return;
    }

    const xMin = 0;
    const yMin = 0;
    const xMax = parseFloat(document.getElementById("xvMax").value);
    const yMax = parseFloat(document.getElementById("yvMax").value);

    const clippedVertices = this.clipPolygonPhong(
      vertices,
      xMin,
      xMax,
      yMin,
      yMax
    );

    if (clippedVertices.length < 3) {
      return;
    }

    let ymin = Infinity;
    let ymax = -Infinity;

    for (let v of clippedVertices) {
      if (v.y < ymin) ymin = v.y;
      if (v.y > ymax) ymax = v.y;
    }

    ymin = Math.floor(ymin);
    ymax = Math.ceil(ymax);

    ymin = Math.max(0, ymin);
    ymax = Math.min(this.height - 1, ymax);

    if (ymin >= ymax) {
      return;
    }

    let vetor_y = this.mapeamentoVertical(ymin, ymax);

    for (let i = 0; i < clippedVertices.length; i++) {
      let j = (i + 1) % clippedVertices.length;
      this.intersecaoPhong(clippedVertices[i], clippedVertices[j], vetor_y);
    }

    vetor_y = this.ordenarVetoresX(vetor_y);

    this.preencherFacePhong(vetor_y);
  }
}

/**
 * Classe para renderização da superfície
 */
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    this.pointSize = 2;
    this.showControlPoints = true; // Por padrão, mostrar os pontos

    this.viewport = {
      minX: parseFloat(document.getElementById("xvMin").value),
      maxX: parseFloat(document.getElementById("xvMax").value),
      minY: parseFloat(document.getElementById("yvMin").value),
      maxY: parseFloat(document.getElementById("yvMax").value),
    };

    this.updateViewportDimensions();
    this.updateCanvasSize();
  }

  setColors(visibleColor, hiddenColor, backgroundColor) {
    this.visibleColor = visibleColor;
    this.hiddenColor = hiddenColor;
    this.backgroundColor = backgroundColor;
  }

  setGridColor(color) {
    this.gridColor = color;
  }

  setControlPointColor(color) {
    this.controlPointColor = color;
  }

  setPointSize(size) {
    this.pointSize = size;
  }

  // Define o viewport
  setViewport(viewport) {
    this.viewport = viewport;

    this.updateViewportDimensions();

    this.updateView();
  }

  setShowControlPoints(show) {
    this.showControlPoints = show;
  }

  updateViewportDimensions() {
    const xvMin = parseFloat(document.getElementById("xvMin").value) || 0;
    const xvMax = parseFloat(document.getElementById("xvMax").value) || 800;
    const yvMin = parseFloat(document.getElementById("yvMin").value) || 0;
    const yvMax = parseFloat(document.getElementById("yvMax").value) || 600;

    const width = xvMax - xvMin;
    const height = yvMax - yvMin;

    this.viewportDimensions = {
      width: width,
      height: height,
    };

  }

  // Método para atualizar a visualização após mudanças na viewport
  updateView() {
    this.clear();

    if (this.lastSurfacePoints && this.lastControlPoints) {
      this.drawSurface(this.lastSurfacePoints, this.lastControlPoints);
    }

    this.drawViewport();
  }

  // Atualiza o tamanho do canvas
  updateCanvasSize() {
    if (this.canvas.parentElement) {
      this.canvas.width = this.canvas.parentElement.clientWidth;
      this.canvas.height = this.canvas.parentElement.clientHeight;
    }
  }

  // Mapeia um ponto da viewport virtual para coordenadas do canvas
  mapToCanvas(point) {
    const { minX, maxX, minY, maxY } = this.viewport;
    const { width, height } = this.viewportDimensions;

    const offsetX = 0; // Posição X no canvas onde a viewport começa
    const offsetY = 0; // Posição Y no canvas onde a viewport começa

    const scaleX = width / (maxX - minX);
    const scaleY = height / (maxY - minY);

    return {
      x: offsetX + (point.x - minX) * scaleX,
      y: offsetY + (point.y - minY) * scaleY,
    };
  }

  // Mapeia um array de pontos para coordenadas do canvas
  mapPointsToCanvas(points) {
    if (!points) return null;

    const mappedPoints = [];

    for (let i = 0; i < points.length; i++) {
      const rowPoints = [];
      for (let j = 0; j < points[i].length; j++) {
        if (points[i][j]) {
          rowPoints.push(this.mapToCanvas(points[i][j]));
        } else {
          rowPoints.push(null);
        }
      }
      mappedPoints.push(rowPoints);
    }

    return mappedPoints;
  }

  // Limpa o canvas
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(
      0,
      0,
      this.viewportDimensions.width,
      this.viewportDimensions.height
    );
  }

  drawSurface(surfacePoints, controlPoints) {
    this.lastSurfacePoints = surfacePoints;
    this.lastControlPoints = controlPoints;

    const mappedSurfacePoints = this.mapPointsToCanvas(surfacePoints);
    const mappedControlPoints = this.mapPointsToCanvas(controlPoints);

    this.drawWireframeGrid(mappedSurfacePoints);

    if (this.showControlPoints) {
      this.drawControlPoints(mappedControlPoints);
    }
  }
  drawViewport() {
    const ctx = this.context;
    ctx.strokeStyle = "red"; // Cor da borda da viewport
    ctx.lineWidth = 2;

    const xvMin = parseFloat(document.getElementById("xvMin").value);
    const xvMax = parseFloat(document.getElementById("xvMax").value);
    const yvMin = parseFloat(document.getElementById("yvMin").value);
    const yvMax = parseFloat(document.getElementById("yvMax").value);

    this.viewport = {
      minX: xvMin,
      maxX: xvMax,
      minY: yvMin,
      maxY: yvMax,
    };

    this.updateViewportDimensions();

    ctx.beginPath();
    ctx.rect(
      0,
      0,
      this.viewportDimensions.width,
      this.viewportDimensions.height
    );
    ctx.stroke();

    ctx.fillStyle = "red";
    ctx.font = "12px Arial";
    ctx.fillText(`(${xvMin}, ${yvMin})`, 5, 15);
    ctx.fillText(
      `(${xvMax}, ${yvMax})`,
      this.viewportDimensions.width - 70,
      this.viewportDimensions.height - 5
    );
  }

  drawWireframeGrid(points) {
    if (!points || points.length === 0) return;

    const ctx = this.context;
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      0,
      0,
      this.viewportDimensions.width,
      this.viewportDimensions.height
    );
    ctx.clip();

    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.moveTo(points[i][0].x, points[i][0].y);

      for (let j = 1; j < points[i].length; j++) {
        ctx.lineTo(points[i][j].x, points[i][j].y);
      }

      ctx.stroke();
    }

    for (let j = 0; j < points[0].length; j++) {
      ctx.beginPath();
      ctx.moveTo(points[0][j].x, points[0][j].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][j].x, points[i][j].y);
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  drawControlPoints(points) {
    if (!points) return;

    const ctx = this.context;
    ctx.fillStyle = this.controlPointColor;

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      0,
      0,
      this.viewportDimensions.width,
      this.viewportDimensions.height
    );
    ctx.clip();

    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points[i].length; j++) {
        if (points[i][j]) {
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

    ctx.restore();
  }

  drawDebugInfo(points, debugInfo) {
    if (!points || !debugInfo) return;

    const ctx = this.context;
    ctx.fillStyle = "#000000";
    ctx.font = "10px Arial";

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      0,
      0,
      this.viewportDimensions.width,
      this.viewportDimensions.height
    );
    ctx.clip();

    let yPos = 20;
    for (const info of debugInfo) {
      ctx.fillText(info, 10, yPos);
      yPos += 15;
    }

    ctx.restore();
  }
}
