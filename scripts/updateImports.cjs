const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('utils/database')) {
    content = content.replace(/from '\.\.\/utils\/database'/g, "from '../backend/types'");
    content = content.replace(/from '\.\.\/\.\.\/utils\/database'/g, "from '../../backend/types'");
    fs.writeFileSync(filePath, content);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

const dirs = ['src/stores', 'src/services', 'src/pages', 'src/backend/repositories', 'src/backend/providers'];
dirs.forEach(dir => processDir(path.join(__dirname, '..', dir)));
