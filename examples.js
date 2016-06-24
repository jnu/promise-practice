/**
 * Why use Promises?
 *
 * Note: Copy + paste into Chrome console to test out snippets.
 */

////////////////////////////////////////////////////////////////////////////////
// Basic async: callbacks

function getAsyncVal(callback) {
    setTimeout(() => callback('foo'), 200);
}

// Normal usage with callback:
getAsyncVal(val => {
    console.log(val)
});

////////////////////////////////////////////////////////////////////////////////
// Basic async: promises

function getAsyncValPromise() {
    return new Promise(resolve => {
        setTimeout(() => resolve('foo'), 200);
    });
}

getAsyncValPromise()
    .then(val => {
        console.log(val)
    });

// Promise encapsulates the 'asyncness'
// But so far this isn't truly better than callbacks.
////////////////////////////////////////////////////////////////////////////////













////////////////////////////////////////////////////////////////////////////////
// More complicated async #1: chaining
// With Callbacks:

function getAsyncVal(callback) {
    setTimeout(() => callback('foo'), 200);
}

function processAsyncVal(val, callback) {
    setTimeout(() => {
        callback(val.toUpperCase());
    }, 200);
}

getAsyncVal(val => {
    console.log('value:', val);

    processAsyncVal(val, newVal => {
        console.log('processed:', newVal);
    });
});

// This is Callback Hell! Imagine adding a third, and a fourth, etc...

////////////////////////////////////////////////////////////////////////////////
// More complicated async #1: chaining
// With Promises:

function getAsyncValPromise() {
    return new Promise(resolve => {
        setTimeout(() => resolve('foo'), 200);
    });
}

function processAsyncValPromise(val) {
    return new Promise(resolve => {
        setTimeout(() => resolve(val.toUpperCase()), 200);
    });
}

getAsyncValPromise()
    .then(val => {
        console.log('value:', val);
        return val;
    })
    .then(processAsyncValPromise)
    .then(val => {
        console.log('processed:', val);
        return val;
    });

// Oh hey, all your JS suddenly fits in 80chars!
// Takeaway: promises are chainable. The `#then` predicate can return a Promise
// value. If it returns a non-promise, the value is wrapped as one.
////////////////////////////////////////////////////////////////////////////////























////////////////////////////////////////////////////////////////////////////////
// More complicated async #2: multiple async and races
// With Callbacks:

function getAsync1(callback) {
    setTimeout(() => callback('foo'), 300);
}

function getAsync2(callback) {
    setTimeout(() => callback('bar'), 200);
}


var count = 0;
var vals = [];
function done() {
    if (++count < 2) {
        return;
    }
    console.log('done! values:', vals);
}

function storeValue(idx, val) {
    vals[idx] = val;
    done();
}

getAsync1(val => storeValue(0, val));
getAsync2(val => storeValue(1, val));

// Messy use of scope, have to hard-code how many calls before `done`

////////////////////////////////////////////////////////////////////////////////
// More complicated async #2: multiple async and races
// With Promises:

function getAsync1() {
    return new Promise(resolve => {
        setTimeout(() => resolve('foo'), 300);
    });
}

function getAsync2() {
    return new Promise(resolve => {
        setTimeout(() => resolve('bar'), 200);
    });
}

Promise.all([
        getAsync1(),
        getAsync2()
    ])
    .then(vals => {
        console.log('done! values', vals);
    });
////////////////////////////////////////////////////////////////////////////////
























////////////////////////////////////////////////////////////////////////////////
// Real world async: Idempotency
// With callbacks

function getJSON(url, callback) {
    console.log('fetching remote json');
    setTimeout(() => callback(null, { url: 'something interesting' }), 50);
}

class Foo {

    constructor() {
        this._callbackQueue = [];
        this._loading = false;
        this._loaded = false;
        this._val = undefined;
    }

    loadBar(callback) {
        this._callbackQueue.push(callback);
        if (this._loaded) {
            setTimeout(() => this._executeCallbacks(), 0);
        } else if (!this._loading) {
            this._loading = true;
            getJSON('/bar', (err, val) => {
                this._loading = false;
                if (!err) {
                    this._loaded = true;
                    // TODO handle errors???
                }
                this._val = val;
                this._executeCallbacks();
            });
        }
    }

