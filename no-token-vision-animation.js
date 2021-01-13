'use strict';

import {libWrapper} from './shim.js';

// Initialize module
Hooks.once('ready', function () {
    const MODULE_NAME = "No Token Vision Animation";
    const MODULE_ID = "no-token-vision-animation";
    const SETTING_NAME = "disable_animation";
    console.log(`Initializing "${MODULE_NAME}"`);

    game.settings.register(MODULE_ID, SETTING_NAME, {
        name: game.i18n.localize("NTVA.SettingName"),
        hint: game.i18n.localize("NTVA.SettingHint"),
        scope: "world",
        type: String,
        choices: {
            "foundry": game.i18n.localize("NTVA.SettingFoundry"),
            "disableAll": game.i18n.localize("NTVA.SettingDisableAll"),
            "disableGM": game.i18n.localize("NTVA.SettingDisableGM"),
        },
        default: "foundry",
        config: true,
    });

    // Register to the 'preUpdateToken' hook
    // Adds a 'isGmUpdate' property to the 'options' object, to be used later
    // (the 'token' reference here is just a copy, not the actual Token)
    Hooks.on('preUpdateToken', (parent, token, diff, options, user_id) => {
        options.isGmUpdate = game.users.entities.filter(u => u.isGM && u.id === user_id).length > 0;
    });

    // Register the wrapper for Token._onUpdate
    // This adds the 'isGmUpdate' field to the token so it can be used later
    libWrapper.register(MODULE_ID, 'Token.prototype._onUpdate', function (wrapped, ...args) {
        // args[1] is the 'options' parameter
        this.isGmUpdate = args[1].isGmUpdate;

        return wrapped(...args);
    }, 'WRAPPER');

    // Register the wrapper for Token._onMovementFrame
    // This wrapper sets the config to actually disable the vision animation
	libWrapper.register(MODULE_ID, 'Token.prototype._onMovementFrame', function (wrapped, ...args) {
        let disableSetting = game.settings.get(MODULE_ID, SETTING_NAME);

        // Disable if the vision animation if we need too
        // args[2] is the 'config' parameter
        if(disableSetting == "disableAll") {
            args[2].animate = false;
        }
        else if(disableSetting == "disableGM") {
            args[2].animate = args[2].animate && (game.user.isGM || !this.isGmUpdate);
        }

		// Call the original function
		return wrapped(...args);
	}, 'WRAPPER');
});

