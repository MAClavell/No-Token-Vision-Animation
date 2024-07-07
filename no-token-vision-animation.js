'use strict';

import {libWrapper} from './shim.js';

// Initialize module
Hooks.once('ready', function () {
    const NTVA_MODULE_NAME = "No Token Vision Animation";
    const NTVA_MODULE_ID = "no-token-vision-animation";
    const NTVA_SETTING_NAME = "disable_animation";
    console.log(`Initializing "${NTVA_MODULE_NAME}"`);

    const NTVA_SETTING_FOUNDRY = 0;
    const NTVA_SETTING_DISABLEALL = 1;
    const NTVA_SETTING_DISABLEGM = 2;
    let disableSetting = 0;

    const NTVA_FLAG_NAME = "NTVA.disableAnimation"

    function parseSetting(value) {
        if (value == "disableAll") {
            disableSetting = NTVA_SETTING_DISABLEALL;
        }
        else if (value == "disableGM") {
            disableSetting = NTVA_SETTING_DISABLEGM;
        }
        else {
            disableSetting = NTVA_SETTING_FOUNDRY;
        }
    }

    game.settings.register(NTVA_MODULE_ID, NTVA_SETTING_NAME, {
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

    parseSetting(game.settings.get(NTVA_MODULE_ID, NTVA_SETTING_NAME));

    // Register the wrapper for Token._onUpdate. Runs on the sender's computer
    libWrapper.register(NTVA_MODULE_ID, 'Token.prototype._onUpdate', (function() {
        return async function(wrapped, ...args) {

            // Only run for the mover of the token
            let userId = args[2];
            if (game.user.id === userId) {
                // Only run for tokens the client has vision for
                if (this._isVisionSource()) {
                    let changed = args[0];
                    const positionChanged = ("x" in changed) || ("y" in changed);
                    const rotationChanged = ("rotation" in changed);
                    const sizeChanged = ("width" in changed) || ("height" in changed);

                    if (positionChanged || sizeChanged || (rotationChanged && this.hasLimitedSourceAngle)) {
                        let disableAnimation = false;
                        if (disableSetting == NTVA_SETTING_DISABLEALL) {
                            disableAnimation = true;
                        }
                        else if (disableSetting == NTVA_SETTING_DISABLEGM) {
                            disableAnimation = game.user.isGM;
                        }

                        this.document.setFlag(NTVA_MODULE_ID, NTVA_FLAG_NAME, disableAnimation);
                    }
                }
            }

            // Call the original function
            return wrapped.apply(this, args);
        }
	})(), 'WRAPPER');

    // Register the wrapper for Token._onAnimationUpdate. Runs on the sender's and reciever's computer
    libWrapper.register(NTVA_MODULE_ID, 'Token.prototype._onAnimationUpdate', (function() {
        return async function(wrapped, ...args) {

            let disableAnimation = this.document.getFlag(NTVA_MODULE_ID, NTVA_FLAG_NAME) && !game.user.isGM;

            // Check the settings value in case the vision animation setting was changed mid-animation.
            let animationSetting = game.settings.get("core", "visionAnimation");

            if (disableAnimation && animationSetting) {
                await game.settings.set("core", "visionAnimation", false);
            }

            // Call the original function
            let result = wrapped.apply(this, args);

            if (disableAnimation && animationSetting) {
                await game.settings.set("core", "visionAnimation", true);
            }

            return result;
        }
	})(), 'WRAPPER');
});
