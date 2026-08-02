/**
 * data-wp-show — Datastar-style show/hide directive.
 *
 * Toggles an element's visibility via `display`. When hidden, the element's
 * current computed display value is saved and `display: none` is applied;
 * when shown, the saved value is restored (falling back to clearing the
 * inline style so the element returns to whatever its stylesheet says —
 * flex, grid, inline-block, etc. — automatically).
 *
 * Why not the `hidden` attribute? `hidden` is overridable by any element
 * display rule (e.g. `[hidden] { display:none !important }` is needed to
 * make it reliable, which then blocks responsive/override rules), while an
 * inline `display: none` is self-contained and reversible.
 *
 * Usage: `data-wp-show="state.userId !== context.authorId"`
 */

import { type RefObject } from 'preact';
import { directive } from '../hooks';
import { useInit } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';
import { cssStringToObject } from './style';

// data-wp-show — Show/hide via display:none.
directive( 'show', ( { directives: { show }, element, evaluate } ) => {
	show.forEach( ( entry ) => {
		if ( entry.uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'show', entry.uniqueId );
			}
			return;
		}

		let result = evaluate( entry );
		if ( result === PENDING_GETTER ) {
			return;
		}
		if ( typeof result === 'function' ) {
			result = result();
		}

		const shouldShow = !! result;

		// Mirror the style directive: apply the display change on the vdom
		// prop so Preact's diff keeps it in sync, and force it onto the real
		// DOM on hydration (Preact doesn't apply attribute changes during
		// hydration).
		element.props.style = element.props.style || {};
		if ( typeof element.props.style === 'string' ) {
			element.props.style = cssStringToObject( element.props.style );
		}
		if ( shouldShow ) {
			// Restore: clear the inline display so the stylesheet wins again.
			delete element.props.style.display;
		} else {
			element.props.style.display = 'none';
		}

		useInit( () => {
			const el = ( element.ref as RefObject< HTMLElement > ).current!;
			if ( shouldShow ) {
				el.style.removeProperty( 'display' );
			} else {
				el.style.setProperty( 'display', 'none' );
			}
		} );
	} );
} );
