module Helper {
    export function Halt(event: Event): boolean {
        event.preventDefault();
        event.cancelBubble = true;
        event.stopPropagation();
        return false;
    }

    export function Range(length: number, start = 0): number[] {
        var result: number[] = [];
        var limit = Number(length) + start;
        for (var i = start; i < limit; i++) {
            result.push(i);
        }

        return result;
    }

    export function RangeInverse(start: number, finish = 0): number[] {
        var result: number[] = [];
        for (var i = start; i >= finish; i--) {
            result.push(i);
        }

        return result;
    }

    export function ToBinary(value: number, exponent: number): number[]{
        var result: number[] = [];
        RangeInverse(exponent - 1).forEach(i => {
            result.push((value >>> i) & 1);
        });

        return result;
    }

    export function ToVariableIndices(value: number, exponent: number): number[] {
        var result: number[] = [];
        RangeInverse(exponent - 1).forEach(i => {
            if ((value >>> i) & 1) {
                result.push(exponent - i);
            }
        });

        return result;
    }

    export function Aggregate<T>(collection: T[], f: <T>(arg: T) => number, accumulator: number = 0): number {
        collection.forEach(v => accumulator += f(v));
        return accumulator;
    }

    class Coordinates implements ICoordinates {
        constructor(private x: number, private y: number) { }
        get X(): number {
            return this.x;
        }
        get Y(): number {
            return this.y;
        }
    }

    export function GetCoordinates(index: number, maxIndex: number, ratioTan: number = 1): ICoordinates {
        var angle: number = 2 * Math.PI * index / maxIndex;
        return new Coordinates(ratioTan * Math.sin(angle), -1 * Math.cos(angle));
    }
}

interface IValidate {
    Validate(): boolean
}

interface ICoordinates {
    X: number;
    Y: number;
}

class Edge implements IValidate {
    private vertices: number[];

    constructor(private exponent: number) {
        this.vertices = [];
    }

    SetVertex(index: number): boolean {
        if (this.vertices.length < 2 && -1 === this.vertices.indexOf(index)) {
            this.vertices.push(index);
            return true;
        }

        return false;
    }

    DisableVertex(index: number): boolean {
        var i = this.vertices.indexOf(index);
        if (i !== -1) {
            if (1 === this.vertices.length) {
                this.vertices = [];
            }
            else {
                this.vertices = [this.vertices[1 - i]];
            }

            return true;
        }

        return false;
    }

    get Value(): number {
        if (!this.Validate()) {
            return -1;
        }

        return Math.pow(2, this.exponent - this.vertices[0]) + Math.pow(2, this.exponent - this.vertices[1]);
    }

    Validate(): boolean {
        return 2 === this.vertices.length;
    }
}

function CalculateMinimalImplicants(edges: Edge[], exponent: number): number[];
function CalculateMinimalImplicants(edges: number[], exponent: number): number[];
function CalculateMinimalImplicants(edges, exponent: number): number[]{
    var values: number[] = edges;
    if (edges.length > 0 && edges[0] instanceof Edge) {
        values = edges.map(e => e.Value);
    }
    if (values.some(v => -1 === v)) {
        throw "Invalid edge boolean alternatives!"
    }

    var miniterms = Helper.Range(Math.pow(2, exponent) - 1, 1).filter(i => values.every(v => (i & v) > 0));
    var minimalImplicants: number[] = [];
    miniterms.forEach(i => {
        if (!minimalImplicants.some(m => (m & i) === m)) {
            minimalImplicants.push(i);
        }
    });

    return minimalImplicants;
}