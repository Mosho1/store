import TodoStore from './TodoStore';
import ViewStore from './ViewStore';
import {createReduxStore} from 'redux-store';

const initialState = window.initialState && JSON.parse(window.initialState) || {};

export const todoStore = window.todoStore = new TodoStore({initialState});
export const viewStore = window.viewStore = new ViewStore();

todoStore.subscribeServerToStore();
todoStore.subscribeLocalstorageToStore();

createReduxStore({
    todoStore,
    viewStore
});
