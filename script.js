class BSplineSurface {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.points = this.createControlPoints(rows, cols);
    }

    // Cria os pontos de controle
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

    // Obtém o ponto de controle em uma posição específica
    getPoint(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.points[row][col];
        } else {
            throw new Error("Índices fora do intervalo.");
        }
    }

    // Define os valores de um ponto de controle
    setPoint(row, col, x, y, z, color = 'black') {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.points[row][col] = { x, y, z, color };
        } else {
            throw new Error("Índices fora do intervalo.");
        }
    }

    // Transformação de SRU para SRC
    transformToSRC(VRP, P, Y) {

        //transforma o vetor para objeto
        VRP = { x: VRP[0], y: VRP[1], z: VRP[2] };
        P = { x: P[0], y: P[1], z: P[2] };
        Y = { x: Y[0], y: Y[1], z: Y[2] };

        // Cálculo do vetor N (normalizado)
        let N = {
            x: VRP.x - P.x,
            y: VRP.y - P.y,
            z: VRP.z - P.z
        };
        
        //normaliza
        const nLength = Math.sqrt(N.x ** 2 + N.y ** 2 + N.z ** 2);
        N = { x: N.x / nLength, y: N.y / nLength, z: N.z / nLength };
        
        // Cálculo do vetor V (normalizado) c = y*n
        let YDotN = Y.x * N.x + Y.y * N.y + Y.z * N.z;
        let V = {//y-c
            x: Y.x - YDotN * N.x,
            y: Y.y - YDotN * N.y,
            z: Y.z - YDotN * N.z
        };
        //normaliza
        const vLength = Math.sqrt(V.x ** 2 + V.y ** 2 + V.z ** 2);
        V = { x: V.x / vLength, y: V.y / vLength, z: V.z / vLength };
        
        // Cálculo do vetor U
        const U = { //v*n
            x: V.y * N.z - V.z * N.y,
            y: V.z * N.x - V.x * N.z,
            z: V.x * N.y - V.y * N.x
        };
        
        // Matriz de transformação de SRU para SRC
        const transformationMatrix = [
            [U.x, U.y, U.z, -(VRP.x * U.x + VRP.y * U.y + VRP.z * U.z)],
            [V.x, V.y, V.z, -(VRP.x * V.x + VRP.y * V.y + VRP.z * V.z)],
            [N.x, N.y, N.z, -(VRP.x * N.x + VRP.y * N.y + VRP.z * N.z)],
            [0, 0, 0, 1]
        ];

        // Aplicar a transformação a todos os pontos
        this.points = this.points.map(row =>
            row.map(point => {
                const x = point.x, y = point.y, z = point.z;
                const transformed = {
                    x: transformationMatrix[0][0] * x + transformationMatrix[0][1] * y + transformationMatrix[0][2] * z + transformationMatrix[0][3],
                    y: transformationMatrix[1][0] * x + transformationMatrix[1][1] * y + transformationMatrix[1][2] * z + transformationMatrix[1][3],
                    z: transformationMatrix[2][0] * x + transformationMatrix[2][1] * y + transformationMatrix[2][2] * z + transformationMatrix[2][3],
                    color: point.color
                };
                return transformed;
            })
        );

        console.log("Pontos após a transformação para SRC:");
        console.log(this.points);
    }

    applyAxonometricProjection() {
        
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

    //exemplo para teste da trannsformação
    surface = new BSplineSurface(rows, cols);
    vrp = [100,100,100]
    p=[0,0,0]
    y=[0,1,0]
    surface.transformToSRC(vrp, p, y);
    //surface.applyAxonometricProjection(35.264, 45); // Aplica a projeção axonométrica 

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
