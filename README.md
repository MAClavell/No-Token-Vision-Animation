# No Token Vision Animation
A small module for FoundryVTT that adds two options that let the GM to override the user's Token Vision Animation setting.

## Usage
Options:
* 'Foundry User Settings' disables this module and falls back to normal Foundry behaviour.
* 'Disable For All Users' overrides all user's settings to completely disable Token Vision Animations.
* 'Disable Only On GM Moves' disables Token Vision Animations for players when the GM moves a token while still allowing players to see animations when moving their own tokens (the GM will always see Token Vision Animations, regardless of what the players see).
Example:
![Example GIF](./Disable-For-GM-Moves.gif)

## Installation
Works best with the [LibWrapper module](https://github.com/ruipin/fvtt-lib-wrapper) installed.

Install from the Foundry module installer or by inputting this manifest link in "Manifest URL" field: https://raw.githubusercontent.com/maclavell/no-token-vision-animation/master/module.json

### Issues
Report any issues on the "Issues" page on this github or message me in the [FoundryVTT Discord](https://discord.gg/foundryvtt) at Joms#1636.
