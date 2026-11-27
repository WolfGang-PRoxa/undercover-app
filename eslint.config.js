import js from '@eslint/js';
import globals from 'globals';

// Globals provided by the Scriptable app (https://docs.scriptable.app).
const scriptableGlobals = Object.fromEntries(
  [
    'Alert',
    'CallbackURL',
    'Color',
    'Contact',
    'ContactsContainer',
    'Data',
    'DateFormatter',
    'Device',
    'DocumentPicker',
    'FileManager',
    'Font',
    'Image',
    'Keychain',
    'ListWidget',
    'Mail',
    'Message',
    'Notification',
    'Pasteboard',
    'QuickLook',
    'Request',
    'Safari',
    'Script',
    'ShareSheet',
    'Timer',
    'UITable',
    'UITableCell',
    'UITableRow',
    'WebView',
    'args',
    'config',
    'importModule',
  ].map((name) => [name, 'readonly']),
);

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    // Scriptable runs each script inside an async function, so top-level await is allowed (module parsing).
    files: ['undercover_*.js'],
    languageOptions: {
      globals: scriptableGlobals,
    },
  },
  {
    rules: {
      // Errors are often swallowed on purpose (optional iCloud files, missing contacts...).
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
];
