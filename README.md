Reddit on Youtube (RoYT) [![Build Status](https://travis-ci.org/mustafakalash/royt.svg?branch=master)](https://travis-ci.org/mustafakalash/royt)
=========

Adds Reddit comments to Youtube videos!

# Installation
Installation of RoYT requires [Sass](http://sass-lang.com/install) and [JPM](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm#Installation).
After install, you can run `jpm run` to run the addon in a separate environment, or run the XPI with Firefox to install the addon.

To install, run either `make.sh` for Linux or `make.bat` for Windows.

# Testing
Your respective `make` script can be run with the --debug parameter to compile and run tests (this will not generate an .xpi). The script will show failure if the is an error in compiling, a test fails, or if RoYT throws an error.

# Translation
If you want to help translate RoYT, check the [`/data/_locales`](https://github.com/mustafakalash/royt/tree/master/data/_locales) directory for already existing translations and the localisation format. Only the `message` key of each section needs to be translated. Modified `messages.json` files can be sent to me or updated in a pull request. Thank you!