'use strict';

import {libWrapper} from './shim.js';

// Initialize module
Hooks.once('ready', function () {
    const MODULE_NAME = "No Token Vision Animation";
    const MODULE_ID = "no-token-vision-animation";
    const SETTING_NAME = "disable_animation";
    console.log(`Initializing "${MODULE_NAME}"`);

    const SETTING_FOUNDRY = 0;
    const SETTING_DISABLEALL = 1;
    const SETTING_DISABLEGM = 2;
    let disableSetting = 0;

    function parseSetting(value) {
        if(value == "disableAll") {
            disableSetting = SETTING_DISABLEALL;
        }
        else if(value == "disableGM") {
            disableSetting = SETTING_DISABLEGM;
        }
        else {
            disableSetting = SETTING_FOUNDRY;
        }
    }

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
        onChange: value => {
            parseSetting(value);
        }
    });

    parseSetting(game.settings.get(MODULE_ID, SETTING_NAME));

    // Register to the 'preUpdateToken' hook. Runs on the sender's computer
    // Adds a 'isGmUpdate' property to the 'options' object, to be used later
    Hooks.on('preUpdateToken', (token, diff, options, user_id) => {
        options.isGmUpdate = game.users.contents.filter(u => u.isGM && u.id === user_id).length > 0;
    });

    // Register the wrapper for Token._onUpdate. Runs on the sender's and reciever's computer
    // This adds the 'isGmUpdate' field to the token so it can be used later
    libWrapper.register(MODULE_ID, 'Token.prototype._onUpdate', function (wrapped, ...args) {
        // args[1] is the 'options' parameter
        this.isGmUpdate = args[1].isGmUpdate;

        return wrapped(...args);
    }, 'WRAPPER');

    // Register the wrapper for Token._onMovementFrame
    // This wrapper sets the config to actually disable the vision animation
	libWrapper.register(MODULE_ID, 'Token.prototype._onMovementFrame', function (wrapped, ...args) {
        // Early return for performance
        if(args[2].alreadyModified) {
            return wrapped(...args);
        }

        // Disable if the vision animation if we need too
        // args[2] is the 'config' parameter
        if(disableSetting == SETTING_DISABLEALL) {
            args[2].animate = false;
        }
        else if(disableSetting == SETTING_DISABLEGM) {
            args[2].animate = args[2].animate && (game.user.isGM || !this.isGmUpdate);
        }

        // Make sure we skip over this code for the rest of the movement animation
        args[2].alreadyModified = true;

		// Call the original function
		return wrapped(...args);
	}, 'WRAPPER');
});

