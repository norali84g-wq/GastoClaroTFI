import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { check, resolveConfig } from 'prettier';

const eslint = new ESLint();
const formatter = await eslint.loadFormatter('stylish');
const paths = readFileSync(0, 'utf8').split('\0').filter(Boolean);
for (const path of paths) {
  const filePath = path.slice('frontend/'.length);
  if (!/\.(jsx?|css|html|md|json|webmanifest)$/.test(filePath) || filePath === 'package-lock.json')
    continue;
  const source = execFileSync('git', ['show', `:${path}`], { encoding: 'utf8' });
  if (/\.(js|jsx)$/.test(filePath)) {
    const results = await eslint.lintText(source, { filePath });
    if (results.some((result) => result.errorCount || result.warningCount)) {
      console.error(formatter.format(results));
      process.exitCode = 1;
    }
  }
  if (!(await check(source, { ...(await resolveConfig(filePath)), filepath: filePath }))) {
    console.error(
      `Formato pendiente: ${path}. Corré npm run format y volvé a preparar el archivo.`,
    );
    process.exitCode = 1;
  }
}
