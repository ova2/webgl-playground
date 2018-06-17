import {Point} from '../point';

/**
 * Get the intersection point between two line segments.
 * http://schteppe.github.io/p2.js/docs/files/src_math_vec2.js.html
 * @param  {Array} p0 start point of the first line
 * @param  {Array} p1 end point of the first line
 * @param  {Array} p2 start point of the second line
 * @param  {Array} p3 end point of the second line
 * @return {Point} intersection point or null.
 */
export function intersect(p0: Point, p1: Point, p2: Point, p3: Point): Point {
    let t = getLineSegmentsIntersectionFraction(p0, p1, p2, p3);
    if (t < 0) {
        return null;
    } else {
        return {x: p0.x + (t * (p1.x - p0.x)), y: p0.y + (t * (p1.y - p0.y))};
    }
}

/**
 * Get the intersection fraction between two line segments. If successful, the intersection is at p0 + t * (p1 - p0)
 * @param  {Array} p0 start point of the first line
 * @param  {Array} p1 end point of the first line
 * @param  {Array} p2 start point of the second line
 * @param  {Array} p3 end point of the second line
 * @return {number} A number between 0 and 1 if there was an intersection, otherwise -1.
 */
function getLineSegmentsIntersectionFraction(p0: Point, p1: Point, p2: Point, p3: Point) {
    let s1_x = p1.x - p0.x;
    let s1_y = p1.y - p0.y;
    let s2_x = p3.x - p2.x;
    let s2_y = p3.y - p2.y;

    const l = -s2_x * s1_y + s1_x * s2_y;
    let s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / l;
    let t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / l;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected (intersection point available)
        return t;
    }

    return -1; // No collision
}