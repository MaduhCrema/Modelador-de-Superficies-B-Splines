class BSplineSurface {
    // Construtor da classe que cria a superfície B-Spline com base nos parâmetros fornecidos
    constructor(rows, cols, degreeU = 3, degreeV = 3) {
        // Armazena o número de linhas e colunas para os pontos de controle
        this.rows = rows;
        this.cols = cols;
        
        // Define o grau das curvas B-Splines para as direções u e v
        this.degreeU = degreeU;
        this.degreeV = degreeV;
        
        // Cria a matriz de pontos de controle com as dimensões especificadas
        this.points = this.createControlPoints(rows, cols);
        
        // Gera os vetores de nós para as direções u e v
        this.knotU = this.generateKnotVector(rows, degreeU);
        this.knotV = this.generateKnotVector(cols, degreeV);
    }

    // Cria a matriz de pontos de controle para a superfície B-Spline
    createControlPoints(rows, cols) {
        let points = []; // Inicializa a matriz de pontos
        const stepX = 100; // Passo para o eixo X
        const stepY = 100; // Passo para o eixo Y
        
        // Preenche a matriz de pontos de controle
        for (let i = 0; i < rows; i++) {
            points[i] = []; // Cria uma nova linha para a matriz
            for (let j = 0; j < cols; j++) {
                // Define cada ponto com valores de x, y e z, e cor
                points[i][j] = { x: j * stepX, y: i * stepY, z: 0, color: 'black' };
            }
        }
        return points; // Retorna a matriz de pontos de controle
    }

    // Gera o vetor de nós com base no número de pontos e no grau da B-Spline
    generateKnotVector(size, degree) {
        const knots = []; // Inicializa o vetor de nós
        const numKnots = size + degree + 1; // Número total de nós
        
        // Preenche o vetor de nós de acordo com o grau da B-Spline
        for (let i = 0; i < numKnots; i++) {
            if (i < degree) {
                knots.push(0); // Os primeiros 'degree' nós são 0
            } else if (i < numKnots - degree) {
                // Os nós intermediários são distribuídos uniformemente entre 0 e 1
                knots.push((i - degree) / (numKnots - 2 * degree - 1));
            } else {
                knots.push(1); // Os últimos 'degree' nós são 1
            }
        }
        return knots; // Retorna o vetor de nós
    }

    // Função recursiva que calcula a função base B-Spline N(i, p, t) para um índice i, grau p, e parâmetro t
    N(i, p, t, knots) {
        if (p === 0) {
            // Caso base: Se o grau p for 0, a função base é 1 se t estiver entre os nós i e i+1, senão é 0
            return (t >= knots[i] && t < knots[i + 1]) ? 1 : 0;
        } else {
            // Caso recursivo: Calcula a função base para graus maiores
            const denom1 = knots[i + p] - knots[i]; // Denominador para o primeiro termo
            const denom2 = knots[i + p + 1] - knots[i + 1]; // Denominador para o segundo termo
            
            // Calcula os termos recursivos para a função base
            const term1 = denom1 === 0 ? 0 : (t - knots[i]) / denom1 * this.N(i, p - 1, t, knots);
            const term2 = denom2 === 0 ? 0 : (knots[i + p + 1] - t) / denom2 * this.N(i + 1, p - 1, t, knots);
            
            // Retorna a soma dos dois termos
            return term1 + term2;
        }
    }

    // Função que calcula o ponto na superfície B-Spline para os valores dos parâmetros u e v
    calculateBSplinePoint(u, v) {
        let point = { x: 0, y: 0, z: 0 }; // Inicializa o ponto resultante (x, y, z)

        // Percorre todos os pontos de controle para calcular o valor final do ponto B-Spline
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // Calcula as funções base para os pontos de controle na direção u e v
                const Ni = this.N(i, this.degreeU, u, this.knotU);
                const Nj = this.N(j, this.degreeV, v, this.knotV);
                
                // Calcula o ponto final ponderando os pontos de controle pelos valores das funções base
                point.x += Ni * Nj * this.points[i][j].x;
                point.y += Ni * Nj * this.points[i][j].y;
                point.z += Ni * Nj * this.points[i][j].z;
            }
        }

        return point; // Retorna o ponto calculado na superfície B-Spline
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

    // Desenha as linhas entre os pontos de controle
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

    // Desenha a superfície B-Spline
    const numSteps = 10;
    for (let u = 0; u <= 1; u += 1 / numSteps) {
        for (let v = 0; v <= 1; v += 1 / numSteps) {
            const point = surface.calculateBSplinePoint(u, v);
            drawPoint(point.x + offsetX, point.y + offsetY, 'red');
        }
    }
}

// Eventos de interação com a tela
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

        const { i, j } = selectedPoint;
        surface.setPoint(i, j, mouseX - offsetX, mouseY - offsetY, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBSplineSurface(surface);
    }
});

canvas.addEventListener('mouseup', () => {
    selectedPoint = null;
});
