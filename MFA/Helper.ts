interface ICoordinates {
    X: number;
    Y: number;
}

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

Array.prototype['unique'] = function () {
    var o = {}, i, l = this.length, r = [];
    for (i = 0; i < l; i += 1) o[this[i]] = this[i];
    for (i in o) r.push(o[i]);
    return r;
};