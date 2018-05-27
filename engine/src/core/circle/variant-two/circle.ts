import vertexShaderSource from './circle-vert.glsl';
import fragmentShaderSource from './circle-frag.glsl';
import { createProgram, createShader, resizeCanvasToDisplaySize } from '../../webgl-program-service';

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

    // Format of data:
    // x coordinate
    // y coordinate
    // radius
    // color (rgb normalized to the range 0 - 1) with alpha
    // prettier-ignore
    let data = new Float32Array([
        -0.5, 0, 12.0, 229 / 255, 116 / 255, 66 / 255, 1.0,
        0, 0.5, 63.0, 40 / 255, 187 / 255, 63 / 255, 1.0,
        0.5, -0.5, 21.5, 187 / 255, 57 / 255, 57 / 255, 1.0
    ]);

    let dataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    let posAttributeLocation = gl.getAttribLocation(program, 'a_position');
    let radiusAttributeLocation = gl.getAttribLocation(program, 'a_radius');
    let colorAttributeLocation = gl.getAttribLocation(program, 'a_color');

    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    let fsize = data.BYTES_PER_ELEMENT;
    let stride = fsize * 7;

    gl.vertexAttribPointer(posAttributeLocation, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(posAttributeLocation);

    gl.vertexAttribPointer(radiusAttributeLocation, 1, gl.FLOAT, false, stride, fsize * 2);
    gl.enableVertexAttribArray(radiusAttributeLocation);

    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, stride, fsize * 3);
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Tell WebGL how to convert from clip space to pixels
    resizeCanvasToDisplaySize(gl.canvas, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 20 / 255, 25 / 255, 1.0);
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // To disable the background color of the canvas element
    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindVertexArray(vao);

    // draw
    gl.drawArrays(gl.POINTS, 0, 3);
}

main();
