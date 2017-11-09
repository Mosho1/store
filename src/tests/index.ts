import { Store, action } from '../index';
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

        store.setState({
            did: null
        });

        expect(store.state.did).to.be.null;
        await store.doSomething();
        expect(store.state.did).to.equal('this');
    });

    it('an async action test', async () => {
        class TestStore extends Store<any, any> {
            @action(state => state)
            async doSomething() {
                await delay(50);
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

        store.setState({
            did: null
        });

        expect(store.state.did).to.be.null;
        const promise = store.doSomething();
        expect(store.state.did).to.be.null;
        await promise;
        expect(store.state.did).to.equal('this');
    });

    it.only('an async action with async handlers test', async () => {
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

        store.setState({
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

        store.setState({
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

        store.setState({
            call: 0
        });

        expect(store.state.call).to.equal(0);
        store.doSomething();
        store.doSomething();
        await delay(200);
        expect(store.state.call).to.equal(2);
    });
});
