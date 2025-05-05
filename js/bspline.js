/**
 * Classe principal para superfícies B-Spline
 */
class BSplineSurface {
    constructor(
        nRows,  nCols,
        uStep,  vStep,
        degreeU = 3,
        degreeV = 3,
        randomize = false
    ){
        this.nRows = nRows;
        this.nCols = nCols;
        this.uStep = uStep;
        this.vStep = vStep;
        this.degreeU = Math.min(degreeU, nRows - 1);
        this.degreeV = Math.min(degreeV, nCols - 1);
        this.randomize = randomize;

        this.controlPoints = [];
        this.surfacePoints = [];
        this.knotsU = [];
        this.knotsV = [];

        this.initializeControlPoints();
        this.generateKnots();
        this.generateSurfacePoints();
    }

    // Inicializar pontos de controle
    initializeControlPoints() {
        for (let i = 0; i < this.nRows; i++) {
            this.controlPoints[i] = [];

            const normalizedY = this.nRows > 1 ? i / (this.nRows - 1) : 0.5;
            const y = normalizedY * 2 - 1; // Mapear para [-1, 1]

            for (let j = 0; j < this.nCols; j++) {
                const normalizedX = this.nCols > 1 ? j / (this.nCols - 1) : 0.5;
                const x = normalizedX * 2 - 1; // Mapear para [-1, 1]

                let z = 0;

                if (this.randomize) {
                    z = Math.sin(x * Math.PI) * Math.cos(y * Math.PI) * 0.3;
                }
                else {
                    z = 0;
                }

                this.controlPoints[i][j] = { x, y, z };
            }
        }
    }

    // Gerar vetores de nós (knots) uniformes
    generateKnots() {
        const nKnotsU = this.nRows + this.degreeU + 1;
        const nKnotsV = this.nCols + this.degreeV + 1;

        this.knotsU = new Array(nKnotsU);
        this.knotsV = new Array(nKnotsV);

        const generateUniformKnots = (degree, n, knotsArray) => {
            for (let i = 0; i <= degree; i++) {
                knotsArray[i] = 0;
            }

            for (let i = n; i < n + degree + 1; i++) {
                knotsArray[i] = 1;
            }

            for (let i = degree + 1; i < n; i++) {
                knotsArray[i] = (i - degree) / (n - degree);
            }
        };

        generateUniformKnots(this.degreeU, this.nRows, this.knotsU);
        generateUniformKnots(this.degreeV, this.nCols, this.knotsV);
    }

    // Função de base B-spline - Algoritmo de Cox-de Boor
    basisFunction(t, i, k, knots) {
        if (k === 0) {
            return (t >= knots[i] && t < knots[i + 1]) ||
                (Math.abs(t - 1) < 1e-10 && Math.abs(knots[i + 1] - 1) < 1e-10)
                ? 1 : 0;
        }

        let result = 0;

        const denomA = knots[i + k] - knots[i];
        if (Math.abs(denomA) > 1e-10) {
            result += ((t - knots[i]) / denomA) * this.basisFunction(t, i, k - 1, knots);
        }

        const denomB = knots[i + k + 1] - knots[i + 1];
        if (Math.abs(denomB) > 1e-10) {
            result += ((knots[i + k + 1] - t) / denomB) * this.basisFunction(t, i + 1, k - 1, knots);
        }  

        return result;
    }

    // Calcular um ponto da superfície para parâmetros u,v
    calculatePoint(u, v) {
        const point = { x: 0, y: 0, z: 0 };
        let weightSum = 0;

        for (let i = 0; i < this.nRows; i++) {
            const basisU = this.basisFunction(u, i, this.degreeU, this.knotsU);

            for (let j = 0; j < this.nCols; j++) {
                const basisV = this.basisFunction(v, j, this.degreeV, this.knotsV);
                const weight = basisU * basisV;

                point.x += this.controlPoints[i][j].x * weight;
                point.y += this.controlPoints[i][j].y * weight;
                point.z += this.controlPoints[i][j].z * weight;

                weightSum += weight;
            }
        }

        if (weightSum > 1e-10) {
            point.x /= weightSum;
            point.y /= weightSum;
            point.z /= weightSum;
        }

        return point;
    }

    // Gerar pontos da superfície para o rendering
    generateSurfacePoints() {
        const nPointsU = Math.max(2, Math.ceil(1 / this.uStep) + 1);
        const nPointsV = Math.max(2, Math.ceil(1 / this.vStep) + 1);

        this.surfacePoints = new Array(nPointsU);

        for (let i = 0; i < nPointsU; i++) {
            this.surfacePoints[i] = new Array(nPointsV);

            const u = i / (nPointsU - 1);

            for (let j = 0; j < nPointsV; j++) {
                const v = j / (nPointsV - 1);

                this.surfacePoints[i][j] = this.calculatePoint(u, v);
            }
        }

        return this.surfacePoints;
    }

    updateControlPoint(i, j, newPoint) {
        if (i >= 0 && i < this.nRows && j >= 0 && j < this.nCols) {
            this.controlPoints[i][j] = { ...newPoint };

            this.generateSurfacePoints();
            return true;
        }

        console.warn(`Índices de ponto inválidos: (${i}, ${j})`);
        return false;
    }

    // Obter pontos de controle
    getControlPoints() {
        return this.controlPoints;
    }

    // Obter pontos da superfície
    getSurfacePoints() {
        return this.surfacePoints;
    }

    // Obter polígonos de controle (linhas entre pontos de controle)
    getControlPolygons() {
        const lines = [];

        for (let i = 0; i < this.nRows; i++) {
            for (let j = 0; j < this.nCols - 1; j++) {
                lines.push([this.controlPoints[i][j], this.controlPoints[i][j + 1]]);
            }
        }

        for (let j = 0; j < this.nCols; j++) {
            for (let i = 0; i < this.nRows - 1; i++) {
                lines.push([this.controlPoints[i][j], this.controlPoints[i + 1][j]]);
            }
        }

        return lines;
    }
}

/**
 * Classe utilitária para cálculos B-Spline
 */
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
            w1 = ((t - knots[i]) / (knots[i + k] - knots[i])) * this.calculateBasisFunction(t, i, k - 1, knots);
        }

        if (knots[i + k + 1] - knots[i + 1] !== 0) {
            w2 = ((knots[i + k + 1] - t) / (knots[i + k + 1] - knots[i + 1])) * this.calculateBasisFunction(t, i + 1, k - 1, knots);
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
        nCols)
    {
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