    _executeCallbacks() {
        const queue = this._callbackQueue;
        const val = this._val;
        let cb;
        while (cb = queue.shift()) {
            cb(val);
        }
    }

}

let foo = new Foo();
foo.loadBar(bar => console.log(bar));
foo.loadBar(bar => console.log(bar));

// Lot of boilerplate, bug-prone

////////////////////////////////////////////////////////////////////////////////
// Real world async: Idempotency
// With Promises

function getJSON(url) {
    console.log('fetching remote json');
    return Promise.resolve({ url: 'something interesting' });
}

class Foo {
    loadBar() {
        this._barPromise = this._barPromise || getJSON('/bar');
        return this._barPromise;
    }
}

let foo = new Foo();
foo.loadBar().then(bar => console.log(bar));
foo.loadBar().then(bar => console.log(bar));

// Oh hey, that whole Callback implementation above is exactly a Promise
// (Or at least half of one, with no way of handling errors!)























////////////////////////////////////////////////////////////////////////////////
/// Real world: Error handling
/// With Callbacks

function probabug() {
    if (Math.random() >= 0.5) {
        throw new Error('uh oh');
    }
}

function flakySystem() {
    return Math.random() >= 0.5;
}

function getAsyncVal(callback) {
    probabug();
    setTimeout(() => {
        let err = flakySystem() && new Error('network error');
        callback(err, 'foo');
    }, 200);
}

function processAsyncVal(val, callback) {
    probabug();
    setTimeout(() => {
        let err = flakySystem() && new Error('processing error');
        callback(err, val.toUpperCase());
    }, 200);
}



try {
    getAsyncVal((err, val) => {
        if (err) {
            console.error('Request error:', err);
            val = 'recovery value';
        }
        console.log('value:', val);

        try {
            processAsyncVal(val, (err2, newVal) => {
                if (err2) {
                    console.error('Processing error:', err2);
                    newVal = 'another recovery value';
                }
                console.log('processed:', newVal);
            });
        } catch (err2) {
            console.error('Processing execution error', err2);
        }
    });
} catch (err) {
    console.error('Request execution error:', err);
}

// Yikes.
// Note: can't recover from try...catch errors without even more code.

////////////////////////////////////////////////////////////////////////////////
// Real World: Error Handling
// With Promises

function probabug() {
    if (Math.random() >= 0.5) {
        throw new Error('uh oh');
    }
}

function flakySystem() {
    return Math.random() >= 0.5;
}

function getAsyncValPromise() {
    return new Promise((resolve, reject) => {
        probabug();
        setTimeout(() => {
            if (flakySystem()) {
                reject(new Error('network error'));
            } else {
                resolve('foo');
            }
        }, 200);
    });
}

function processAsyncValPromise(val) {
    return new Promise((resolve, reject) => {
        probabug();
        setTimeout(() => {
            if (flakySystem()) {
                reject(new Error('processing error'));
            } else {
                resolve(val.toUpperCase());
            }
        }, 200);
    });
}

getAsyncValPromise()
    .then(val => {
        console.log('value:', val);
        return val;
    })
    .catch(err => {
        console.error('Error getting value:', err);
        return 'recovery value';
    })
    .then(processAsyncValPromise)
    .catch(err => {
        console.error('Error processing value:', err);
        return 'another splendid recovery'
    })
    .then(val => {
        console.log('processed:', val);
        return val;
    })
    .catch(err => {
        console.error('Another Error occurred:', err);
        // Could rethrow, or provide another recovery value.
    });












////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Promising future: async functions in ES7!

function getJSON(url) {
    return Promise.resolve({ /* json from server */ });
}

async function loadPage() {
    try {
        mainContent = await getJSON('/main/content/api');
        displayContent(mainContent);
    } catch (e) {
        showError('Arrgh nothing ever works');
        logError(e);
    }
}
