class BSplineSurface {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.points = this.createControlPoints(rows, cols);
    }

    // Função para criar a matriz de pontos de controle
    createControlPoints(rows, cols) {
        let points = [];
        const stepX = 100;
        const stepY = 100;
        for (let i = 0; i < rows; i++) {
            points[i] = [];
            for (let j = 0; j < cols; j++) {
                points[i][j] = { x: j * stepX, y: i * stepY, z: 0, color: 'black' }; // Inicializa z = 0 e cor preta
            }
        }
        return points;
    }

    // Função para acessar um ponto de controle específico
    getPoint(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.points[row][col];
        } else {
            throw new Error("Índices fora do intervalo.");
        }
    }

    // Função para definir um ponto de controle específico
    setPoint(row, col, x, y, z, color = 'black') {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.points[row][col] = { x, y, z, color };
        } else {
            throw new Error("Índices fora do intervalo.");
        }
    }
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let surface;
let selectedRow = null;
let selectedCol = null;

// Função para desenhar um ponto
function drawPoint(x, y, color = 'black') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2, true);
    ctx.fill();
}

// Função para desenhar linha
function drawLine(x1, y1, x2, y2, color = 'black') {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// Função para projetar um ponto 3D em 2D usando projeção isométrica
function projectPoint(x, y, z) {
    const isoX = x - z * Math.cos(Math.PI / 6);
    const isoY = y - z * Math.sin(Math.PI / 6);
    return [isoX, isoY];
}

// Função para gerar a matriz de pontos de controle e desenhar a superfície B-Spline
function generateSurface() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);

    surface = new BSplineSurface(rows, cols);
    updateControlPointList(surface);

    // Ajustar tamanho do canvas de acordo com a matriz
    canvas.width = 1000; // largura fixa do canvas
    canvas.height = 800; // altura fixa do canvas

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar a superfície B-Spline
    drawBSplineSurface(surface);
}

// Função para desenhar uma superfície B-Spline em wireframe
function drawBSplineSurface(surface) {
    // Calcular deslocamento para centralizar a malha
    const offsetX = (canvas.width - (surface.cols - 1) * 100) / 2;
    const offsetY = (canvas.height - (surface.rows - 1) * 100) / 2;

    for (let i = 0; i < surface.rows; i++) {
        for (let j = 0; j < surface.cols; j++) {
            let point = surface.getPoint(i, j);
            const [projX, projY] = projectPoint(point.x + offsetX, point.y + offsetY, point.z);
            drawPoint(projX, projY, point.color);
        }
    }

    // Desenhar linhas entre pontos de controle (wireframe)
    for (let i = 0; i < surface.rows; i++) {
        for (let j = 0; j < surface.cols - 1; j++) {
            const [x1, y1] = projectPoint(surface.getPoint(i, j).x + offsetX, surface.getPoint(i, j).y + offsetY, surface.getPoint(i, j).z);
            const [x2, y2] = projectPoint(surface.getPoint(i, j + 1).x + offsetX, surface.getPoint(i, j + 1).y + offsetY, surface.getPoint(i, j + 1).z);
            drawLine(x1, y1, x2, y2);
        }
    }

    for (let j = 0; j < surface.cols; j++) {
        for (let i = 0; i < surface.rows - 1; i++) {
            const [x1, y1] = projectPoint(surface.getPoint(i, j).x + offsetX, surface.getPoint(i, j).y + offsetY, surface.getPoint(i, j).z);
            const [x2, y2] = projectPoint(surface.getPoint(i + 1, j).x + offsetX, surface.getPoint(i + 1, j).y + offsetY, surface.getPoint(i + 1, j).z);
            drawLine(x1, y1, x2, y2);
        }
    }
}

// Função para atualizar a lista de pontos de controle
function updateControlPointList(surface) {
    const controlPointSelect = document.getElementById('controlPoint');
    controlPointSelect.innerHTML = '';

    for (let i = 0; i < surface.rows; i++) {
        for (let j = 0; j < surface.cols; j++) {
            const option = document.createElement('option');
            option.value = `${i},${j}`;
            option.text = `Ponto (${i}, ${j})`;
            controlPointSelect.appendChild(option);
        }
    }
}

// Função para selecionar um ponto de controle da lista
function selectControlPoint() {
    const controlPointSelect = document.getElementById('controlPoint');
    const [row, col] = controlPointSelect.value.split(',').map(Number);
    const point = surface.getPoint(row, col);

    selectedRow = row;
    selectedCol = col;

    console.log(`Ponto de Controle Selecionado: (${point.x}, ${point.y}, ${point.z})`);
}

// Função para mudar a cor do ponto de controle selecionado
function changeControlPointColor() {
    if (selectedRow !== null && selectedCol !== null) {
        const colorPicker = document.getElementById('colorPicker');
        const newColor = colorPicker.value;

        let point = surface.getPoint(selectedRow, selectedCol);
        point.color = newColor;
        surface.setPoint(selectedRow, selectedCol, point.x, point.y, point.z, newColor);

        // Redesenhar a superfície para aplicar a nova cor
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBSplineSurface(surface);
    } else {
        console.log("Nenhum ponto de controle selecionado.");
    }
}

