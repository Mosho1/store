
import { ActionStates, default as ActionTypeManager } from './utils/action-type-manager';
import assert from './utils/assert';
import { Deferred } from './utils/deferred';
import { Mocker } from './utils/mocker'
import { isReduxInternalAction } from './utils/is-redux-internal-action'

class StoreMetadata<T> {
    public actions: Dictionary<ActionMeta<T>> = {};
    public selectors: Dictionary<SelectorsMeta> = {};
    public handlers: Dictionary<Reducer<T>> = {};
}

export type AnyStore = Store<any, any>;

// stores references to all active stores, useful for hot reloading
const stores = new Set<AnyStore>();

export class Store<T, S> extends Mocker {
    static errorProps = {};
    reducersList: Reducer<any>[] = [];
    actions: Dictionary<PayloadCreator<T>> = {};
    selectors: Dictionary<Function> = {};
    store: DataStore<any> = {
        dispatch: (action) => {
            this.state = this.reducer(this.state, action);
        },
        getState: () => {
            return this.state;
        },
        subscribe: () => {

        }
    };
    _name: string;
    initialState: T;
    state: T;
    defaultActionHandler = (state: any) => state;
    deps: S;
    parentStore: AnyStore;
    innerStores: AnyStore[] = [];
    subscriptions: Function[] = [];
    actionStateSubscriptions: Function[] = [];
    selectGlobalState = (x: any) => x;
    selectLocalState = (x: any) => x;

    get name() {
        return this._name;
    }

    async handleError(e: Error | Response, type: string) {
        console.error(`Error in action <${type}>`);
        console.error(e);
    };

    protected createSelector(metadata: SelectorsMeta) {
        let { combiner } = metadata;
        return combiner;
    }

    private createSelectors(): void {
        const { selectors: selectorsMeta } = this.metadata;
        for (let k in selectorsMeta) {
            this.selectors[k] = this.createSelector(selectorsMeta[k]);
        }
    }

    private wrapPayloadCreator(meta: ActionMeta<T>, type: string) {
        const bound = (...args: any[]) => {
            return meta.payloadFn.apply(this, args);
        };
        if (!this.handleError) {
            return bound;
        }
        else if (meta.isAsync) {
            meta.cachedArguments
            return async (...args: any[]) => {
                try {
                    const promise = bound(...args);
                    assert(promise && promise.then, `async payload creator <${type}> did not return a promise.`);
                    let callNumber = ++meta.callCount;
                    const ret = await promise;
                    if (callNumber !== meta.callCount) {
                        const { latest } = meta.opts;
                        switch (typeof latest) {
                            case 'undefined':
                                return ret;
                            case 'boolean':
                                return latest ? null : ret;
                        }
                    }
                    return ret;
                } catch (e) {
                    this.handleError(e, type);
                    throw e;
                }
            };
        } else {
            return (...args: any[]) => {
                try {
                    meta.callCount++;
                    return bound(...args);
                } catch (e) {
                    this.handleError(e, type);
                    throw e;
                }
            };
        }
    }

    // allows to ignore actions run with arguments identical to the last call
    checkCachedArguments(args: any | any[], meta: ActionMeta<any>) {
        if (!meta.opts.cache) return true;
        const newCachedArguments = meta.opts.cache === true ? args : meta.opts.cache(args);
        const { cachedArguments } = meta;

        if (!cachedArguments) {
            meta.cachedArguments = newCachedArguments;
            return true;
        }

        if (!Array.isArray(cachedArguments)) {
            if (newCachedArguments !== cachedArguments) {
                meta.cachedArguments = newCachedArguments;
                return true;
            }
            return false;
        }

        if (cachedArguments.length === 0 && newCachedArguments.length === 0) return true;

        if (cachedArguments.length !== newCachedArguments.length) {
            meta.cachedArguments = newCachedArguments;
            return true;
        }

        for (let i = 0, len = cachedArguments.length; i < len; i++) {
            if (newCachedArguments[i] !== cachedArguments[i]) {
                meta.cachedArguments = newCachedArguments;
                return true;
            }
        }
        return false;
    }

