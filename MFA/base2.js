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
Array.prototype['unique'] = function () {
    var o = {}, i, l = this.length, r = [];
    for (i = 0; i < l; i += 1)
        o[this[i]] = this[i];
    for (i in o)
        r.push(o[i]);
    return r;
};
///<reference path="Scripts/typings/jquery/jquery.d.ts" />
///<reference path="Scripts/typings/knockout/knockout.d.ts" />
///<reference path="Helper.ts" />
var Alternative = (function () {
    function Alternative(_index) {
        var _this = this;
        this._index = _index;
        this._variables = ko.observableArray();
        this._isEmpty = ko.pureComputed(function () { return 0 === _this._variables().length; });
        this._reduce = function (p, c) {
            return p + (1 << c - 1);
        };
    }
    Object.defineProperty(Alternative.prototype, "Index", {
        get: function () {
            return this._index;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Alternative.prototype, "IsEmpty", {
        get: function () {
            return this._isEmpty;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Alternative.prototype, "Variables", {
        get: function () {
            return this._variables;
        },
        enumerable: true,
        configurable: true
    });
    Alternative.prototype.SwitchVariable = function (event, variable, data) {
        if (-1 === $.inArray(variable, this._variables.peek())) {
            var variables = this._variables.peek();
            var i;
            for (i = 0; i < variables.length; i++) {
                if (variables[i] > variable) {
                    break;
                }
            }
            this._variables.splice(i, 0, variable);
            $(event.currentTarget).addClass('set');
        }
        else {
            this._variables.remove(variable);
            $(event.currentTarget).removeClass();
        }
        if (data || '') {
            data.Calculate();
        }
        return Helper.Halt(event);
    };
    Alternative.prototype.GetAlternative = function () {
        return this._variables.peek().reduce(this._reduce, 0);
    };
    return Alternative;
})();
var Base = (function () {
    function Base(_variables, _isCore) {
        this._variables = _variables;
        this._isCore = _isCore;
    }
    Object.defineProperty(Base.prototype, "Variables", {
        get: function () {
            return this._variables;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Base.prototype, "IsCore", {
        get: function () {
            return this._isCore;
        },
        enumerable: true,
        configurable: true
    });
    return Base;
})();
var Grid = (function () {
    function Grid(variablesNumber, alternativesNumber) {
        var _this = this;
        if (variablesNumber === void 0) { variablesNumber = 0; }
        if (alternativesNumber === void 0) { alternativesNumber = 0; }
        this._alternatives = ko.observable([]);
        this._variables = ko.observable([]);
        this._formula = ko.observable([]);
        this._visible = ko.pureComputed(function () { return _this._alternatives().some(function (a) { return !a.IsEmpty(); }); });
        this._setSigmaUp = function () {
            this._sigma = sigma.init(document.getElementById('graph'));
            this._sigma.configProperties({
                drawHoverNodes: false,
                drawActiveNodes: false
            }).drawingProperties({
                defaultLabelColor: '#FFF',
                defaultLabelSize: 14,
                font: 'Lato, Helvetica Neue',
                defaultEdgeType: 'curve',
                defaultEdgeArrow: 'target',
                defaultEdgeColor: '#333'
            }).graphProperties({
                minNodeSize: 10,
                maxNodeSize: 20,
                minEdgeSize: 5,
                maxEdgeSize: 5,
                scalingMode: 'inside'
            }).mouseProperties({
                mouseEnabled: false
            });
        };
        this._variablesNumber = ko.observable(variablesNumber);
        this._calculatedVariablesNumber = ko.observable(variablesNumber);
        this._alternativesNumber = ko.observable(alternativesNumber);
        this._enabled = ko.pureComputed(function () { return _this._alternatives().length > 0; });
        this._isGraph = ko.pureComputed(function () { return _this._calculatedVariablesNumber() > 0 && _this._calculatedVariablesNumber() === _this._alternatives().length && _this._alternatives().every(function (a) { return -1 !== a.Variables().indexOf(a.Index); }); });
        this._setSigmaUp();
    }
    Grid.prototype.SetVariables = function () {
        this._sigma.emptyGraph();
        this._sigma.resize();
        this._sigma.refresh();
        this._sigma.draw();
        this._variables(Helper.Range(this._variablesNumber(), 1));
        this._calculatedVariablesNumber(this._variables.peek().length);
        this._alternatives.valueWillMutate();
        var alternatives = this._alternatives();
        alternatives.length = 0;
        Helper.Range(this._alternativesNumber(), 1).forEach(function (n) {
            alternatives.push(new Alternative(n));
        });
        this._alternatives.valueHasMutated();
    };
    Grid.prototype.Calculate = function (data, event) {
        var _this = this;
        var alternatives = $.grep(this._alternatives.peek().map(function (value) { return value.GetAlternative(); }), function (i) { return i > 0; });
        if (alternatives.length > 0) {
            var miniterms = this._getMinimalImplicants.call(this, alternatives);
            var minimalImplicants = [];
            miniterms.forEach(function (i) {
                if (minimalImplicants.every(function (j) { return (j & i) !== j; })) {
                    minimalImplicants.push(i);
                }
            });
            this._formula(minimalImplicants.map(function (n) { return _this._getBinary(n); }));
        }
        return (event || '') ? Helper.Halt(event) : false;
    };
    Grid.prototype.Draw = function (data, event) {
        var _this = this;
        this._sigma.emptyGraph();
        var alternatives = this._alternatives.peek();
        alternatives.forEach(function (a) {
            var coordinates = Helper.GetCoordinates(a.Index - 1, alternatives.length, 1.1);
            _this._sigma.addNode('N' + a.Index, { label: a.Index.toString(), x: (coordinates.X + 1.1) / 2.2, y: (coordinates.Y + 1.1) / 2.2, size: 1, color: '#222' });
        });
        alternatives.forEach(function (a) {
            $.grep(a.Variables.peek(), function (n) { return a.Index !== n; }).forEach(function (n) {
                _this._sigma.addEdge('E_' + a.Index + '->' + n, 'N' + a.Index, 'N' + n, { arrow: '' });
            });
        });
        this._sigma.resize();
        this._sigma.refresh();
        this._sigma.draw();
        return (event || '') ? Helper.Halt(event) : false;
    };
    Object.defineProperty(Grid.prototype, "AlternativesNumber", {
        get: function () {
            return this._alternativesNumber;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "Formula", {
        get: function () {
            return this._formula;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "VariablesNumber", {
        get: function () {
            return this._variablesNumber;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "Alternatives", {
        get: function () {
            return this._alternatives;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "Variables", {
        get: function () {
            return this._variables;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "Enabled", {
        get: function () {
            return this._enabled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "IsGraph", {
        get: function () {
            return this._isGraph;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "Visible", {
        get: function () {
            return this._visible;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "CalculatedVariablesNumber", {
        get: function () {
            return this._calculatedVariablesNumber;
        },
        enumerable: true,
        configurable: true
    });
    Grid.prototype._getBinary = function (value) {
        var result = [];
        var aux = 1, variable = 1;
        while (value > 0) {
            if (0 !== (aux & value)) {
                result.push(variable);
                value ^= aux;
            }
            variable++;
            aux = aux << 1;
        }
        var alternatives = this._alternatives.peek();
        var variablesNumber = this._calculatedVariablesNumber.peek();
        return new Base(result, variablesNumber === alternatives.length ? result.every(function (n) { return !Grid._hasSiblings($.grep(result, function (i) { return n !== i; }), alternatives[n - 1].Variables.peek()); }) : false);
    };
    Grid.prototype._getMinimalImplicants = function (alternatives) {
        return $.grep(Helper.Range(Math.pow(2, this._variablesNumber.peek()) - 1, 1), function (i) { return alternatives.every(function (j) { return (i & j) > 0; }); });
    };
    Grid._hasSiblings = function (s, siblings) {
        return s.some(function (i) { return -1 !== $.inArray(i, siblings); });
    };
    return Grid;
})();
var State = (function () {
    function State(a, v, s) {
        this.a = a;
        this.v = v;
        this.s = s;
    }
    State.prototype.Validate = function () {
        var _this = this;
        if (typeof this.a !== 'number' || typeof this.v !== 'number' || this.a < 1 || this.v < 1) {
            return false;
        }
        if (!(this.s instanceof Array && this.s.length <= this.a && this.s.every(function (v) { return Math.max.apply(Math, v) <= _this.v; }))) {
            return false;
        }
        return true;
    };
    State.prototype.Set = function (table) {
        this.s.forEach(function (value, td) {
            value.unique().forEach(function (tr) {
                var cell = table.find('tr:nth-child(' + tr + ')>td:eq(' + td + ')');
                cell.click();
            });
        });
        if (grid.IsGraph.peek()) {
            grid.Draw();
        }
        Array;
    };
    return State;
})();
var grid;
var state = new State();
// Query string
(function () {
    var queryString = document.URL.split('?');
    var parameter = queryString.length === 2 ? decodeURIComponent(queryString[1]) : undefined;
    var saved;
    if (typeof parameter !== 'undefined') {
        try {
            eval('saved=' + parameter);
            state = new State(saved.a, saved.v, saved.s);
        }
        catch (error) {
        }
    }
})();
// Activates knockout.js
ko.components.register('function-header', { template: '<span class="fnc">f<span class="sub">(G)</span>(v<span class="sup" data-bind="text: \'(\' + number + \')\'" />)=</span>' });
$(function () {
    grid = state.Validate() ? new Grid(state.v, state.a) : new Grid;
    ko.applyBindings(grid);
    if (state.Validate()) {
        grid.SetVariables();
        state.Set($('#placeholder>table>tbody'));
    }
    $(document.body).css('visibility', 'visible');
});
//# sourceMappingURL=base2.js.map