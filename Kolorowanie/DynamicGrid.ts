///<reference path="Scripts/typings/jquery/jquery.d.ts" />
///<reference path="Scripts/typings/sigmajs/sigmajs.d.ts" />
///<reference path="MinimalImplicants.ts" />

interface JQueryEventObject { returnValue: boolean };
declare function HSLColour(hue: number, saturation: number, lightness: number): void;

class Tuple<T1, T2> {
    constructor(private v1: T1, private v2: T2) { }
    get V1(): T1 {
        return this.v1;
    }
    get V2(): T2 {
        return this.v2;
    }
}

class Save {
    constructor(public n: number, public e: number[][]) { }

    Validate(): boolean {
        if (typeof this.n !== "number" && this.n < 2) {
            return false;
        }
        if (!(this.e instanceof Array && this.e.length > 0 && this.e.length <= this.n * (this.n-1) / 2)) {
            return false;
        }
        for (var i = 0; i < this.e.length; i++) {
            var ee = this.e[i];
            if (!(ee instanceof Array && ee.length === 2 && ee[0] !== ee[1])) {
                return false;
            }
            if (ee[0] > this.n || ee[1] > this.n) {
                return false;
            }
        }
        
        return true;
    }
}

function RestoreGrid(save: Save, nodes: JQuery, links: JQuery, placeholder: JQuery, switchElement: JQuery) {
    nodes.val(save.n.toString());
    links.val(save.e.length.toString());
    var grid = placeholder.children("table");
    save.e.forEach((n, i) => {
        grid.children('tr:eq(' + (n[0] - 1) + ')').children('td:eq(' + i + ')').trigger('click');
        grid.children('tr:eq(' + (n[1] - 1) + ')').children('td:eq(' + i + ')').trigger('click');
    });
    switchElement.triggerHandler('click');
}

function CreateGrid(rows: number, cols: number, placeholderId: string, switchElementId: string, mfaPlaceholderId: string, setsPlaceholderId: string, coloursPlaceholderId: string, aSetsPlaceholderId: string, sigma: SigmaJs.Sigma) {
    var placeholder = $('#' + placeholderId);
    var switchElement = $('#' + switchElementId);
    var mfaPlaceholder = $('#' + mfaPlaceholderId);
    var setsPlaceholder = $('#' + setsPlaceholderId);
    var coloursPlaceholder = $('#' + coloursPlaceholderId);
    var aSetsPlaceholder = $('#' + aSetsPlaceholderId);
    placeholder.empty();
    setsPlaceholder.empty();
    mfaPlaceholder.empty();
    coloursPlaceholder.empty();
    aSetsPlaceholder.empty();
    var edgeCollection: Edge[] = [];
    Helper.Range(cols).forEach(() => { edgeCollection.push(new Edge(rows)); });

    var table = $('<table class="table"></table>');
    var head = $('<thead></thead>');
    var row = $('<tr><th></th></tr>');
    Helper.Range(cols, 1).forEach(i => row.append($('<th class="edge"><span>' + i + '</span></th>')));
    head.append(row);
    table.append(head);
    Helper.Range(rows, 1).forEach(i => table.append(CreateRow(i, cols)));
    table.on('click', 'td',(event: JQueryEventObject) => {
        if (event.preventDefault) event.preventDefault();
        event.returnValue = false;
        var element = $(event.target);
        element = element.is('td') ? element : element.parent();
        var vertex = Number(element.attr('vertex'));
        var edge = edgeCollection[Number(element.attr('edge')) - 1];
        var success: boolean;
        if (element.hasClass('set')) {
            success = edge.DisableVertex(vertex);
            if (success) {
                element.removeClass('set');
                element.empty();
            }
        }
        else {
            success = edge.SetVertex(vertex);
            if (success) {
                element.addClass('set');
                element.append($('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));
            }
        }
        if (success) {
            if (edgeCollection.every(e => e.Validate())) {
                switchElement.removeAttr('disabled');
            }
            else {
                switchElement.attr({ disabled: '' });
            }
        }

        return success;
    });
    switchElement.on('click', edgeCollection, (event) => {
        mfaPlaceholder.empty();
        placeholder.children().not('table').remove();
        setsPlaceholder.empty();
        coloursPlaceholder.empty();
        aSetsPlaceholder.empty();
        sigma.graph.clear();
        sigma.refresh();
        var minimalImplicants = CalculateMinimalImplicants(event.data, rows);
        ShowAlternative(placeholder, event.data.map(i => i.vertices), rows);
        var binaries = minimalImplicants.map(i => Helper.ToVariableIndices(i, rows));
        ShowMfa(mfaPlaceholder, setsPlaceholder, placeholder, rows, binaries);
        var aIndices = ShowColours(coloursPlaceholder, rows, binaries);
        var sets = setsPlaceholder.children('p').map((i: number, e: Element) => $(e).find('.sub').map((ii: number, ee: Element) => parseInt($(ee).text())));
        var nodes = showAsets(aSetsPlaceholder, sets.toArray(), aIndices);
        DrawGraph(sigma.graph, nodes, event.data.map(e => e.vertices));
        sigma.refresh();
        event.preventDefault();
        return false;
    });

    placeholder.append(table);
}

function showAsets(placeholder: JQuery, sets: JQuery[], indices: number[]): Tuple<number, string>[] {
    var used: Element[] = [];
    var nodes: Tuple<number, string>[] = [];
    indices.forEach((index: number, i: number) => {
        var colour = GetColour(i, indices.length);
        var aSet = $('<p class="alert-warning alert" style="background-color: ' + colour + '; border-color: ' + colour + '"><span class="index"><span>' + (i + 1) + '</span></span></p>');
        sets[index - 1].filter((v: number, e: Element) => -1 === used.indexOf(e)).toArray().forEach(s => {
            aSet.append('<span><span class="sub">' + s + '</span></span>');
            nodes.push(new Tuple(s, colour));
            used.push(s);
        });
        placeholder.append(aSet);
    });

    return nodes;
}

function GetColour(i: number, max: number): string {
    var colour = new HSLColour(360 * i / max, 70, 53);
    return colour.getCSSHexadecimalRGB();
}

function DrawGraph(graph: SigmaJs.Graph, vertices: Tuple<number, string>[], edges: number[][]): void {
    var created: string[] = [];
    Helper.Range(vertices.length, 1).forEach(j => { var i = vertices.filter(t => t.V1 === j)[0]; var coordinates = Helper.GetCoordinates(j - 1, vertices.length, 2); graph.addNode({ id: "N" + i.V1, x: coordinates.X, y: coordinates.Y, label: i.V1.toString(), size: 1, color: i.V2 }); });
    edges.forEach(e => { var source = "N" + e[0], destination = "N" + e[1]; var id = "E=" + source + "-" + destination; if (-1 === $.inArray(id, created)) { graph.addEdge({ id: id, source: source, target: destination, color: "#000" }); created.push(id); }});
}

function ShowAlternative(placeholder: JQuery, indices: number[][], dimension: number) {
    placeholder.append('<h5>Wyrażenie alternatywno-koniunkcyjne</h5>');
    var fnc = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + dimension + ')</span>)=</span></div>');
    var alternatives = indices.map(e => CreateAlternative(e));
    fnc.append(alternatives.join(''));
    placeholder.append(fnc);
}

function ShowMfa(placeholder: JQuery, sets: JQuery, fncPlaceholder: JQuery, max: number, binaries: number[][]) {
    var range = Helper.Range(max, 1);
    fncPlaceholder.append('<h5>Minimalna formuła alternatywna</h5>');
    var mfa = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + max + ')</span>)=</span></div>');
    mfa.append((binaries.map(e => e.map(i => '<span><span class="sub">' + i + '</span></span>').join('')).join(' + ')));
    mfa.appendTo(fncPlaceholder);
    binaries.forEach((numbers, index) => {
        var row = $('<p class="alert-info alert"></p>');
        var zws = $('<p class="alert-danger alert"><span class="index"><span>' + (index  + 1) + '</span></span></p>');
        numbers.forEach(n => row.append($('<span><span class="sub">' + n + '</span></span>')));
        $.grep(range, r => -1 < numbers.indexOf(r), true).forEach(n => zws.append($('<span><span class="sub">' + n + '</span></span>')));
        placeholder.append(row);
        sets.append(zws);
    });
}

