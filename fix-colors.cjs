const fs = require('fs');

// Fix index.css
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/oklch\(([^)]+)\)/g, '$1');
fs.writeFileSync('src/index.css', css);

// Fix tailwind.config.ts
let tw = fs.readFileSync('tailwind.config.ts', 'utf8');
tw = tw.replace(/:\s*'var\(--([^)]+)\)'/g, ': \'oklch(var(--$1) / <alpha-value>)\'');
fs.writeFileSync('tailwind.config.ts', tw);
