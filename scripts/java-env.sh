#!/usr/bin/env bash
# Source this file to select the project's JDK in the current terminal.
export JAVA_HOME="${VEHICLE_JAVA_HOME:-${HOME}/.local/share/jdks/temurin-25}"
if [[ ! -x "${JAVA_HOME}/bin/javac" ]]; then
    printf 'Java 25 JDK not found at %s. Set VEHICLE_JAVA_HOME to your Java 25 installation.\n' "${JAVA_HOME}" >&2
    return 1 2>/dev/null || exit 1
fi
export PATH="${JAVA_HOME}/bin:${PATH}"
