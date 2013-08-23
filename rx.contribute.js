/*
* RxJS Contribute
*
* * Licensed under the MIT (https://github.com/Reactive-Extensions/RxJS-Contrib/blob/master/license.txt) license.
*/

(function (global) {

    var root;
    if (typeof global.module !== 'undefined' && typeof global.module.exports !== 'undefined') {
        root = global.require('./rx-vsdoc.js');
    } else {
        root = global.Rx;
    }

    var Observable = root.Observable,
        observableProto = Observable.prototype,
        isFunction = function(fun) { return typeof(fun) === "function"; };

    /// <summary>
    /// Filters the observable sequence by the value of itself or a given property on it and lets only those pass where the value is true
    /// </summary>
    /// <param name="propertyName">[Optional] Name of the property to check for true.</param>
    /// <returns>An observable sequence that is filtered either by the value of itself or the value of the given property on itself.</returns>
    observableProto.whereTrue = function (propertyName) {
        return this.where(function (x) {
            return propertyName === undefined ? x === true : x[propertyName] === true;
        });
    };

    /// <summary>
    /// Filters the observable sequence by the value of itself or a given property on it and lets only those pass where the value is false
    /// </summary>
    /// <param name="propertyName">[Optional] Name of the property to check for false.</param>
    /// <returns>An observable sequence that is filtered either by the value of itself or the value of the given property on itself.</returns>
    observableProto.whereFalse = function (propertyName) {
        return this.where(function (x) {
            return propertyName === undefined ? x === false : x[propertyName] === false;
        });
    };

    /// <summary>
    /// projects the current value into a new object that carries the current value on a property with the given name
    /// </summary>
    /// <param name="propertyName">Name of the new property</param>
    /// <returns>An observable sequence with objects that that carry the current value on the specified property</returns>
    observableProto.wrapAs = function (propertyName) {
        return this.select(function (x) {
            var temp = {};
            temp[propertyName] = x;
            return temp;
        });
    };

    /// <summary>
    /// Appends a value or the resulting value of a given function to the current stream object under a given name
    /// </summary>
    /// <param name="propertyName">Name of the property to place the data on</param>
    /// <param name="data">Either the data itself or a function to lazily retrieve the data</param>
    /// <returns>An observable sequence with objects that carry some injected data on the specified property</returns>
    observableProto.appendAs = function (propertyName, data) {
        return this.select(function (x) {
            if (x !== null && typeof (x) == 'object') {
                x[propertyName] = isFunction(data) ? data() : data;
                return x;
            }
            else {
                var temp = {};
                temp[propertyName] = isFunction(data) ? data() : data;
                return temp;
            }
        });
    };

    /// <summary>
    /// Applies a function on a property of the current value and saves the return value as an property under the same or a new name
    /// </summary>
    /// <param name="propertyFrom">Name of the property to pick the data from</param>
    /// <param name="propertyTo">Name of the property to store the data on</param>
    /// <param name="transistorFunc">Function to be applied on the value of the property</param>
    /// <returns>An observable sequence with objects that carry an (possibly) new property with a value coming from a (possibly) different property</returns>
    observableProto.convertProperty = function (propertyFrom, propertyTo, transistorFunc) {
        return this.select(function (x) {
            if (x.hasOwnProperty(propertyFrom) && isFunction(transistorFunc)) {
                x[propertyTo] = transistorFunc(x[propertyFrom]);
            }

            return x;
        });
    };

    /// <summary>
    /// Projects the value of a property on the current object into the new output of the stream
    /// </summary>
    /// <param name="propertyName">Name of the property to pick the data from</param>
    /// <returns>An observable sequence with objects that where previously found on an objects property</returns>
    observableProto.selectProperty = function (propertyName) {
        return this.select(function (x) {
            if (x.hasOwnProperty(propertyName)) {
                return x[propertyName];
            }

            return x;
        });
    };

    /// <summary>
    /// Drops the current value and returns the value of the given parameter instead
    /// </summary>
    /// <param name="as">value for the projection</param>
    /// <returns>An observable sequence that carries the given value</returns>
    observableProto.selectAs = function (as) {
        return this.select(function (_) {
            return as;
        });
    };

    /// <summary>
    /// Takes an array of observable sequences and produces a value with the results of all given sequences as a single result
    /// </summary>
    /// <param name="sources">Either an array of observable sequences or multiple observable sequences as multiple parameters</param>
    /// <returns>An observable sequence that carries an array wich the results of all observable sequences</returns>
    Observable.forkJoin = function (sources) {

        var tempSources = arguments.length > 1 ? arguments : sources;

        return Rx.Observable
                 .fromArray(tempSources)
                 .selectMany(function (o, i) {
                     return o.takeLast(1).select(function (value) { return { i: i, value: value }; });
                 })

                 .aggregate({ array: [], count: 0 }, function (results, result) {
                     results.array[result.i] = result.value;
                     return {
                         array: results.array,
                         count: results.count + 1
                     };
                 })
                 .where(function (results) { return results.count === tempSources.length; })
                 .select(function (results) { return results.array; });
    };

    /// <summary>
    /// Combines two observable sequences. Notifies whenever the left sequence produces a value and applies a function that combines the values of the left sequence with the last value of the right sequence
    /// </summary>
    /// <param name="rightSource">Other observable sequence to combine with</param>
    /// <param name="selector">Function to be applied on both values that produces the output for the new observable sequence</param>
    /// <returns>An observable sequence that carries the result of the selector function of both combined streams</returns>
    observableProto.combineLatestOnLeft = function (rightSource, selector) {

        return this.timestamp()
                   .combineLatest(rightSource.timestamp(), function (l, r) {
                       return {
                           Left: l,
                           Right: r
                       };
                   })
                    .where(function (x) {
                        return x.Left.timestamp >= x.Right.timestamp;
                    })
                    .select(function (x) {
                        return selector(x.Left.value, x.Right.value);
                    });

    };

})(this);
