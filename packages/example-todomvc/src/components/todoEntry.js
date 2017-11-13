import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {todoStore} from '../stores/index';

const ENTER_KEY = 13;

export default class TodoEntry extends React.Component {

	todoStore = todoStore;

	render() {
		return (<input
			ref="newField"
			className="new-todo"
			placeholder="What needs to be done?"
			onKeyDown={this.handleNewTodoKeyDown}
			autoFocus={true}
		/>);
	}

	handleNewTodoKeyDown = (event) => {
		if (event.keyCode !== ENTER_KEY) {
			return;
		}

		event.preventDefault();

		var val = ReactDOM.findDOMNode(this.refs.newField).value.trim();

		if (val) {
			this.todoStore.addTodo(val);
			ReactDOM.findDOMNode(this.refs.newField).value = '';
		}
	};
}
