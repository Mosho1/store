#Introduction

<Name> is a state management library, focused on better developer experience.

The generic store is standalone, but the redux extension uses redux, reselect, and seamless-immutable to provide a modern app state management solution.

Despite being based on redux, it functions similarly (and was influenced by) mobx. 

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

`merge` here is what is typically known as a reducer. It's a pure function that implements how an update payload should be integrated into the current state. `merge` in this case can be something like an immutable merge, or `Object.assign`. Another example might be `replace` which replaces the current state in its entirety with the payload. These reducers should be kept concise and descriptive, ideally a single verb.

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

The redux plugin uses `react-redux`'s `connect`, and will inject props mapped from the store into react components.

# Motivation

## Best of both worlds

<Name> offers the same benefits as redux, like serializable state, first-class hot reload, and existing ecosystem, while also providing an easy to use interface similar to mobx. The only difference in everyday use from mobx is having to explicitly list dependencies, rather than have them magically (and usefully) computed by mobx.

## Reduce boilerplate

Here is the simplest possible typical redux action creator:

```
export const setVisibilityFilter = filter => {
  return {
    type: 'SET_VISIBILITY_FILTER',
    filter
  }
}
```

By using named class methods, `type` can be abstracted away.

## Ease of use

Accessing state and computed properties is easily done via `this`. Calling actions is easily done by calling those actions from a stored reference to the store. The bare minimum additional code is required to have the benefits of immutable, predictable state.
