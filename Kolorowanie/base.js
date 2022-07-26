var Helper;
(function (Helper) {
    function Halt(event) {
        event.preventDefault();
        event.cancelBubble = true;
        event.stopPropagation();
        return false;
    }
    Helper.Halt = Halt;
    function Range(length, start) {
        if (start === void 0) { start = 0; }
        var result = [];
        var limit = Number(length) + start;
        for (var i = start; i < limit; i++) {
            result.push(i);
        }
        return result;
    }
    Helper.Range = Range;
    function RangeInverse(start, finish) {
        if (finish === void 0) { finish = 0; }
        var result = [];
        for (var i = start; i >= finish; i--) {
            result.push(i);
        }
        return result;
    }
    Helper.RangeInverse = RangeInverse;
    function ToBinary(value, exponent) {
        var result = [];
        RangeInverse(exponent - 1).forEach(function (i) {
            result.push((value >>> i) & 1);
        });
        return result;
    }
    Helper.ToBinary = ToBinary;
    function ToVariableIndices(value, exponent) {
        var result = [];
        RangeInverse(exponent - 1).forEach(function (i) {
            if ((value >>> i) & 1) {
                result.push(exponent - i);
            }
        });
        return result;
    }
    Helper.ToVariableIndices = ToVariableIndices;
    function Aggregate(collection, f, accumulator) {
        if (accumulator === void 0) { accumulator = 0; }
        collection.forEach(function (v) { return accumulator += f(v); });
        return accumulator;
    }
    Helper.Aggregate = Aggregate;
    var Coordinates = (function () {
        function Coordinates(x, y) {
            this.x = x;
            this.y = y;
        }
        Object.defineProperty(Coordinates.prototype, "X", {
            get: function () {
                return this.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Coordinates.prototype, "Y", {
            get: function () {
                return this.y;
            },
            enumerable: true,
            configurable: true
        });
        return Coordinates;
    })();
    function GetCoordinates(index, maxIndex, ratioTan) {
        if (ratioTan === void 0) { ratioTan = 1; }
        var angle = 2 * Math.PI * index / maxIndex;
        return new Coordinates(ratioTan * Math.sin(angle), -1 * Math.cos(angle));
    }
    Helper.GetCoordinates = GetCoordinates;
})(Helper || (Helper = {}));
var Edge = (function () {
    function Edge(exponent) {
        this.exponent = exponent;
        this.vertices = [];
    }
    Edge.prototype.SetVertex = function (index) {
        if (this.vertices.length < 2 && -1 === this.vertices.indexOf(index)) {
            this.vertices.push(index);
            return true;
        }
        return false;
    };
    Edge.prototype.DisableVertex = function (index) {
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
    };
    Object.defineProperty(Edge.prototype, "Value", {
        get: function () {
            if (!this.Validate()) {
                return -1;
            }
            return Math.pow(2, this.exponent - this.vertices[0]) + Math.pow(2, this.exponent - this.vertices[1]);
        },
        enumerable: true,
        configurable: true
    });
    Edge.prototype.Validate = function () {
        return 2 === this.vertices.length;
    };
    return Edge;
})();
function CalculateMinimalImplicants(edges, exponent) {
    var values = edges;
    if (edges.length > 0 && edges[0] instanceof Edge) {
        values = edges.map(function (e) { return e.Value; });
    }
    if (values.some(function (v) { return -1 === v; })) {
        throw "Invalid edge boolean alternatives!";
    }
    var miniterms = Helper.Range(Math.pow(2, exponent) - 1, 1).filter(function (i) { return values.every(function (v) { return (i & v) > 0; }); });
    var minimalImplicants = [];
    miniterms.forEach(function (i) {
        if (!minimalImplicants.some(function (m) { return (m & i) === m; })) {
            minimalImplicants.push(i);
        }
    });
    return minimalImplicants;
}
///<reference path="Scripts/typings/jquery/jquery.d.ts" />
///<reference path="Scripts/typings/sigmajs/sigmajs.d.ts" />
///<reference path="MinimalImplicants.ts" />
;
var Tuple = (function () {
    function Tuple(v1, v2) {
        this.v1 = v1;
        this.v2 = v2;
    }
    Object.defineProperty(Tuple.prototype, "V1", {
        get: function () {
            return this.v1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Tuple.prototype, "V2", {
        get: function () {
            return this.v2;
        },
        enumerable: true,
        configurable: true
    });
    return Tuple;
})();
var Save = (function () {
    function Save(n, e) {
        this.n = n;
        this.e = e;
    }
    Save.prototype.Validate = function () {
        if (typeof this.n !== "number" && this.n < 2) {
            return false;
        }
        if (!(this.e instanceof Array && this.e.length > 0 && this.e.length <= this.n * (this.n - 1) / 2)) {
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
    };
    return Save;
})();
function RestoreGrid(save, nodes, links, placeholder, switchElement) {
    nodes.val(save.n.toString());
    links.val(save.e.length.toString());
    var grid = placeholder.children("table");
    save.e.forEach(function (n, i) {
        grid.children('tr:eq(' + (n[0] - 1) + ')').children('td:eq(' + i + ')').trigger('click');
        grid.children('tr:eq(' + (n[1] - 1) + ')').children('td:eq(' + i + ')').trigger('click');
    });
    switchElement.triggerHandler('click');
}
function CreateGrid(rows, cols, placeholderId, switchElementId, mfaPlaceholderId, setsPlaceholderId, coloursPlaceholderId, aSetsPlaceholderId, sigma) {
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
    var edgeCollection = [];
    Helper.Range(cols).forEach(function () {
        edgeCollection.push(new Edge(rows));
    });
    var table = $('<table class="table"></table>');
    var head = $('<thead></thead>');
    var row = $('<tr><th></th></tr>');
    Helper.Range(cols, 1).forEach(function (i) { return row.append($('<th class="edge"><span>' + i + '</span></th>')); });
    head.append(row);
    table.append(head);
    Helper.Range(rows, 1).forEach(function (i) { return table.append(CreateRow(i, cols)); });
    table.on('click', 'td', function (event) {
        if (event.preventDefault)
            event.preventDefault();
        event.returnValue = false;
        var element = $(event.target);
        element = element.is('td') ? element : element.parent();
        var vertex = Number(element.attr('vertex'));
        var edge = edgeCollection[Number(element.attr('edge')) - 1];
        var success;
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
            if (edgeCollection.every(function (e) { return e.Validate(); })) {
                switchElement.removeAttr('disabled');
            }
            else {
                switchElement.attr({ disabled: '' });
            }
        }
        return success;
    });
    switchElement.on('click', edgeCollection, function (event) {
        mfaPlaceholder.empty();
        placeholder.children().not('table').remove();
        setsPlaceholder.empty();
        coloursPlaceholder.empty();
        aSetsPlaceholder.empty();
        sigma.graph.clear();
        sigma.refresh();
        var minimalImplicants = CalculateMinimalImplicants(event.data, rows);
        ShowAlternative(placeholder, event.data.map(function (i) { return i.vertices; }), rows);
        var binaries = minimalImplicants.map(function (i) { return Helper.ToVariableIndices(i, rows); });
        ShowMfa(mfaPlaceholder, setsPlaceholder, placeholder, rows, binaries);
        var aIndices = ShowColours(coloursPlaceholder, rows, binaries);
        var sets = setsPlaceholder.children('p').map(function (i, e) { return $(e).find('.sub').map(function (ii, ee) { return parseInt($(ee).text()); }); });
        var nodes = showAsets(aSetsPlaceholder, sets.toArray(), aIndices);
        DrawGraph(sigma.graph, nodes, event.data.map(function (e) { return e.vertices; }));
        sigma.refresh();
        event.preventDefault();
        return false;
    });
    placeholder.append(table);
}
function showAsets(placeholder, sets, indices) {
    var used = [];
    var nodes = [];
    indices.forEach(function (index, i) {
        var colour = GetColour(i, indices.length);
        var aSet = $('<p class="alert-warning alert" style="background-color: ' + colour + '; border-color: ' + colour + '"><span class="index"><span>' + (i + 1) + '</span></span></p>');
        sets[index - 1].filter(function (v, e) { return -1 === used.indexOf(e); }).toArray().forEach(function (s) {
            aSet.append('<span><span class="sub">' + s + '</span></span>');
            nodes.push(new Tuple(s, colour));
            used.push(s);
        });
        placeholder.append(aSet);
    });
    return nodes;
}
function GetColour(i, max) {
    var colour = new HSLColour(360 * i / max, 70, 53);
    return colour.getCSSHexadecimalRGB();
}
function DrawGraph(graph, vertices, edges) {
    var created = [];
    Helper.Range(vertices.length, 1).forEach(function (j) {
        var i = vertices.filter(function (t) { return t.V1 === j; })[0];
        var coordinates = Helper.GetCoordinates(j - 1, vertices.length, 2);
        graph.addNode({ id: "N" + i.V1, x: coordinates.X, y: coordinates.Y, label: i.V1.toString(), size: 1, color: i.V2 });
    });
    edges.forEach(function (e) {
        var source = "N" + e[0], destination = "N" + e[1];
        var id = "E=" + source + "-" + destination;
        if (-1 === $.inArray(id, created)) {
            graph.addEdge({ id: id, source: source, target: destination, color: "#000" });
            created.push(id);
        }
    });
}
function ShowAlternative(placeholder, indices, dimension) {
    placeholder.append('<h5>Wyrażenie alternatywno-koniunkcyjne</h5>');
    var fnc = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + dimension + ')</span>)=</span></div>');
    var alternatives = indices.map(function (e) { return CreateAlternative(e); });
    fnc.append(alternatives.join(''));
    placeholder.append(fnc);
}
function ShowMfa(placeholder, sets, fncPlaceholder, max, binaries) {
    var range = Helper.Range(max, 1);
    fncPlaceholder.append('<h5>Minimalna formuła alternatywna</h5>');
    var mfa = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + max + ')</span>)=</span></div>');
    mfa.append((binaries.map(function (e) { return e.map(function (i) { return '<span><span class="sub">' + i + '</span></span>'; }).join(''); }).join(' + ')));
    mfa.appendTo(fncPlaceholder);
    binaries.forEach(function (numbers, index) {
        var row = $('<p class="alert-info alert"></p>');
        var zws = $('<p class="alert-danger alert"><span class="index"><span>' + (index + 1) + '</span></span></p>');
        numbers.forEach(function (n) { return row.append($('<span><span class="sub">' + n + '</span></span>')); });
        $.grep(range, function (r) { return -1 < numbers.indexOf(r); }, true).forEach(function (n) { return zws.append($('<span><span class="sub">' + n + '</span></span>')); });
        placeholder.append(row);
        sets.append(zws);
    });
}
function ShowColours(placeholder, nodeNumber, binaries) {
    var table = $('<table class="table"></table>');
    var head = $('<thead></thead>');
    var row = $('<tr><th></th></tr>');
    Helper.Range(binaries.length, 1).forEach(function (i) { return row.append($('<th class="set"><span>' + i + '</span></th>')); });
    head.append(row);
    table.append(head);
    var v = [];
    Helper.Range(nodeNumber, 1).forEach(function (i) { return table.append(CreateBrow(i, binaries, v)); });
    placeholder.append(table);
    var alternatives = $.grep(v, function (e) { return e.length > 0; }).map(function (e) { return CreateAlternative(e); });
    var cWak = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + binaries.length + ')</span>)=</span></div>');
    cWak.append(alternatives.join(''));
    placeholder.append('<h5>Wyrażenie alternatywno-koniunkcyjne</h5>');
    placeholder.append(cWak);
    var vNumbers = v.map(function (e) { return Helper.Aggregate(e, function (i) { return Math.pow(2, binaries.length - i); }); });
    var vMinimalImplicants = CalculateMinimalImplicants(vNumbers, binaries.length);
    var vBinaries = vMinimalImplicants.map(function (i) {
        return Helper.ToVariableIndices(i, binaries.length);
    });
    var cMfa = $('<div id="wak"><span class="fnc">f<span class="sub">(G)</span>(v<span class="sup">(' + binaries.length + ')</span>)=</span></div>');
    vBinaries.sort(function (a, b) {
        if (a.length < b.length)
            return -1;
        if (a.length > b.length)
            return 1;
        return 0;
    });
    cMfa.append((vBinaries.map(function (e) { return e.map(function (i) { return '<span><span class="sub">' + i + '</span></span>'; }).join(''); }).join(' + ')));
    placeholder.append('<h5>Minimalna formuła alternatywna</h5>');
    cMfa.appendTo(placeholder);
    return vBinaries.length > 0 ? vBinaries[0] : [];
}
function CreateAlternative(indices) {
    var alternative = indices.sort().map(function (e) { return '<span><span class="sub">' + e + '</span></span>'; }).join('+');
    return indices.length > 1 ? '(' + alternative + ')' : alternative;
}
function CreateBrow(index, binaries, v) {
    var row = $('<tr><th class="index">' + index + '</th></tr>');
    v[index - 1] = [];
    Helper.Range(binaries.length).forEach(function (i) {
        var cell;
        if (-1 === binaries[i].indexOf(index)) {
            v[index - 1].push(i + 1);
            cell = $('<td class="set"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></td>');
        }
        else {
            cell = $('<td></td>');
        }
        row.append(cell);
    });
    return row;
}
function CreateRow(index, cols) {
    var row = $('<tr><th class="vertex"><span>' + index + '<span></th></tr>');
    Helper.Range(cols, 1).forEach(function (i) {
        var cell = $('<td vertex="' + index + '" edge="' + i + '"></td>');
        row.append(cell);
    });
    return row;
}
//# sourceMappingURL=base.js.map