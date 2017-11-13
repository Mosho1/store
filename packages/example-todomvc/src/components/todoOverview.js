import React from 'react';
import PropTypes from 'prop-types';
import { ACTIVE_TODOS, COMPLETED_TODOS } from '../constants';
import {todoStore, viewStore} from '../stores/index';
import TodoItem from './todoItem';

@viewStore.connect(store => ({
	todoFilter: store.state.todoFilter
}))
@todoStore.connect(store => ({
	todos: store.state.todos
}))
export default class TodoOverview extends React.Component {

	todoStore = todoStore;

	render() {
		if (this.props.todos.length === 0)
			return null;
		return <section className="main">
			<input
				className="toggle-all"
				type="checkbox"
				onChange={this.toggleAll}
				checked={this.todoStore.activeTodoCount === 0}
			/>
			<ul className="todo-list">
				{this.getVisibleTodos().map(todo =>
					(<TodoItem
						key={todo.id}
						todo={todo}
					/>)
				)}
			</ul>
		</section>
	}

	getVisibleTodos() {
		return this.props.todos.filter(todo => {
			switch (this.props.todoFilter) {
				case ACTIVE_TODOS:
					return !todo.completed;
				case COMPLETED_TODOS:
					return todo.completed;
				default:
					return true;
			}
		});
	}

	toggleAll = (event) => {
		var checked = event.target.checked;
		this.todoStore.toggleAll(checked);
	};
}

// TodoOverview.propTypes = {
// 	todos: PropTypes.array.isRequired,
// };
