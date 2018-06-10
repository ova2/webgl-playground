import vertexShaderSource from './thickline-vert.glsl';
import fragmentShaderSource from './thickline-frag.glsl';
import {createProgram, createShader, resizeCanvasToDisplaySize} from '../webgl-program-service';
import {mat3} from 'gl-matrix';
import {Point} from '../point';

function main() {
    let canvas = document.getElementById('glscreen') as HTMLCanvasElement;
    let gl = canvas.getContext('webgl2');
    if (!gl) {
        return;
    }

    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    let program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // points of line
    // prettier-ignore
    let points: Point[] = [
        {x: -360.88, y: -222},
        {x: -244.5, y: 0},
        {x: 17.99, y: 0},
        {x: 98, y: -197.34},
        {x: 98, y: 22.9},
        {x: -189, y: 212},
        {x: -379.12, y: 11.6}
    ];

    const lineWidth = 5;

    // points of trinagles that draw a thick line
    let pointsT = transformToTriangles(points, lineWidth);
    const length = pointsT.length;
    let data = new Float32Array(2 * length);
    for (let pointT of pointsT) {
        data[data.length] = pointT.x;
        data[data.length] = pointT.y;
    }

    let dataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    let positionLocation = gl.getAttribLocation(program, 'a_position');
    let colorLocation = gl.getUniformLocation(program, 'u_color');
    let projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix');

    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    let fsize = data.BYTES_PER_ELEMENT;
    let stride = fsize * 2;

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindVertexArray(vao);

    // Tell WebGL how to convert from clip space to pixels
    resizeCanvasToDisplaySize(gl.canvas, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let projectionMatrix = mat3.create();
    mat3.projection(projectionMatrix, gl.canvas.width, gl.canvas.height);

    gl.uniformMatrix3fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniform4fv(colorLocation, [40 / 255, 187 / 255, 63 / 255, 1.0]);

    gl.clearColor(0, 20 / 255, 25 / 255, 1.0);
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // To disable the background color of the canvas element
    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, length);
}

function transformToTriangles(points: Point[], lineWidth: number): Point[] {
    let pointsT: Point[] = [];


    return pointsT;
}

main();
