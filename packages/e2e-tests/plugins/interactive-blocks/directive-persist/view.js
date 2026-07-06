/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'directive-persist', {
	state: {
		value: 'default',
	},
	actions: {
		update() {
			state.value = 'updated';
		},
		reset() {
			state.value = 'default';
		},
	},
} );
