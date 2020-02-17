/* *
 *
 *  (c) 2010-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import H from './Globals.js';

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        type OptionsStackingValue = ('normal'|'overlap'|'percent'|'stream'|'group');
        interface Axis {
            oldStacks?: Dictionary<Dictionary<StackItem>>;
            stacks: Dictionary<Dictionary<StackItem>>;
            stackTotalGroup?: SVGElement;
            usePercentage?: boolean;
            buildStacks(): void;
            cleanStacks(): void;
            renderStackTotals(): void;
            resetStacks(): void;
        }
        interface Chart {
            getStacks(): void;
        }
        interface Point {
            leftCliff?: number;
            rightCliff?: number;
        }
        interface Series {
            isRadialBar?: boolean;
            negStacks?: any; // @todo
            singleStacks?: any; // @todo
            stack?: OptionsStackingValue;
            stackedYData?: Array<number>;
            stackKey?: string;
            getStackIndicator(
                stackIndicator: (StackItemIndicatorObject|undefined),
                x: number,
                index: number,
                key?: string
            ): StackItemIndicatorObject;
            modifyStacks(): void;
            percentStacker(
                pointExtremes: Array<number>,
                stack: StackItem,
                i: number
            ): void;
            setGroupedPoints(): void;
            setStackedPoints(
                stackingParam?: string
            ): void;
        }
        interface StackItemIndicatorObject {
            index: number;
            key?: string;
            x: number;
        }
        interface StackItemObject {
            alignOptions: AlignObject;
            axis: Axis;
            cumulative?: number;
            crop?: boolean;
            isNegative: boolean;
            label: SVGElement;
            options: YAxisStackLabelsOptions;
            overflow?: OptionsOverflowValue;
            padding: number;
            rotation: number;
            total: number;
            x: number;
        }
        interface YAxisOptions {
            stackLabels?: YAxisStackLabelsOptions;
        }
        interface YAxisStackLabelsOptions {
            align?: AlignValue;
            allowOverlap?: boolean;
            crop?: boolean;
            enabled?: boolean;
            format?: string;
            formatter?: FormatterCallbackFunction<StackItemObject>;
            overflow?: DataLabelsOverflowValue;
            rotation?: number;
            style?: CSSObject;
            textAlign?: AlignValue;
            useHTML?: boolean;
            verticalAlign?: VerticalAlignValue;
            x?: number;
            y?: number;
        }
        class StackItem {
            public constructor(
                axis: Axis,
                options: YAxisStackLabelsOptions,
                isNegative: boolean,
                x: number,
                stackOption?: OptionsStackingValue
            );
            public alignOptions: AlignObject;
            public axis: Axis;
            public base?: string;
            public cumulative?: (null|number);
            public hasValidPoints: boolean;
            public isNegative: boolean;
            public label?: SVGElement;
            public leftCliff: number;
            public options: YAxisStackLabelsOptions;
            public points: Dictionary<Array<number>>;
            public rightCliff: number;
            public stack?: OptionsStackingValue;
            public textAlign: AlignValue;
            public total: (null|number);
            public touched?: number;
            public x: number;
            public destroy(): void;
            public getStackBox(
                chart: Chart,
                stackItem: StackItem,
                x: number,
                y: number,
                xWidth: number,
                h: number,
                axis: Axis
            ): BBoxObject;
            public render(group: SVGElement): void;
            public setOffset(
                xOffset: number,
                xWidth: number,
                boxBottom?: number,
                boxTop?: number,
                defaultX?: number
            ): void;
        }
    }
}

/**
 * Stack of data points
 *
 * @product highcharts
 *
 * @interface Highcharts.StackItemObject
 *//**
 * Alignment settings
 * @name Highcharts.StackItemObject#alignOptions
 * @type {Highcharts.AlignObject}
 *//**
 * Related axis
 * @name Highcharts.StackItemObject#axis
 * @type {Highcharts.Axis}
 *//**
 * Cumulative value of the stacked data points
 * @name Highcharts.StackItemObject#cumulative
 * @type {number}
 *//**
 * True if on the negative side
 * @name Highcharts.StackItemObject#isNegative
 * @type {boolean}
 *//**
 * Related SVG element
 * @name Highcharts.StackItemObject#label
 * @type {Highcharts.SVGElement}
 *//**
 * Related stack options
 * @name Highcharts.StackItemObject#options
 * @type {Highcharts.YAxisStackLabelsOptions}
 *//**
 * Total value of the stacked data points
 * @name Highcharts.StackItemObject#total
 * @type {number}
 *//**
 * Shared x value of the stack
 * @name Highcharts.StackItemObject#x
 * @type {number}
 */

