import { createStore, combineReducers } from 'redux';
import { AnyStore, Store } from './index';
import { connect } from 'react-redux';
import * as si from 'seamless-immutable';
import { createSelector } from 'reselect';

class ActionQueuer {
    queue: Action<any>[] = [];
    reducer = (state: any) => state;
    dispatch = (action: Action<any>) => {
        this.queue.push(action);
    }
    commit = (fn: (action: Action<any>) => any) => {
        this.queue.forEach(fn);
    }
}

const actionQueuer = new ActionQueuer() as any;

function observeStore(store: DataStore<any>, select: Function, onChange: Function) {
    let currentState: any;

    function handleChange() {
        let nextState = select(store.getState());
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    }

    let unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
}

function connectStoresToDispatch(stores: Dictionary<AnyStore>, store: DataStore<any>) {
    for (let k in stores) {
        const s = stores[k];
        s.store = store;
        s._name = k;

        observeStore(store, (state: any) => state[k], (nextState: any) => s.setState(nextState));
    }
}

export function createReduxStore(stores: Dictionary<AnyStore>, initialState?: any, enhancer?: any): DataStore<any> {

    let reducers: Dictionary<Reducer<any>> = {};

    for (let k in stores) {
        reducers[k] = stores[k].reducer;
    }

    if (!initialState) {
        initialState = {};
        for (let k in stores) {
            initialState[k] = stores[k].initialState;
        }
    }

    const combinedReducer = combineReducers(reducers);

    const store = createStore(combinedReducer, initialState, enhancer);
    connectStoresToDispatch(stores, store);

    actionQueuer.commit((action: Action<any>) => store.dispatch(action));

    return store;
}

export class ReduxStore<T, S> extends Store<T, S> {
    constructor(args: StoreConstructorArgs<T, S>) {
        super(args);
        this.store = actionQueuer;
    }

    protected processInitialState(state: T) {
        return si.from(state);
    }

    protected createSelector(metadata: SelectorsMeta) {
        let { selectors, combiner } = metadata;
        if (selectors.length === 0) {
            selectors = [store => store.state];
        }
        const createSelectorArgs = [...selectors, combiner.bind(this) as any]; // weird typings for reselect
        return createSelector.apply(null, createSelectorArgs);
    }

    private mapStateToStoreState: MapStateToProps<any, any> = (state): Dictionary<T> => {
        return { [this._name]: state[this._name] };
    }

    connect(selector?: MapStoreToProps<this, any, any>, options?: { pure: boolean }): Function
    connect<U>(selector: MapStoreToProps<this, any, Partial<U>>, options?: { pure: boolean }): Function
    connect<U>(selector?: MapStoreToProps<this, any, Partial<U>>, options?: { pure: boolean }): Function {

        return (component: Function): Function => {
            // assert(component.prototype instanceof React.Component, 'Must be a component');
            const mapStateToStoreState = selector
                ? (_: any, props: Partial<U>) => selector(this, props)
                : this.mapStateToStoreState;

            return connect(mapStateToStoreState as any, undefined as any, undefined as any, options || {})(component);
        };

    }
}

const getMerge = (options?: { deep: boolean }) => function merge<T>(state: T, data: T) {
    if (!data || typeof data !== 'object') return si.static.from(state);
    return si.static.merge(state, data, options);
};

export const mergeFlat = getMerge();
export const merge = getMerge({ deep: true });

export function replace<T>(state: T, data: T) {
    return data || state;
};

export default ReduxStore;
