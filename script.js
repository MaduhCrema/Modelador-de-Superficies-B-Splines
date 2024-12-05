const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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

// Função para gerar a matriz de pontos de controle e desenhar a superfície B-Spline
function generateSurface() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    
    // Ajustar tamanho do canvas de acordo com a matriz
    canvas.width = cols * 100;
    canvas.height = rows * 100;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Exemplo de geração de pontos de controle
    const points = [];
    const stepX = canvas.width / (cols + 1);
    const stepY = canvas.height / (rows + 1);
    
    for (let i = 0; i < rows; i++) {
        points[i] = [];
        for (let j = 0; j < cols; j++) {
            points[i][j] = [stepX * (j + 1), stepY * (i + 1)];
            drawPoint(points[i][j][0], points[i][j][1]);
        }
    }

    // Desenhar linhas entre pontos de controle (wireframe)
    for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points[i].length - 1; j++) {
            drawLine(points[i][j][0], points[i][j][1], points[i][j + 1][0], points[i][j + 1][1]);
        }
    }
    for (let j = 0; j < points[0].length; j++) {
        for (let i = 0; i < points.length - 1; i++) {
            drawLine(points[i][j][0], points[i][j][1], points[i + 1][j][0], points[i + 1][j][1]);
        }
    }
}
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