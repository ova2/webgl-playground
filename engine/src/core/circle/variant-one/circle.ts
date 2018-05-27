import vertexShaderSource from './circle-vert.glsl';
import fragmentShaderSource from './circle-frag.glsl';
import { createProgram, createShader, resizeCanvasToDisplaySize } from '../../webgl-program-service';
import { mat4 } from 'gl-matrix';

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

    const arrayLength = 361 * 2 + 2;
    let data = new Float32Array(arrayLength);
    let radian = Math.PI / 180;
    let radius = 0.04;
    data[0] = 0.0;
    data[1] = 0.0;
    // prettier-ignore
    for (let i = 0; i <= 360; i++) {
        let rad = i * radian;
        data.set([
            radius * Math.cos(rad),
            radius * Math.sin(rad)
        ], 2 + i * 2);
    }

    let dataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    let positionLocation = gl.getAttribLocation(program, 'a_position');
    let colorLocation = gl.getUniformLocation(program, 'u_color');
    let projectionModelMatrixLocation = gl.getUniformLocation(program, 'u_projectionModelMatrix');

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

    let modelMatrix = mat4.create();
    mat4.fromTranslation(modelMatrix, [-0.5, 0.0, 0.0]);
    let projectionMatrix = mat4.create();
    let ratio = gl.canvas.width / gl.canvas.height;
    let halfWorldWidth = 1.0;
    mat4.ortho(projectionMatrix, -halfWorldWidth, halfWorldWidth, -halfWorldWidth / ratio, halfWorldWidth / ratio, 0, -1.0);
    let projectionModelMatrix = mat4.create();
    mat4.multiply(projectionModelMatrix, projectionMatrix, modelMatrix);

    gl.uniformMatrix4fv(projectionModelMatrixLocation, false, projectionModelMatrix);
    gl.uniform4fv(colorLocation, [229 / 255, 116 / 255, 66 / 255, 1.0]);

    gl.clearColor(0, 20 / 255, 25 / 255, 1.0);
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // To disable the background color of the canvas element
    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 362);
}

main();
