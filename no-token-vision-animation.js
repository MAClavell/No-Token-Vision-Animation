/* ------------------------------------------------------------------------ */

// Patching functions from "The Furnace" by KaKaRoTo
// Patches.js
// https://github.com/kakaroto/fvtt-module-furnace

function patchClass(klass, func, line_number, line, new_line) {
    // Check in case the class/function had been deprecated/removed
    if (func === undefined)
        return;
    let funcStr = func.toString()
    let lines = funcStr.split("\n")
    if (lines[line_number].trim() == line.trim()) {
        lines[line_number] = lines[line_number].replace(line, new_line);
        let fixed = lines.join("\n")
        if (klass !== undefined) {
            let classStr = klass.toString()
            fixed = classStr.replace(funcStr, fixed)
        } else {
            if (!(fixed.startsWith("function") || fixed.startsWith("async function")))
                fixed = "function " + fixed
            if (fixed.startsWith("function async"))
                fixed = fixed.replace("function async", "async function");
        }
        return Function('"use strict";return (' + fixed + ')')();
    } else {
        console.log("Cannot patch function. It has wrong content at line ", line_number, " : ", lines[line_number].trim(), " != ", line.trim(), "\n", funcStr)
    }
};

function patchFunction(func, line_number, line, new_line) {
    return patchClass(undefined, func, line_number, line, new_line)
};

function patchMethod(klass, func, line_number, line, new_line) {
    return patchClass(klass, klass.prototype[func], line_number, line, new_line)
};

/* ------------------------------------------------------------------------ */

function UpdateVisionCode() {
    let newClass = Token;
    newClass = patchMethod(newClass, "setPosition", 0,
        `async setPosition(x, y, {animate=true}={}) {`,
        `async setPosition(x, y, {animate=true, isGmUpdate=false}={}) {`);
    if (!newClass) return;

    newClass = patchMethod(newClass, "animateMovement", 0,
        `async animateMovement(ray) {`,
        `async animateMovement(ray, isGmUpdate=false) {`);
    if (!newClass) return;

    newClass = patchMethod(newClass, "setPosition", 23,
        `if ( animate ) await this.animateMovement(new Ray(this.position, ray.B));`,
        `if ( animate ) await this.animateMovement(new Ray(this.position, ray.B), isGmUpdate);`);
    if (!newClass) return;

    newClass = patchMethod(newClass, "animateMovement", 20,
        `animate: game.settings.get("core", "visionAnimation"),`,
        `animate: ( (game.settings.get("no-token-vision-animation", "disable_animation") == "none") || ((game.settings.get("no-token-vision-animation", "disable_animation") == "disableGM") && (game.user.isGM || !isGmUpdate)) ) && game.settings.get("core", "visionAnimation"),`);
        //`animate: ( (game.settings.get("no-token-vision-animation", "disable_animation") == "none") || ((game.settings.get("no-token-vision-animation", "disable_animation") == "disableGM") && isGmUpdate && game.user.isGM) ) && game.settings.get("core", "visionAnimation"),`);
    if (!newClass) return;

    Token.prototype.setPosition = newClass.prototype.setPosition;
    Token.prototype.animateMovement = newClass.prototype.animateMovement;
}

// Initialize module
Hooks.once('init', async function () {
    console.log("Initializing \"No Token Vision Animation\"");

    game.settings.register("no-token-vision-animation", "disable_animation", {
        name: "Disable Token Vision Animation for all players",
        hint: "Relative darkness in dim areas (0 to 1 where 1 is fully dark).",
        scope: "world",
        type: String,
        choices: {
            "none": "None",
            "disableAll": "Disable For All Players",
            "disableGM": "Disable For GM",
        },
        default: "none",
        config: true,
    });
});

// Patch `Token.animateMovement` to restrict token vision animation
Hooks.once('ready', function () {
    UpdateVisionCode();

    Hooks.on('preUpdateToken', (parent, entity, diff, options, user_id) => {
        options.isGmUpdate = game.users.entities.filter(u => u.isGM && u.id === user_id).length > 0;
        //console.log(options);
    });

    Hooks.on('updateToken', (parent, entity, diff, options, user_id) => {
        console.log(options);
    });
});