function ShowColours(placeholder: JQuery, nodeNumber: number, binaries: number[][]): number[] {
    var table = $('<table class="table"></table>');
    var head = $('<thead></thead>');
    var row = $('<tr><th></th></tr>');
    Helper.Range(binaries.length, 1).forEach(i => row.append($('<th class="set"><span>' + i + '</span></th>')));
    head.append(row);
    table.append(head);
    var v: number[][] = [];
    Helper.Range(nodeNumber, 1).forEach(i => table.append(CreateBrow(i, binaries, v)));
    placeholder.append(table);
    var alternatives = $.grep(v, e => e.length > 0).map(e => CreateAlternative(e));
    var cWak = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + binaries.length + ')</span>)=</span></div>');
    cWak.append(alternatives.join(''));
    placeholder.append('<h5>Wyrażenie alternatywno-koniunkcyjne</h5>');
    placeholder.append(cWak);
    var vNumbers: number[] = v.map(e => Helper.Aggregate(e, i => Math.pow(2, binaries.length - i)));
    var vMinimalImplicants = CalculateMinimalImplicants(vNumbers, binaries.length);
    var vBinaries = vMinimalImplicants.map(function (i) { return Helper.ToVariableIndices(i, binaries.length); });
    var cMfa = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + binaries.length + ')</span>)=</span></div>');
    vBinaries.sort(function (a: number[], b: number[]) : number { if (a.length < b.length) return -1; if (a.length > b.length) return 1; return 0; });
    cMfa.append((vBinaries.map(e => e.map(i => '<span><span class="sub">' + i + '</span></span>').join('')).join(' + ')));
    placeholder.append('<h5>Minimalna formuła alternatywna</h5>');
    cMfa.appendTo(placeholder);
    return vBinaries.length > 0 ? vBinaries[0] : [];
}

function CreateAlternative(indices: number[]): string {
    var alternative = indices.sort().map(e => '<span><span class="sub">' + e + '</span></span>').join('+');
    return indices.length > 1 ? '(' + alternative + ')' : alternative;
}

function CreateBrow(index: number, binaries: number[][], v: number[][]): JQuery {
    var row = $('<tr><th class="index">' + index + '</th></tr>');
    v[index - 1] = [];
    Helper.Range(binaries.length).forEach(i => {
        var cell: JQuery;
        if (-1 === binaries[i].indexOf(index)) {
            v[index-1].push(i + 1);
            cell = $('<td class="set"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></td>');
        }
        else {
            cell = $('<td></td>');
        }
        row.append(cell);
    });
    return row;
}

function CreateRow(index: number, cols: number): JQuery {
    var row = $('<tr><th class="vertex"><span>' + index + '<span></th></tr>');
    Helper.Range(cols, 1).forEach(i => {
        var cell = $('<td vertex="' + index + '" edge="' + i + '"></td>');
        row.append(cell);
    });
    return row;
}