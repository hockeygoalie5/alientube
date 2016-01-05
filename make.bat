@ECHO off

ECHO.
IF (%1) == (--debug) (ECHO Compiling Reddit on Youtube for testing.) ELSE (ECHO Compiling Reddit on Youtube for production.)
ECHO ##########################
ECHO.

ECHO Removing old files.
ECHO Removing SASS stylesheet code-mapping file.
DEL /Q /F "data/style.css.map"
IF NOT (%1) == (--debug) ECHO Removing old addon versions. & DEL /Q /F *.xpi
ECHO Removing any old install.rdf or bootstrap.js that may have gotten out of the package.
DEL /Q /F install.rdf
DEL /Q /F bootstrap.js
ECHO.
ECHO.

ECHO Compiling SASS style files.
ECHO Compiling Main SASS stylesheet.
CALL sass data/style.scss data/style.css
IF ERRORLEVEL 1 GOTO abort
ECHO Compiling Options SASS stylesheet.
CALL sass data/options.scss data/options.css
IF ERRORLEVEL 1 GOTO abort
ECHO.
ECHO.

IF (%1) == (--debug) (GOTO testing) ELSE (GOTO packaging)

:testing
ECHO Running tests.
CALL jpm test --binary-args https://www.youtube.com/watch?v=gozIJFK1jVU --tbpl | FINDSTR /R /V /C:"^TEST-INFO[ ]\|[ ]\[JavaScript[ ]Warning" | FIND /V """}]" > testlog.txt
SET TESTERRORLEVEL = %ERRORLEVEL%
TYPE testlog.txt
IF TESTERRORLEVEL EQU 1 GOTO abort
FINDSTR /L /C:"All tests passed!" testlog.txt > nul
IF ERRORLEVEL 1 GOTO abort
FINDSTR /R /C:"^TEST-INFO[ ]\|[ ]\[JavaScript[ ]Error.*15f28b3a-c42b-463c-907a-e69d0eb2988a-at-jetpack" testlog.txt > nul && GOTO abort
ECHO.
ECHO.
GOTO success

:packaging
ECHO Packaging .xpi
jpm xpi
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