    private createActions(): void {
        const { actions } = this.metadata;
        for (let k in actions) {
            const typeManager = new ActionTypeManager(k, this._name);
            const type = typeManager.getType();

            const actionMeta = actions[k];
            const payloadCreatorWithErrorHandler = this.wrapPayloadCreator(actionMeta, type);

            let action = ((...args: any[]) => {
                if (!this.checkCachedArguments(args, actionMeta)) return Promise.resolve();
                const payload = payloadCreatorWithErrorHandler(...args);
                const isPromise = payload && (payload as Promise<any>).then;
                
                const method = isPromise ? this.dispatchAsync : this.dispatchSync;
        
                return method.call(this, {
                    type,
                    action: action as PayloadCreator<any>,
                    meta: actionMeta,
                    payload
                }, args);
            }) as Partial<PayloadCreator<any>>;

            action.type = type;
            action.deferred = null;

            // these are called by the function returned from decorated @actions
            this.actions[k] = action as PayloadCreator<any>;
        }
    }

    getActionState(action: Function): ActionState | undefined {
        const state = (action as PayloadCreator<any>).state;
        return state || this.innerStores.map(s => s.getActionState(action)).find(Boolean);
    }

    applySelector(key: string) {
        return this.selectors[key].call(this, this);
    }

    getState() {
        return this.state;
    }

    setState(state: T) {
        const prevState = this.state;
        this.state = state;
        if (this.subscriptionsEnabled) this.notifySubscribers(prevState);
        return this;
    }

    setPartialState(state: Partial<T>) {
        return this.setState(Object.assign({}, this.state, state));
    }

    getStore() {
        assert(this.store, 'Must set the store before using this method.');
        return this.store;
    }

    get metadata(): StoreMetadata<T> {
        const constructor: any = this.constructor;
        if (!('metadata' in constructor)) {
            return constructor.metadata = new StoreMetadata<T>();
        }
        return constructor.metadata;
    };

    private setActionState(action: PayloadCreator<any>, state: ActionState) {
        action.state = state;
        if (this.parentStore) {
            this.parentStore.actionStateSubscriptions.forEach(fn => fn(action, state));
        } else {
            this.actionStateSubscriptions.forEach(fn => fn(action, state));
        }
    }

    dispatchSync({ type, payload, action }: Action<any>) {
        assert(this.store.dispatch, 'store has no dispatch method, make sure it\'s a valid store.');
        const typeManager = new ActionTypeManager(type);

        // sync handler, sync action payload creator
        this.getStore().dispatch({ type: typeManager.getType(), payload: this.selectGlobalState(payload) });

        // added for consistency but doesn't really belong in sync functions
        if (action.deferred) {
            action.deferred!.resolve();
        }
        action.deferred = null;

        return payload;
    }

    async dispatchAsync({ type, meta, payload, action }: Action<any>, actionCreatorArgs: any[]) {
        assert(this.store.dispatch, 'store has no dispatch method, make sure it\'s a valid store.');
        const typeManager = new ActionTypeManager(type);

        const deferred = action.deferred = new Deferred(action.deferred);

        if (meta.isAsync) {
            const startPayload = actionCreatorArgs;
            this.setActionState(action, ActionStates.START);
            this.getStore().dispatch({ type: typeManager.getTypeWithState(ActionStates.START), payload: startPayload });
        }
        try {
            const data = await payload || null;
            if (data !== null) {
                this.getStore().dispatch({ type: typeManager.getTypeWithState(ActionStates.SUCCESS), payload: this.selectGlobalState(data) });
            }
            if (deferred) {
                deferred!.resolve();
            }
            if (deferred === action.deferred) {
                action.deferred = null;
                this.setActionState(action, ActionStates.SUCCESS);
            }
            return data;
        } catch (error) {
            if (meta.isAsync) {
                this.getStore().dispatch({ type: typeManager.getTypeWithState(ActionStates.ERROR), payload: error });
            }
            if (deferred && deferred.subscribedTo) {
                deferred!.reject(error);
            }
            if (deferred === action.deferred) {
                action.deferred = null;
                this.setActionState(action, ActionStates.ERROR);
            }
            throw error;
        }

    }

