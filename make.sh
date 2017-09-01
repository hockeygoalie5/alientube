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
	echo Compiling Reddit on Youtube for ${standout}testing${normal}.
else
	echo Compiling Reddit on Youtube for ${standout}production${normal}.
fi
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo

echo ${standout}Removing old files${normal}
echo Removing SASS stylesheet code-mapping file.
rm -f royt/style.css.map
rm -f options/options.css.map
if [  "$1" != "--debug" ]; then
	echo Removing old addon versions.
	rm -f *.zip
fi
echo
echo

echo ${standout}Compiling SASS style files.${normal}
echo Compiling Main SASS stylesheet.
sass royt/style.scss royt/style.css
echo Compiling Options SASS stylesheet
sass options/options.scss options/options.css
echo
echo

if [ "$1" == "--debug" ]; then
	echo ${standout}Running tests.${normal}
	web-ext run --verbose -u https://youtu.be/gozIJFK1jVU
else
	echo ${standout}Packaging extension${normal}
	web-ext build --verbose
fi
echo
echo

echo
echo
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo
echo ${green}Operation completed successfully${normal}
echo
echo
trap : 0
