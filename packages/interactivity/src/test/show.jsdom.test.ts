/**
 * Unit tests for the `data-wp-show` directive.
 *
 * The directive takes an expression that evaluates to a boolean: when falsy,
 * the element gets an inline `display: none`; when truthy, the inline
 * `display` is cleared so the element returns to whatever its stylesheet
 * says.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { store } from '../store';
import '../directives'; // Registers all the core directives.
import { hydrateRegions } from '../hydration';

const NS = 'test/show';

const { state } = store( NS, {
	state: {
		visible: true,
	},
	actions: {
		toggle() {
			state.visible = !state.visible;
		},
	},
} );

// Drains preact's effect queue (useInit/useEffect) reliably: a macrotask
// plus two animation frames.
const flush = async () => {
	await new Promise( ( r ) => setTimeout( r, 0 ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

const setup = async ( islandHtml: string ) => {
	document.body.innerHTML = `
		<div data-wp-interactive="${ NS }">
			${ islandHtml }
		</div>
	`;
	state.visible = true;
	await hydrateRegions();
};

/* eslint-disable @wordpress/wp-global-usage */
const testGlobalThis = globalThis as typeof globalThis & {
	IS_GUTENBERG_PLUGIN?: boolean;
};
let originalIsGutenbergPlugin: boolean | undefined;

( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

beforeEach( () => {
	document.body.innerHTML = '';
	originalIsGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;
	testGlobalThis.IS_GUTENBERG_PLUGIN = false;
} );

afterEach( () => {
	testGlobalThis.IS_GUTENBERG_PLUGIN = originalIsGutenbergPlugin;
} );
/* eslint-enable @wordpress/wp-global-usage */

describe( 'data-wp-show', () => {
	it( 'keeps the element visible when the expression evaluates to true', async () => {
		await setup(
			'<div data-testid="box" data-wp-show="state.visible">Content</div>'
		);
		await flush();

		const box = document.querySelector(
			'[data-testid="box"]'
		) as HTMLElement;
		expect( box.style.display ).toBe( '' );
	} );

	it( 'hides the element when the expression evaluates to false', async () => {
		await setup(
			'<div data-testid="box" data-wp-show="!state.visible">Content</div>'
		);
		await flush();

		const box = document.querySelector(
			'[data-testid="box"]'
		) as HTMLElement;
		expect( box.style.display ).toBe( 'none' );
	} );

	it( 'toggles the display style when the state changes', async () => {
		await setup( `
			<button data-testid="toggle" data-wp-on--click="actions.toggle">Toggle</button>
			<div data-testid="box" data-wp-show="state.visible">Content</div>
		` );
		await flush();

		const box = document.querySelector(
			'[data-testid="box"]'
		) as HTMLElement;
		expect( box.style.display ).toBe( '' );

		const toggle = document.querySelector(
			'[data-testid="toggle"]'
		) as HTMLButtonElement;
		toggle.click();
		await flush();

		expect( box.style.display ).toBe( 'none' );

		toggle.click();
		await flush();

		expect( box.style.display ).toBe( '' );
	} );

	it( 'preserves other inline styles while hidden and when shown again', async () => {
		await setup( `
			<button data-testid="toggle" data-wp-on--click="actions.toggle">Toggle</button>
			<div data-testid="box" style="color: red" data-wp-show="state.visible">Content</div>
		` );
		await flush();

		const box = document.querySelector(
			'[data-testid="box"]'
		) as HTMLElement;
		expect( box.style.display ).toBe( '' );
		expect( box.style.color ).toBe( 'red' );

		const toggle = document.querySelector(
			'[data-testid="toggle"]'
		) as HTMLButtonElement;
		toggle.click();
		await flush();

		expect( box.style.display ).toBe( 'none' );
		expect( box.style.color ).toBe( 'red' );

		toggle.click();
		await flush();

		expect( box.style.display ).toBe( '' );
		expect( box.style.color ).toBe( 'red' );
	} );
} );
