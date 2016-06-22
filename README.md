Promise practice
===

# Background

Promises are an ES2015 standard, and are available natively in most modern
browsers. Sadly, but as is typical in JavaScript world, there are several
competing projects that implemented Promises based on various drafts of the
Promise spec, and well before Promises were available natively. The enthusiastic
developers of these projects also added their own features (like Deferreds,
progress, state information, &c.) This adds a lot of noise and makes it harder
for JS newcomers and old pros alike to grasp the core concepts of what problem
Promises actually solve.

Different implementations you might use are:

 - Bluebird
 - Q
 - Angular's $q (based on Q)
 - es6-promise polyfill

Of these, the last strives to adhere to the spec. The others have a variety of
other features.

### Angular's $q service
When using Angular, _always use $q_. Don't use native `Promise` (or a polyfill).
This is because $q is wired into the $digest cycle: it calls `$scope.$apply`
for you when the promise resolves so your UI stays in sync.

## What problem do Promises solve?
* Promises represent an eventual value.
* Promises encapsulate the asynchronousness of code, letting you write it as if
it were synchronous.
* Promises get you out of callback hell

### What does "asynchronous code written synchronously" look like?
Traditionally callbacks are passed as an argument to a function, and that
function calls them when appropriate. With Promises, the continuation is instead
given to the _return value_ of the function. Compare:

Accepting a callback:
```js
function getAsyncVal(callback) {
    setTimeout(() => callback('foo'), 200);
}

getAsyncVal(val => {
    console.log(val)
});
```

Returning a Promise:
```js
function getAsyncValPromise() {
    return new Promise(resolve => {
        setTimeout(() => resolve('foo'), 200);
    });
}

getAsyncValPromise()
    .then(val => {
        console.log(val)
    });
```

See `examples.js` for more side-by-side comparisons of callbacks and Promises.

## A Promising Future
Promises are getting even more play in ES7 with `async` functions! Check out
this sweet syntax:

```js
async function loadPage() {
    try {
        content = await getJSON('/api/main/content');
        showPage(content);
    } catch (e) {
        showError('Arrrggh everything is broken');
        logError(e);
    }
}
```

# Exercise
We're going to implement a `Promise` class that adheres to the spec. The tests
in `test/promise.spec.js` are written, you just need to implement `promise.js`.
(Oh, hey TDD.)

## Why?
Promises are mind-bending when you first see them. (And sometimes later, too.)
The thing they encapsulate is subtle, but powerful when you use it right.

Not only that, but one of the great use cases of Promises is a Promise-based
API. And it just so happens that the `Promise` class itself implements a
Promise-based API!

## How?
```js
$ npm install && npm start
```
to start the test watcher. Then open your editor and implement all the
things in `promise.js` to make the tests pass.

Note: the `promise.js` template is written as an ES6 `class` for simplicity.

## Too long; didn't code?
Checkout the `solution` branch to see a sample implementation.
