/**
 * Why use Promises?
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
// More complicated async #1: chaining
// With Callbacks:

function getAsyncValPromise() {
    return new Promise(resolve => {
        setTimeout(() => resolve('foo'), 200);
    });
}

function processAsyncVal(val, callback) {
    setTimeout(() => {
        callback(val.toUpperCase());
    }, 2);
}

getAsyncVal(val => {
    console.log('value:', val);

    processAsyncVal(val, newVal => {
        console.log('processed:', newVal);
    });
});

// Now entering Callback Hell! Imagine adding a third, and a fourth, etc...
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
// Real world async: Idempotency
// With callbacks

function getJSON(url, callback) {
    setTimeout(() => callback({ url: 'something interesting' }), 50);
}

class Foo {

    loadBar(callback) {
        if (this._bar) {
            setTimeout(() => callback(this._bar), 0);
        } else {
            getJSON('/bar', val => {
                this._bar = val;
                callback(this._bar);
            });
        }
    }

}

let foo = new Foo();
foo.loadBar(bar => console.log(bar));
foo.loadBar(bar => console.log(bar));

// Lot of boilerplate, bug-prone (note the setTimeout in the cached path)
////////////////////////////////////////////////////////////////////////////////
// Real world async: Idempotency
// With Promises

function getJSON(url) {
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

// The *whole promise* is cached and reused! It can be re-thened!

////////////////////////////////////////////////////////////////////////////////
/// Real world async: Error handling







////////////////////////////////////////////////////////////////////////////////
// Promising future: async functions in ES7!

function getJSON(url) {
    return Promise.resolve({ /* json from server */});
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