import U from './Utilities.js';
const {
    correctFloat,
    defined,
    destroyObjectProperties,
    objectEach,
    pick
} = U;

import './Axis.js';
import './Chart.js';
import './Series.js';

var Axis = H.Axis,
    Chart = H.Chart,
    format = H.format,
    Series = H.Series;

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * The class for stacks. Each stack, on a specific X value and either negative
 * or positive, has its own stack item.
 *
 * @private
 * @class
 * @name Highcharts.StackItem
 * @param {Highcharts.Axis} axis
 * @param {Highcharts.YAxisStackLabelsOptions} options
 * @param {boolean} isNegative
 * @param {number} x
 * @param {Highcharts.OptionsStackingValue} [stackOption]
 */
H.StackItem = function (
    this: Highcharts.StackItem,
    axis: Highcharts.Axis,
    options: Highcharts.YAxisStackLabelsOptions,
    isNegative: boolean,
    x: number,
    stackOption?: Highcharts.OptionsStackingValue
): void {

    var inverted = axis.chart.inverted;

    this.axis = axis;

    // Tells if the stack is negative
    this.isNegative = isNegative;

    // Save the options to be able to style the label
    this.options = options = options || {};

    // Save the x value to be able to position the label later
    this.x = x;

    // Initialize total value
    this.total = null;

    // This will keep each points' extremes stored by series.index and point
    // index
    this.points = {};
    this.hasValidPoints = false;

    // Save the stack option on the series configuration object, and whether to
    // treat it as percent
    this.stack = stackOption;
    this.leftCliff = 0;
    this.rightCliff = 0;

    // The align options and text align varies on whether the stack is negative
    // and if the chart is inverted or not.
    // First test the user supplied value, then use the dynamic.
    this.alignOptions = {
        align: options.align ||
            (inverted ? (isNegative ? 'left' : 'right') : 'center'),
        verticalAlign: options.verticalAlign ||
            (inverted ? 'middle' : (isNegative ? 'bottom' : 'top')),
        y: options.y,
        x: options.x
    };

    this.textAlign = options.textAlign ||
        (inverted ? (isNegative ? 'right' : 'left') : 'center');
} as any;

