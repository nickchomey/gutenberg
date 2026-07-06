<?php
/**
 * HTML for testing the data persistence mechanism.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-persist">
	<div>
		<p data-testid="persist-output" data-wp-text="state.value">default</p>
		<button
			data-testid="update-btn"
			data-wp-on--click="actions.update"
		>Update</button>
		<button
			data-testid="reset-btn"
			data-wp-on--click="actions.reset"
		>Reset</button>
	</div>
</div>
