import vertexShaderSource from './thickline-vert.glsl';
import fragmentShaderSource from './thickline-frag.glsl';
import {createProgram, createShader, resizeCanvasToDisplaySize} from '../webgl-program-service';
import {mat3, vec2} from 'gl-matrix';
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

    // calculate points of triangles that draw a thick line
    let tPoints = transformToTrianglePoints(points, lineWidth);
    const length = tPoints.length;
    let data = new Float32Array(2 * length);
    tPoints.forEach((tPoint, index) => {
        data.set([tPoint.x, tPoint.y], index * 2);
    });

    console.log(2 * length);
    console.log(data);

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

function transformToTrianglePoints(points: Point[], lineWidth: number): Point[] {
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
        console.log(`${start.x}, ${start.y}, ${end.x}, ${end.y}, ${endPointIndex}`);
        straightLines.push({start, end});
        endIndex = endPointIndex;
    }

    let tPoints: Point[] = [];
    for (let sl of straightLines) {
        tPoints.push(...findTrianglePoints(sl, lineWidth));
    }

    return tPoints;
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

function isLinesParallel(firstStartPoint: Point, firstEndPoint: Point, secondStartPoint: Point, secondEndPoint: Point): boolean {
    // calculate and compare slopes
    let slope1 = 0;
    let slope2 = 0;
    if (firstStartPoint.x != firstEndPoint.x) {
        slope1 = (firstEndPoint.y - firstStartPoint.y) / (firstEndPoint.x - firstStartPoint.x);
    }

    if (secondStartPoint.x != secondEndPoint.x) {
        slope2 = (secondEndPoint.y - secondStartPoint.y) / (secondEndPoint.x - secondStartPoint.x);
    }

    //console.log(`slope1 = ${slope1}, slope2 = ${slope2}`);

    return Math.abs(slope1 - slope2) < 0.00000001;
}

function findTrianglePoints(straightLine: StraightLine, lineWidth: number): Point[] {
    // get orthogonal normalized vectors at both line points (start and end)
    let [vecStart, vecEnd] = getNormalizedOrthogonalVector(straightLine);

    // calculate points for triangles (scale and translate vectors back to the original poisitons)
    const distance1 = vecStart[0] * lineWidth;
    const distance2 = vecStart[1] * lineWidth;
    const distance3 = vecEnd[0] * lineWidth;
    const distance4 = vecEnd[1] * lineWidth;

    let t1: Point = {x: distance1 + straightLine.start.x, y: distance2 + straightLine.start.y};
    let t2: Point = {x: -distance1 * lineWidth + straightLine.start.x, y: -distance2 + straightLine.start.y};
    let t3: Point = {x: distance3 + straightLine.end.x, y: distance4 + straightLine.end.y};
    let t4: Point = {x: -distance3 + straightLine.end.x, y: -distance4 + straightLine.end.y};

    return [t1, t2, t3, t2, t3, t4];
}

function getNormalizedOrthogonalVector(straightLine: StraightLine): [vec2, vec2] {
    let outStart: vec2;
    let outEnd: vec2;

    if (straightLine.start.x == straightLine.end.x) {
        outStart = outEnd = vec2.fromValues(0, 1);
        return [outStart, outEnd];
    }

    if (straightLine.start.y == straightLine.end.y) {
        outStart = outEnd = vec2.fromValues(1, 0);
        return [outStart, outEnd];
    }

    let spoint: Point = {
        x: straightLine.start.x - straightLine.end.x,
        y: straightLine.start.y - straightLine.end.y
    };

    let epoint: Point = {
        x: straightLine.end.x - straightLine.start.x,
        y: straightLine.end.y - straightLine.start.y
    };

    outStart = vec2.create();
    outEnd = vec2.create();
    vec2.normalize(outStart, vec2.fromValues(1, -epoint.x / epoint.y));
    vec2.normalize(outEnd, vec2.fromValues(1, -spoint.x / spoint.y));

    return [outStart, outEnd];
}

interface StraightLine {
    start: Point;
    end: Point;
}

main();
