// Fake Scriptable environment to run the game scripts under Node.js.
// Only the APIs used by the scripts are implemented; UI objects record what they receive.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOCUMENTS = '/scriptable';

// In-memory file system shared by FileManager.iCloud() and FileManager.local().
export class MemoryFileManager {
  constructor({ iCloud = true } = {}) {
    this.files = new Map();
    this.dirs = new Set([DOCUMENTS]);
    this.iCloud = iCloud;
  }

  documentsDirectory() {
    return DOCUMENTS;
  }

  joinPath(a, b) {
    return path.posix.join(a, b);
  }

  fileExists(p) {
    return this.files.has(p) || this.dirs.has(p);
  }

  isDirectory(p) {
    return this.dirs.has(p);
  }

  createDirectory(p) {
    let current = p;
    while (current !== '/' && !this.dirs.has(current)) {
      this.dirs.add(current);
      current = path.posix.dirname(current);
    }
  }

  listContents(dir) {
    if (!this.dirs.has(dir)) throw new Error(`No such directory: ${dir}`);
    const children = [...this.files.keys(), ...this.dirs].filter((p) => path.posix.dirname(p) === dir);
    return [...new Set(children.map((p) => path.posix.basename(p)))].sort();
  }

  readString(p) {
    if (!this.files.has(p)) throw new Error(`No such file: ${p}`);
    return this.files.get(p);
  }

  writeString(p, content) {
    this.createDirectory(path.posix.dirname(p));
    this.files.set(p, String(content));
  }

  remove(p) {
    this.files.delete(p);
    this.dirs.delete(p);
  }

  isFileStoredIniCloud() {
    return this.iCloud;
  }

  isFileDownloaded() {
    return true;
  }

  async downloadFileFromiCloud() {}

  creationDate() {
    return new Date();
  }

  modificationDate() {
    return new Date();
  }
}

// Builds the Scriptable globals. `alertResponses` gives the index returned by each presentAlert() call (default 0).
export function createScriptableEnv({ alertResponses = [], requests = {}, iCloud = true } = {}) {
  const fm = new MemoryFileManager({ iCloud });
  const alerts = [];
  const responses = [...alertResponses];

  class Alert {
    constructor() {
      this.title = '';
      this.message = '';
      this.actions = [];
      this.textFields = [];
      alerts.push(this);
    }
    addAction(title) {
      this.actions.push(title);
    }
    addDestructiveAction(title) {
      this.actions.push(title);
    }
    addCancelAction(title) {
      this.cancelAction = title;
    }
    addTextField(_placeholder, text = '') {
      this.textFields.push(text);
      return {};
    }
    textFieldValue(i) {
      return this.textFields[i];
    }
    async presentAlert() {
      return responses.length ? responses.shift() : 0;
    }
    async present() {
      return this.presentAlert();
    }
    async presentSheet() {
      return this.presentAlert();
    }
  }

  class UITableRow {
    constructor() {
      this.cells = [];
    }
    addText(title, subtitle) {
      const cell = { title, subtitle };
      this.cells.push(cell);
      return cell;
    }
    addButton(title) {
      const cell = { title };
      this.cells.push(cell);
      return cell;
    }
  }

  class UITable {
    constructor() {
      this.rows = [];
    }
    addRow(row) {
      this.rows.push(row);
    }
    removeAllRows() {
      this.rows = [];
    }
    reload() {}
    async present() {}
  }

  class Request {
    constructor(url) {
      this.url = url;
      this.response = { statusCode: 404 };
    }
    async loadString() {
      const body = requests[this.url];
      this.response = { statusCode: body === undefined ? 404 : 200 };
      return body ?? '';
    }
    async loadJSON() {
      return JSON.parse(await this.loadString());
    }
  }

  const color = (name) => ({ name });

  return {
    fm,
    alerts,
    globals: {
      FileManager: { iCloud: () => fm, local: () => fm },
      Alert,
      UITable,
      UITableRow,
      Request,
      Color: {
        red: () => color('red'),
        green: () => color('green'),
        gray: () => color('gray'),
        blue: () => color('blue'),
      },
      Font: { boldSystemFont: (size) => ({ size, bold: true }), systemFont: (size) => ({ size }) },
      Timer: { schedule: (ms, repeats, cb) => setTimeout(cb, 0) },
      Contact: { all: async () => [] },
      ContactsContainer: { all: async () => [] },
      Message: class {
        async send() {}
      },
      QuickLook: { present: async () => {} },
      Safari: { open: () => {} },
      Script: { name: () => 'Undercover', complete: () => {} },
      config: { runsInApp: true, runsInWidget: false },
      args: { queryParameters: {} },
    },
  };
}

// Functions and state exposed to the tests by loadScript().
const EXPORTS = [
  'APP_VERSION',
  'LANG',
  'EMBEDDED_WORDS',
  'parseWordList',
  'loadWordPool',
  'loadUsedWords',
  'resetUsedWords',
  'remainingGroups',
  'pickPair',
  'shuffle',
  'normalizePhone',
  'isValidPhone',
  'assignRoles',
  'buildTurnOrder',
  'computeEndGameStats',
  'ensureStorage',
  'listFilePath',
  'usedWordsPath',
];

// Loads a game script without running main(): its final `await main();` is replaced by a return of its internals.
export async function loadScript(file, env = createScriptableEnv()) {
  const source = readFileSync(file, 'utf8');
  const ending = /await main\(\);\s*$/;
  if (!ending.test(source)) throw new Error(`${file} does not end with "await main();"`);
  const exported = `return { ${EXPORTS.join(', ')}, get appState() { return appState; }, get sessionConfig() { return sessionConfig; } };`;
  const body = source.replace(ending, exported);
  const names = Object.keys(env.globals);
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const run = new AsyncFunction(...names, body);
  const script = await run(...names.map((n) => env.globals[n]));
  return { script, env };
}
