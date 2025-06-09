# Modelador de Superfícies 3D usando B-Splines

## Descrição do Projeto

Este projeto foi desenvolvido como parte do Trabalho 2 da disciplina de Computação Gráfica, Turma 2024. O objetivo é criar um software que modele e edite superfícies 3D usando B-Splines. O software permite a criação e manipulação de superfícies B-Spline abertas, utilizando matrizes de pontos de controle com dimensões variadas.

## Funcionalidades

1. **Modelagem e Edição de Pontos de Controle**:
   - Permite a criação de superfícies B-Spline usando matrizes de pontos de controle (4x4 até 100x100).
   - Edição dos pontos de controle diretamente através da interface gráfica.

2. **Projeção Axonométrica Isométrica**:
   - Representação das superfícies em projeção axonométrica isométrica na técnica wireframe.
   - Visualização das arestas das faces visíveis e não visíveis com cores diferenciadas.

3. **Transformações 3D**:
   - Rotação, translação e escala das superfícies em x, y e z.
   - A escala é aplicada uniformemente para evitar deformações nas malhas.

4. **Sombreamento e Ocultação de Superfícies**:
   - Sombreamento constante com ocultação de superfícies usando o algoritmo z-buffer.
   - Sombreamento Gouraud com ocultação de superfícies incluindo o algoritmo z-buffer.
   - Sombreamento Phong simplificado com ocultação de superfícies incluindo o algoritmo z-buffer.

5. **Interface Interativa**:
   - Todos os parâmetros relacionados com as superfícies (número de pontos de controle, linhas interpoladas, materiais, etc.), câmera, window, viewport e luzes são editáveis em tempo de execução.

![alt text](https://github.com/MaduhCrema/Modelador-de-Superficies-B-Splines/blob/master/modelador.mp4)
