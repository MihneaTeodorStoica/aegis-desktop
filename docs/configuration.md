# Configuration

## Sources

Configuration is resolved in this order:

1. defaults
2. optional JSON config file referenced by `AEGIS_CONFIG_PATH`
3. environment variables

## Environment Variables

### `AEGIS_ARTIFACT_DIR`

Artifact output directory for screenshots and related files.

Default:

```text
./artifacts
```

### `AEGIS_OCR_ENABLED`

Enable OCR support when the OCR backend exists.

Default:

```text
true
```

### `AEGIS_OCR_COMMAND`

OCR executable name or path.

Default:

```text
tesseract
```

### `AEGIS_COMMAND_TIMEOUT_MS`

Timeout applied to external command invocations.

Default:

```text
5000
```

### `AEGIS_SCREENSHOT_BACKEND`

Preferred screenshot backend:

- `auto`
- `maim`
- `import`
- `gnome-screenshot`

### `AEGIS_INPUT_BACKEND`

Preferred input backend:

- `auto`
- `xdotool`

### `AEGIS_SAFE_MODE`

When enabled, risky tools are disabled by policy.

### `AEGIS_ALLOWED_LAUNCH_COMMANDS`

Comma-separated allowlist for `launch_app`.

### `AEGIS_LOG_LEVEL`

- `debug`
- `info`
- `warn`
- `error`

### `AEGIS_MAX_SCREENSHOTS_PER_MINUTE`

Screenshot throttling limit.

### `AEGIS_MAX_INPUT_SEQUENCE_STEPS`

Maximum allowed `perform_input_sequence` step count after validation.

## JSON Config File

Example `aegis-desktop.config.json`:

```json
{
  "artifactDir": "./artifacts",
  "ocrEnabled": true,
  "ocrCommand": "tesseract",
  "commandTimeoutMs": 5000,
  "screenshotBackend": "auto",
  "inputBackend": "auto",
  "safeMode": false,
  "allowedLaunchCommands": ["firefox", "code", "xdg-open"],
  "logLevel": "info",
  "maxScreenshotsPerMinute": 30,
  "maxInputSequenceSteps": 256,
  "disabledTools": [],
  "envAllowlist": ["DISPLAY", "WAYLAND_DISPLAY", "XAUTHORITY", "HOME", "PATH"]
}
```
