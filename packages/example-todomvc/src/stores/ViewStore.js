import {ReduxStore, action, merge} from 'redux-store';
import { ALL_TODOS } from '../constants';

export default class ViewStore extends ReduxStore {

	static initialState = {
		todoBeingEdited: null,
		todoFilter: ALL_TODOS
	};

	@action(merge)
	setFilter(todoFilter) {
		return {todoFilter};
	}

	@action(merge) 
	setTodoBeingEdited(todoBeingEdited) {
		return {todoBeingEdited};
	}
}