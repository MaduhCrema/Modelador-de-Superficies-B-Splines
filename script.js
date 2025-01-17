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

    transformToSRC() {
        const scale = 0.5; // Exemplo de escala
        const translateX = 400; // Exemplo de translação
        const translateY = 300;

        this.points = this.points.map(row =>
            row.map(point => ({
                x: point.x * scale + translateX,
                y: point.y * scale + translateY,
                z: point.z,
                color: point.color
            }))
        );
    }

    applyAxonometricProjection(alpha, beta) {
        const radAlpha = (Math.PI / 180) * alpha;
        const radBeta = (Math.PI / 180) * beta;

        this.points = this.points.map(row =>
            row.map(point => {
                const x = point.x * Math.cos(radBeta) - point.z * Math.sin(radBeta);
                const y = point.x * Math.sin(radAlpha) * Math.sin(radBeta) + point.y * Math.cos(radAlpha) - point.z * Math.sin(radAlpha) * Math.cos(radBeta);
                return { ...point, x, y };
            })
        );
    }

    getRectangles() {
        const rectangles = [];
        for (let i = 0; i < this.rows - 1; i++) {
            for (let j = 0; j < this.cols - 1; j++) {
                const p1 = this.getPoint(i, j);
                const p2 = this.getPoint(i, j + 1);
                const p3 = this.getPoint(i + 1, j);
                const p4 = this.getPoint(i + 1, j + 1);

                const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;
                rectangles.push({ points: [p1, p2, p4, p3], avgZ });
            }
        }
        return rectangles;
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

function drawRectangle(points, color = '#f9f9f9') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
}

function generateSurface() {
    const rows = parseInt(document.getElementById('rows').value) + 1;
    const cols = parseInt(document.getElementById('cols').value) + 1;

    surface = new BSplineSurface(rows, cols);
    surface.transformToSRC();
    surface.applyAxonometricProjection(60, 30); // Aplica a projeção axonométrica ajustada

    canvas.width = 1000;
    canvas.height = 800;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBSplineSurface(surface);
}

function drawBSplineSurface(surface) {
    const rectangles = surface.getRectangles();

    // Ordena os retângulos do mais distante (menor avgZ) para o mais próximo (maior avgZ)
    rectangles.sort((a, b) => b.avgZ - a.avgZ);

    // Desenha os retângulos na ordem fundo-para-frente, algoritmo do pintor
    rectangles.forEach(rect => drawRectangle(rect.points));

    // Opcional: desenha as bordas para maior visibilidade
    rectangles.forEach(rect => {
        for (let i = 0; i < rect.points.length; i++) {
            const p1 = rect.points[i];
            const p2 = rect.points[(i + 1) % rect.points.length];
            drawLine(p1.x, p1.y, p2.x, p2.y);
        }
    });

    // Desenha os pontos (vértices) da superfície
    surface.points.forEach(row =>
        row.forEach(point => drawPoint(point.x, point.y, 'black'))
    );
}

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    surface.points.forEach((row, i) =>
        row.forEach((point, j) => {
            const dist = Math.hypot(mouseX - point.x, mouseY - point.y);
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

        const { i, j } = selectedPoint;
        surface.setPoint(i, j, mouseX, mouseY, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBSplineSurface(surface);
    }
});

canvas.addEventListener('mouseup', () => {
    selectedPoint = null;
});
