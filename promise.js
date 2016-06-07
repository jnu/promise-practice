const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

const noop = () => {};
const identity = v => v;
const thrower = e => { throw e; };

function makePromiseInState(state, v) {
    let p = new Promise(noop);
    p._result = v;
    p._state = state;
    return p;
}

function isPromise(p) {
    return p instanceof Promise;
}

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
        this._result = null;
        this._queue = [];
        this._state = PENDING;

        const fulfill = (state, result) => {
            if (this._state !== PENDING) {
                return;
            }

            this._state = state;
            this._result = result;
            this._publishResult();
        }

        const resolve = v => fulfill(RESOLVED, v);
        const reject = r => fulfill(REJECTED, r);

        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }

    _publishResult() {
        setTimeout(() => this._invokeReactions(this._state), 0);
    }

    _invokeReactions(type) {
        const queue = this._queue;
        const result = this._result;
        while (queue.length) {
            let reactionRecord = queue.shift();
            reactionRecord[type](result);
        }
    }

    _addReactionRecord(resolvePredicate, rejectPredicate, thenResolve, thenReject) {
        this._queue.push({
            [RESOLVED]: this._createReaction(resolvePredicate, thenResolve, thenReject),
            [REJECTED]: this._createReaction(rejectPredicate, thenResolve, thenReject)
        });
    }

    _createReaction(predicate, onResolve, onReject) {
        return result => {
            try {
                const value = predicate(result);
                if (isPromise(value)) {
                    value.then(onResolve, onReject);
                } else {
                    onResolve(value);
                }
            } catch (e) {
                onReject(e);
            }
        };
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
        onResolve = onResolve || identity;
        onReject = onReject || thrower;

        return new Promise((resolve, reject) => {
            this._addReactionRecord(onResolve, onReject, resolve, reject);
            // Invoke immediately if the Promise is already fulfilled.
            // Could optimize by circumventing the queue in this case.
            if (this._state !== PENDING) {
                this._publishResult();
            }
        });
    }

    /**
     * Handle Promise rejection, or uncaught errors in promise execution
     * @param  {(reason: any) => any} callback
     * @return {Promise}
     */
    catch(onReject) {
        return this.then(undefined, onReject);
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
    return isPromise(value) ? value : makePromiseInState(RESOLVED, value);
};

/**
 * Construct a Promise in the rejected state
 * @static
 * @param  {any} reason
 * @return {Promise}
 */
Promise.reject = function reject(reason) {
    return makePromiseInState(REJECTED, reason);
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
        const len = iterable.length;
        const results = new Array(len);
        let count = 0;

        // Special case: no inputs
        if (!len) {
            return resolve(results);
        }

        const resolveOne = () => {
            if (++count === len) {
                resolve(results);
            }
        }

        // NB: in a real library you'd want to implement this with Promise
        // internals, *outside of* the executor, since the JIT deoptimizes
        // code inside try-catch blocks.
        iterable.forEach((input, i) => {
            Promise.resolve(input)
                .then(val => {
                    results[i] = val;
                    resolveOne();
                }, reason => {
                    reject(reason);
                });
        });
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
        const len = iterable.length;
        if (!len) {
            resolve();
        }
        iterable.forEach(input => {
            Promise.resolve(input).then(resolve, reject);
        });
    });
};


export default Promise;