H.StackItem.prototype = {

    /**
     * @private
     * @function Highcharts.StackItem#destroy
     * @return {void}
     */
    destroy: function (this: Highcharts.StackItem): void {
        destroyObjectProperties(this, this.axis);
    },

    /**
     * Renders the stack total label and adds it to the stack label group.
     *
     * @private
     * @function Highcharts.StackItem#render
     * @param {Highcharts.SVGElement} group
     * @return {void}
     */
    render: function (
        this: Highcharts.StackItem,
        group: Highcharts.SVGElement
    ): void {
        var chart = this.axis.chart,
            options = this.options,
            formatOption = options.format,
            attr = {},
            str = formatOption ? // format the text in the label
                format(formatOption, this, chart) :
                (options.formatter as any).call(this);

        // Change the text to reflect the new total and set visibility to hidden
        // in case the serie is hidden
        if (this.label) {
            this.label.attr({ text: str, visibility: 'hidden' });
        } else {
            // Create new label
            this.label = chart.renderer
                .label(
                    str,
                    null as any,
                    null as any,
                    (options as any).shape,
                    null as any,
                    null as any,
                    options.useHTML,
                    false,
                    'stack-labels'
                );

            attr = {
                text: str,
                align: this.textAlign,
                rotation: (options as any).rotation,
                padding: pick((options as any).padding, 0),
                visibility: 'hidden' // hidden until setOffset is called
            };
            this.label.attr(attr);
            if (!chart.styledMode) {
                this.label.css(options.style as any);
            }
            if (!this.label.added) {
                this.label.add(group); // add to the labels-group
            }
        }

        // Rank it higher than data labels (#8742)
        this.label.labelrank = chart.plotHeight;
    },

    /**
     * Sets the offset that the stack has from the x value and repositions the
     * label.
     *
     * @private
     * @function Highcarts.StackItem#setOffset
     * @param {number} xOffset
     * @param {number} xWidth
     * @param {number} [boxBottom]
     * @param {number} [boxTop]
     * @param {number} [defaultX]
     * @return {void}
     */
    setOffset: function (
        this: Highcharts.StackItem,
        xOffset: number,
        xWidth: number,
        boxBottom?: number,
        boxTop?: number,
        defaultX?: number
    ): void {
        var stackItem = this,
            axis = stackItem.axis,
            chart = axis.chart,
            // stack value translated mapped to chart coordinates
            y = axis.translate(
                axis.usePercentage ?
                    100 :
                    (boxTop ?
                        boxTop :
                        (stackItem.total as any)),
                0 as any,
                0 as any,
                0 as any,
                1 as any
            ),
            yZero = axis.translate(boxBottom ? boxBottom : 0), // stack origin
            // stack height:
            h = defined(y) && Math.abs((y as any) - (yZero as any)),
            // x position:
            x = pick(defaultX, (chart.xAxis[0].translate(stackItem.x) as any)) +
                xOffset,
            stackBox = defined(y) && stackItem.getStackBox(
                chart,
                stackItem,
                x,
                y as any,
                xWidth,
                h as any,
                axis
            ),
            label = stackItem.label,
            isNegative = stackItem.isNegative,
            isJustify = pick(stackItem.options.overflow,
                'justify') === 'justify',
            visible,
            alignAttr;

        if (label && stackBox) {
            var bBox = label.getBBox(),
                boxOffsetX = chart.inverted ?
                    (isNegative ? bBox.width : 0) : bBox.width / 2,
                boxOffsetY = chart.inverted ?
                    bBox.height / 2 : (isNegative ? -4 : bBox.height + 4);

            stackItem.alignOptions.x = pick(stackItem.options.x, 0);
            // Align the label to the box
            label.align(stackItem.alignOptions, null as any, stackBox);
            // Set visibility (#678)
            alignAttr = label.alignAttr;
            label.show();
            // Set label above/under stackBox
            alignAttr.y -= boxOffsetY;
            if (isJustify) {
                // Set label x position for justifyDataLabel function
                alignAttr.x -= boxOffsetX;
                Series.prototype.justifyDataLabel.call(this.axis,
                    label, stackItem.alignOptions, alignAttr, bBox, stackBox);
                alignAttr.x += boxOffsetX;
            }
            alignAttr.x = label.alignAttr.x;
            label.attr({
                x: alignAttr.x,
                y: alignAttr.y
            });

            if (pick(!isJustify && stackItem.options.crop, true)) {
                visible = chart.isInsidePlot(label.x +
                    (chart.inverted ? 0 : -bBox.width / 2), label.y) &&
                    chart.isInsidePlot(label.x + (chart.inverted ?
                        (isNegative ? -bBox.width : bBox.width) :
                        bBox.width / 2), label.y + bBox.height);
                if (!visible) {
                    label.hide();
                }
            }
        }
    },

    /**
     * @private
     * @function Highcharts.StackItem#getStackBox
     *
     * @param {Highcharts.Chart} chart
     *
     * @param {Highcharts.StackItem} stackItem
     *
     * @param {number} x
     *
     * @param {number} y
     *
     * @param {number} xWidth
     *
     * @param {number} h
     *
     * @param {Highcharts.Axis} axis
     *
     * @return {Highcharts.BBoxObject}
     */
    getStackBox: function (
        this: Highcharts.StackItem,
        chart: Highcharts.Chart,
        stackItem: Highcharts.StackItem,
        x: number,
        y: number,
        xWidth: number,
        h: number,
        axis: Highcharts.Axis
    ): Highcharts.BBoxObject {
        var reversed = stackItem.axis.reversed,
            inverted = chart.inverted,
            axisPos = axis.height + (axis.pos as any) -
                (inverted ? chart.plotLeft : chart.plotTop),
            neg = (stackItem.isNegative && !reversed) ||
                (!stackItem.isNegative && reversed); // #4056

        return { // this is the box for the complete stack
            x: inverted ? (neg ? y : y - h) : x,
            y: inverted ?
                axisPos - x - xWidth :
                (neg ?
                    (axisPos - y - h) :
                    axisPos - y
                ),
            width: inverted ? h : xWidth,
            height: inverted ? xWidth : h
        };
    }
} as any;

/**
 * Generate stacks for each series and calculate stacks total values
 *
 * @private
 * @function Highcharts.Chart#getStacks
 * @return {void}
 */
