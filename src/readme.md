<Name> is a state management library, focused on ease-of-use, reduced boilerplate, and not getting in the way of developers. 

The internal generic store is standalone, but the redux extension uses redux, reselect, and seamless-immutable to provide a modern app state management solution. 

Despite being based on redux, it functions similarly (and was influenced by) mobx. 

The idea is to use a Store class that houses our state. All interactions with state are done with a (typically singleton) instance of that class. Local component state is kept to a minimum.

There are 3 main components to a store:

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

`merge`, in this case, is what is typically known as a reducer. It describes how an update payload should be integrated into the current state. `merge` can be something like an immutable merge, or `Object.assign`. Another example might be `replace` which replaces the current state in its entirety with the payload. These reducers should be kept concise and descriptive, ideally a single verb.

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

0. Redux benefits

While abstracting away boilerplate, <Name> offers the same benefits as redux, like serializable state, first-class hot reload, and existing ecosystem.

1. Reduce boilerplate

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

2. Ease of use

Instead of spreading code required to perform an action (like add a todo) across 3 files (actions.ts, reducers.ts, selectors.ts) in an often disjointed manner, they are created and used within the same context of a store. I believe this is a better way to organize your code, but most importantly it helps keep your train of thought focused on that specific action, not having to change context from "I'm now working on an action" to "I'm now working on a selector". 

Additionally, all actions and selectors are, since they are methods/getters of the store instance, called with the store's context, with easy access to other actions, selectors, and the store's state via `this`. This is merely a reference, a grounding point that keeps you focused on the work you are doing with the minimal context to have to keep in your head.

Actions are methods on the store, not a separate payload creator and dispatcher. There is no overhead to using them in components. Seeing what an action does is as simple as going to its definition.

3. Not getting in the way

With Redux, if you want to use async actions, you would probably use something like redux-thunk. if you want to use Rx, you would probably use redux-rx. For every pattern or additional functionality, you have to use additional wiring specific to redux. <Name> aims to provide you with basic tooling that integrate seamlessly with modern JS or TS. Using an `async` method as an action works as you'd expect, with no additional wiring needed. Useful OOP concepts are used to make life easier, instead of trying to strictly adhere to functional programming and pure functions, making something like accessing state a pain:

```
function incrementIfOdd() {
  return (dispatch, getState) => {
    const { counter } = getState();

    if (counter % 2 === 0) {
      return;
    }

    dispatch(increment());
  };
}
```
