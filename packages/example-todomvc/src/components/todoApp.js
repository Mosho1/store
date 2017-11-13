import React from 'react';
import PropTypes from 'prop-types';

import {viewStore} from '../stores/index';
import TodoEntry from './todoEntry';
import TodoOverview from './todoOverview';
import TodoFooter from './todoFooter';
import { ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS } from '../constants';

// import DevTool from 'mobx-react-devtools';

export default class TodoApp extends React.Component {

	viewStore = viewStore;

	render() {
		return (
			<div>
				{/* <DevTool /> */}
				<header className="header">
					<h1>todos</h1>
					<TodoEntry/>
				</header>
				<TodoOverview />
				<TodoFooter />
			</div>
		);
	}

	componentDidMount() {
		if (__CLIENT__) {
			var { Router } = require('director/build/director');
			var router = Router({
				'/': () => this.viewStore.setFilter(ALL_TODOS),
				'/active': () => this.viewStore.setFilter(ACTIVE_TODOS),
				'/completed': () => this.viewStore.setFilter(COMPLETED_TODOS)
			});
		router.init('/');
		}
	}
}
