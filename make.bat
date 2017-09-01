@ECHO off

ECHO.
IF (%1) == (--debug) (ECHO Compiling Reddit on Youtube for testing.) ELSE (ECHO Compiling Reddit on Youtube for production.)
ECHO ##########################
ECHO.

ECHO Removing old files.
ECHO Removing SASS stylesheet code-mapping file.
DEL /Q /F "royt/style.css.map"
DEL /Q /F "options/options.css.map"
IF NOT (%1) == (--debug) ECHO Removing old addon versions. & DEL /Q /F *.zip
ECHO.
ECHO.

ECHO Compiling SASS style files.
ECHO Compiling Main SASS stylesheet.
CALL sass royt/style.scss royt/style.css
IF ERRORLEVEL 1 GOTO abort
ECHO Compiling Options SASS stylesheet.
CALL sass options/options.scss options/options.css
IF ERRORLEVEL 1 GOTO abort
ECHO.
ECHO.

IF (%1) == (--debug) (GOTO testing) ELSE (GOTO packaging)

:testing
ECHO Running tests.
CALL web-ext run --verbose -u https://youtu.be/gozIJFK1jVU
IF ERRORLEVEL 1 GOTO abort
ECHO.
GOTO success

:packaging
ECHO Packaging extension
CALL web-ext build --verbose
IF ERRORLEVEL 1 GOTO abort
ECHO.
ECHO.
GOTO success

:success
ECHO.
ECHO.
ECHO ##########################
ECHO.
ECHO Operation completed successfully.
ECHO.
ECHO.
cmd /k
EXIT 0

:abort
ECHO.
ECHO.
ECHO ##########################
ECHO.
ECHO Operation failed.
ECHO.
ECHO.
cmd /k
EXIT 1
