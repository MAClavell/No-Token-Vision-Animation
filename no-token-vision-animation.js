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
        if (value == "disableAll") {
            disableSetting = SETTING_DISABLEALL;
        }
        else if (value == "disableGM") {
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

    // Register the wrapper for Token._onUpdate. Runs on the sender's and reciever's computer
    // This disables vision animation for the whole update
    libWrapper.register(MODULE_ID, 'Token.prototype._onUpdate', (function() {
        return async function(wrapped, ...args) {
            
            let userId = args[2];
            let isGmUpdate = game.users.contents.filter(u => u.isGM && u.id === userId).length > 0;
            let disableAnimation = false;

            // Only run for tokens the client has vision for
            if(this._isVisionSource())
            {
                let animationSetting = game.settings.get("core", "visionAnimation");
                if (animationSetting) {
                    if (disableSetting == SETTING_DISABLEALL) {
                        disableAnimation = true;
                    }
                    else if (disableSetting == SETTING_DISABLEGM) {
                        disableAnimation = animationSetting && (!game.user.isGM & isGmUpdate);
                    }
                }
            }

            if (disableAnimation) {
                await game.settings.set("core", "visionAnimation", false);
            }

            // Call the original function
            let result = wrapped.apply(this, args);

            if (disableAnimation) {
                await game.settings.set("core", "visionAnimation", true);
            }
            
            return result;
        }
	})(), 'WRAPPER');
});
