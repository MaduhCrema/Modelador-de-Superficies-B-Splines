class BSplineSurface {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols; // Corrigido: cols = rows -> cols
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
    ctx.arc(x, y, 5, 0, Math.PI * 2, true); // Aumentei o raio para melhor visibilidade
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


