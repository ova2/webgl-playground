import vertexShaderSource from './thickline-vert.glsl';
import fragmentShaderSource from './thickline-frag.glsl';
import {createProgram, createShader, resizeCanvasToDisplaySize} from '../webgl-program-service';
import {mat3, vec2} from 'gl-matrix';
import {Point} from '../point';
import {Quad, StraightLine, ThickLineElement, Triangle} from './thickline.model';
import {EPSILON, intersect, isLinesParallel} from './math.util';

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
    let linePoints: Point[] = [
        {x: -360.88, y: -222},
        {x: -244.5, y: 0},
        {x: 17.99, y: 0},
        {x: 61.99, y: 0},
        {x: 188, y: -197.34},
        {x: 188, y: 32.9},
        {x: 371, y: 32.9},
        {x: -189, y: 212},
        {x: -379.12, y: 11.6}
    ];

    const lineWidth = 50;

    let points = createGeometry(linePoints, lineWidth);
    const length = points.length;
    let data = new Float32Array(2 * length);
    points.forEach((point, index) => {
        data.set([point.x, point.y], index * 2);
    });

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
    gl.uniform4fv(colorLocation, [40 / 255, 187 / 255, 63 / 255, 0.5]);

    gl.clearColor(0, 20 / 255, 25 / 255, 1.0);
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // To disable the background color of the canvas element
    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, length);
}

function createGeometry(points: Point[], lineWidth: number): Point[] {
    let length = points != null ? points.length : -1;
    // we expect at least two points
    if (length <= 1) {
        return [];
    }

    // break given line in array of straight lines
    let straightLines: StraightLine[] = [];
    let endIndex = 0;
    while (endIndex < length - 1) {
        let {start, end, endPointIndex} = buildStraightLine(endIndex, points);
        straightLines.push({start, end});
        endIndex = endPointIndex;
    }

    // build array of rectangles (quads) along the straight lines
    let quads: Quad[] = [];
    for (let sl of straightLines) {
        quads.push(buildQuads(sl, lineWidth));
    }

    // build thick line model => adjust quads and connect them with triangles
    let model: (Quad | Triangle)[] = [];
    const quadsLength = quads.length;
    for (let i = 0; i < quadsLength; i++) {
        let quad = quads[i];
        if (i + 1 == quadsLength) {
            model.push(quad);
            break;
        }

        let nextQuad = quads[i + 1];
        constructThickLineModel(model, quad, nextQuad);
    }

    // build array of points to draw with TRIANGLES
    return transformToTrianglePoints(model);
}

function buildStraightLine(idx: number, points: Point[]): StraightLine & { endPointIndex: number } {
    let point = points[idx];
    let start = {x: point.x, y: point.y};
    let endPointIndex = findEndPointIndex(start, idx + 1, points);
    let end = points[endPointIndex];

    return {start, end, endPointIndex};
}

function findEndPointIndex(start: Point, idx: number, points: Point[]): number {
    let end = points[idx];
    let next: Point = null;
    if (idx < points.length - 1) {
        next = points[idx + 1];
    }

    // compare two lines with points (start, end) and (end, next) if they are parallel
    if (next && isLinesParallel(start, end, end, next)) {
        // current and next lines are parallel => search on the end point of the straight line
        return findEndPointIndex(end, idx + 1, points);
    }

    return idx;
}

function buildQuads(straightLine: StraightLine, lineWidth: number): Quad {
    const vecStart = vec2.fromValues(straightLine.start.x, straightLine.start.y);
    const vecEnd = vec2.fromValues(straightLine.end.x, straightLine.end.y);
    const line = vec2.create();
    vec2.subtract(line, vecEnd, vecStart);
    const normal = vec2.create();
    vec2.normalize(normal, vec2.fromValues(-line[1], line[0]));
    const halfLineWidth = lineWidth / 2;
    const resizedNormal = vec2.fromValues(halfLineWidth * normal[0], halfLineWidth * normal[1]);

    const vecA = vec2.create();
    vec2.subtract(vecA, vecStart, resizedNormal);
    const vecB = vec2.create();
    vec2.add(vecB, vecStart, resizedNormal);
    const vecC = vec2.create();
    vec2.subtract(vecC, vecEnd, resizedNormal);
    const vecD = vec2.create();
    vec2.add(vecD, vecEnd, resizedNormal);

    return new Quad(
        {start: {x: vecB[0], y: vecB[1]}, end: {x: vecD[0], y: vecD[1]}},
        {start: {x: vecA[0], y: vecA[1]}, end: {x: vecC[0], y: vecC[1]}}
    );
}

function constructThickLineModel(model: (Quad | Triangle)[], quad: Quad, nextQuad: Quad): void {
    let intersectPoint = intersect(
        {x: quad.bottom.start.x, y: quad.bottom.start.y},
        {x: quad.bottom.end.x, y: quad.bottom.end.y},
        {x: nextQuad.bottom.start.x, y: nextQuad.bottom.start.y},
        {x: nextQuad.bottom.end.x, y: nextQuad.bottom.end.y}
    );

    if (intersectPoint) {
        // intersection point at bottom line
        quad.bottom.end = intersectPoint;
        nextQuad.bottom.start = intersectPoint;
        let triangleBase = {start: quad.top.end, end: nextQuad.top.start};
        let triangle = new Triangle(intersectPoint, triangleBase);
        model.push(quad, triangle);
        return;
    }

    intersectPoint = intersect(
        {x: quad.top.start.x, y: quad.top.start.y},
        {x: quad.top.end.x, y: quad.top.end.y},
        {x: nextQuad.top.start.x, y: nextQuad.top.start.y},
        {x: nextQuad.top.end.x, y: nextQuad.top.end.y}
    );

    if (intersectPoint) {
        // intersection point at top line
        quad.top.end = intersectPoint;
        nextQuad.top.start = intersectPoint;
        let triangleBase = {start: quad.bottom.end, end: nextQuad.bottom.start};
        let triangle = new Triangle(intersectPoint, triangleBase);
        model.push(quad, triangle);
        return;
    }

    console.warn(`Intersection point of quads ${JSON.stringify(quad)} and ${JSON.stringify(nextQuad)} could not be found.
    The lineWidth is probably too big or an angle between lines is too acute.`);
}

function transformToTrianglePoints(model: (Quad | Triangle)[]): Point[] {
    let points: Point[] = [];
    for (let element of model) {
        points.push(...element.getPoints());
    }

    return points;
}

main();
