import React from 'react';
import PropTypes from 'prop-types';
import {pluralize} from '../utils';
import { ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS } from '../constants';
import {todoStore, viewStore} from '../stores/index';

@viewStore.connect(store => ({
	todoFilter: store.state.todoFilter
}))
@todoStore.connect(store => ({
	completedCount: todoStore.completedCount,
	activeTodoCount: todoStore.activeTodoCount
}))
export default class TodoFooter extends React.Component {

	todoStore = todoStore;

	render() {
		const {completedCount, activeTodoCount} = this.props;
		if (!activeTodoCount && !completedCount)
			return null;

		const activeTodoWord = pluralize(activeTodoCount, 'item');

		return (
			<footer className="footer">
				<span className="todo-count">
					<strong>{activeTodoCount}</strong> {activeTodoWord} left
				</span>
				<ul className="filters">
					{this.renderFilterLink(ALL_TODOS, "", "All")}
					{this.renderFilterLink(ACTIVE_TODOS, "active", "Active")}
					{this.renderFilterLink(COMPLETED_TODOS, "completed", "Completed")}
				</ul>
				{ completedCount === 0
					? null
					: 	<button
							className="clear-completed"
							onClick={this.clearCompleted}>
							Clear completed
						</button>
				}
			</footer>
		);
	}

	renderFilterLink(filterName, url, caption) {
		return (<li>
			<a href={"#/" + url}
				className={filterName ===  this.props.todoFilter ? "selected" : ""}>
				{caption}
			</a>
			{' '}
		</li>)
	}

	clearCompleted = () => {
		this.todoStore.clearCompleted();
	};
}
