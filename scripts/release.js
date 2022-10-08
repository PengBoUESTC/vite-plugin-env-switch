const args = require('minimist')(process.argv.slice(2));
const semver = require('semver');
const chalk = require('chalk');
const execa = require('execa');
const path = require('path');
const fs = require('fs');

const { prompt } = require('enquirer');

const versionIncrements = [
  'patch',
  'minor',
  'major',
];

const currentVersion = require('../package.json').version;

const inc = i => semver.inc(currentVersion, i);
const step = (message) => console.log(chalk.cyan(message));
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts });

const updateVersions = (version) => {
  // get root package.json
  const rootPkgPath = path.resolve(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(rootPkgPath));
  pkg.version = version;
  fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n');
};

const getReleaseBranch = async () => {
  const { stdout: curBranch } = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { stdio: 'pipe' });
  return curBranch;
};

async function main() {
  step('release...');
  const curBranch = await getReleaseBranch();
  if(curBranch !== 'master') {
    throw new Error(`release only for master; current branch is ${curBranch}`);
  }
  let targetVersion = args._[0];

  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(['custom'])
    });

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion
        })
      ).version;
    } else {
      targetVersion = release.match(/\((.*)\)/)[1];
    }
  }
  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`);
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`
  });
  if(!yes) return;

  step('\nstart building...');
  await run('npm', ['run', 'build']);

  step('\nUpdating pkg version...');
  updateVersions(targetVersion);

  // generate changelog
  step('\nGenerating changelog...');
  await run('npm', ['run', 'changelog']);

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' });
  if(stdout) {
    step('\nCommitting changes...');
    await run('git', ['add', '-A']);
    await run('git', ['commit', '-m', `release: ${targetVersion}`]);
  }else {
    console.log(chalk.red('\n Nothing change...'));
  }

  step('\nPushing to GitHub...');
  await run('git', ['tag', `v${targetVersion}`]);
  await run('git', ['push', 'origin', 'master']);
  step('\nDONE');
}

main().catch(e => {
  console.log(e);
});