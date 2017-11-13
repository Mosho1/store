import React from 'react';
import PropTypes from 'prop-types';
import {todoStore, viewStore} from '../stores/index';

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;

@viewStore.connect(store => ({
	todoBeingEdited: store.state.todoBeingEdited
}))
export default class TodoItem extends React.Component {

	state = { editText: "" };

	todoStore = todoStore;
	viewStore = viewStore;

	render() {
		const { todoBeingEdited, todo } = this.props;
		return (
			<li className={[
				todo.completed ? "completed" : "",
				todo === todoBeingEdited ? "editing" : ""
			].join(" ")}>
				<div className="view">
					<input
						className="toggle"
						type="checkbox"
						checked={todo.completed}
						onChange={this.handleToggle}
					/>
					<label onDoubleClick={this.handleEdit}>
						{todo.title}
					</label>
					<button className="destroy" onClick={this.handleDestroy} />
				</div>
				<input
					ref="editField"
					className="edit"
					value={this.state.editText}
					onBlur={this.handleSubmit}
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
				/>
			</li>
		);
	}

	handleSubmit = (event) => {
		const val = this.state.editText.trim();
		if (val) {
			this.todoStore.setTodoTitle(this.props.todo, val);
			this.setState({editText: val});
		} else {
			this.handleDestroy();
		}
		this.viewStore.setTodoBeingEdited(null);
	};

	handleDestroy = () => {
		this.todoStore.destroyTodo(this.props.todo);
		this.viewStore.setTodoBeingEdited(null);
	};

	handleEdit = () => {
		const todo = this.props.todo;
		this.viewStore.setTodoBeingEdited(todo);
		this.setState({editText: todo.title});
	};

	handleKeyDown = (event) => {
		if (event.which === ESCAPE_KEY) {
			this.setState({editText: this.props.todo.title});
			this.viewStore.setTodoBeingEdited(null);
		} else if (event.which === ENTER_KEY) {
			this.handleSubmit(event);
		}
	};

	handleChange = (event) => {
		this.setState({
			editText: event.target.value
		});
	};

	handleToggle = () => {
		this.todoStore.toggleTodo(this.props.todo);
	};
}

TodoItem.propTypes = {
	todo: PropTypes.object.isRequired
};
