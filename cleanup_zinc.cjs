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
      
      const original = content;

      content = content.replace(/hover:bg-zinc-300:bg-zinc-800/g, 'hover:bg-zinc-800');
      content = content.replace(/text-zinc-600/g, 'text-zinc-500');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned up zinc issues in ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components');
processDirectory('./src/pages');
processDirectory('./src/lib');
