import {Point} from '../point';

export abstract class ThickLineElement {
    isTriangle(): boolean {
        return false;
    }

    abstract getPoints(): Point[];
}

export interface StraightLine {
    start: Point;
    end: Point;
}

export class Quad extends ThickLineElement {
    constructor(public top: StraightLine, public bottom: StraightLine) {
        super();
    }

    getPoints(): Point[] {
        return [
            this.top.start, this.top.end, this.bottom.start,
            this.bottom.start, this.bottom.end, this.top.end
        ];
    }
}

export class Triangle extends ThickLineElement {
    constructor(public corner: Point, public base: StraightLine) {
        super();
    }

    isTriangle(): boolean {
        return true;
    }

    getPoints(): Point[] {
        return [this.corner, this.base.start, this.base.end];
    }
}