Chart.prototype.getStacks = function (this: Highcharts.Chart): void {
    var chart = this,
        inverted = chart.inverted;

    // reset stacks for each yAxis
    chart.yAxis.forEach(function (axis: Highcharts.Axis): void {
        if (axis.stacks && axis.hasVisibleSeries) {
            axis.oldStacks = axis.stacks;
        }
    });

    chart.series.forEach(function (series: Highcharts.Series): void {
        var xAxisOptions = series.xAxis && series.xAxis.options || {};

        if (
            series.options.stacking &&
            (
                series.visible === true ||
                (chart.options.chart as any).ignoreHiddenSeries === false
            )
        ) {
            series.stackKey = [
                series.type,
                pick(series.options.stack, ''),
                inverted ? xAxisOptions.top : xAxisOptions.left,
                inverted ? xAxisOptions.height : xAxisOptions.width
            ].join(',');
        }
    });
};


// Stacking methods defined on the Axis prototype

/**
 * Build the stacks from top down
 *
 * @private
 * @function Highcharts.Axis#buildStacks
 * @return {void}
 */
Axis.prototype.buildStacks = function (this: Highcharts.Axis): void {
    var axisSeries = this.series,
        reversedStacks = pick(this.options.reversedStacks, true),
        len = axisSeries.length,
        actualSeries,
        i;

    if (!this.isXAxis) {
        this.usePercentage = false;
        i = len;
        while (i--) {
            actualSeries = axisSeries[reversedStacks ? i : len - i - 1];
            actualSeries.setStackedPoints();
            actualSeries.setGroupedPoints();
        }

        // Loop up again to compute percent and stream stack
        for (i = 0; i < len; i++) {
            axisSeries[i].modifyStacks();
        }
        H.fireEvent(this, 'afterBuildStacks');
    }
};

/**
 * @private
 * @function Highcharts.Axis#renderStackTotals
 * @return {vopid}
 */
Axis.prototype.renderStackTotals = function (this: Highcharts.Axis): void {
    var axis = this,
        chart = axis.chart,
        renderer = chart.renderer,
        stacks = axis.stacks,
        stackTotalGroup = axis.stackTotalGroup as Highcharts.SVGElement;

    // Create a separate group for the stack total labels
    if (!stackTotalGroup) {
        axis.stackTotalGroup = stackTotalGroup =
            renderer
                .g('stack-labels')
                .attr({
                    visibility: 'visible',
                    zIndex: 6
                })
                .add();
    }

    // plotLeft/Top will change when y axis gets wider so we need to translate
    // the stackTotalGroup at every render call. See bug #506 and #516
    stackTotalGroup.translate(chart.plotLeft, chart.plotTop);

    // Render each stack total
    objectEach(stacks, function (
        type: Highcharts.Dictionary<Highcharts.StackItem>
    ): void {
        objectEach(type, function (stack: Highcharts.StackItem): void {
            stack.render(stackTotalGroup);
        });
    });
};

/**
 * Set all the stacks to initial states and destroy unused ones.
 *
 * @private
 * @function Highcharts.Axis#resetStacks
 * @return {void}
 */
Axis.prototype.resetStacks = function (this: Highcharts.Axis): void {
    var axis = this,
        stacks = axis.stacks;

    if (!axis.isXAxis) {
        objectEach(stacks, function (
            type: Highcharts.Dictionary<Highcharts.StackItem>
        ): void {
            objectEach(type, function (
                stack: Highcharts.StackItem,
                key: string
            ): void {
                // Clean up memory after point deletion (#1044, #4320)
                if ((stack.touched as any) < axis.stacksTouched) {
                    stack.destroy();
                    delete type[key];

                // Reset stacks
                } else {
                    stack.total = null;
                    stack.cumulative = null;
                    stack.hasValidPoints = false;
                }
            });
        });
    }
};

/**
 * @private
 * @function Highcharts.Axis#cleanStacks
 * @return {void}
 */
Axis.prototype.cleanStacks = function (this: Highcharts.Axis): void {
    var stacks;

    if (!this.isXAxis) {
        if (this.oldStacks) {
            stacks = this.stacks = this.oldStacks;
        }

        // reset stacks
        objectEach(stacks, function (
            type: Highcharts.Dictionary<Highcharts.StackItem>
        ): void {
            objectEach(type, function (stack: Highcharts.StackItem): void {
                stack.cumulative = stack.total;
            });
        });
    }
};


