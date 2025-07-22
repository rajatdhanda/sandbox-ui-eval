// scripts/refactor-imports.js
// Path: scripts/refactor-imports.js

const fs = require('fs');
const path = require('path');

const replacements = [
  {
    // Replace button-styles imports
    from: /import\s+{\s*buttonStyles\s*}\s+from\s+['"]\..*?button-styles['"]/g,
    to: "import { formControlStyles } from './form-controls'"
  },
  {
    // Replace ConfirmButton imports
    from: /import\s+{\s*ConfirmButton\s*}\s+from\s+['"]\..*?confirm-button['"]/g,
    to: "import { ConfirmButton } from './form-controls'"
  },
  {
    // Replace StatusButton imports
    from: /import\s+{\s*StatusButton\s*}\s+from\s+['"]\..*?status-button['"]/g,
    to: "import { StatusButton } from './form-controls'"
  },
  {
    // Update buttonStyles references to formControlStyles
    from: /buttonStyles\.(standard|compact|text|textSmall)/g,
    to: (match, p1) => {
      const mappings = {
        'standard': 'formControlStyles.button.sizes.md',
        'compact': 'formControlStyles.button.sizes.sm',
        'text': 'formControlStyles.text.sizes.md',
        'textSmall': 'formControlStyles.text.sizes.sm'
      };
      return mappings[p1] || match;
    }
  }
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Find all TypeScript files
function findFiles(dir, pattern = /\.(tsx?|jsx?)$/) {
  const files = [];
  
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.')) {
      files.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(file)) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// Run the refactoring
const files = findFiles('./app');
files.forEach(updateFile);
console.log(`\n✨ Refactored ${files.length} files`);