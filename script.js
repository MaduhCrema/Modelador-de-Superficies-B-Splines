class BSplineSurface {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.points = this.createControlPoints(rows, cols);
    }

    createControlPoints(rows, cols) {
        let points = [];
        const stepX = 100;
        const stepY = 100;
        for (let i = 0; i < rows; i++) {
            points[i] = [];
            for (let j = 0; j < cols; j++) {
                points[i][j] = { x: j * stepX, y: i * stepY, z: 0, color: 'black' };
            }
        }
        return points;
    }

    getPoint(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.points[row][col];
        } else {
            throw new Error("Índices fora do intervalo.");
        }
    }

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
let selectedPoint = null;

function drawPoint(x, y, color = 'black') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2, true);
    ctx.fill();
}

function drawLine(x1, y1, x2, y2, color = 'black') {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function generateSurface() {
    const rows = parseInt(document.getElementById('rows').value) + 1;
    const cols = parseInt(document.getElementById('cols').value) + 1;

    surface = new BSplineSurface(rows, cols);

    canvas.width = 1000;
    canvas.height = 800;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBSplineSurface(surface);
}

function drawBSplineSurface(surface) {
    const offsetX = (canvas.width - (surface.cols - 1) * 100) / 2;
    const offsetY = (canvas.height - (surface.rows - 1) * 100) / 2;

    surface.points.forEach(row =>
        row.forEach(point => drawPoint(point.x + offsetX, point.y + offsetY, point.color))
    );

    for (let i = 0; i < surface.rows; i++) {
        for (let j = 0; j < surface.cols - 1; j++) {
            const point1 = surface.getPoint(i, j);
            const point2 = surface.getPoint(i, j + 1);
            drawLine(point1.x + offsetX, point1.y + offsetY, point2.x + offsetX, point2.y + offsetY);
        }
    }

    for (let j = 0; j < surface.cols; j++) {
        for (let i = 0; i < surface.rows - 1; i++) {
            const point1 = surface.getPoint(i, j);
            const point2 = surface.getPoint(i + 1, j);
            drawLine(point1.x + offsetX, point1.y + offsetY, point2.x + offsetX, point2.y + offsetY);
        }
    }

    // Gerar pontos de u e v (em vermelho)
    const uSteps = 10; // Número de divisões para u
    const vSteps = 10; // Número de divisões para v
    let numCalculatedPoints = 0;

    for (let i = 0; i <= uSteps; i++) {
        for (let j = 0; j <= vSteps; j++) {
            const u = i / uSteps;
            const v = j / vSteps;
            const point = calculateBSplinePoint(u, v);
            drawPoint(point.x + offsetX, point.y + offsetY, 'red'); // Pinta de vermelho
            numCalculatedPoints++;
        }
    }

    console.log(`Número de pontos calculados: ${numCalculatedPoints}`); // Imprime no console
}

// Função para calcular o ponto da superfície a partir dos parâmetros u e v
function calculateBSplinePoint(u, v) {
    // Calcular as coordenadas (i, j) dos pontos de controle
    const i = Math.min(Math.floor(u * (surface.rows - 1)), surface.rows - 2); // Ajusta para evitar ultrapassar o limite
    const j = Math.min(Math.floor(v * (surface.cols - 1)), surface.cols - 2); // Ajusta para evitar ultrapassar o limite

    // Acesso aos pontos de controle vizinhos
    const p00 = surface.getPoint(i, j);
    const p01 = surface.getPoint(i, j + 1);
    const p10 = surface.getPoint(i + 1, j);
    const p11 = surface.getPoint(i + 1, j + 1);

    // Interpolação bilinear simples para calcular o ponto (u, v)
    const x = (1 - u) * (1 - v) * p00.x + u * (1 - v) * p01.x + (1 - u) * v * p10.x + u * v * p11.x;
    const y = (1 - u) * (1 - v) * p00.y + u * (1 - v) * p01.y + (1 - u) * v * p10.y + u * v * p11.y;
    const z = (1 - u) * (1 - v) * p00.z + u * (1 - v) * p01.z + (1 - u) * v * p10.z + u * v * p11.z;

    return { x, y, z };
}

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    surface.points.forEach((row, i) =>
        row.forEach((point, j) => {
            const offsetX = (canvas.width - (surface.cols - 1) * 100) / 2;
            const offsetY = (canvas.height - (surface.rows - 1) * 100) / 2;
            const dist = Math.hypot(mouseX - (point.x + offsetX), mouseY - (point.y + offsetY));
            if (dist < 10) {
                selectedPoint = { i, j };
            }
        })
    );
});

canvas.addEventListener('mousemove', e => {
    if (selectedPoint) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const offsetX = (canvas.width - (surface.cols - 1) * 100) / 2;
        const offsetY = (canvas.height - (surface.rows - 1) * 100) / 2;

        // Subtrai os offsets para garantir que o ponto seja posicionado corretamente
        const { i, j } = selectedPoint;
        surface.setPoint(i, j, mouseX - offsetX, mouseY - offsetY, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBSplineSurface(surface);
    }
});

canvas.addEventListener('mouseup', () => {
    selectedPoint = null;
});
