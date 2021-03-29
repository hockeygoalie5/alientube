[<img alt='Get it on Mozilla Addons' src='https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png' width='172' height="60"/>](https://addons.mozilla.org/firefox/addon/reddit-on-youtube/)

Reddit on Youtube (RoYT)
=========

Adds Reddit comments to Youtube videos!

# Testing
To test, clone the repository, then follow one of the two methods:

## With `web-ext`
If you have `web-ext` installed, simply navigate to the extension root in your terminal and run `web-ext run`. The extension will load in a clean version of your default firefox profile. See further options and instructions on installing `web-ext` [here](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext).

## Without `web-ext`
If you do not have `web-ext` and do not want to install it, you can open FireFox and navigate to `about:debugging`. Select "Load Temporary Add-on", navigate to the extension root, and select any file in that directory. The extension will load immediatally. See further instructions [here](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

# Translation
If you want to help translate RoYT, check the [`_locales`](https://github.com/mustafakalash/royt/tree/master/_locales) directory for already existing translations and the localisation format. Only the `message` key of each section needs to be translated. Modified `messages.json` files can be sent to me or updated in a pull request. Thank you!

# Libraries
This addon uses [Handlebars 4.7.7](https://github.com/handlebars-lang/handlebars.js/blob/v4.7.7/lib/handlebars.js) and [Snuownd](https://github.com/gamefreak/snuownd/commit/e0c2dd44da89b75fc54c0767fc5faa18b7e4ef2f).
