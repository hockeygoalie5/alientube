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
rm -f data/style.css.map
if [  "$1" != "--debug" ]; then
	echo Removing old addon versions.
	rm -f *.xpi
fi
echo Removing any old install.rdf or bootstrap.js that may have gotten out of the package.
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

if [ "$1" == "--debug" ]; then
	echo ${standout}Running tests.${normal}
	jpm test --binary-args 'https://www.youtube.com/watch?v=gozIJFK1jVU' --tbpl | grep -E -v "^(TEST-INFO \| \[JavaScript Warning)|^(\"}])" | tee testlog.txt
	grep "All tests passed\!" testlog.txt > /dev/null
	(! grep -E "^(TEST-INFO \| \[JavaScript Error).*(15f28b3a-c42b-463c-907a-e69d0eb2988a-at-jetpack)" testlog.txt) > /dev/null
else
	echo ${standout}Packaging .xpi${normal}
	jpm xpi
fi
echo
echo

echo
echo
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' \#
echo
echo ${green}Operation completed sucessfully${normal}
echo
echo
trap : 0