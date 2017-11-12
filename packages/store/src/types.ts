export type ActionState = 'success' | 'start' | 'error';

export type ActionPayload<T> = T | Promise<T>;

export interface IDeferred<T> {
    resolve: Function;
    reject: Function;
    resolveForce: Function;
    rejectForce: Function;
    promise: Promise<T>;
    subscribedTo: boolean;
    deactivated: boolean;
    wrapActivation: any;
}

export interface StoreConstructorArgs<T, S> {
    name?: string;
    initialState?: T;
    deps?: S;
    parentStore?: any;
}

export interface AsyncActionPayload<T> {
    data: T;
    error?: Error;
    loading?: boolean;
}

export interface Action<T> {
    type: string;
    action: PayloadCreator<any>;
    meta: ActionMeta;
    payload?: ActionPayload<T> | Promise<T>;
}

export interface Reducer<T> extends Function {
    (state: T, payload?: any, ...args: any[]): T;
}

export interface Dispatch<T> {
    (action: Action<T>): any;
}

export interface PayloadCreator<T> extends Function {
    (...args: any[]): ActionPayload<T>;
    type: string;
    deferred: IDeferred<any> | null;

    state: ActionState;
}

export interface AsyncPayloadCreator<T> extends Function {
    (...args: any[]): Promise<T>;
    type?: string;
}

export interface MapStateToProps<TStateProps, TOwnProps> {
    (state: any, ownProps?: TOwnProps): TStateProps;
}

export interface MapStoreToProps<TStoreProps, TStateProps, TOwnProps> {
    (storeProps: TStoreProps, ownProps: TOwnProps): TStateProps;
}

export interface Selector<T> {
    (state: T, props: any): any;
}

export interface SelectorsMeta {
    selectors: Function[];
    combiner: Function;
}


export interface ActionOptions {
    cache?: Function | boolean;
    latest?: boolean;
}

export interface ActionMeta {
    payloadFn: Function;
    isAsync: boolean;
    opts: ActionOptions;
    cachedArguments?: any;
    callCount: number;
}

export type Dictionary<T> = { [index: string]: T };

export type NestedPartial<T> = {[K in keyof T]?: NestedPartial<T[K]>};

export interface DataStore<T> {
    dispatch: Function;
    getState(): T;
    subscribe(subscriber: Function): void;
}

export interface StoreMetadata<T> {
    actions: Dictionary<ActionMeta>;
    selectors: Dictionary<SelectorsMeta>;
    handlers: Dictionary<Reducer<T>>;
}