/**
 * Set grouped points in a stack-like object. When `centerInCategory` is true,
 * and `stacking` is not enabled, we need a pseudo (horizontal) stack in order
 * to handle grouping of points within the same category.
 *
 * @private
 * @function Highcharts.Series#setStackedPoints
 * @return {void}
 */
Series.prototype.setGroupedPoints = function (this: Highcharts.Series): void {
    if (
        this.options.centerInCategory &&
        this.type.match(/column|columnrange|bar/g) &&
        // With stacking enabled, we already have stacks that we can compute
        // from
        !this.options.stacking &&
        // With only one series, we don't need to consider centerInCategory
        this.chart.series.length > 1
    ) {
        Series.prototype.setStackedPoints.call(this, 'group');
    }
};

/**
 * Adds series' points value to corresponding stack
 *
 * @private
 * @function Highcharts.Series#setStackedPoints
 * @return {void}
 */
Series.prototype.setStackedPoints = function (
    this: Highcharts.Series,
    stackingParam?: string
): void {

    const stacking = stackingParam || this.options.stacking;

    if (!stacking ||
        (this.visible !== true &&
        (this.chart.options.chart as any).ignoreHiddenSeries !== false)
    ) {
        return;
    }

    var series = this,
        xData = series.processedXData,
        yData = series.processedYData,
        stackedYData = [],
        yDataLength = (yData as any).length,
        seriesOptions = series.options,
        threshold = seriesOptions.threshold,
        stackThreshold = pick(seriesOptions.startFromThreshold && threshold, 0),
        stackOption = seriesOptions.stack,
        stackKey = stackingParam ? `${series.type},${stacking}` : series.stackKey,
        negKey = '-' + stackKey,
        negStacks = series.negStacks && stacking !== 'group',
        yAxis = series.yAxis,
        stacks = yAxis.stacks,
        oldStacks = yAxis.oldStacks,
        stackIndicator: (Highcharts.StackItemIndicatorObject|undefined),
        isNegative,
        stack,
        other,
        key,
        pointKey,
        i,
        x,
        y;


    yAxis.stacksTouched += 1;

    // loop over the non-null y values and read them into a local array
    for (i = 0; i < yDataLength; i++) {
        x = (xData as any)[i];
        y = (yData as any)[i];
        stackIndicator = series.getStackIndicator(
            stackIndicator,
            x,
            series.index as any
        );
        pointKey = stackIndicator.key;
        // Read stacked values into a stack based on the x value,
        // the sign of y and the stack key. Stacking is also handled for null
        // values (#739)
        isNegative = negStacks && y < (stackThreshold ? 0 : (threshold as any));
        key = isNegative ? negKey : stackKey;

        // Create empty object for this stack if it doesn't exist yet
        if (!stacks[key as any]) {
            stacks[key as any] =
                {} as Highcharts.Dictionary<Highcharts.StackItem>;
        }

        // Initialize StackItem for this x
        if (!stacks[key as any][x]) {
            if ((oldStacks as any)[key as any] &&
                (oldStacks as any)[key as any][x]
            ) {
                stacks[key as any][x] = (oldStacks as any)[key as any][x];
                stacks[key as any][x].total = null;
            } else {
                stacks[key as any][x] = new H.StackItem(
                    yAxis,
                    (
                        yAxis.options as Highcharts.YAxisOptions
                    ).stackLabels as any,
                    isNegative,
                    x,
                    stackOption as any
                );
            }
        }

        // If the StackItem doesn't exist, create it first
        stack = stacks[key as any][x];
        if (y !== null) {
            stack.points[pointKey as any] = stack.points[series.index as any] =
                [pick(stack.cumulative, stackThreshold as any)];

            // Record the base of the stack
            if (!defined(stack.cumulative)) {
                stack.base = pointKey;
            }
            stack.touched = yAxis.stacksTouched;

            // In area charts, if there are multiple points on the same X value,
            // let the area fill the full span of those points
            if (stackIndicator.index > 0 && series.singleStacks === false) {
                stack.points[pointKey as any][0] =
                    stack.points[series.index + ',' + x + ',0'][0];
            }

        // When updating to null, reset the point stack (#7493)
        } else {
            stack.points[pointKey as any] = stack.points[series.index as any] =
                null as any;
        }

        // Add value to the stack total
        if (stacking === 'percent') {

            // Percent stacked column, totals are the same for the positive and
            // negative stacks
            other = isNegative ? stackKey : negKey;
            if (negStacks && stacks[other as any] && stacks[other as any][x]) {
                other = stacks[other as any][x];
                stack.total = other.total =
                    Math.max(other.total as any, stack.total as any) +
                    Math.abs(y) ||
                    0;

            // Percent stacked areas
            } else {
                stack.total =
                    correctFloat((stack.total as any) + (Math.abs(y) || 0));
            }

        } else if (stacking === 'group') {
            // In this stack, the total is the number of valid points
            if (y !== null) {
                stack.total = (stack.total || 0) + 1;
            }

        } else {
            stack.total = correctFloat(stack.total + (y || 0));
        }

        if (stacking === 'group') {
            // This point's index within the stack, pushed to stack.points[1]
            stack.cumulative = (stack.total || 1) - 1;
        } else {
            stack.cumulative =
                pick(stack.cumulative, stackThreshold as any) + (y || 0);
        }

        if (y !== null) {
            (stack.points[pointKey as any] as any).push(stack.cumulative);
            stackedYData[i] = stack.cumulative;
            stack.hasValidPoints = true;
        }
    }

    if (stacking === 'percent') {
        yAxis.usePercentage = true;
    }

    if (stacking !== 'group') {
        this.stackedYData = stackedYData as any; // To be used in getExtremes
    }

    // Reset old stacks
    yAxis.oldStacks = {};
};

