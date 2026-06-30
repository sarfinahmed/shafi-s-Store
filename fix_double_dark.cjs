const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let changed = false;
      const regex = /dark:text-zinc-500 dark:text-zinc-400/g;
      if (regex.test(content)) {
        content = content.replace(regex, 'dark:text-zinc-400');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed double dark in ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components');
processDirectory('./src/pages');
processDirectory('./src/lib');

