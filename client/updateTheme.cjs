const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const jsxFiles = walkSync('src');

const replacements = [
  { from: /bg-\\[#0b1120\\]/g, to: 'bg-slate-50' },
  { from: /bg-slate-900\/40/g, to: 'bg-white/80' },
  { from: /bg-slate-900\/50/g, to: 'bg-white/90' },
  { from: /bg-slate-900\/60/g, to: 'bg-white/90' },
  { from: /bg-slate-900/g, to: 'bg-white' },
  { from: /bg-slate-800\/30/g, to: 'bg-blue-50' },
  { from: /bg-slate-800\/50/g, to: 'bg-blue-50' },
  { from: /bg-slate-800\/80/g, to: 'bg-blue-100/50' },
  { from: /bg-slate-800/g, to: 'bg-blue-50' },
  { from: /bg-slate-700\/50/g, to: 'border-blue-200' },
  { from: /bg-slate-700\/40/g, to: 'border-blue-200' },
  { from: /bg-slate-700/g, to: 'bg-blue-100' },
  { from: /border-slate-700\/50/g, to: 'border-blue-200' },
  { from: /border-slate-700\/40/g, to: 'border-blue-200' },
  { from: /border-slate-700/g, to: 'border-blue-200' },
  { from: /border-slate-600\/50/g, to: 'border-blue-300' },
  { from: /border-slate-600/g, to: 'border-blue-300' },
  { from: /border-white\/10/g, to: 'border-blue-500/20' },
  { from: /text-slate-200/g, to: 'text-slate-700' },
  { from: /text-slate-300/g, to: 'text-slate-600' },
  { from: /text-slate-400/g, to: 'text-slate-500' },
  { from: /text-slate-500/g, to: 'text-blue-500/80' },
  { from: /from-white via-blue-100 to-slate-400/g, to: 'from-blue-900 via-blue-700 to-blue-500' },
  { from: /text-white/g, to: 'text-blue-950' }, 
  { from: /bg-black\/30/g, to: 'bg-slate-100' },
  { from: /radial-gradient\(#334155/g, to: 'radial-gradient(#cbd5e1' }
];

jsxFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(rep => {
    content = content.replace(rep.from, rep.to);
  });
  // Special fix for text-white in buttons and gradient icons
  content = content.replace(/className="text-blue-950"/g, 'className="text-white"');
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});

// Update index.css separately
let cssPath = 'src/index.css';
if(fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  cssContent = cssContent.replace(/bg-\\[#0b1120\\]/g, 'bg-slate-50');
  cssContent = cssContent.replace(/text-slate-200/g, 'text-slate-800');
  cssContent = cssContent.replace(/bg-slate-900\/40/g, 'bg-white/80');
  cssContent = cssContent.replace(/border-slate-700\/40/g, 'border-blue-200/40');
  cssContent = cssContent.replace(/bg-slate-800\/50/g, 'bg-blue-50/50');
  cssContent = cssContent.replace(/border-slate-600\/50/g, 'border-blue-300/50');
  cssContent = cssContent.replace(/text-white/g, 'text-slate-800');
  
  // Specific fix for .btn-primary text color which we just converted to slate-800
  cssContent = cssContent.replace(/.btn-primary \{\n    @apply px-5 py-2.5 bg-gradient-to-r from-blue-600 to-primary-500 hover:from-blue-500 hover:to-primary-400 text-slate-800/, 
    '.btn-primary {\n    @apply px-5 py-2.5 bg-gradient-to-r from-blue-600 to-primary-500 hover:from-blue-500 hover:to-primary-400 text-white');
  
  fs.writeFileSync(cssPath, cssContent);
  console.log('Updated ' + cssPath);
}

