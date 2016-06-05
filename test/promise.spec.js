import Promise from '../promise';
import * as chai from 'chai';

describe('Promise', () => {

    describe('constructor', () => {
        it('resolves when `executor` calls `resolve`', done => {
            let p = new Promise((resolve, reject) => setTimeout(resolve, 5));
            p.then(done);
        });
        it('rejects when `executor` rejects', done => {
            let p = new Promise((resolve, reject) => setTimeout(reject, 5));
            p.catch(done);
        });
        it('rejects implicitly if `executor` throws', done => {
            let p = new Promise((resolve, reject) => {
                throw 'weee';
            });
            p.catch(() => {
                done();
            });
        });
        it('ignores reject if resolve has been called', done => {
            let p = new Promise((resolve, reject) => {
                setTimeout(resolve, 5);
                setTimeout(reject, 10);
            });

            p.then(() => {
                setTimeout(done, 10);
            });
            p.catch(() => {
                done('unexpected reject');
            });
        });
        it('ignores reject if reject has already been called', done => {
            let p = new Promise((resolve, reject) => {
                setTimeout(reject, 5);
                setTimeout(reject, 10);
            });

            let count = 0;
            p.then(() => done('unexpected resolve'))
            p.catch(() => {
                count++;
            });
            setTimeout(() => {
                chai.expect(count).to.equal(1);
                done();
            }, 15);
        });
        it('ignores resolve if reject has been called', done => {
            let p = new Promise((resolve, reject) => {
                setTimeout(resolve, 10);
                setTimeout(reject, 5);
            });

            p.then(() => {
                done('unexpected resolve');
            });
            p.catch(() => {
                setTimeout(done, 10);
            });
        });
        it('ignores resolve if resolve has already been called', done => {
            let p = new Promise((resolve, reject) => {
                setTimeout(resolve, 5);
                setTimeout(resolve, 10);
            });

            let count = 0;
            p.catch(() => done('unexpected reject'))
            p.then(() => {
                count++;
            });
            setTimeout(() => {
                chai.expect(count).to.equal(1);
                done();
            }, 15);
        });
    });

    describe('#then', () => {
        it('calls `onResolved` with value when Promise resolves', done => {
            let p = new Promise((resolve, reject) => setTimeout(() => resolve('foo'), 5));
            p.then(
                value => {
                    chai.expect(value).to.equal('foo');
                    done();
                },
                reason => {
                    done('unexpected call to reject');
                }
            );
        });
        it('calls `onRejected` with reason when Promise rejects', done => {
            let p = new Promise((resolve, reject) => setTimeout(() => reject('bar'), 5));
            p.then(
                value => {
                    done('unexpected call to resolve');
                },
                reason => {
                    chai.expect(reason).to.equal('bar');
                    done();
                }
            );
        });
        it('is chainable: coerces non-Promise return values to Promises', done => {
            let p = new Promise((resolve, reject) => {
                    setTimeout(() => resolve('a'), 5);
                })
                .then(val => val + 'b')
                .then(val => val.toUpperCase())
                .then(val => {
                    chai.expect(val).to.equal('AB');
                    done();
                });
        });
        it('is chainable: does not coerce Promise return values to Promises', done => {
            let p = new Promise((resolve, reject) => {
                    setTimeout(() => resolve('a'), 5);
                })
                .then(val => new Promise(resolve => {
                    setTimeout(() => resolve('b'), 10);
                }))
                .then(val => {
                    chai.expect(val).to.equal('b');
                    done();
                });
        });
        it('defers `onResolved` even when Promise resolves immediately', done => {
            let value = 0;
            let p = new Promise(resolve => {
                resolve(1);
            });
            p.then(val => {
                value = val;
                done();
            });
            p.catch(() => done('unexpected reject'));
            chai.expect(value).to.equal(0);
        });
        it('defers `onRejected` (when present) even when Promise rejects immediately', done => {
            let value = 0;
            let p = new Promise((resolve, reject) => {
                reject(1);
            });
            p.then(() => done('unexpected resolve'))
            p.catch(reason => {
                value = reason;
                done();
            });
            chai.expect(value).to.equal(0);
        });
        it('can be thenned multiple times while pending', done => {
            let string = '';
            let p = new Promise(resolve => setTimeout(resolve, 5));
            p.then(() => string += 'a');
            p.then(() => string += 'b');
            p.then(() => string += 'c');
            setTimeout(() => {
                chai.expect(string).to.equal('abc');
                done();
            }, 10);
        });
        it('can be thenned multiple times after resolved', done => {
            let string = '';
            let p = new Promise(resolve => setTimeout(resolve, 0));
            p.then(() => string += 'a');
            p.catch(() => done('unexpected reject'));
            setTimeout(() => {
                p.then(() => string += 'b');
            }, 5);
            setTimeout(() => {
                p.then(() => string += 'c');
                p.then(() => string += 'd');
            }, 10);
            setTimeout(() => {
                chai.expect(string).to.equal('abcd');
                done();
            }, 15);
        });
        it('does not handle error if no onRejected is passed');
        it('need not be called with `onResolved` if `onRejected` is passed');
        it('need not specifiy `onRejected` if `onResolved` is passed');
        it('may not be called with no handlers');
    });

    describe('#catch', () => {
        it('calls `onRejected` when Promise rejects');
        it('calls `onRejected` when Promise throws');
        it('is chainable with `then`: coerces non-Promise return values to Promises');
        it('is chainable with `then`: does not coerce Promise return values to Promises');
        it('is chainable with `catch`: rethrown errors get caught downstream');
        it('defers `onRejected` even when Promise rejects immediately');
        it('does not affect the initial Promise state (can be #catched forever with the same result)');
    });

    describe('.resolve', () => {
        it('constructs a Promise in the resolved state');
        it('constructs a Promise that resolves with value of input');
        it('passes through when a Promise is passed as input');
        it('passes through even when a rejected Promise is passed as input');
    });

    describe('.reject', () => {
        it('constructs a Promise in the rejected state');
        it('constructs a Promise that rejects with reason of input');
        it('does not pass through when a Promise is passed as input');
    });

    describe('.all', () => {
        it('resolves after all promises have resolved');
        it('resolves with an array of values in the same order as input');
        it('coerces non-Promise inputs to resolved Promises');
        it('rejects as soon as any promise rejects');
        it('rejects with the same reason as the rejected promise');
        it('ignores subsequent rejected promises after one rejects');
        it('ignores subsequent resolved promises after one rejects');
    });

    describe('.race', () => {
        it('resolves as soon as one input Promise resolves');
        it('resolves with value of first resolved Promise');
        it('rejects as soon as one input Promise rejects');
        it('rejects with reason of first rejected Promise');
        it('ignores subsequent rejections after one rejects');
        it('ignores subsequent resolves after one rejects');
        it('ignores subsequent rejections after one resolves');
        it('ignores subsequent resolves after one resolves');
    });

});
