const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-white dark:bg-black': 'bg-black',
  'text-black dark:text-white': 'text-white',
  'bg-zinc-50 dark:bg-\\[#0a0a0a\\]': 'bg-[#0a0a0a]',
  'bg-zinc-100 dark:bg-\\[#111\\]': 'bg-[#111]',
  'bg-zinc-200 dark:bg-\\[#1a1a1a\\]': 'bg-[#1a1a1a]',
  'bg-zinc-100 dark:bg-\\[#0d0d0d\\]': 'bg-[#0d0d0d]',
  'border-zinc-200 dark:border-zinc-900': 'border-zinc-900',
  'border-zinc-300 dark:border-zinc-800': 'border-zinc-800',
  'border-zinc-400 dark:border-zinc-700': 'border-zinc-700',
  'text-zinc-600 dark:text-zinc-500': 'text-zinc-500',
  'text-zinc-500 dark:text-zinc-400': 'text-zinc-400',
  'text-zinc-700 dark:text-zinc-300': 'text-zinc-300',
  'bg-zinc-200 dark:bg-zinc-900': 'bg-zinc-900',
  'hover:bg-zinc-200 dark:hover:bg-zinc-800': 'hover:bg-zinc-800',
  'hover:border-zinc-300 dark:hover:border-zinc-700': 'hover:border-zinc-700',
  'bg-zinc-100 dark:bg-zinc-950': 'bg-zinc-950',
  'bg-white/80 dark:bg-black/80': 'bg-black/80',
  'selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black': 'selection:bg-zinc-800 selection:text-white'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [find, replace] of Object.entries(replacements)) {
        const regex = new RegExp(find, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      }
      
      const opacityRegex = /bg-white\/(\d+) dark:bg-black\/\d+/g;
      if (opacityRegex.test(content)) {
        content = content.replace(opacityRegex, 'bg-black/$1');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Reverted ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components');
processDirectory('./src/pages');
processDirectory('./src/lib');
