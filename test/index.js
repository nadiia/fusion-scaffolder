const test = require('tape');
const fs = require('fs');
const {join} = require('path');
const {promisify} = require('util');
const rimrafCb = require('rimraf');
const scaffold = require('../');

const stat = promisify(fs.stat);
const rimraf = promisify(rimrafCb);
const readFile = promisify(fs.readFile);

test('scaffolding with no path', async t => {
  try {
    await scaffold();
  } catch (e) {
    t.ok(e instanceof Error, 'errors out');
    t.end();
  }
});

test('scaffolding with no files in template', async t => {
  try {
    await scaffold({
      path: './test/fixtures/nofiles',
    });
  } catch (e) {
    t.ok(e instanceof Error, 'errors out');
    t.end();
  }
});

test('scaffolding with no project name', async t => {
  try {
    await scaffold({
      cwd: __dirname,
      path: './fixtures/example',
    });
  } catch (e) {
    t.ok(e instanceof Error, 'errors out');
    t.end();
  }
});

test('scaffolding example/', async t => {
  await scaffold({
    cwd: __dirname,
    path: './fixtures/example',
    project: 'foo',
  });

  const projectDir = join(__dirname, 'foo');

  const folderStat = await stat(projectDir);
  t.ok(folderStat.isDirectory(), 'project folder is created correctly');

  const fooJsStat = await stat(join(projectDir, 'foo.js'));
  t.ok(fooJsStat.isFile(), 'generic files are copied');
  const fooJsContent = await readFile(join(projectDir, 'foo.js'), 'utf8');
  t.ok(
    fooJsContent === 'module.exports = {};\n',
    'generic file content is correct'
  );

  const packageJsonStat = await stat(join(projectDir, 'package.json'));
  t.ok(
    packageJsonStat.isFile(),
    '.njk files are written without .njk file extension'
  );
  const packageJsonContent = await readFile(
    join(projectDir, 'package.json'),
    'utf8'
  );
  t.ok(
    packageJsonContent === `{\n  "name": "foo"\n}\n`,
    '.njk files are compiled correctly'
  );

  const dotGitignoreStat = await stat(join(projectDir, '.gitignore'));
  t.ok(dotGitignoreStat.isFile(), 'copies dot files');

  const scriptShStat = await stat(join(projectDir, 'script.sh'));
  t.ok(
    scriptShStat.mode === 33261,
    'executable files are copied with the same mode'
  );

  const script2ShStat = await stat(join(projectDir, 'script2.sh'));
  t.ok(
    script2ShStat.mode === 33261,
    'executable .njk files are written with the same mode'
  );

  const ctxJsStat = await stat(join(projectDir, 'ctx.js'));
  t.ok(ctxJsStat.isFile(), 'writes ctx.js correctly');
  const ctxJsContent = await readFile(join(projectDir, 'ctx.js'), 'utf8');
  t.ok(
    ctxJsContent === "module.exports = 'bar';\n",
    'handles additional context from index.js correctly'
  );

  await rimraf(projectDir);
  await t.end();
});
