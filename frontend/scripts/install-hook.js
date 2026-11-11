import { execFileSync, spawnSync } from 'node:child_process';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const result = spawnSync('git', ['-C', root, 'config', '--get', 'core.hooksPath'], {
  encoding: 'utf8',
});
const hookPath = 'frontend/.githooks';
if (result.status === 0 && result.stdout.trim() !== hookPath) {
  console.error(
    'El repo ya tiene hooks configurados. Integrá el pre-commit existente antes de reemplazarlo.',
  );
  process.exitCode = 1;
} else if (result.status !== 0 && result.status !== 1) {
  process.exitCode = 1;
} else {
  execFileSync('git', ['-C', root, 'config', 'core.hooksPath', hookPath]);
  console.log('Pre-commit de frontend habilitado para este clon.');
}
