const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';


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
            this._fulfill();
        }

        const resolve = fulfill.bind(this, RESOLVED);
        const reject = fulfill.bind(this, REJECTED);

        executor(resolve, reject);
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
        /** TODO Implement */
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
    /** TODO Implement */
};

/**
 * Construct a Promise in the rejected state
 * @static
 * @param  {any} reason
 * @return {Promise}
 */
Promise.reject = function reject(reason) {
    /** TODO Implement */
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
    /** TODO Implement */
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
    /** TODO Implement */
};


export default Promise;
