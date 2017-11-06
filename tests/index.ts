import { Store, action } from '../index';
import { expect } from 'chai';
import { it } from './tester';

const delay = (ms) => new Promise(res => setTimeout(res, ms));


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