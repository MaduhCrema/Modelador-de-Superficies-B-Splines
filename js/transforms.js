/**
 * Pipeline de transformações para projeção
 */
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

        // Matriz de Mapeamento (Mjp)
        const S = [
            [sx, 0, 0, -sx * xwMin + xvMin],
            [0, -sy, 0, sy * ywMin + yvMax],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ];

        return S;
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

        const projMatrix = this.getIsometricMatrix();
    
        const Mjp = this.calculateMappingMatrix();

        const M = this.multiplyMatrices(Mjp, srcMatrix);

        return points.map((row) =>
            row.map((point) => this.applyMatrixToPoint(M, point))
        );
    }
}

/**
 * Gerenciador de transformações geométricas
 */
class TransformationsManager {
    constructor() {
        this.translationMatrix = this.createIdentityMatrix();
        this.rotationMatrixX = this.createIdentityMatrix();
        this.rotationMatrixY = this.createIdentityMatrix();
        this.rotationMatrixZ = this.createIdentityMatrix();
        this.scaleMatrix = this.createIdentityMatrix();

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
            [0, 0, 0, 1],
        ];
    }

    // Converte graus para radianos
    degreesToRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }

    // Atualiza a matriz de translação
    setTranslation(tx, ty, tz) {
        this.translationValues = { x: tx, y: ty, z: tz };
        this.translationMatrix = [
            [1, 0, 0, tx],
            [0, 1, 0, ty],
            [0, 0, 1, tz],
            [0, 0, 0, 1],
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
            [0, 0, 0, 1],
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
            [0, 0, 0, 1],
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
            [0, 0, 0, 1],
        ];
    }

    // Atualiza a matriz de escala (uniforme)
    setScale(scale) {
        this.scaleValue = scale;
        this.scaleMatrix = [
            [scale, 0, 0, 0],
            [0, scale, 0, 0],
            [0, 0, scale, 0],
            [0, 0, 0, 1],
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
        const p = [point.x, point.y, point.z, 1];
        const result = [0, 0, 0, 0];

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i] += matrix[i][j] * p[j];
            }
        }

        if (result[3] !== 0) {
            return {
                x: result[0] / result[3],
                y: result[1] / result[3],
                z: result[2] / result[3],
            };
        } else {
            return { x: result[0], y: result[1], z: result[2] };
        }
    }

    // Obtém a matriz de transformação combinada
    getCombinedTransformMatrix() {
        // Ordem de aplicação: Escala -> Rotação Z -> Rotação Y -> Rotação X -> Translação
        let combinedMatrix = this.scaleMatrix;
        combinedMatrix = this.multiplyMatrices(
            this.rotationMatrixZ,
            combinedMatrix
        );
        
        combinedMatrix = this.multiplyMatrices(
            this.rotationMatrixY,
            combinedMatrix
        );

        combinedMatrix = this.multiplyMatrices(
            this.rotationMatrixX,
        combinedMatrix
        );
        
        combinedMatrix = this.multiplyMatrices(
            this.translationMatrix,
            combinedMatrix
        );

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
            return points.map((row) =>
            row.map((point) => this.transformPoint(point))
        );
        } else {
            return points.map((point) => this.transformPoint(point));
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
