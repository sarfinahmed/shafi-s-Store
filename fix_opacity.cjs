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
      
      // Fix bg-black with opacity
      let changed = false;
      const regex = /bg-white dark:bg-black\/(\d+)/g;
      if (regex.test(content)) {
        content = content.replace(regex, 'bg-black/$1 dark:bg-black/$1'); // wait, if it was bg-black/60 it should be bg-black/60 for light mode? actually bg-white/60 dark:bg-black/60
        changed = true;
      }
      
      // Let's actually replace bg-white dark:bg-black/(\d+) with bg-white/$1 dark:bg-black/$1
      content = content.replace(/bg-white dark:bg-black\/(\d+)/g, 'bg-white/$1 dark:bg-black/$1');
      
      // Oh wait, I just did `content = content.replace(...)`.
      // It's better to just re-read and replace.
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

// Read the files and replace
const allFiles = [
  'src/pages/Home.tsx',
  'src/pages/ProductDetail.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Admin.tsx',
  'src/components/Layout.tsx',
  'src/components/GlobalMaintenance.tsx'
];

allFiles.forEach(fullPath => {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (/bg-white dark:bg-black\/\d+/.test(content)) {
        content = content.replace(/bg-white dark:bg-black\/(\d+)/g, 'bg-white/$1 dark:bg-black/$1');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed opacity in ${fullPath}`);
    }
});

