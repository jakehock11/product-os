import { rcedit } from 'rcedit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const exePath = path.join(projectRoot, 'release', 'win-unpacked', 'Product OS.exe');
const iconPath = path.join(projectRoot, 'build', 'icon.ico');

console.log('Embedding icon and version info...');
console.log('Exe:', exePath);
console.log('Icon:', iconPath);

await rcedit(exePath, {
  icon: iconPath,
  'version-string': {
    ProductName: 'Product OS',
    FileDescription: 'Product OS Application',
    CompanyName: 'Product OS',
    InternalName: 'Product OS',
    OriginalFilename: 'Product OS.exe'
  }
});

console.log('Successfully updated exe!');
