///<reference path="Scripts/typings/jquery/jquery.d.ts" />
///<reference path="Scripts/typings/knockout/knockout.d.ts" />
///<reference path="Helper.ts" />

declare module SigmaJs {
    interface SigmaPublic {
        emptyGraph(): SigmaPublic;
        refresh(): SigmaPublic;
        resize(): SigmaPublic;
        draw(): SigmaPublic;
        goTo(x: number, y: number, ratio: number): SigmaPublic;
        addNode(id: string, params: any): SigmaPublic;
        addEdge(id: string, source: string, target: string, params: any): SigmaPublic;
        _core: any;
    }

    interface SigmaFactory {
        init(element: HTMLElement): SigmaPublic;
    }
}

interface Array<T> {
    unique(): T[];
}

declare var sigma: SigmaJs.SigmaFactory

class Alternative {
    private _variables: KnockoutObservableArray<number> = ko.observableArray<number>();
    private _isEmpty: KnockoutComputed<boolean> = ko.pureComputed<boolean>(() => 0 === this._variables().length);

    constructor(private _index: number) {
    }

    get Index(): number {
        return this._index;
    }

    get IsEmpty(): KnockoutObservable<boolean> {
        return this._isEmpty;
    }

    get Variables(): KnockoutObservableArray<number> {
        return this._variables;
    }

    SwitchVariable(event: Event, variable: number, data?: Grid): boolean {
        if (-1 === $.inArray(variable, this._variables.peek())) {
            var variables: number[] = this._variables.peek();
            var i: number;
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
    }

    GetAlternative(): number {
        return this._variables.peek().reduce(this._reduce, 0);
    }

    private _reduce: (previousValue: number, currentValue: number, currentIndex: number, array: number[]) => number = function (p, c) { return p + (1 << c -1); };
}

class Base {
    constructor(private _variables: number[], private _isCore: boolean) {
    }

    get Variables(): number[] {
        return this._variables;
    }

    get IsCore(): boolean{
        return this._isCore;
    }
}

class Grid {
    private _sigma: SigmaJs.SigmaPublic;

    private _alternatives: KnockoutObservable<Alternative[]> = ko.observable<Alternative[]>([]);
    private _variables: KnockoutObservable<number[]> = ko.observable<number[]>([]);

    private _variablesNumber: KnockoutObservable<number>;
    private _calculatedVariablesNumber: KnockoutObservable<number>;
    private _alternativesNumber: KnockoutObservable<number>;
    private _formula: KnockoutObservable<Base[]> = ko.observable([]);
    private _visible: KnockoutComputed<boolean> = ko.pureComputed(() => this._alternatives().some(a => !a.IsEmpty()));
    private _enabled: KnockoutComputed<boolean>;
    private _isGraph: KnockoutComputed<boolean>;

    constructor(variablesNumber: number = 0, alternativesNumber: number = 0) {
        this._variablesNumber = ko.observable<number>(variablesNumber);
        this._calculatedVariablesNumber = ko.observable<number>(variablesNumber);
        this._alternativesNumber = ko.observable<number>(alternativesNumber);
        this._enabled = ko.pureComputed<boolean>(() => this._alternatives().length > 0);
        this._isGraph = ko.pureComputed(() => this._calculatedVariablesNumber() > 0 && this._calculatedVariablesNumber() === this._alternatives().length && this._alternatives().every(a => -1 !== a.Variables().indexOf(a.Index)));
        this._setSigmaUp();
    }

    public SetVariables(): void {
        this._sigma.emptyGraph();
        this._sigma.resize();
        this._sigma.refresh();
        this._sigma.draw();
        this._variables(Helper.Range(this._variablesNumber(), 1));
        this._calculatedVariablesNumber(this._variables.peek().length);
        this._alternatives.valueWillMutate();

        var alternatives = this._alternatives();
        alternatives.length = 0;
        Helper.Range(this._alternativesNumber(), 1).forEach(n => { alternatives.push(new Alternative(n)); });

        this._alternatives.valueHasMutated();
    }

    public Calculate(data?: Grid, event?: Event): boolean {
        var alternatives: number[] = $.grep(this._alternatives.peek().map(value => value.GetAlternative()), i => i > 0);
        if (alternatives.length > 0) {
            var miniterms: number[] = this._getMinimalImplicants.call(this, alternatives);
            var minimalImplicants: number[] = [];
            miniterms.forEach(i => {
                if (minimalImplicants.every(j => (j & i) !== j)) {
                    minimalImplicants.push(i);
                }
            });

            this._formula(minimalImplicants.map(n => this._getBinary(n)));
        }

        return (event || '') ? Helper.Halt(event) : false;
    }

