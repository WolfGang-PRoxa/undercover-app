import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadScript } from './scriptable-mock.js';

const root = new URL('../', import.meta.url);
const readJson = (file) => JSON.parse(readFileSync(new URL(file, root), 'utf8'));

const GAMES = [
  { lang: 'en', file: 'undercover_en.js', roles: { civil: 'Civilian', infil: 'Undercover', mw: 'Mr. White' } },
  { lang: 'fr', file: 'undercover_fr.js', roles: { civil: 'Civil', infil: 'Infiltré', mw: 'Mister White' } },
];

const makePlayers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    name: `Player ${i + 1}`,
    phone: `+3360000000${i}`,
    score: 0,
    roles: {
      civil: { played: 0, won: 0, lost: 0 },
      infiltre: { played: 0, won: 0, lost: 0 },
      mrwhite: { played: 0, won: 0, lost: 0 },
    },
  }));

async function load(file) {
  const { script, env } = await loadScript(new URL(file, root));
  script.ensureStorage();
  return { script, env };
}

it('both scripts share the same X.Y.Z version', async () => {
  const [en, fr] = await Promise.all(GAMES.map((g) => load(g.file)));
  assert.match(en.script.APP_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(fr.script.APP_VERSION, en.script.APP_VERSION);
});

it('every official list in lists/index.json exists and is valid', async () => {
  const { script } = await load('undercover_en.js');
  const index = readJson('lists/index.json');
  for (const [lang, names] of Object.entries(index)) {
    assert.ok(names.length > 0, `no list for ${lang}`);
    for (const name of names) {
      assert.ok(existsSync(new URL(`lists/${name}.json`, root)), `lists/${name}.json is missing`);
      const groups = script.parseWordList(readJson(`lists/${name}.json`));
      assert.ok(groups.length > 0, `lists/${name}.json has no valid group`);
      assert.ok(
        groups.every((g) => g.words.length >= 2),
        `lists/${name}.json has a group with fewer than 2 words`,
      );
    }
  }
});

for (const game of GAMES) {
  describe(`${game.file}`, () => {
    it('embeds the full default list', async () => {
      const { script } = await load(game.file);
      assert.equal(script.LANG, game.lang);
      assert.deepEqual(script.EMBEDDED_WORDS, readJson(`lists/default_${game.lang}.json`));
    });

    describe('parseWordList', () => {
      it('reads groups, trims words and drops duplicates', async () => {
        const { script } = await load(game.file);
        const groups = script.parseWordList([
          [' Dog ', 'Cat', 'Wolf', 'Cat'],
          ['Wolf', 'Dog', 'Cat'],
          ['Alone'],
          'not a group',
          ['Sun', 'Moon', 42],
        ]);
        assert.deepEqual(
          groups.map((g) => g.words),
          [
            ['Dog', 'Cat', 'Wolf'],
            ['Sun', 'Moon'],
          ],
        );
        assert.ok(groups.every((g) => g.fixed === false));
      });

      it('supports the legacy pair format', async () => {
        const { script } = await load(game.file);
        const groups = script.parseWordList([
          { civil: 'Tea', undercover: 'Coffee' },
          { civil: 'Same', undercover: 'Same' },
          { civil: 'Missing' },
        ]);
        assert.deepEqual(groups, [{ id: 'Tea|Coffee', words: ['Tea', 'Coffee'], fixed: true }]);
      });

      it('returns an empty list for invalid data', async () => {
        const { script } = await load(game.file);
        assert.deepEqual(script.parseWordList(null), []);
        assert.deepEqual(script.parseWordList({ words: [] }), []);
      });
    });

    describe('word draw', () => {
      it('falls back to the embedded list when the active list is missing', async () => {
        const { script } = await load(game.file);
        const pool = script.loadWordPool('does_not_exist');
        assert.equal(pool.missing, true);
        assert.equal(pool.groups.length, script.EMBEDDED_WORDS.length);
      });

      it('loads a list from the lists folder', async () => {
        const { script, env } = await load(game.file);
        env.fm.writeString(script.listFilePath('custom'), JSON.stringify([['A', 'B', 'C']]));
        const pool = script.loadWordPool('custom');
        assert.equal(pool.missing, false);
        assert.equal(pool.key, 'custom');
        assert.equal(pool.groups.length, 1);
      });

      it('draws two different words of the same group', async () => {
        const { script } = await load(game.file);
        const pool = script.loadWordPool(null);
        for (let i = 0; i < 20; i++) {
          const pair = script.pickPair(pool);
          assert.notEqual(pair.civil, pair.undercover);
          assert.ok(pair.words.includes(pair.civil) && pair.words.includes(pair.undercover));
        }
      });

      it('never draws the same group twice until the list is exhausted, then can be reset', async () => {
        const { script } = await load(game.file);
        const groups = [
          ['A1', 'A2', 'A3'],
          ['B1', 'B2', 'B3'],
          ['C1', 'C2', 'C3'],
        ];
        const pool = { key: 'test', label: 'test', groups: script.parseWordList(groups), missing: false };

        const drawn = [];
        for (let i = 0; i < groups.length; i++) {
          const pair = script.pickPair(pool);
          assert.equal(pair.remaining, groups.length - i - 1);
          assert.equal(pair.total, groups.length);
          drawn.push(pair.civil[0]);
        }
        assert.deepEqual([...drawn].sort(), ['A', 'B', 'C']);
        assert.equal(script.pickPair(pool), null);
        assert.equal(script.remainingGroups(pool).length, 0);

        script.resetUsedWords(pool.key);
        assert.equal(script.remainingGroups(pool).length, groups.length);
        assert.ok(script.pickPair(pool));
      });

      it('keeps the civil / undercover order of a legacy pair', async () => {
        const { script } = await load(game.file);
        const groups = script.parseWordList([{ civil: 'Tea', undercover: 'Coffee' }]);
        const pair = script.pickPair({ key: 'pairs', label: 'pairs', groups, missing: false });
        assert.equal(pair.civil, 'Tea');
        assert.equal(pair.undercover, 'Coffee');
      });
    });

    describe('roles', () => {
      const pair = { civil: 'Cat', undercover: 'Tiger' };

      it('assigns the requested number of each role with the right word', async () => {
        const { script } = await load(game.file);
        const players = makePlayers(8);
        const assignments = script.assignRoles(players, 2, 1, pair);
        const count = (role) => assignments.filter((a) => a.role === role).length;

        assert.equal(assignments.length, players.length);
        assert.deepEqual(new Set(assignments.map((a) => a.player.phone)), new Set(players.map((p) => p.phone)));
        assert.equal(count(game.roles.mw), 1);
        assert.equal(count(game.roles.infil), 2);
        assert.equal(count(game.roles.civil), 5);
        for (const a of assignments) {
          const expected = { [game.roles.civil]: 'Cat', [game.roles.infil]: 'Tiger', [game.roles.mw]: null };
          assert.equal(a.word, expected[a.role]);
        }
      });

      it('draws the roles at random', async () => {
        const { script } = await load(game.file);
        const players = makePlayers(5);
        const undercovers = new Set();
        for (let i = 0; i < 200; i++) {
          const a = script.assignRoles(players, 1, 0, pair).find((x) => x.role === game.roles.infil);
          undercovers.add(a.player.phone);
        }
        assert.equal(undercovers.size, players.length);
      });

      it('never lets Mr. White speak first', async () => {
        const { script } = await load(game.file);
        const players = makePlayers(4);
        for (let i = 0; i < 200; i++) {
          script.appState.game.assignments = script.assignRoles(players, 1, 2, pair);
          const phones = players.map((p) => p.phone);
          const order = script.buildTurnOrder(phones);
          assert.deepEqual([...order].sort(), [...phones].sort());
          const first = script.appState.game.assignments.find((a) => a.player.phone === order[0]);
          assert.notEqual(first.role, game.roles.mw);
        }
      });
    });

    describe('end of game', () => {
      it('gives 2 points to each Civilian when the Civilians win', async () => {
        const { script } = await load(game.file);
        const players = makePlayers(5);
        script.appState.players = players;
        script.appState.game.assignments = script.assignRoles(players, 1, 1, { civil: 'Cat', undercover: 'Tiger' });
        script.computeEndGameStats('civils');

        for (const a of script.appState.game.assignments) {
          const player = players.find((p) => p.phone === a.player.phone);
          const civilian = a.role === game.roles.civil;
          assert.equal(player.score, civilian ? 2 : 0);
          const key = civilian ? 'civil' : a.role === game.roles.infil ? 'infiltre' : 'mrwhite';
          assert.deepEqual(player.roles[key], { played: 1, won: civilian ? 1 : 0, lost: civilian ? 0 : 1 });
        }
      });

      it('gives 10 points to Undercovers and 6 to Mr. White when they win', async () => {
        const { script } = await load(game.file);
        const players = makePlayers(5);
        script.appState.players = players;
        script.appState.game.assignments = script.assignRoles(players, 1, 1, { civil: 'Cat', undercover: 'Tiger' });
        script.computeEndGameStats('infiltres');

        const points = { [game.roles.civil]: 0, [game.roles.infil]: 10, [game.roles.mw]: 6 };
        for (const a of script.appState.game.assignments) {
          assert.equal(players.find((p) => p.phone === a.player.phone).score, points[a.role]);
        }
      });
    });

    it('normalizes French phone numbers', async () => {
      const { script } = await load(game.file);
      assert.equal(script.normalizePhone('06 12-34.56 (78)'), '+33612345678');
      assert.equal(script.isValidPhone('+33612345678'), true);
      assert.equal(script.isValidPhone('0612'), false);
    });
  });
}
