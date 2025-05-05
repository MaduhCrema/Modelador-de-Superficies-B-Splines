/**
 * Classe principal para controle da aplicação
 */
class SurfaceController {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.surface = null;
        this.surfaces = [];
        this.currentSurfaceIndex = -1; // Nenhuma superfície selecionada inicialmente
        this.transformManager = new TransformationsManager();
        this.initializeViewport();
        this.setupDefaultColors();
        this.updateSurfacesList();
    }

    createNewSurface(params) {
        try {
            if (!params) {
                params = {
                    nRows: parseInt(document.getElementById("nRows").value) || 4,
                    nCols: parseInt(document.getElementById("nCols").value) || 4,
                    uStep: parseFloat(document.getElementById("uStep").value) || 0.1,
                    vStep: parseFloat(document.getElementById("vStep").value) || 0.1,
                };
            }

            const newSurface = new BSplineSurface(
                params.nRows,
                params.nCols,
                params.uStep,
                params.vStep
            );
            newSurface.surfacePoints = newSurface.generateSurfacePoints();

            const newTransformManager = new TransformationsManager();

            const lightingConfig = {
                light: {
                    x: parseFloat(document.getElementById("lightX").value) || 70,
                    y: parseFloat(document.getElementById("lightY").value) || 20,
                    z: parseFloat(document.getElementById("lightZ").value) || 35,
                    intensity: [
                        parseInt(document.getElementById("lightIntensityR").value) || 150,
                        parseInt(document.getElementById("lightIntensityG").value) || 150,
                        parseInt(document.getElementById("lightIntensityB").value) || 150,
                    ],
                },
                ambient: [
                    parseInt(document.getElementById("ambientIntensityR").value) || 120,
                    parseInt(document.getElementById("ambientIntensityG").value) || 120,
                    parseInt(document.getElementById("ambientIntensityB").value) || 120,
                ],
                material: {
                    Ka: [
                        parseFloat(document.getElementById("materialKaR").value) || 0.4,
                        parseFloat(document.getElementById("materialKaG").value) || 0.4,
                        parseFloat(document.getElementById("materialKaB").value) || 0.4,
                    ],
                    Kd: [
                        parseFloat(document.getElementById("materialKdR").value) || 0.7,
                        parseFloat(document.getElementById("materialKdG").value) || 0.7,
                        parseFloat(document.getElementById("materialKdB").value) || 0.7,
                    ],
                    Ks: [
                        parseFloat(document.getElementById("materialKsR").value) || 0.5,
                        parseFloat(document.getElementById("materialKsG").value) || 0.5,
                        parseFloat(document.getElementById("materialKsB").value) || 0.5,
                    ],
                    n: parseFloat(document.getElementById("materialN").value) || 2.15,
                },
                colors: {
                    visible: document.getElementById("visibleColor").value,
                    hidden: document.getElementById("hiddenColor").value,
                },
            };

            this.surfaces.push({
                surface: newSurface,
                transformManager: newTransformManager,
                lightingConfig: lightingConfig,
            });

            this.currentSurfaceIndex = this.surfaces.length - 1;
            this.selectSurface(this.currentSurfaceIndex);

            return true;
        } catch (error) {
            console.error("Erro ao criar superfície:", error);
            this.showError(error.message);
            return false;
        }
    }

  selectSurface(index) {
    if (index >= 0 && index < this.surfaces.length) {
      this.currentSurfaceIndex = index;

      const surfaceData = this.surfaces[index];
      this.surface = surfaceData.surface;

      this.transformManager = surfaceData.transformManager;

      this.updateTransformationUI();

      this.updateLightingUI(surfaceData.lightingConfig);

      this.updateSurfacesList();
      this.updateControlPointsUI();
      this.redrawSurface();
      return true;
    }
    return false;
  }

  deleteCurrentSurface() {
    if (this.currentSurfaceIndex >= 0) {
      this.surfaces.splice(this.currentSurfaceIndex, 1);

      if (this.surfaces.length === 0) {
        this.currentSurfaceIndex = -1;
        this.surface = null;
        this.transformManager = null;
      } else {
        this.currentSurfaceIndex = Math.min(
          this.currentSurfaceIndex,
          this.surfaces.length - 1
        );
        const surfaceData = this.surfaces[this.currentSurfaceIndex];
        this.surface = surfaceData.surface;
        this.transformManager = surfaceData.transformManager;
      }

      this.updateSurfacesList();
      this.updateTransformationUI();

      if (this.surface) {
        this.updateControlPointsUI();
      } else {
        document.getElementById("controlPointSelect").innerHTML = "";
      }

      this.redrawSurface();
      return true;
    }
    return false;
  }
  updateLightingUI(lightingConfig) {
    if (!lightingConfig) return;

    document.getElementById("lightX").value = lightingConfig.light.x;
    document.getElementById("lightY").value = lightingConfig.light.y;
    document.getElementById("lightZ").value = lightingConfig.light.z;

    document.getElementById("lightIntensityR").value =
      lightingConfig.light.intensity[0];
    document.getElementById("lightIntensityG").value =
      lightingConfig.light.intensity[1];
    document.getElementById("lightIntensityB").value =
      lightingConfig.light.intensity[2];

    document.getElementById("ambientIntensityR").value =
      lightingConfig.ambient[0];
    document.getElementById("ambientIntensityG").value =
      lightingConfig.ambient[1];
    document.getElementById("ambientIntensityB").value =
      lightingConfig.ambient[2];

    document.getElementById("materialKaR").value =
      lightingConfig.material.Ka[0];
    document.getElementById("materialKaG").value =
      lightingConfig.material.Ka[1];
    document.getElementById("materialKaB").value =
      lightingConfig.material.Ka[2];

    document.getElementById("materialKdR").value =
      lightingConfig.material.Kd[0];
    document.getElementById("materialKdG").value =
      lightingConfig.material.Kd[1];
    document.getElementById("materialKdB").value =
      lightingConfig.material.Kd[2];

    document.getElementById("materialKsR").value =
      lightingConfig.material.Ks[0];
    document.getElementById("materialKsG").value =
      lightingConfig.material.Ks[1];
    document.getElementById("materialKsB").value =
      lightingConfig.material.Ks[2];

    document.getElementById("materialN").value = lightingConfig.material.n;

    document.getElementById("visibleColor").value =
      lightingConfig.colors.visible;
    document.getElementById("hiddenColor").value = lightingConfig.colors.hidden;
  }

  updateSurfacesList() {
    const surfacesList = document.getElementById("surfacesList");
    if (!surfacesList) return;

    surfacesList.innerHTML = "";

    if (this.surfaces.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "empty-list";
      emptyMsg.textContent = "Nenhuma superfície criada";
      surfacesList.appendChild(emptyMsg);
      return;
    }

    this.surfaces.forEach((surfaceData, index) => {
      const item = document.createElement("div");
      item.className = "surface-item";
      if (index === this.currentSurfaceIndex) {
        item.classList.add("selected");
      }

      const surface = surfaceData.surface;

      let displayText = `Superfície ${index + 1}`;
      if (
        surface &&
        surface.nRows !== undefined &&
        surface.nCols !== undefined
      ) {
        displayText += ` - ${surface.nRows}x${surface.nCols} pontos`;
      }

      item.textContent = displayText;
      item.dataset.index = index;

      item.addEventListener("click", (e) => {
        e.preventDefault();
        this.selectSurface(index);
      });

      surfacesList.appendChild(item);
    });
  }

  updateTransformationUI() {
    if (!this.transformManager) return;

    document.getElementById("translationX").value =
      this.transformManager.translationValues.x;
    document.getElementById("translationY").value =
      this.transformManager.translationValues.y;
    document.getElementById("translationZ").value =
      this.transformManager.translationValues.z;

    document.getElementById("rotationX").value =
      this.transformManager.rotationValues.x;
    document.getElementById("rotationY").value =
      this.transformManager.rotationValues.y;
    document.getElementById("rotationZ").value =
      this.transformManager.rotationValues.z;

    document.getElementById("scale").value = this.transformManager.scaleValue;
  }
  

  getRGBLightingParams() {
    const lightConfig = {
      light: {
        x: parseFloat(document.getElementById("lightX").value) || 70,
        y: parseFloat(document.getElementById("lightY").value) || 20,
        z: parseFloat(document.getElementById("lightZ").value) || 35,
        intensity: [
          parseInt(document.getElementById("lightIntensityR").value) || 150,
          parseInt(document.getElementById("lightIntensityG").value) || 150,
          parseInt(document.getElementById("lightIntensityB").value) || 150,
        ],
      },
      ambient: [
        parseInt(document.getElementById("ambientIntensityR").value) || 120,
        parseInt(document.getElementById("ambientIntensityG").value) || 120,
        parseInt(document.getElementById("ambientIntensityB").value) || 120,
      ],
      material: {
        Ka: [
          parseFloat(document.getElementById("materialKaR").value) || 0.4,
          parseFloat(document.getElementById("materialKaG").value) || 0.4,
          parseFloat(document.getElementById("materialKaB").value) || 0.4,
        ],
        Kd: [
          parseFloat(document.getElementById("materialKdR").value) || 0.7,
          parseFloat(document.getElementById("materialKdG").value) || 0.7,
          parseFloat(document.getElementById("materialKdB").value) || 0.7,
        ],
        Ks: [
          parseFloat(document.getElementById("materialKsR").value) || 0.5,
          parseFloat(document.getElementById("materialKsG").value) || 0.5,
          parseFloat(document.getElementById("materialKsB").value) || 0.5,
        ],
        n: parseFloat(document.getElementById("materialN").value) || 2.15,
      },
    };

    if (
      this.currentSurfaceIndex >= 0 &&
      this.surfaces[this.currentSurfaceIndex]
    ) {
      this.surfaces[this.currentSurfaceIndex].lightingConfig.light =
        lightConfig.light;
      this.surfaces[this.currentSurfaceIndex].lightingConfig.ambient =
        lightConfig.ambient;
      this.surfaces[this.currentSurfaceIndex].lightingConfig.material =
        lightConfig.material;
    }

    return lightConfig;
  }

  setupDefaultColors() {
    this.renderer.setColors(
      document.getElementById("visibleColor").value,
      document.getElementById("hiddenColor").value,
      "#FFFFFF"
    ); // visível, oculto, background
    this.renderer.setGridColor("#333333");
    this.renderer.setControlPointColor("#FF0000");
    this.renderer.setPointSize(2);
  }

  i;

  initializeViewport() {
    try {
      const viewport = {
        minX: parseFloat(document.getElementById("xvMin").value) || 0,
        maxX: parseFloat(document.getElementById("xvMax").value) || 800,
        minY: parseFloat(document.getElementById("yvMin").value) || 0,
        maxY: parseFloat(document.getElementById("yvMax").value) || 600,
      };

      this.renderer.setViewport(viewport);

      this.renderer.updateViewportDimensions();
    } catch (error) {
      console.error("Erro ao inicializar viewport:", error);

      this.renderer.setViewport({
        minX: 0,
        maxX: 800,
        minY: 0,
        maxY: 600,
      });

      this.renderer.updateViewportDimensions();
    }
  }


  createRasterizador() {
    return new Rasterizador(this.canvas.width, this.canvas.height);
  }

  // Z-buffer
  renderWithRGBShading() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície para desenhar");
      }

      const viewParams = this.getViewParameters();

      let points = this.surface.getSurfacePoints();
      let controlPoints = this.surface.getControlPoints();

      points = this.transformManager.transformPoints(points);
      controlPoints = this.transformManager.transformPoints(controlPoints);

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

      const faces = PainterAlgorithm.generateFaces(projectedPoints);

      const rasterizador = this.createRasterizador();

      rasterizador.setVRP({
        x: viewParams.VRP[0],
        y: viewParams.VRP[1],
        z: viewParams.VRP[2],
      });

      const rgbParams = this.getRGBLightingParams();

      rasterizador.setLight(rgbParams.light);
      rasterizador.setAmbientIntensity(rgbParams.ambient);
      rasterizador.setMaterial(rgbParams.material);

      rasterizador.clearBuffers();

      const facesForRasterization = [];
      for (const face of faces) {
        if (
          face &&
          face.vertices &&
          Array.isArray(face.vertices) &&
          face.vertices.length >= 3
        ) {
          let verticesValidos = true;
          for (const v of face.vertices) {
            if (
              !v ||
              v.x === undefined ||
              v.y === undefined ||
              v.z === undefined ||
              isNaN(v.x) ||
              isNaN(v.y) ||
              isNaN(v.z)
            ) {
              verticesValidos = false;
              break;
            }
          }

          if (verticesValidos) {
            facesForRasterization.push(face.vertices);
          }
        }
      }

      if (facesForRasterization.length === 0) {
        throw new Error("Nenhuma face válida encontrada para renderização");
      }

      rasterizador.rasterizarMalha(facesForRasterization);

      rasterizador.renderToCanvas(this.canvas);

      this.renderer.drawViewport();

    } catch (error) {
      console.error("Erro ao renderizar com sombreamento RGB:", error);
      this.showError(error.message);
    }
  }

  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
  }

  generateSurface(params) {
    return this.createNewSurface(params);
  }

  updateColors() {
    const visibleColor = document.getElementById("visibleColor").value;
    const hiddenColor = document.getElementById("hiddenColor").value;

    this.renderer.setColors(visibleColor, hiddenColor, "#FFFFFF");

    if (
      this.currentSurfaceIndex >= 0 &&
      this.surfaces[this.currentSurfaceIndex]
    ) {
      this.surfaces[this.currentSurfaceIndex].lightingConfig.colors = {
        visible: visibleColor,
        hidden: hiddenColor,
      };
    }

    this.redrawSurface();
  }
  updateControlPointsUI() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície foi gerada");
      }

      const controlPoints = this.surface.getControlPoints();
      const controlPointSelect = document.getElementById("controlPointSelect");

      controlPointSelect.innerHTML = "";

      for (let i = 0; i < controlPoints.length; i++) {
        for (let j = 0; j < controlPoints[i].length; j++) {
          const option = document.createElement("option");
          option.value = `${i},${j}`;
          option.text = `Ponto de Controle (${i}, ${j})`;
          controlPointSelect.add(option);
        }
      }

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
  applyTransformations() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície para transformar");
      }

      const tx = parseFloat(document.getElementById("translationX").value) || 0;
      const ty = parseFloat(document.getElementById("translationY").value) || 0;
      const tz = parseFloat(document.getElementById("translationZ").value) || 0;

      const rx = parseFloat(document.getElementById("rotationX").value) || 0;
      const ry = parseFloat(document.getElementById("rotationY").value) || 0;
      const rz = parseFloat(document.getElementById("rotationZ").value) || 0;

      const scale = parseFloat(document.getElementById("scale").value) || 1;

      this.transformManager.setTranslation(tx, ty, tz);
      this.transformManager.setRotationX(rx);
      this.transformManager.setRotationY(ry);
      this.transformManager.setRotationZ(rz);
      this.transformManager.setScale(scale);

      this.redrawSurface();
    } catch (error) {
      console.error("Erro ao aplicar transformações:", error);
      this.showError(error.message);
    }
  }

  //resetar transformações
  resetTransformations() {
    try {
      document.getElementById("translationX").value = "0";
      document.getElementById("translationY").value = "0";
      document.getElementById("translationZ").value = "0";

      document.getElementById("rotationX").value = "0";
      document.getElementById("rotationY").value = "0";
      document.getElementById("rotationZ").value = "0";

      document.getElementById("scale").value = "1";

      this.transformManager.resetTransformations();

      this.redrawSurface();
    } catch (error) {
      console.error("Erro ao resetar transformações:", error);
      this.showError(error.message);
    }
  }
  redrawSurface() {
    try {
      if (!this.surface || !this.transformManager) {
        this.renderer.clear();
        this.renderer.drawViewport();
        return;
      }

      const viewParams = this.getViewParameters();
      let points = this.surface.getSurfacePoints();
      let controlPoints = this.surface.getControlPoints();

      points = this.transformManager.transformPoints(points);
      controlPoints = this.transformManager.transformPoints(controlPoints);

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

      this.renderer.clear();

      const vrp = {
        x: viewParams.VRP[0],
        y: viewParams.VRP[1],
        z: viewParams.VRP[2],
      };
      const faces = PainterAlgorithm.generateFaces(projectedPoints);
      const sortedFaces = PainterAlgorithm.debugPainterAlgorithm(
        projectedPoints,
        vrp
      );

      PainterAlgorithm.renderWireframe(
        this.canvas,
        sortedFaces,
        this.renderer.visibleColor,
        this.renderer.hiddenColor,
        this.renderer.backgroundColor
      );
      this.renderer.drawSurface(projectedPoints, projectedControlPoints);

      this.renderer.drawViewport();
    } catch (error) {
      console.error("Erro ao redesenhar superfície:", error);
      this.showError(error.message);
    }
  }

  debugPainterAlgorithm() {
    if (!this.surface) {
      this.showError("Crie uma superfície primeiro");
      return;
    }

    const viewParams = this.getViewParameters();
    let points = this.surface.getSurfacePoints();

    points = this.transformManager.transformPoints(points);

    const projectedPoints = TransformationPipeline.projection(
      viewParams.VRP,
      viewParams.P,
      viewParams.Y,
      points
    );

    const vrp = {
      x: viewParams.VRP[0],
      y: viewParams.VRP[1],
      z: viewParams.VRP[2],
    };

    PainterAlgorithm.debugPainterAlgorithm(projectedPoints, vrp);

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
      return {
        VRP: [25, 25, 25],
        P: [0, 0, 0],
        Y: [0, 1, 0],
      };
    }
  }

  showError(message) {
    alert(message);
  }

  addSurface(surface) {
    this.surfaces.push(surface);
  }

  removeSurface(index) {
    this.surfaces.splice(index, 1);
  }
  // sombreamento Gouraud RGB (sem cor base)
  renderWithRGBGouraudShading() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície para desenhar");
      }

      const viewParams = this.getViewParameters();

      let points = this.surface.getSurfacePoints();
      let controlPoints = this.surface.getControlPoints();

      points = this.transformManager.transformPoints(points);
      controlPoints = this.transformManager.transformPoints(controlPoints);

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

      const faces = PainterAlgorithm.generateFaces(projectedPoints);

      const rasterizador = this.createRasterizador();

      rasterizador.setVRP({
        x: viewParams.VRP[0],
        y: viewParams.VRP[1],
        z: viewParams.VRP[2],
      });

      const rgbParams = this.getRGBLightingParams();

      rasterizador.setLight(rgbParams.light);
      rasterizador.setAmbientIntensity(rgbParams.ambient);
      rasterizador.setMaterial(rgbParams.material);

      rasterizador.clearBuffers();

      const facesForRasterization = [];
      for (const face of faces) {
        if (
          face &&
          face.vertices &&
          Array.isArray(face.vertices) &&
          face.vertices.length >= 3
        ) {
          let verticesValidos = true;
          for (const v of face.vertices) {
            if (
              !v ||
              v.x === undefined ||
              v.y === undefined ||
              v.z === undefined ||
              isNaN(v.x) ||
              isNaN(v.y) ||
              isNaN(v.z)
            ) {
              verticesValidos = false;
              break;
            }
          }

          if (verticesValidos) {
            facesForRasterization.push(face.vertices);
          }
        }
      }

      if (facesForRasterization.length === 0) {
        throw new Error("Nenhuma face válida encontrada para renderização");
      }

      rasterizador.rasterizarMalhaGouraudRGB(facesForRasterization);

      rasterizador.renderToCanvas(this.canvas);

      this.renderer.drawViewport();

    } catch (error) {
      console.error("Erro ao renderizar com sombreamento Gouraud RGB:", error);
      this.showError(error.message);
    }
  }

  // renderizar com sombreamento Phong
  renderWithPhongShading() {
    try {
      if (!this.surface) {
        throw new Error("Nenhuma superfície para desenhar");
      }

      const viewParams = this.getViewParameters();

      let points = this.surface.getSurfacePoints();
      let controlPoints = this.surface.getControlPoints();

      points = this.transformManager.transformPoints(points);
      controlPoints = this.transformManager.transformPoints(controlPoints);

      // Projetar os pontos para o espaço de tela
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

      const faces = PainterAlgorithm.generateFaces(projectedPoints);

      const rasterizador = this.createRasterizador();

      rasterizador.setVRP({
        x: viewParams.VRP[0],
        y: viewParams.VRP[1],
        z: viewParams.VRP[2],
      });

      const rgbParams = this.getRGBLightingParams();

      rasterizador.setLight(rgbParams.light);
      rasterizador.setAmbientIntensity(rgbParams.ambient);
      rasterizador.setMaterial(rgbParams.material);

      rasterizador.clearBuffers();

      const facesForRasterization = [];
      for (const face of faces) {
        if (
          face &&
          face.vertices &&
          Array.isArray(face.vertices) &&
          face.vertices.length >= 3
        ) {
          let verticesValidos = true;
          for (const v of face.vertices) {
            if (
              !v ||
              v.x === undefined ||
              v.y === undefined ||
              v.z === undefined ||
              isNaN(v.x) ||
              isNaN(v.y) ||
              isNaN(v.z)
            ) {
              verticesValidos = false;
              break;
            }
          }

          if (verticesValidos) {
            facesForRasterization.push(face.vertices);
          }
        }
      }

      if (facesForRasterization.length === 0) {
        throw new Error("Nenhuma face válida encontrada para renderização");
      }

      rasterizador.rasterizarMalhaPhong(facesForRasterization);

      rasterizador.renderToCanvas(this.canvas);

      this.renderer.drawViewport();

      

    } catch (error) {
      console.error("Erro ao renderizar com sombreamento Phong:", error);
      this.showError(error.message);
    }
  }

  testOverlappingSurfaces() {
    const surface1 = new BSplineSurface(10, 10, 0.1, 0.1);
    const surface2 = new BSplineSurface(10, 10, 0.1, 0.1);

    for (let i = 0; i < surface2.controlPoints.length; i++) {
      for (let j = 0; j < surface2.controlPoints[i].length; j++) {
        surface2.controlPoints[i][j].z += 0.5;
        surface2.controlPoints[i][j].x += 0.5;
        surface2.controlPoints[i][j].y += 0.5;
      }
    }

    surface2.generateSurfacePoints();

    this.surfaces = [surface1, surface2];

    this.redrawMultipleSurfaces();
  }

  startRotationTest() {
    if (!this.surface) {
      this.showError("Crie uma superfície primeiro");
      return;
    }

    this.rotationAngle = 0;
    this.rotationInterval = setInterval(() => {
      this.rotationAngle += 5; // incremento de 5 graus
      if (this.rotationAngle >= 360) {
        this.rotationAngle = 0;
      }

      document.getElementById("rotationY").value = this.rotationAngle;

      this.transformManager.setRotationY(this.rotationAngle);

      this.redrawSurface();

    }, 100); // atualiza a cada 100ms

    if (!document.getElementById("stopRotationButton")) {
      const button = document.createElement("button");
      button.id = "stopRotationButton";
      button.textContent = "Parar Rotação";
      button.className = "full-width";
      button.onclick = () => this.stopRotationTest();

      const testButton = document.getElementById("testRotationButton");
      if (testButton && testButton.parentNode) {
        testButton.parentNode.insertBefore(button, testButton.nextSibling);
      }
    }
  }

  stopRotationTest() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }

    const stopButton = document.getElementById("stopRotationButton");
    if (stopButton && stopButton.parentNode) {
      stopButton.parentNode.removeChild(stopButton);
    }
  }

  // Método para serializar o estado atual para um objeto JSON
  serializeState() {
    const state = {
      surfaces: [],
      version: "1.0",
      date: new Date().toISOString(),
      description: "Configuração de superfícies B-Spline",
    };

    for (let i = 0; i < this.surfaces.length; i++) {
      const surfaceData = this.surfaces[i];
      const surface = surfaceData.surface;

      const controlPoints = [];
      const originalCP = surface.getControlPoints();
      for (let i = 0; i < originalCP.length; i++) {
        controlPoints[i] = [];
        for (let j = 0; j < originalCP[i].length; j++) {
          controlPoints[i][j] = {
            x: originalCP[i][j].x,
            y: originalCP[i][j].y,
            z: originalCP[i][j].z,
          };
        }
      }

      state.surfaces.push({
        dimensions: {
          nRows: surface.nRows,
          nCols: surface.nCols,
          uStep: surface.uStep,
          vStep: surface.vStep,
          degreeU: surface.degreeU,
          degreeV: surface.degreeV,
        },
        controlPoints: controlPoints,
        transformations: {
          translation: surfaceData.transformManager.translationValues,
          rotation: surfaceData.transformManager.rotationValues,
          scale: surfaceData.transformManager.scaleValue,
        },
        lighting: surfaceData.lightingConfig,
      });
    }

    state.currentSurfaceIndex = this.currentSurfaceIndex;

    state.viewParameters = this.getViewParameters();
    state.viewport = {
      xvMin: parseFloat(document.getElementById("xvMin").value),
      xvMax: parseFloat(document.getElementById("xvMax").value),
      yvMin: parseFloat(document.getElementById("yvMin").value),
      yvMax: parseFloat(document.getElementById("yvMax").value),
      xwMin: parseFloat(document.getElementById("xwMin").value),
      xwMax: parseFloat(document.getElementById("xwMax").value),
      ywMin: parseFloat(document.getElementById("ywMin").value),
      ywMax: parseFloat(document.getElementById("ywMax").value),
    };

    return state;
  }

  // Método para salvar o estado atual em um arquivo JSON
  saveStateToFile() {
    try {
      const state = this.serializeState();

      const jsonString = JSON.stringify(state, null, 2);

      const blob = new Blob([jsonString], { type: "application/json" });

      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;

      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .substring(0, 19);
      downloadLink.download = `bspline_config_${timestamp}.json`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Erro ao salvar estado para arquivo:", error);
      this.showError(`Erro ao salvar: ${error.message}`);
      return false;
    }
  }

  // Método para carregar o estado a partir de um objeto JSON
  loadStateFromJSON(stateObject) {
    try {
      if (
        !stateObject ||
        !stateObject.surfaces ||
        !Array.isArray(stateObject.surfaces)
      ) {
        throw new Error("Formato de arquivo inválido");
      }

      const initialIndex = this.surfaces.length;

      let fileSelectedIndex = stateObject.currentSurfaceIndex;

      for (const surfaceData of stateObject.surfaces) {
        const surface = new BSplineSurface(
          surfaceData.dimensions.nRows,
          surfaceData.dimensions.nCols,
          surfaceData.dimensions.uStep,
          surfaceData.dimensions.vStep,
          surfaceData.dimensions.degreeU,
          surfaceData.dimensions.degreeV
        );

        if (surfaceData.controlPoints) {
          for (let i = 0; i < surfaceData.controlPoints.length; i++) {
            for (let j = 0; j < surfaceData.controlPoints[i].length; j++) {
              surface.updateControlPoint(i, j, surfaceData.controlPoints[i][j]);
            }
          }
        }

        surface.surfacePoints = surface.generateSurfacePoints();

        const transformManager = new TransformationsManager();

        if (surfaceData.transformations) {
          const t = surfaceData.transformations;
          if (t.translation) {
            transformManager.setTranslation(
              t.translation.x,
              t.translation.y,
              t.translation.z
            );
          }
          if (t.rotation) {
            transformManager.setRotationX(t.rotation.x);
            transformManager.setRotationY(t.rotation.y);
            transformManager.setRotationZ(t.rotation.z);
          }
          if (t.scale !== undefined) {
            transformManager.setScale(t.scale);
          }
        }

        this.surfaces.push({
          surface: surface,
          transformManager: transformManager,
          lightingConfig:
            surfaceData.lighting || this.getDefaultLightingConfig(),
        });
      }

      if (initialIndex === 0) {
        if (stateObject.viewParameters) {
          const vp = stateObject.viewParameters;
          document.getElementById("vrpX").value = vp.VRP[0];
          document.getElementById("vrpY").value = vp.VRP[1];
          document.getElementById("vrpZ").value = vp.VRP[2];
          document.getElementById("focalX").value = vp.P[0];
          document.getElementById("focalY").value = vp.P[1];
          document.getElementById("focalZ").value = vp.P[2];
          document.getElementById("viewUpX").value = vp.Y[0];
          document.getElementById("viewUpY").value = vp.Y[1];
          document.getElementById("viewUpZ").value = vp.Y[2];
        }

        if (stateObject.viewport) {
          const v = stateObject.viewport;
          document.getElementById("xvMin").value = v.xvMin;
          document.getElementById("xvMax").value = v.xvMax;
          document.getElementById("yvMin").value = v.yvMin;
          document.getElementById("yvMax").value = v.yvMax;
          document.getElementById("xwMin").value = v.xwMin;
          document.getElementById("xwMax").value = v.xwMax;
          document.getElementById("ywMin").value = v.ywMin;
          document.getElementById("ywMax").value = v.ywMax;
          this.initializeViewport();
        }
      }

      let newSelectedIndex = -1;
      if (
        fileSelectedIndex >= 0 &&
        fileSelectedIndex < stateObject.surfaces.length
      ) {
        newSelectedIndex = initialIndex + fileSelectedIndex;
      } else if (stateObject.surfaces.length > 0) {
        // selecionar a primeira superfície importada
        newSelectedIndex = initialIndex;
      }

      if (newSelectedIndex >= 0 && newSelectedIndex < this.surfaces.length) {
        this.selectSurface(newSelectedIndex);
      }

      this.updateSurfacesList();

      if (this.surface) {
        this.updateControlPointsUI();
        this.updateTransformationUI();
        this.updateLightingUI(
          this.surfaces[this.currentSurfaceIndex].lightingConfig
        );
      }

      this.redrawSurface();

      const numImported = stateObject.surfaces.length;
      this.showSuccess(
        `${numImported} superfície(s) importada(s) com sucesso!`
      );

      return true;
    } catch (error) {
      console.error("Erro ao carregar estado:", error);
      this.showError(`Erro ao carregar: ${error.message}`);
      return false;
    }
  }

  showSuccess(message) {
    alert(message);
  }

  // Método para lidar com carregamento de arquivo
  loadStateFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonString = event.target.result;
          const stateObject = JSON.parse(jsonString);
          const success = this.loadStateFromJSON(stateObject);
          if (success) {
            resolve();
          } else {
            reject(new Error("Falha ao processar o arquivo de configuração"));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo"));
      };

      reader.readAsText(file);
    });
  }

  // Método para obter configuração padrão de iluminação
  getDefaultLightingConfig() {
    return {
      light: {
        x: 70,
        y: 20,
        z: 35,
        intensity: [150, 150, 150],
      },
      ambient: [120, 120, 120],
      material: {
        Ka: [0.4, 0.4, 0.4],
        Kd: [0.7, 0.7, 0.7],
        Ks: [0.5, 0.5, 0.5],
        n: 2.15,
      },
      colors: {
        visible: "#00FF00",
        hidden: "#FF0000",
      },
    };
  }
}
