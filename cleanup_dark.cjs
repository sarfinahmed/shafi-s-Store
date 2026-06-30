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

      // Match "dark:SOMETHING" and remove it if there is a space before it
      content = content.replace(/\s+dark:[a-zA-Z0-9-\[\]\/]+/g, '');
      // Match if it's the only class or at the start
      content = content.replace(/dark:[a-zA-Z0-9-\[\]\/]+\s+/g, '');
      // Match if just left alone
      content = content.replace(/dark:[a-zA-Z0-9-\[\]\/]+/g, '');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned up dark classes in ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components');
processDirectory('./src/pages');
processDirectory('./src/lib');
