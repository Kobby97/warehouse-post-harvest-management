@ECHO OFF
@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup script for Windows.
@REM Downloads the pinned Maven distribution/wrapper jar if not already present,
@REM then delegates to it. Keeps every teammate on the same Maven version
@REM regardless of what (if anything) is globally installed.
@REM ----------------------------------------------------------------------------

SETLOCAL ENABLEEXTENSIONS

SET MAVEN_PROJECTBASEDIR=%~dp0
IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

SET WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar
SET WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties

IF NOT EXIST "%WRAPPER_JAR%" (
    ECHO Downloading Maven wrapper jar...
    FOR /F "tokens=1,* delims==" %%A IN ('FINDSTR /B "wrapperUrl" "%WRAPPER_PROPERTIES%"') DO SET WRAPPER_URL=%%B
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
    IF ERRORLEVEL 1 (
        ECHO Error: failed to download Maven wrapper jar from %WRAPPER_URL%
        EXIT /B 1
    )
)

IF NOT "%JAVA_HOME%"=="" (
    SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
) ELSE (
    SET JAVA_EXE=java.exe
)

"%JAVA_EXE%" ^
    -classpath "%WRAPPER_JAR%" ^
    "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
    org.apache.maven.wrapper.MavenWrapperMain %*

ENDLOCAL
