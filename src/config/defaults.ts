export const defaultConfig = {
  artifactDir: './artifacts',
  ocrEnabled: true,
  ocrCommand: 'tesseract',
  commandTimeoutMs: 5000,
  screenshotBackend: 'auto',
  inputBackend: 'auto',
  safeMode: false,
  allowedLaunchCommands: [
    'firefox',
    'google-chrome',
    'chromium',
    'code',
    'gedit',
    'gnome-terminal',
    'xdg-open'
  ],
  logLevel: 'info',
  maxScreenshotsPerMinute: 30,
  maxInputSequenceSteps: 256,
  disabledTools: [] as string[],
  envAllowlist: ['DISPLAY', 'WAYLAND_DISPLAY', 'XAUTHORITY', 'HOME', 'PATH']
} as const;