    public Draw(data?: Grid, event?: Event): boolean {
        this._sigma.emptyGraph();
        var alternatives: Alternative[] = this._alternatives.peek();

        alternatives.forEach(a => {
            var coordinates: ICoordinates = Helper.GetCoordinates(a.Index - 1, alternatives.length, 1.1);
            this._sigma.addNode('N' + a.Index, { label: a.Index.toString(), x: (coordinates.X + 1.1) / 2.2, y: (coordinates.Y + 1.1) / 2.2, size: 1, color: '#222' });
        });

        alternatives.forEach(a => {
            $.grep(a.Variables.peek(), n => a.Index !== n).forEach(n => {
                this._sigma.addEdge('E_' + a.Index + '->' + n, 'N' + a.Index, 'N' + n, { arrow: '' });
            });
        });
        this._sigma.resize();
        this._sigma.refresh();
        this._sigma.draw();
        return (event || '') ? Helper.Halt(event) : false;
    }


    get AlternativesNumber(): KnockoutObservable<number> {
        return this._alternativesNumber;
    }

    get Formula(): KnockoutObservable<Base[]> {
        return this._formula;
    }

    get VariablesNumber(): KnockoutObservable<number> {
        return this._variablesNumber;
    }

    get Alternatives(): KnockoutObservable<Alternative[]> {
        return this._alternatives;
    }

    get Variables(): KnockoutObservable<number[]> {
        return this._variables;
    }

    get Enabled(): KnockoutComputed<boolean> {
        return this._enabled;
    }

    get IsGraph(): KnockoutObservable<boolean> {
        return this._isGraph;
    }

    get Visible(): KnockoutObservable<boolean> {
        return this._visible;
    }

    get CalculatedVariablesNumber(): KnockoutObservable<number> {
        return this._calculatedVariablesNumber;
    }

    private _getBinary(value: number): Base{
        var result: number[] = [];
        var aux: number = 1, variable: number = 1;
        while (value > 0) {
            if (0 !== (aux & value)) {
                result.push(variable);
                value ^= aux;
            }
            variable++;
            aux = aux << 1;
        }
        var alternatives: Alternative[] = this._alternatives.peek();
        var variablesNumber: number = this._calculatedVariablesNumber.peek();
        return new Base(result, variablesNumber === alternatives.length ? result.every(n => !Grid._hasSiblings($.grep(result, i => n !== i), alternatives[n-1].Variables.peek())) : false);
    }

    private _getMinimalImplicants(alternatives: number[]): number[]{
        return $.grep(Helper.Range(Math.pow(2, this._variablesNumber.peek()) - 1, 1), i => alternatives.every(j => (i & j) > 0));
    }

    private static _hasSiblings(s: number[], siblings: number[]): boolean {
        return s.some(i => -1 !== $.inArray(i, siblings));
    }

    private _setSigmaUp: () => void = function() {
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
}

class State {
    constructor(public a?: number, public v?: number, public s?: number[][]) {
    }

    public Validate(): boolean {
        if (typeof this.a !== 'number' || typeof this.v !== 'number' || this.a < 1 || this.v < 1) {
            return false;
        }
        if (!(this.s instanceof Array && this.s.length <= this.a && this.s.every(v => Math.max.apply(Math, v) <= this.v))) {
            return false;
        }

        return true;
    }

    public Set(table: JQuery): void {
        this.s.forEach((value: number[], td: number) => {
            value.unique().forEach(tr => {
                var cell: JQuery = table.find('tr:nth-child(' + tr + ')>td:eq(' + td + ')');
                cell.click();
            });
        });
        if (grid.IsGraph.peek()) {
            grid.Draw();
        }

        Array
    }
}

var grid: Grid;
var state: State = new State();

// Query string
(function () {
    var queryString: string[] = document.URL.split('?');
    var parameter: string = queryString.length === 2 ? decodeURIComponent(queryString[1]) : undefined;
    var saved: any;
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
ko.components.register('function-header', { template: '<span class="fnc">f<span class="sub">(G)</span>(v<span class="sup" data-bind="text: \'(\' + number + \')\'" />)=</span>'});
$(() => { grid = state.Validate() ? new Grid(state.v, state.a) : new Grid; ko.applyBindings(grid); if (state.Validate()) { grid.SetVariables(); state.Set($('#placeholder>table>tbody')); } $(document.body).css('visibility', 'visible')});