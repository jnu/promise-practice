/**
 * Compare against other Promise implementations:
 *  - Comment out both imports to use native Promise
 *  - Uncomment `es6-promise` to use 3rd party polyfill
 * Note test run times for each implementation. (es6-promise is comparable to
 * the native implementation.)
 */
// import Promise from '../promise';
// import { Promise } from 'es6-promise';
////////////////////////////////////////////////////////////////////////////////
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
                setTimeout(() => resolve('foo'), 5);
                setTimeout(() => reject('bar'), 10);
            });

            p.then(() => {
                setTimeout(done, 10);
            });
            p.catch(reason => {
                done(`unexpected reject: ${reason}`);
            });
        });
        it('ignores reject if reject has already been called', done => {
            let p = new Promise((resolve, reject) => {
                setTimeout(() => reject('foo'), 5);
                setTimeout(() => reject('bar'), 10);
            });

            p.then(value => done(`unexpected resolve ${value}`))
            setTimeout(() => {
                p.then(v => {
                    done(`unexpected resolve: ${v}`);
                }).catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
            }, 15);
        });
        it('ignores resolve if reject has been called', done => {
            let p = new Promise((resolve, reject) => {
                setTimeout(resolve, 10);
                setTimeout(reject, 5);
            });

            p.then(value => {
                done(`unexpected resolve: ${value}`);
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
            p.catch(reason => done(`unexpected reject: ${reason}`))
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
                    done(`unexpected reject: ${reason}`);
                }
            );
        });
        it('calls `onRejected` with reason when Promise rejects', done => {
            let p = new Promise((resolve, reject) => setTimeout(() => reject('bar'), 5));
            p.then(
                value => {
                    done(`unexpected resolve: ${value}`);
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
            p.catch(reason => done(`unexpected reject: ${reason}`));
            chai.expect(value).to.equal(0);
        });
        it('defers `onRejected` (when present) even when Promise rejects immediately', done => {
            let value = 0;
            let p = new Promise((resolve, reject) => {
                reject(1);
            });
            p.then(val => done(`unexpected resolve: ${val}`))
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
            p.catch(reason => done(`unexpected reject: ${reason}`));
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
        it('does not handle error if no onRejected is passed', done => {
            new Promise((resolve, reject) => setTimeout(() => reject('foo'), 1))
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('need not be called with `onResolved` if `onRejected` is passed', done => {
            new Promise((resolve, reject) => setTimeout(() => reject('foo'), 1))
                .then(null, reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('need not specify `onRejected` if `onResolved` is passed', done => {
            new Promise((resolve, reject) => {
                    setTimeout(() => resolve('foo'), 1);
                })
                .then(v => {
                    chai.expect(v).to.equal('foo');
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('may be called with no handlers, passing through values', done => {
            new Promise(resolve => setTimeout(() => resolve('foo')))
                .then()
                .then(v => {
                    chai.expect(v).to.equal('foo');
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('may be called with no handlers, passing through errors', done => {
            new Promise((resolve, reject) => setTimeout(() => reject('foo')))
                .then()
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
    });

    describe('#catch', () => {
        it('calls `onRejected` when Promise rejects', done => {
            new Promise((resolve, reject) => setTimeout(() => reject('foo')))
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('calls `onRejected` when Promise throws', done => {
            new Promise((resolve, reject) => {
                    throw 'foo';
                })
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('is chainable with `then`: coerces non-Promise return values to Promises', done => {
            new Promise((resolve, reject) => setTimeout(reject, 5))
                .catch(() => 'foo')
                .then(v => {
                    chai.expect(v).to.equal('foo');
                    done();
                });
        });
        it('is chainable with `then`: does not coerce Promise return values to Promises', done => {
            new Promise((resolve, reject) => setTimeout(reject, 5))
                .catch(() => new Promise(resolve => setTimeout(() => resolve('foo'), 5)))
                .then(v => {
                    chai.expect(v).to.equal('foo');
                    done();
                });
        });
        it('is chainable with `catch`: rethrown errors get caught downstream', done => {
            new Promise((resolve, reject) => setTimeout(reject, 5))
                .catch(() => {
                    throw 'foo';
                })
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('defers `onRejected` even when Promise rejects immediately', done => {
            let value = 'foo';
            new Promise((resolve, reject) => reject())
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(() => {
                    value = 'bar';
                    done();
                });
            chai.expect(value).to.equal('foo');
        });
        it('can be #catched forever after promise is rejected with same result', done => {
            let p = new Promise((resolve, reject) => reject('foo'))
                .then(val => done(`unexpected resolve: ${val}`));
            setTimeout(() => {
                let count = 0;

                p.catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    count++;
                });

                chai.expect(count).to.equal(0);

                p.catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    count++;
                });

                chai.expect(count).to.equal(0);

                setTimeout(() => {
                    chai.expect(count).to.equal(2);
                    done();
                }, 5);
            }, 5);
        });
        it('can be #catched multiple times while promise is pending with same result', done => {
            let p = new Promise((resolve, reject) => setTimeout(() => reject('foo'), 10))
                .then(val => done(`unexpected resolve: ${val}`));
            setTimeout(() => {
                let count = 0;

                p.catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    count++;
                });

                chai.expect(count).to.equal(0);

                p.catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    count++;
                });

                chai.expect(count).to.equal(0);

                setTimeout(() => {
                    chai.expect(count).to.equal(2);
                    done();
                }, 10);
            }, 5);
        });
        it('can be called with no arguments, resulting in a pass through', done => {
            new Promise((resolve, reject) => reject('foo'))
                .then(val => done(`unexpected resolve: ${val}`))
                .catch()
                .catch()
                .catch()
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
    });

    describe('.resolve', () => {
        it('constructs a Promise in the resolved state', done => {
            Promise.resolve()
                .then(() => done(), reason => done(`unexpected then-catch: ${reason}`))
                .catch(() => done(`unexpected reject: ${reason}`));
        });
        it('constructs a Promise that resolves with value of input', done => {
            const val = { unique: 'identity' };
            Promise.resolve(val)
                .then(v => {
                    // NB: object equality
                    chai.expect(v).to.equal(val);
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('passes through when a Promise is passed as input', done => {
            let p = new Promise((resolve, reject) => setTimeout(() => resolve('foo'), 5));
            let p2 = Promise.resolve(p);
            chai.expect(p2).to.equal(p);
            p2.then(val => {
                chai.expect(val).to.equal('foo');
                done();
            }).catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('passes through even when a rejected Promise is passed as input', done => {
            let p = new Promise((resolve, reject) => setTimeout(() => reject('foo'), 5));
            let p2 = Promise.resolve(p);
            chai.expect(p2).to.equal(p);
            p2.then(val => done(`unexpected reject: ${val}`)).catch(reason => {
                chai.expect(reason).to.equal('foo');
                done();
            });
        });
    });

    describe('.reject', () => {
        it('constructs a Promise in the rejected state', done => {
            Promise.reject()
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(() => done());
        });
        it('constructs a Promise that rejects with reason of input', done => {
            Promise.reject('foo')
                .then(val => done(`unexpected resolve: ${val}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('does not pass through when a Promise is passed as input', done => {
            let p = Promise.resolve('foo');
            let p2 = Promise.reject(p);
            chai.expect(p2).not.to.equal(p);
            p2.then(val => done(`unexpected resolve: ${val}`)).catch(reason => {
                chai.expect(reason).to.equal(p);
                done();
            });
        });
    });

    describe('.all', () => {
        it('resolves after all promises have resolved', done => {
            let count = 0;
            let P = [1, 2, 3].map(v => new Promise((resolve, reject) => {
                setTimeout(() => resolve(v), v);
            }).then(() => count++));
            Promise
                .all(P)
                .then(() => {
                    chai.expect(count).to.equal(3);
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('resolves with an array of values in the same order as input', done => {
            let P = [6, 4, 2].map(v => new Promise((resolve, reject) => {
                setTimeout(() => resolve(v * 10), v);
            }));
            Promise
                .all(P)
                .then(vals => {
                    chai.expect(vals).to.deep.equal([60, 40, 20]);
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('coerces non-Promise inputs to resolved Promises', done => {
            let P = [
                4,
                Promise.resolve(5),
                'foo'
            ];
            Promise
                .all(P)
                .then(vals => {
                    chai.expect(vals).to.deep.equal([4, 5, 'foo'])
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('rejects if any promise rejects', done => {
            let P = [
                new Promise((resolve, reject) => setTimeout(reject, 5)),
                'baz'
            ];
            Promise
                .all(P)
                .then(v => done(`unexpected resolve: ${v}`))
                .catch(() => done());
        });
        it('rejects with the same reason as the rejected promise', done => {
            Promise.all([Promise.reject('foo')])
                .then(v => done(`unexpected reject: ${v}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('ignores subsequent rejected promises after one rejects', done => {
            let catchCount = 0;
            let P = [
                new Promise((resolve, reject) => setTimeout(() => {
                    catchCount++;
                    reject('foo');
                }, 10)),
                new Promise((resolve, reject) => setTimeout(() => {
                    catchCount++;
                    reject('bar');
                }, 5))
            ];
            Promise
                .all(P)
                .then(v => done(`unexpected resolve: ${v}`))
                .catch(reason => {
                    chai.expect(catchCount).to.equal(1);
                    chai.expect(reason).to.equal('bar');
                    done();
                });
        });
        it('ignores subsequent resolved promises after one rejects', done => {
            let didResolve = false;
            let P = [
                new Promise(resolve => setTimeout(() => {
                    didResolve = true;
                    resolve('foo');
                }, 10)),
                new Promise((resolve, reject) => setTimeout(reject, 5)),
                'baz'
            ];
            Promise
                .all(P)
                .then(v => done(`unexpected resolve: ${v}`))
                .catch(() => {
                    chai.expect(didResolve).to.equal(false);
                    done();
                });
        });
    });

    describe('.race', () => {
        it('resolves if an input Promise resolves first', done => {
            let P = [
                new Promise(resolve => setTimeout(resolve, 5))
            ];
            Promise
                .race(P)
                .then(() => done())
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('resolves with value of first resolved Promise', done => {
            let P = [
                new Promise(resolve => setTimeout(() => resolve('foo', 5))),
                Promise.resolve('bar')
            ];
            Promise
                .race(P)
                .then(v => {
                    chai.expect(v).to.equal('bar');
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('rejects as soon as one input Promise rejects', done => {
            let P = [
                new Promise(resolve => setTimeout(resolve, 5)),
                Promise.reject()
            ];
            Promise
                .race(P)
                .then(v => done(`unexpected resolve: ${v}`))
                .catch(reason => done());
        });
        it('rejects with reason of first rejected Promise', done => {
            let P = [
                new Promise(resolve => setTimeout(resolve, 5)),
                Promise.reject('foo')
            ];
            Promise
                .race(P)
                .then(v => done(`unexpected resolve: ${v}`))
                .catch(reason => {
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('ignores subsequent rejections after one rejects', done => {
            let count = 0;
            let P = [
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    reject('foo')
                }, 5)),
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    reject('bar')
                }, 10))
            ]
            Promise
                .race(P)
                .then(v => done(`unexpected resolve ${v}`))
                .catch(reason => {
                    chai.expect(count).to.equal(1);
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('ignores subsequent resolves after one rejects', done => {
            let count = 0;
            let P = [
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    reject('foo')
                }, 5)),
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    resolve('bar')
                }, 10))
            ]
            Promise
                .race(P)
                .then(v => done(`unexpected resolve ${v}`))
                .catch(reason => {
                    chai.expect(count).to.equal(1);
                    chai.expect(reason).to.equal('foo');
                    done();
                });
        });
        it('ignores subsequent rejections after one resolves', done => {
            let count = 0;
            let P = [
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    resolve('foo')
                }, 5)),
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    reject('bar')
                }, 10))
            ]
            Promise
                .race(P)
                .then(v => {
                    chai.expect(v).to.equal('foo');
                    chai.expect(count).to.equal(1);
                    done();
                })
                .catch(reason => done(`unexpected reject: ${reason}`));
        });
        it('ignores subsequent resolves after one resolves', done => {
            let count = 0;
            let P = [
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    resolve('foo')
                }, 5)),
                new Promise((resolve, reject) => setTimeout(() => {
                    count++;
                    resolve('bar')
                }, 10))
            ]
            let p = Promise.race(P);

            p.then(v => {
                chai.expect(v).to.equal('foo');
                chai.expect(count).to.equal(1);
            }).catch(reason => done(`unexpected reject: ${reason}`));

            setTimeout(() => {
                p.then(v2 => {
                    chai.expect(v2).to.equal('foo');
                    chai.expect(count).to.equal(2);
                    done();
                }).catch(reason => done(`unexpected reject: ${reason}`))
            }, 15);
        });
    });

});
