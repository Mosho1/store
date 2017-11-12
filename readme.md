# Introduction

*Name* is a state management library, focused on better developer experience.

The generic store is standalone, but the redux extension uses redux, reselect, and seamless-immutable to provide a modern app state management solution.

Despite being based on redux, it looks and feels like (and was influenced by)mobx. 

The idea is to use a class instance that stores our state. All interactions with state are done with through the store instance. Local component state is kept to a minimum.

There are 3 main components to interacting with state:

1. Actions
2. Selectors
3. Connectors

## Actions 

Actions cause a change of the store's state. A decorated action payload creator returns a payload that is then combined (by a "reducer") with the current state with an updated state.

```
class MyStore extends Store<any, any> {
    @action(merge)
    doSomething() {
        return {
            didSomething: true
        };
    }
}
```

`merge` here is what is typically known as a reducer. It's a pure function that implements how an update payload should be integrated into the current state. `merge` in this case can be something like an immutable merge, or `Object.assign`. Another example might be `replace` which replaces the current state in its entirety with the payload. These should be kept concise and descriptive, ideally a single verb. Under the hood, a reducer is created from @action declarations for each store.

## Selectors

These are used to extract derived information from the state, typically to be presented in a UI.

```
class MyStore extends Store<any, any> {
    @select(store => store.state.didSomething)
    get thing() {
        return this.state.didSomething ? 'something' : 'nothing';
    }

    @select(store => store.thing)
    get twoThings() {
        return [this.thing, this.thing];
    }
}
```

The redux plugin uses `reselect` internally, which creates getters wrapper in memoized functions that make sure computations are made once for every distinct state.

These work as expected. When the getter is invoked, a check using the provided selectors (e.g. `store => store.thing`) determines if any dependencies changed, and either returns the previous, memoized result or calls the getter to recompute the result.

## Connectors

Used to connect the store to a function. A function decorated with @store.connect(mapState) will receive the mapped state result as an argument.

The redux plugin uses `react-redux`'s `connect`, and will inject props mapped from the store into react components. A store reference is passed to connected components' props, so no use of `Provider` is required.

# Motivation

## Predictable state

*Name* offers the same benefits as redux, like serializable state, first-class hot reload, and existing ecosystem.

## Simple and Scalable

Like mobx, *Name* uses ES/TS classes and references. Actions and selectors are simple and easy to maintain. Unlike mobx, you have to declare dependencies, no magic. This shifts some of the lifting to the end user, but is ultimately simpler and easier to understand.

## Reduce boilerplate

The bare minimum additional code is required to have the benefits of immutable, predictable state.

## Ease of use

Accessing state and computed properties is easily done with a store reference. Calling actions is easily done by calling those actions directly from a reference to the store. 

## Interoperability

By abstracting away use of raw selectors, action creators and reducers into plain classes, plugging in any library to your code is as easy as it is without *Name*.