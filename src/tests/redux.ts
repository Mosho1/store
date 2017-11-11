import { action, select } from '../index';
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

        const store = new TestStore({ initialState: { key: 'value' } });

        const reduxStore = createReduxStore({ store });

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

        const store = new TestStore({ initialState: { key: 'value' } });

        const reduxStore = createReduxStore({ store });

        await store.doSomething();

        expect(store.state.key).to.equal('value');
        expect(store.state.anotherKey).to.equal('anotherValue');
        expect(reduxStore.getState().store).to.have.property('key', 'value');
        expect(reduxStore.getState().store).to.have.property('anotherKey', 'anotherValue');
    });

    it('should select', async () => {

        let callCounter = 0;
        class TestStore extends Store<any, any> {
            @action(merge)
            doSomething(value: string) {
                return {
                    key: value
                }
            }

            @select(store => store.state.key)
            get something() {
                callCounter++;
                return this.state.key
            }
        }

        const store = new TestStore({ initialState: { key: 'value' } });

        createReduxStore({ store });

        expect(store.something).to.equal('value');
        expect(callCounter).to.equal(1);
        expect(store.something).to.equal('value');
        expect(callCounter).to.equal(1);
        store.doSomething('anotherValue');
        expect(store.something).to.equal('anotherValue');
        expect(callCounter).to.equal(2);
    });

    it('should select selectors', async () => {

        let callCounter = 0;
        class TestStore extends Store<any, any> {
            @action(merge)
            doSomething(value: string) {
                return {
                    key: value
                }
            }

            @select(store => store.state.key)
            get something() {
                return this.state.key
            }

            @select(store => store.something)
            get somethingElse() {
                callCounter++;
                return this.something + '2';
            }
        }

        const store = new TestStore({ initialState: { key: 'value' } });

        createReduxStore({ store });

        expect(store.somethingElse).to.equal('value2');
        expect(callCounter).to.equal(1);
        expect(store.somethingElse).to.equal('value2');
        expect(callCounter).to.equal(1);
        store.doSomething('anotherValue');
        expect(store.somethingElse).to.equal('anotherValue2');
        expect(callCounter).to.equal(2);
    })
});
