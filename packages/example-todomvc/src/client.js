import 'todomvc-common';
import TodoApp from './components/todoApp.js';
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
	<TodoApp/>,
	document.getElementById('todoapp')
);

if (module.hot) {
  module.hot.accept('./components/todoApp', () => {
    var NewTodoApp = require('./components/todoApp').default;
    ReactDOM.render(
      <NewTodoApp/>,
      document.getElementById('todoapp')
    );
  });
}

