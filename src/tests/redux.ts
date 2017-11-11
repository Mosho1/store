import { action } from '../index';
import { createReduxStore, ReduxStore as Store, merge } from '../redux';
import { expect } from 'chai';
import { it, describe } from './tester';

// const delay = (ms) => new Promise(res => setTimeout(res, ms));

describe('tests', () => {
    it('should create a redux store', async () => {
        class TestStore extends Store<any, any> {
            @action(merge)
            doSomething() {
                return {
                    did: 'this'
                }
            }

        }

        const store = new TestStore({initialState: {key: 'value'}});

        const reduxStore = createReduxStore({store});

        expect(store.state.key).to.equal('value');
        expect(reduxStore.getState().store).to.have.property('key', 'value');
    });

    it('should update a redux store', async () => {
        class TestStore extends Store<any, any> {
            @action(merge)
            doSomething() {
                return {
                    anotherKey: 'anotherValue'
                }
            }
        }

        const store = new TestStore({initialState: {key: 'value'}});

        const reduxStore = createReduxStore({store});

        await store.doSomething();

        expect(store.state.key).to.equal('value');
        expect(store.state.anotherKey).to.equal('anotherValue');
        expect(reduxStore.getState().store).to.have.property('key', 'value');
        // expect(reduxStore.getState().store).to.have.property('anotherKey', 'anotherValue');
    });
});
