type ActionState = 'success' | 'start' | 'error';

type ActionPayload<T> = T | Promise<T>;

interface IDeferred<T> {
    resolve: Function;
    reject: Function;
    promise: Promise<T>;
}

interface AsyncActionPayload<T> {
    data: T;
    error?: Error;
    loading?: boolean;
}

interface Action<T> {
    type: string;
    action: PayloadCreator<any>;
    meta: ActionMeta<T>;
    payload?: ActionPayload<T> | Promise<T>;
}

interface Reducer<T> extends Function {
    (state: T, payload: any, ...args: any[]): T;
}

interface Dispatch<T> {
    (action: Action<T>): any;
}

interface PayloadCreator<T> extends Function {
    (...args: any[]): ActionPayload<T>;
    type: string;
    deferred: IDeferred<any> | null;

    state: ActionState;
}

interface AsyncPayloadCreator<T> extends Function {
    (...args: any[]): Promise<T>;
    type?: string;
}

interface MapStateToProps<TStateProps, TOwnProps> {
    (state: any, ownProps?: TOwnProps): TStateProps;
}

interface MapStoreToProps<TStoreProps, TStateProps, TOwnProps> {
    (storeProps: TStoreProps, ownProps: TOwnProps): TStateProps;
}

interface Selector<T> {
    (state: T, props: any): any;
}

interface SelectorsMeta {
    selectors: Selector<any>[];
    combiner: Function;
}


interface ActionOptions {
    cache?: Function | boolean;
    latest?: Function | boolean;
}

interface ActionMeta<T> {
    payloadFn: Function;
    isAsync: boolean;
    opts: ActionOptions;
    cachedArguments?: any;
    callCount: number;
}

type Dictionary<T> = { [index: string]: T };


type NestedPartial<T> = {[K in keyof T]?: NestedPartial<T[K]>};

interface DataStore<T> {
    dispatch: Function;
    getState(): T;
    subscribe(subscriber: Function): void;
}

declare module 'assert' {
    var x: any;
    export = x;
}