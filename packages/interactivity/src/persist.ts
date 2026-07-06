import { effect } from '@preact/signals';
import { store } from './store';
import { deepClone } from './utils';

export interface PersistOptions {
	storage?: Storage;
	key?: string;
	include?: RegExp;
	exclude?: RegExp;
	debounceMs?: number;
	serialize?: ( data: unknown ) => string;
	deserialize?: ( data: string ) => unknown;
}

const DEFAULTS: Required< PersistOptions > = {
	storage: localStorage,
	key: 'wp-interactivity',
	include: /.*/,
	exclude: /^_/,
	debounceMs: 300,
	serialize: JSON.stringify,
	deserialize: JSON.parse,
};

const filterState = (
	obj: Record< string, unknown >,
	opts: Required< Pick< PersistOptions, 'include' | 'exclude' > >,
	prefix = ''
): Record< string, unknown > => {
	const result: Record< string, unknown > = {};
	for ( const key in obj ) {
		if ( ! Object.prototype.hasOwnProperty.call( obj, key ) ) continue;
		const path = prefix ? `${ prefix }.${ key }` : key;
		const value = obj[ key ];

		if ( typeof value === 'object' && value !== null && ! Array.isArray( value ) ) {
			const nested = filterState(
				value as Record< string, unknown >,
				opts,
				path
			);
			if ( Object.keys( nested ).length > 0 ) {
				result[ key ] = nested;
			}
		} else if ( opts.include.test( path ) && ! opts.exclude.test( path ) ) {
			result[ key ] = value;
		}
	}
	return result;
};

const mergeState = ( namespace: string, data: Record< string, unknown > ): void => {
	const { state } = store( namespace );
	for ( const key in data ) {
		if ( Object.prototype.hasOwnProperty.call( data, key ) ) {
			try {
				( state as Record< string, unknown > )[ key ] = deepClone(
					data[ key ]
				);
			} catch {
				/* Silently skip values that can't be set. */
			}
		}
	}
};

export const persist = (
	namespace: string,
	options?: PersistOptions
): void => {
	const opts = { ...DEFAULTS, ...options };
	const storageKey = `${ opts.key }:${ namespace }`;

	try {
		const saved = opts.storage.getItem( storageKey );
		if ( saved ) {
			const data = opts.deserialize( saved );
			if ( data && typeof data === 'object' ) {
				mergeState( namespace, data as Record< string, unknown > );
			}
		}
	} catch {
		/* Ignore deserialization errors. */
	}

	let timer: ReturnType< typeof setTimeout >;
	effect( () => {
		const { state } = store( namespace );
		const snapshot = filterState(
			state as Record< string, unknown >,
			{
			include: opts.include,
			exclude: opts.exclude,
		} );
		clearTimeout( timer );
		timer = setTimeout( () => {
			try {
				opts.storage.setItem(
					storageKey,
					opts.serialize( snapshot )
				);
			} catch {
				/* Ignore serialization / quota errors. */
			}
		}, opts.debounceMs );
	} );
};
