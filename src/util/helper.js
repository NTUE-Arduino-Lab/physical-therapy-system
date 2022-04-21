import _ from 'underscore';
import React from 'react';

class Helper {
    defaults(object, defaults) {
        return _.defaults({ ...object }, defaults);
    }
    each(list, iteratee, context) {
        if (list instanceof Set) {
            let array = Array.from(list);
            array.forEach((value, index, array) =>
                iteratee.call(context, value, index, array),
            );
        } else {
            _.each(list, iteratee, context);
        }
    }

    map(list, iteratee, context) {
        return _.map(list, iteratee, context);
    }

    mapObject(obj, iteratee, context) {
        return _.mapObject(obj, iteratee, context);
    }

    reduce(list, iteratee, memo, context) {
        return _.reduce(list, iteratee, memo, context);
    }

    every(list, iteratee, context) {
        return _.every(list, iteratee, context);
    }

    some(list, iteratee, context) {
        return _.some(list, iteratee, context);
    }

    find(list, predicate, context) {
        let result = null;
        if (list instanceof Map) {
            for (const entry of list.entries()) {
                let value = entry[1];
                let key = entry[0];
                let test = predicate.call(context, value, key, list);
                if (test) {
                    result = value;
                    break;
                }
            }
        } else {
            result = _.find(list, predicate, context);
        }
        return result;
    }

    findIndex(list, predicate, context) {
        return _.findIndex(list, predicate, context);
    }

    filter(list, predicate, context) {
        return _.filter(list, predicate, context);
    }

    count(list, predicate, context) {
        return this.filter(list, predicate, context).length;
    }

    max(list, iteratee, context) {
        return _.max(list, iteratee, context);
    }

    min(list, iteratee, context) {
        return _.min(list, iteratee, context);
    }

    toArray(any) {
        if (this.isValid(any)) {
            return _.isArray(any) ? any : [any];
        } else {
            return any;
        }
    }
    first(array, n) {
        return _.isEmpty(array) ? null : _.first(array, n);
    }

    last(array, n) {
        return _.isEmpty(array) ? null : _.last(array, n);
    }

    has(object, key) {
        return _.has(object, key);
    }

    values(object) {
        return _.values(object);
    }

    isEqual(a, b) {
        let test = true;
        if (a instanceof File && b instanceof File) {
            test = a.size === b.size;
        } else if (this.isArray(a) && this.isArray(b)) {
            for (let i = 0; i < Math.max(a.length, b.length); i++) {
                if (a[i] !== b[i]) {
                    test = false;
                    break;
                }
            }
        } else {
            test = JSON.stringify(a) === JSON.stringify(b);
        }
        return test;
    }
    isEmpty(value) {
        let test = false;
        if (this.isNullOrUndefined(value)) {
            test = true;
        } else if (_.isString(value) || _.isArray(value)) {
            test = value.length === 0;
        } else if (!this.isPrimitive(value)) {
            test = Object.entries(value).length === 0;
        }
        return test;
    }
    isNotEmpty(object) {
        return !this.isEmpty(object);
    }
    isBoolean(object) {
        return _.isBoolean(object);
    }
    isFalse(value) {
        return value === false;
    }
    isTrue(value) {
        return value === true;
    }
    isString(object) {
        return _.isString(object);
    }
    isNumber(object) {
        return _.isNumber(object);
    }
    isFunction(object) {
        return _.isFunction(object);
    }
    isDate(object) {
        return _.isDate(object);
    }
    isNull(...values) {
        return values.every((value) => _.isNull(value));
    }
    isNotNull(...values) {
        return values.every((value) => !_.isNull(value));
    }
    isUndefined(...values) {
        return values.every((value) => _.isUndefined(value));
    }
    isNotUndefined(...values) {
        return values.every((value) => !_.isUndefined(value));
    }
    isNullOrUndefined(...values) {
        return values.every(
            (value) => this.isNull(value) || this.isUndefined(value),
        );
    }
    isNotNullOrUndefined(...values) {
        return values.every((value) => !this.isNullOrUndefined(value));
    }
    isExisted(object) {
        return !(object === null || object === undefined);
    }
    isNotExisted(object) {
        return object === null || object === undefined;
    }
    isValid(object) {
        return this.isExisted(object);
    }
    isNotValid(object) {
        return this.isNotExisted(object);
    }
    isArray(object) {
        return Array.isArray(object);
    }
    isObject(object) {
        return _.isObject(object);
    }
    isInteger(object) {
        return Number.isInteger(object);
    }
    isFinite(value) {
        return Number.isFinite(value);
    }
    isFile(object) {
        return object instanceof File;
    }
    isNaN(object) {
        return _.isNaN(object);
    }
    isPrimitive(value) {
        return (
            this.isNumber(value) ||
            this.isString(value) ||
            this.isDate(value) ||
            this.isBoolean(value) ||
            this.isFile(value)
        );
    }
    isJson(json) {
        if (!_.isString(json)) return false;

        try {
            JSON.parse(json);
        } catch (e) {
            return false;
        }
        return true;
    }
    isPojo(object) {
        if (object == null || typeof object !== 'object') {
            return false;
        }
        const proto = Object.getPrototypeOf(object);
        if (proto == null) {
            return true; // `Object.create(null)`
        }
        return proto === Object.prototype;
    }
    isElement(object) {
        return React.isValidElement(object);
    }
}

let helper = new Helper();

export default helper;