    reducer = (state: T, action: Action<any>) => {
        return this.reducersList.reduce(
            (accState, reducer) =>
                reducer(accState, action),
            state
        );
    }

    private createReducer(): void {
        const { handlers } = this.metadata;

        let handlerWithScopedTypes: typeof handlers = {};

        // map keys
        for (let k in handlers) {
            const newKey = new ActionTypeManager(k as string, this._name).getType();
            handlerWithScopedTypes[newKey] = handlers[k];
        }

        const initialReducer: Reducer<T> = (state: T, action: Action<any>): T => {
            const { type, payload } = action;
            const typeManager = new ActionTypeManager(type);
            // TODO: add test to make sure we don't touch original action
            if (state == null) return this.initialState;
            if (isReduxInternalAction(type)) return state;
            // TODO: add test with two different stores with same action names.
            const handler = handlerWithScopedTypes[typeManager.getType()];
            return handler
                ? handler(state, payload, type)
                : this.defaultActionHandler(state);
        };

        this.reducersList.push(initialReducer);
    }

    subscriptionsEnabled = true;

    disableSubscriptions() {
        this.subscriptionsEnabled = false;
    }

    enableSubscriptions() {
        this.subscriptionsEnabled = true;
    }

    subscribeToActionState(fn: () => void) {
        this.actionStateSubscriptions.push(fn);
    }

    subscribe(fn: (state: T, prevState: T) => void) {
        assert(typeof fn === 'function', 'subscribe should be given a function');
        this.subscriptions.push(fn);
    }

    private unsubscribeSingle(fn: Function, subscriptions: Function[]) {
        const index = subscriptions.indexOf(fn);
        if (index > -1) {
            subscriptions.splice(index, 1);
        }
    }

    unsubscribe(fn?: Function) {
        if (fn) {
            this.unsubscribeSingle(fn, this.subscriptions);
            this.unsubscribeSingle(fn, this.actionStateSubscriptions);
        } else {
            this.subscriptions = [];
            this.actionStateSubscriptions = [];
            this.innerStores.forEach(store => store.unsubscribe());
        }
    }

    private notifySubscribers(prevState: T) {
        this.subscriptions.forEach(sub => sub(this.state, prevState));
        this.innerStores.forEach(store => {
            if (store.selectLocalState) {
                let state;
                if (prevState) {
                    state = store.selectLocalState(prevState);
                }
                store.notifySubscribers(state);
            }
        });
    }

    addInnerStore(store: AnyStore, selectLocalState: (state: T) => any = x => x, selectGlobalState: (state: any) => Partial<T> = x => x) {
        store.getStore = () => this.getStore();
        store.parentStore = this;
        store.selectGlobalState = selectGlobalState;
        store.selectLocalState = selectLocalState;
        this.reducersList.push(store.reducer);
        this.innerStores.push(store);
        Object.defineProperty(store, 'state', {
            get: () => {
                if (this.state) {
                    return store.selectLocalState(this.state);
                }
            },
            set: (state) => {
                this.state = store.selectGlobalState(state);
            },
            configurable: true
        });
    }

    static defaultDeps = {};

    protected processInitialState(state: T) {
        return state;
    }

