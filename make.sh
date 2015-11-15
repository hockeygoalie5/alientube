#!/bin/bash
bold=$(tput bold)
standout=$(tput smso)
normal=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 1)

abort() {
    echo
    echo
    printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
    echo
    echo ${red}Operation failed${normal}
    echo
    echo
    exit 1
}

trap 'abort' 0
set -e

echo
if [ "$1" == "--debug" ]; then
    echo Compiling Reddit on Youtube in ${standout}debug${normal} mode.
else
    echo Compiling Reddit on Youtube in ${standout}production${normal} mode.
fi
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo

echo ${standout}Removing old files${normal}
echo Removing SASS stylesheet code-mapping file.
rm -f data/style.css.map
echo Removing old addon versions.
rm -f *.xpi
rm -f install.rdf
rm -f bootstrap.js
echo
echo

echo ${standout}Compiling SASS style files.${normal}
echo Compiling Main SASS stylesheet.
sass data/style.scss data/style.css
echo Compiling Options SASS stylesheet
sass data/options.scss data/options.css
echo
echo

echo ${standout}Creating royt.xpi${normal}
jpm xpi
echo
echo

if [ "$1" == "--debug" ] && [[ "$OSTYPE" == "darwin"* ]]; then
    echo ${standout}Reloading Development Browsers${normal}
    osascript reload.scpt
fi

echo
echo
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo
echo ${green}Operation completed sucessfully${normal}
echo
echo
trap : 0