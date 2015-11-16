Reddit on Youtube
=========

Adds Reddit comments to Youtube videos!

# Installation
Installation of RoYT requires [Sass](http://sass-lang.com/install) and [JPM](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm#Installation).
After install, you can run `jpm run` run the addon in a separate environment, or run the XPI with Firefox to install the addon.
## Linux
Simply run `./make.sh`.
## Windows
There is currently no batch script to install RoYT. You can still install RoYT manually. First, delete any existing XPI file in the root directory. Then, run `sass data/style.scss data/style.css` and `sass data/options.scss data/options.css` to compile the Sass stylesheets. Finally, run `jpm xpi` to generate the XPI file.