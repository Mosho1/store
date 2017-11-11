import { Store, action, select, waitForAction } from '../index';
import { expect } from 'chai';
import { it, describe } from './tester';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

describe('tests', () => {
    it('a test', async () => {
        class TestStore extends Store<any, any> {
            @action(state => state)
            doSomething() {
                return {
                    did: 'this'
                }
            }

            store = {
                dispatch: ({ payload }) => {
                    this.state = payload;
                }
            } as any
        }

        const store = new TestStore({});

        store['setState']({
            did: null
        });

        expect(store.state.did).to.be.null;
        expect(store.doSomething()).to.eql({ did: 'this' });
        expect(store.state.did).to.equal('this');
    });

    it('an async action test', async () => {
        class TestStore extends Store<any, any> {
            @action({ success: (state, payload) => ({ ...state, ...payload }) })
            async doSomething() {
                await delay(50);
                return {
                    did: 'this'
                }
            }

        }

        const store = new TestStore({});

        store['setState']({
            did: null
        });

        expect(store.state.did).to.be.null;
        const promise = store.doSomething();
        expect(store.state.did).to.be.null;
        await promise;
        expect(store.state.did).to.equal('this');
    });

    it('an async action with async handlers test', async () => {
        class TestStore extends Store<any, any> {
            @action({
                start: (state) => ({ ...state, start: true }),
                success: (state, payload) => ({ ...state, ...payload, success: true }),
                error: state => ({ ...state, error: true })
            })
            async doSomething() {
                await delay(1);
                return {
                    did: 'this'
                }
            }

            @action({
                start: state => ({ ...state, start2: true }),
                success: state => ({ ...state, success2: true }),
                error: state => ({ ...state, error2: true })
            })
            async failSomething() {
                throw new Error('__error__');
            }

            store = {
                dispatch: (action) => {
                    this.state = this.reducer(this.state, action);
                }
            } as any
        }

        const store = new TestStore({});

        store['setState']({
            did: null
        });

        expect(store.state.did).to.be.null;
        const promise = store.doSomething();
        expect(store.state.did).to.be.null;
        expect(store.state.start).to.be.true;
        expect(store.state.success).to.be.undefined;
        expect(store.state.error).to.be.undefined;
        await promise;
        expect(store.state.start).to.be.true;
        expect(store.state.success).to.be.true;
        expect(store.state.error).to.be.undefined;
        expect(store.state.did).to.equal('this');
        try {
            await store.failSomething()
        } catch (e) {
            if (e.message !== '__error__') {
                throw e;
            }
        }
        expect(store.state.error2).to.be.true;
        expect(store.state.start2).to.be.true;
        expect(store.state.success2).to.be.undefined;
    });

    it('should call latest', async () => {
        class TestStore extends Store<any, any> {
            @action({ success: state => state })
            async doSomething() {
                const call = this.call++
                if (call === 1) {
                    await delay(100);
                } else {
                    await delay(50);
                }
                return {
                    call
                }
            }

            call = 0;

            store = {
                dispatch: ({ payload }) => {
                    this.state = payload;
                }
            } as any
        }

        const store = new TestStore({});

        store['setState']({
            call: 0
        });

        expect(store.state.call).to.equal(0);
        store.doSomething();
        store.doSomething();
        await delay(200);
        expect(store.state.call).to.equal(1);
    });

    it('should call latest 2', async () => {
        class TestStore extends Store<any, any> {
            @action({ success: state => state }, { latest: true })
            async doSomething() {
                const call = ++this.call;
                if (call === 1) {
                    await delay(100);
                } else {
                    await delay(50);
                }
                return {
                    call
                }
            }
            call = 0;

            store = {
                dispatch: ({ payload }) => {
                    this.state = payload;
                }
            } as any
        }

        const store = new TestStore({});

        store['setState']({
            call: 0
        });

        expect(store.state.call).to.equal(0);
        store.doSomething();
        store.doSomething();
        await delay(200);
        expect(store.state.call).to.equal(2);
    });

    it('should not cache 0 arguments', async () => {
        class TestStore extends Store<any, any> {
            @action(state => state, { cache: true })
            doSomething() {
                this.call++;
            }
            call = 0;

            store = {
                dispatch: ({ payload }) => {
                    this.state = payload;
                }
            } as any
        }

        const store = new TestStore({});

        await store.doSomething();
        await store.doSomething();
        expect(store.call).to.equal(2);
    });

    it('should cache arguments', async () => {
        class TestStore extends Store<any, any> {
            @action(state => state, { cache: true })
            doSomething(arg: any) {
                arg;
                this.call++;
            }
            call = 0;

            store = {
                dispatch: ({ payload }) => {
                    this.state = payload;
                }
            } as any
        }

        const store = new TestStore({});

        await store.doSomething(1);
        await store.doSomething(1);
        expect(store.call).to.equal(1);
        await store.doSomething(2);
        expect(store.call).to.equal(2);
    });

    it('should subscribe to updates', async () => {
        class TestStore extends Store<any, any> {
            @action((state, payload) => ({ ...state, ...payload }))
            doSomething() {
                const call = this.state.call + 1;
                return { call };
            }

            store = {
                dispatch: ({ payload }) => {
                    if ('call' in payload) {
                        this.setState(payload);
                    }
                }
            } as any
        }

        const store = new TestStore({});
        const logged: any[] = [];
        const subscriber = (state, prevState) => logged.push([{ ...state }, prevState ? { ...prevState } : prevState]);
        store.subscribe(subscriber);

        store['setState']({
            call: 0
        });

        await store.doSomething();
        expect(store.state.call).to.equal(1);

        await store.doSomething();
        expect(store.state.call).to.equal(2);
        expect(logged).to.eql([
            [{ call: 0 }, {}],
            [{ call: 1 }, { call: 0 }],
            [{ call: 2 }, { call: 1 }]
        ]);

        store.unsubscribe(subscriber);
        await store.doSomething();
        expect(store.state.call).to.equal(3);
        expect(logged).to.eql([
            [{ call: 0 }, {}],
            [{ call: 1 }, { call: 0 }],
            [{ call: 2 }, { call: 1 }]
        ]);

        store.subscribe(subscriber);
        await store.doSomething();
        expect(store.state.call).to.equal(4);
        expect(logged).to.eql([
            [{ call: 0 }, {}],
            [{ call: 1 }, { call: 0 }],
            [{ call: 2 }, { call: 1 }],
            [{ call: 4 }, { call: 3 }]
        ]);

        store.unsubscribe();
        await store.doSomething();
        expect(store.state.call).to.equal(5);
        expect(logged).to.eql([
            [{ call: 0 }, {}],
            [{ call: 1 }, { call: 0 }],
            [{ call: 2 }, { call: 1 }],
            [{ call: 4 }, { call: 3 }]
        ]);
    });

    it('selector - should just be a getter', async () => {
        class TestStore extends Store<any, any> {
            @action((state, payload) => ({ ...state, ...payload }))
            doSomething() {
                const call = this.state.call + 1;
                return { call };
            }

            @select<any>()
            get something() {
                return this.state.call;
            }

            store = {
                dispatch: ({ payload }) => {
                    if ('call' in payload) {
                        this.setState(payload);
                    }
                }
            } as any
        }

        const store = new TestStore({});

        store['setState']({
            call: 0
        });

        expect(store.something).to.equal(0);

        await store.doSomething();

        expect(store.something).to.equal(1);
    });

    it('selector - should select the output', async () => {
        class TestStore extends Store<any, any> {
            @select<TestStore>(store => store.state.call > 5, store => store.state.call < -5)
            get something() {
                return this.state.call;
            }

            createSelector(metadata: SelectorsMeta) {
                const { selectors, combiner } = metadata;
                return (store: TestStore) => {
                    if (selectors[0](store) || selectors[1](store)) {
                        return combiner.call(this, store);
                    } else {
                        return 'oops';
                    }
                }
            }

            store = {
                dispatch: ({ payload }) => {
                    if ('call' in payload) {
                        this.setState(payload);
                    }
                }
            } as any
        }

        const store = new TestStore({});

        store['setState']({
            call: 0
        });
        expect(store.something).to.equal('oops');

        store['setState']({
            call: -2
        });
        expect(store.something).to.equal('oops');

        store['setState']({
            call: 6
        });
        expect(store.something).to.equal(6);

        store['setState']({
            call: -10
        });
        expect(store.something).to.equal(-10);
    });

    it('waitForAction', async () => {
        class TestStore extends Store<any, any> {
            @action({ success: (state, payload) => ({ ...state, ...payload }) })
            async doSomething() {
                await delay(50);
                return { didSomething: true };
            }

            @action({ success: (state, payload) => ({ ...state, ...payload }) })
            async doSomethingElse() {
                await waitForAction(this.doSomething);
                return { didSomethingElse: true };
            }

            call = 0;

            store = {
                dispatch: (action) => {
                    this.state = this.reducer(this.state, action);
                }
            } as any
        }

        const store = new TestStore({});
        store['setState']({
            didSomething: false,
            didSomethingElse: false
        });

        store.doSomething();
        store.doSomethingElse();
        expect(store.state.didSomething).to.be.false;
        expect(store.state.didSomethingElse).to.be.false;
        await delay(40);
        expect(store.state.didSomething).to.be.false;
        expect(store.state.didSomethingElse).to.be.false;
        await delay(20);
        expect(store.state.didSomething).to.be.true;
        expect(store.state.didSomethingElse).to.be.true;
    });

    it('waitForAction multiple', async () => {
        class TestStore extends Store<any, any> {
            @action({ success: (state, payload) => ({ ...state, ...payload }) })
            async doSomething() {
                await delay(50);
                return { didSomething: this.state.didSomething + 1 };
            }

            @action({ success: (state, payload) => ({ ...state, ...payload }) })
            async doSomethingElse() {
                await waitForAction(this.doSomething);
                return { didSomethingElse: this.state.didSomethingElse + 1 };
            }

            call = 0;

            store = {
                dispatch: (action) => {
                    this.state = this.reducer(this.state, action);
                }
            } as any
        }

        const store = new TestStore({});
        store['setState']({
            didSomething: 0,
            didSomethingElse: 0
        });

        store.doSomething();
        store.doSomethingElse();
        expect(store.state.didSomething).to.equal(0);
        expect(store.state.didSomethingElse).to.equal(0);

        expect(store.doSomething).to.have.property('state', 'start');
        await delay(40);
        expect(store.doSomething).to.have.property('state', 'start');

        expect(store.state.didSomething).to.equal(0);
        expect(store.state.didSomethingElse).to.equal(0);
        store.doSomething();

        expect(store.doSomething).to.have.property('state', 'start');
        await delay(20);
        expect(store.doSomething).to.have.property('state', 'start');

        expect(store.state.didSomething).to.equal(1);
        expect(store.state.didSomethingElse).to.equal(0);

        expect(store.doSomething).to.have.property('state', 'start');
        await delay(20);
        expect(store.doSomething).to.have.property('state', 'start');

        store.doSomething();

        expect(store.doSomething).to.have.property('state', 'start');
        await delay(20);
        expect(store.doSomething).to.have.property('state', 'start');

        expect(store.state.didSomething).to.equal(2);
        await delay(40);
        expect(store.doSomething).to.have.property('state', 'success');
        expect(store.state.didSomething).to.equal(3);
        expect(store.state.didSomethingElse).to.equal(1);
    });

    it('addInnerStore', async () => {
        class TestStore extends Store<any, any> {
            @action((state, payload) => ({ ...state, ...payload }))
            doSomething() {
                return { didSomething: true };
            }
        }

        class InnerTestStore extends Store<any, any> {
            @action((state, payload) => ({ ...state, ...payload }))
            doSomething() {
                return { didSomething: true };
            }
        }

        const store = new TestStore({
            initialState: {
                didSomething: false,
                inner: { didSomething: false }
            }
        });

        const innerStore = new InnerTestStore({
            initialState: {
                didSomethingElse: false
            }
        });

        store.addInnerStore(innerStore, state => state.inner, inner => ({ inner }));
        expect(store.state.inner.didSomething).to.be.false;
        expect(store.state.didSomething).to.be.false;
        expect(innerStore.state).to.not.have.property('didSomethingElse');
        expect(innerStore.state).to.equal(store.state.inner);

        store.doSomething();
        expect(store.state.inner.didSomething).to.be.false;
        expect(store.state.didSomething).to.be.true;

        innerStore.doSomething();
        expect(store.state.inner.didSomething).to.be.true;
        expect(store.state.didSomething).to.be.true;
        expect(innerStore.state).to.equal(store.state.inner);

        const args: any[] = [];
        const spy = function () {
            args.push(Array.from(arguments));
        }
        innerStore.subscribe(spy);

        innerStore.doSomething();
        expect(args).to.eql([[{ didSomething: true }, { didSomething: true }]]);

        store.doSomething();
        expect(args).to.eql([
            [{ didSomething: true }, { didSomething: true }],
            [{ didSomething: true }, { didSomething: true }]
        ]);

    });
});