// Função para multiplicar uma matriz 4x4 por um vetor 4x1
function multiplyMatrixAndPoint(matrix, point) {
    let result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        result[i] = matrix[i][0] * point[0] + matrix[i][1] * point[1] + matrix[i][2] * point[2] + matrix[i][3] * point[3];
    }
    return result;
}

// Função para criar a matriz de translação
function translationMatrix(dx, dy, dz) {
    return [
        [1, 0, 0, dx],
        [0, 1, 0, dy],
        [0, 0, 1, dz],
        [0, 0, 0, 1]
    ];
}

// Função para criar a matriz de escala
function scalingMatrix(sx, sy, sz) {
    return [
        [sx, 0, 0, 0],
        [0, sy, 0, 0],
        [0, 0, sz, 0],
        [0, 0, 0, 1]
    ];
}

// Função para criar a matriz de rotação em torno do eixo Z
function rotationMatrixZ(angle) {
    const rad = angle * Math.PI / 180;
    return [
        [Math.cos(rad), -Math.sin(rad), 0, 0],
        [Math.sin(rad), Math.cos(rad), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

// Função para calcular o centro da superfície
function calculateCenter() {
    let sumX = 0, sumY = 0, sumZ = 0;
    let totalPoints = surface.rows * surface.cols;

    for (let i = 0; i < surface.rows; i++) {
        for (let j = 0; j < surface.cols; j++) {
            let point = surface.getPoint(i, j);
            sumX += point.x;
            sumY += point.y;
            sumZ += point.z;
        }
    }

    return { x: sumX / totalPoints, y: sumY / totalPoints, z: sumZ / totalPoints };
}

// Função para criar a matriz de translação para o ponto âncora (levar para a origem)
function translationMatrixToOrigin(center) {
    return translationMatrix(-center.x, -center.y, -center.z);
}

// Função para criar a matriz de translação para o ponto âncora (levar de volta)
function translationMatrixFromOrigin(center) {
    return translationMatrix(center.x, center.y, center.z);
}

// Função para aplicar transformações mantendo o ponto âncora
function applyTransformationWithAnchor(matrix) {
    let center = calculateCenter();
    let toOrigin = translationMatrixToOrigin(center);
    let fromOrigin = translationMatrixFromOrigin(center);

    for (let i = 0; i < surface.rows; i++) {
        for (let j = 0; j < surface.cols; j++) {
            let point = surface.getPoint(i, j);
            let [x, y, z, w] = multiplyMatrixAndPoint(toOrigin, [point.x, point.y, point.z, 1]);
            [x, y, z, w] = multiplyMatrixAndPoint(matrix, [x, y, z, 1]);
            [x, y, z, w] = multiplyMatrixAndPoint(fromOrigin, [x, y, z, 1]);
            surface.setPoint(i, j, x, y, z, point.color);
        }
    }

    // Redesenhar a superfície para aplicar a nova transformação
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBSplineSurface(surface);
}

// Atualizar eventos para aplicar transformações com ponto âncora
document.getElementById('translateButton').addEventListener('click', () => {
    const dx = parseFloat(document.getElementById('dx').value);
    const dy = parseFloat(document.getElementById('dy').value);
    const dz = parseFloat(document.getElementById('dz').value);
    applyTransformationWithAnchor(translationMatrix(dx, dy, dz));
});

document.getElementById('scaleButton').addEventListener('click', () => {
    const scaleFactor = parseFloat(document.getElementById('scaleFactor').value);
    applyTransformationWithAnchor(scalingMatrix(scaleFactor, scaleFactor, scaleFactor));
});

document.getElementById('rotateButton').addEventListener('click', () => {
    const rotationAngle = parseFloat(document.getElementById('rotationAngle').value);
    applyTransformationWithAnchor(rotationMatrixZ(rotationAngle));
});



// Testando a geração e desenho da superfície
generateSurface();


/*
User. número de pontos de controle, linhas interpoladas, materiais, câmera, window, viewport e luzes

1. Implementar a Edição de Pontos de Controle
Permitir que o usuário possa clicar e arrastar os pontos de controle para reposicioná-los.

Ações:

Adicionar eventos de clique e arrasto no canvas para mover os pontos de controle.

Atualizar a matriz de pontos de controle com as novas posições.

2. Adicionar Transformações 3D
Implementar operações de rotação, translação e escala.

Ações:

Criar funções para aplicar matrizes de transformação (rotação, translação e escala).

Garantir que a escala seja uniforme nas três dimensões.

3. Implementar Algoritmo do Pintor
Desenhar as superfícies na ordem correta para garantir a visibilidade correta.

Ações:

Calcular as normais das faces.

Ordenar as faces de acordo com a profundidade (do fundo para a frente).

Desenhar as faces com base na ordem calculada.

4. Adicionar Sombreamento e Ocultação de Superfícies
Implementar sombreamento constante, Gouraud e Phong com ocultação de superfícies usando o algoritmo z-buffer.

Ações:

Implementar o algoritmo z-buffer para ocultação de superfícies.

Implementar o sombreamento constante (flat shading).

Implementar o sombreamento Gouraud.

Implementar o sombreamento Phong (simplificado).*/