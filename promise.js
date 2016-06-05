/**
 * @class Custom Promise implementation.
 * @todo Make this pass tests in `tests/promise.spec.js`.
 */
class Promise {

    /**
     * Construct a Promise. The constructor is given an `executor` function,
     * which itself takes a `resolve` and a `reject` function as arguments.
     *
     * @example
     *   new Promise((resolve, reject) => {
     *     setTimeout(() => resolve('hello world!'), 1000);
     *   });
     *
     * @example
     *   new Promise((resolve, reject) => {
     *     setTimeout(() => reject('goodbye cruel world'), 1000);
     *   });
     *
     * @param {(resolve: (val: any) => void, reject: (reason: any) => void) => void} executor
     */
    constructor(executor) {

        /**
         * Current state of Promise: pending, rejected, resolved
         * @type {String}
         */
        this._state = 'pending';
        /**
         * Value of resolved promise
         * @type {any?}
         */
        this._value = undefined;
        /**
         * Reason for rejected promise
         * @type {any?}
         */
        this._reason = undefined;
        /**
         * Wrapper to handle rejection (@see Promise#then and Promise#catch)
         * @type {Function?}
         */
        this._onRejected = null;
        /**
         * Queue for resolve handlers (@see Promise#then)
         * @type {Array<Function>}
         */
        this._onResolved = [];

        // Executor's resolve
        const resolve = value => {
            if (this._state !== 'pending') {
                return;
            }
            this._value = value;
            this._state = 'resolved';
            this._fulfill();
        }

        // Executor's reject
        const reject = reason => {
            if (this._state !== 'pending') {
                return;
            }
            this._reason = reason;
            this._state = 'rejected';
            this._fulfill();
        }

        // Catch unhandled errors and implicitly reject
        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }


    /**
     * Convenience helper to invoke resolve or reject actions based on state
     * @private
     */
    _fulfill() {
        const state = this._state;
        if (state === 'resolved') {
            this._doResolve();
        } else if (state === 'rejected') {
            this._doReject();
        }
    }

    /**
     * Invoke and clear the resolved handler.
     * @private
     */
    _doResolve() {
        let queue = this._onResolved;
        let value = this._value;
        while (queue.length) {
            let cb = queue.shift();
            setTimeout(() => cb(value));
        }
    }

    /**
     * Invoke and clear the rejected handler
     * @private
     */
    _doReject() {
        let fn = this._onRejected;
        if (fn) {
            let reason = this._reason;
            this._onRejected = null;
            setTimeout(() => fn(reason));
        }
    }

    /**
     * Set the handler to invoke when a promise is resolved. That function is
     * a wrapper around the callback given in the #then method and the
     * executor resolve and reject callbacks from the Promise returned by
     * that method.
     *
     * If `onResolve` is falsy, the handler is unset.
     *
     * @private
     * @param {Function?} onResolve - callback provided to #then
     * @param {Function?} resolve - resolve callback from #then's Promise
     * @param {Function?} reject - reject callback from #then's Promise
     */
    _setResolvedHandler(onResolve, resolve, reject) {
        if (onResolve) {
            this._onResolved.push(value => Promise
                .resolve(onResolve(value))
                .then(resolve)
                .catch(reject)
            );
        }
    }

    /**
     * Set up a handler to invoke when a promise is rejected. That function is
     * a wrapper around the callback given in the #then or #catch methods and
     * the executor's resolve and reject callbacks from the Promises that those
     * methods return.
     *
     * If `onReject` is falsy, the handler is unset.
     *
     * @private
     * @param {Function?} onReject - callback provided to #then or #catch
     * @param {Function?} resolve - resolve callback from method's Promise
     * @param {Function?} reject - reject callback from method's Promise
     */
    _setRejectedHandler(onReject, resolve, reject) {
        this._onRejected = onReject ?
            reason => Promise
                .resolve(onReject(reason))
                .then(resolve)
                .catch(reject) :
            null;
    }

    /**
     * Register callbacks for when `resolve` or `reject` are called. Both
     * handlers are optional; if neither handler is passed, this is effectively
     * a clone operation.
     * @param  {(val: any) => any?} callback - optional resolve handler
     * @param  {(reason: any) => any?} errback - optional reject handler
     * @return {Promise}
     */
    then(onResolve, onReject) {
        if (!onResolve && !onReject) {
            throw new Error('Promise#then must have at least one handler');
        }

        // Return a promise that calls given handlers when it resolves/rejects
        return new Promise((resolve, reject) => {
            // Set up handlers on `this` (the host Promise).
            this._setResolvedHandler(onResolve, resolve, reject);
            this._setRejectedHandler(onReject, resolve, reject);

            // Optimistically try to fulfill this Promise, in case `this` is
            // already in `pending` state.
            setTimeout(() => this._fulfill(), 0);
        });
    }

    /**
     * Handle Promise rejection, or uncaught errors in promise execution
     * @param  {(reason: any) => any} callback
     * @return {Promise}
     */
    catch(onReject) {
        this._onRejected = null;
        return new Promise((resolve, reject) => {
            this._setRejectedHandler(onReject, resolve, reject)
            this._fulfill();
        });
    }

    /**
     * Execute a function regardless of whether the Promise resolved or
     * rejected, but do not handle errors or change promise value.
     *
     * Angular's $q implements this and it is sometimes useful. It is not in
     * the actual ES2015 spec.
     *
     * @name Promise#finally
     * @param {(val: any) => void} callback
     * @return {Promise}
     */

}

/**
 * Construct a Promise in the resolved state
 * @static
 * @param  {any} value
 * @return {Promise}
 */
Promise.resolve = function resolve(value) {
    if (value instanceof Promise) {
        return value;
    }
    return new Promise(resolve => {
        setTimeout(() => resolve(value), 0);
    });
};

/**
 * Construct a Promise in the rejected state
 * @static
 * @param  {any} reason
 * @return {Promise}
 */
Promise.reject = function reject(reason) {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(reason), 0);
    });
};

/**
 * Construct a Promise that resolves when all input values are resolved, or
 * rejects immediately if any reject. The Promise resolves with an array of
 * values corresponding in order to the iterable passed as input (not the order
 * in which they were resolved).
 *
 * If any input value is not a promise, it will be coerced to a Promise using
 * Promise.resolve.
 *
 * @static
 * @param  {Array<any>} iterable
 * @return {Promise} - resolves with array corresponding to input promises
 */
Promise.all = function all(iterable) {
    return new Promise((resolve, reject) => {
        let count = 0;
        let len = iterable.length;
        let vals = new Array(len);

        // Resolve a single promise. The final call will also resolve all.
        const resolveOne = (id, val) => {
            vals[id] = val;
            if (++count === len) {
                resolve();
            }
        }

        // Special case: empty array, resolve immediately.
        if (!len) {
            resolve();
            return;
        }

        iterable.forEach(p => Promise
            .resolve(p)
            .then(resolveOne)
            .catch(reject)
        );
    });
};

/**
 * Construct a Promise that resolves or rejects with the first of a set of
 * Promises, with the same value or reason.
 * @name Promise.race
 * @static
 * @param {Array<Promise>} iterable
 * @return {Promise}
 */
Promise.race = function race(iterable) {
    return new Promise((resolve, reject) => {
        // Special case: empty array.
        if (!len) {
            resolve();
            return;
        }

        // Ensure all promises and hook them into the resolve, reject handler.
        // It doesn't really make sense to pass non-promises here, since they
        // will always win the race, but whatever.
        iterable.forEach(p => Promise
            .resolve(p)
            .then(resolve)
            .catch(reject)
        );
    });
};


export default Promise;