    constructor({ name = 'store', initialState = {} as T, deps, parentStore }: StoreConstructorArgs<T, S> = {}) {
        super();
        stores.add(this);
        this._name = name;
        this.initialState = this.processInitialState(initialState);
        this.deps = deps as S;
        if (parentStore) this.parentStore = parentStore;

        if (parentStore) {
            parentStore.addInnerStore(this);
        }

        this.createReducer();
        this.createSelectors();
        this.createActions();
    }

}

// decorator for Store class methods
export function action(actionHandler: Reducer<any> | AsyncActionHandlers<any>, opts: ActionOptions = {}): MethodDecorator {
    return (
        target: any,
        key: string | symbol,
        descriptor: TypedPropertyDescriptor<any>
    ): TypedPropertyDescriptor<any> => {

        assert(target instanceof Store, 'can only use the @action decorator on a Store.');

        const { metadata } = target as AnyStore;

        let actionName: string | symbol, handlerFn: Reducer<any>, isAsync: boolean;

        switch (typeof actionHandler) {
            case 'function': {
                actionName = key;
                handlerFn = actionHandler as Reducer<any>;
                isAsync = false;
                break;
            }
            default: {
                const keys = Object.keys(actionHandler);
                const { SUCCESS, ERROR, START } = ActionTypeManager;
                assert(keys.length === 0 || keys.includes(SUCCESS) || keys.includes(ERROR) || keys.includes(START), 'invalid async action handler, expected {start?: Function success?: Function, error?: Function}');
                actionName = key;
                handlerFn = handleAsyncAction(actionHandler as AsyncActionHandlers<any>);
                isAsync = true;
            }
        }

        metadata.handlers[actionName] = handlerFn;

        const payloadFn = descriptor.value;
        metadata.actions[actionName] = { payloadFn, isAsync, opts, callCount: 0 };

        const newDescriptor: PropertyDescriptor = {
            // allow overwriting for tests
            set(value) {
                (this as AnyStore).actions[actionName] = value;
            },
            get() {
                return (this as AnyStore).actions[actionName];
            }
        };

        return newDescriptor;
    };
}

// decorator for Store class methods
export function select<T>(...selectors: Selector<T>[]): MethodDecorator;
export function select(...selectors: Selector<any>[]): MethodDecorator {
    return (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
        const { metadata } = target as AnyStore;

        const selectorFnProperty = 'get' in descriptor ? 'get' : 'value';

        metadata.selectors[key] = {
            selectors,
            combiner: descriptor[selectorFnProperty]
        };

        descriptor[selectorFnProperty] = function () {
            return Store.prototype['applySelector'].call(this, key);
        };

        return descriptor;
    };
}

export const getSelect = <T>() => (...selectors: Selector<T>[]) => select<T>(...selectors);

export interface AsyncActionHandlers<T> {
    [key: string]: Reducer<T>;
}

export const handleAsyncAction = (handlers: AsyncActionHandlers<any>): Reducer<any> => (state, payload: any, type: string) => {
    const typeManager = new ActionTypeManager(type);

    const { SUCCESS, ERROR, START } = ActionTypeManager;

    if (typeManager.isSuccess() && handlers[SUCCESS]) {
        return handlers[SUCCESS](state, payload);
    }

    if (typeManager.isError()) {
        if (handlers[ERROR]) {
            return handlers[ERROR](state, payload);
        }
    }
    if (typeManager.isStart() && handlers[START]) {
        if (Array.isArray(payload)) {
            return (handlers[START] as any)(state, ...payload);
        } else {
            return handlers[START](state, payload);
        }
    }

    return state;
};


export const unsubscribeAllStores = () => {
    stores.forEach(s => s.unsubscribe());
    stores.clear();
};

export const waitForAction = async (action: any): Promise<any> => {
    assert(action.deferred === null || action.deferred.promise, `${action.toString()} is not a valid action.`);
    const _action = action as { deferred: Deferred<any> };
    if (_action.deferred === null) return;
    _action.deferred.subscribedTo = true;
    return _action.deferred.promise;
};