/**
 * Iterate over all stacks and compute the absolute values to percent
 *
 * @private
 * @function Highcharts.Series#modifyStacks
 * @return {void}
 */
Series.prototype.modifyStacks = function (this: Highcharts.Series): void {
    var series = this,
        stackKey = series.stackKey,
        stacks = series.yAxis.stacks,
        processedXData = series.processedXData,
        stackIndicator: Highcharts.StackItemIndicatorObject,
        stacking = series.options.stacking;

    if ((series as any)[stacking + 'Stacker']) { // Modifier function exists
        [stackKey, '-' + stackKey].forEach(function (
            key: (string|undefined)
        ): void {
            var i = (processedXData as any).length,
                x,
                stack,
                pointExtremes;

            while (i--) {
                x = (processedXData as any)[i];
                stackIndicator = series.getStackIndicator(
                    stackIndicator,
                    x,
                    series.index as any,
                    key
                );
                stack = stacks[key as any] && stacks[key as any][x];
                pointExtremes =
                    stack && stack.points[stackIndicator.key as any];
                if (pointExtremes) {
                    (series as any)[stacking + 'Stacker'](
                        pointExtremes, stack, i
                    );
                }
            }
        });
    }
};

/**
 * Modifier function for percent stacks. Blows up the stack to 100%.
 *
 * @private
 * @function Highcharts.Series#percentStacker
 * @param {Array<number>} pointExtremes
 * @param {Highcharts.StackItem} stack
 * @param {number} i
 * @return {void}
 */
Series.prototype.percentStacker = function (
    this: Highcharts.Series,
    pointExtremes: Array<number>,
    stack: Highcharts.StackItem,
    i: number
): void {
    var totalFactor = stack.total ? 100 / stack.total : 0;

    // Y bottom value
    pointExtremes[0] = correctFloat(pointExtremes[0] * totalFactor);
    // Y value
    pointExtremes[1] = correctFloat(pointExtremes[1] * totalFactor);
    (this.stackedYData as any)[i] = pointExtremes[1];
};

/**
 * Get stack indicator, according to it's x-value, to determine points with the
 * same x-value
 *
 * @private
 * @function Highcharts.Series#getStackIndicator
 * @param {Highcharts.StackItemIndicatorObject|undefined} stackIndicator
 * @param {number} x
 * @param {number} index
 * @param {string} [key]
 * @return {Highcharts.StackItemIndicatorObject}
 */
Series.prototype.getStackIndicator = function (
    this: Highcharts.Series,
    stackIndicator: (Highcharts.StackItemIndicatorObject|undefined),
    x: number,
    index: number,
    key?: string
): Highcharts.StackItemIndicatorObject {
    // Update stack indicator, when:
    // first point in a stack || x changed || stack type (negative vs positive)
    // changed:
    if (!defined(stackIndicator) ||
        (stackIndicator as any).x !== x ||
        (key && (stackIndicator as any).key !== key)
    ) {
        stackIndicator = {
            x: x,
            index: 0,
            key: key
        };
    } else {
        (stackIndicator as any).index++;
    }

    (stackIndicator as any).key =
        [index, x, (stackIndicator as any).index].join(',');

    return stackIndicator as any;
};
