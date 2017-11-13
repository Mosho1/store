import { observable, computed, reaction } from 'mobx';
import { action, merge, select, ReduxStore } from 'redux-store';
import * as Utils from '../utils';


export default class TodoStore extends ReduxStore {

	static initialState = {
		todos: []
	};

	@select(store => store.state.todos)
	get activeTodoCount() {
		return this.state.todos.reduce(
			(sum, todo) => sum + (todo.completed ? 0 : 1),
			0
		)
	}

	@select(store => store.state.todos, store => store.activeTodoCount)
	get completedCount() {
		return this.state.todos.length - this.activeTodoCount;
	}

	subscribeServerToStore() {
		this.subscribe(({ todos }) => {
			window.fetch && fetch('/api/todos', {
				method: 'post',
				body: JSON.stringify({ todos }),
				headers: new Headers({ 'Content-Type': 'application/json' })
			});
		});
	}

	subscribeLocalstorageToStore() {
		this.subscribe(({ todos }) => {
			localStorage.setItem('mobx-react-todomvc-todos', JSON.stringify({ todos }))
		});
	}

	@action(merge)
	addTodo(title) {
		return {
			todos: this.state.todos.concat({
				id: Utils.uuid(),
				title,
				completed: false
			})
		};
	}

	@action(merge)
	setTodoTitle(todoToEdit, title) {
		return {
			todos: this.state.todos.map(todo =>
				todo === todoToEdit
					? ({ ...todo, title })
					: todo)
		};
	}

	@action(merge)
	toggleAll(checked) {
		return {
			todos: this.state.todos.map(todo =>
				({ ...todo, completed: checked }))
		};
	}

	@action(merge)
	toggleTodo(todoToToggle) {
		return {
			todos: this.state.todos.map(todo =>
				todo === todoToToggle
					? ({ ...todo, completed: !todo.completed })
					: todo)
		};
	}

	@action(merge)
	clearCompleted() {
		return {
			todos: this.state.todos.filter(todo => !todo.completed)
		};
	}

	@action(merge)
	destroyTodo(todoToDestroy) {
		return {
			todos: this.state.todos.filter(todo => todo !== todoToDestroy)
		};
	}

	static fromJS(array) {
		const todoStore = new TodoStore({ initialState: array });
		return todoStore;
	}
}
