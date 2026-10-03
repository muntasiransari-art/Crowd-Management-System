const fs = require('fs');

const pageFile = 'src/app/page.tsx';
let content = fs.readFileSync(pageFile, 'utf8');

const replacements = [
  { regex: /attendeeage/g, replace: 'event' },
  { regex: /spiritual experience/g, replace: 'amazing experience' },
  { regex: /Morning Aarti/g, replace: 'Gate Opens' },
  { regex: /Special Pooja/g, replace: 'Main Act Begins' },
  { regex: /Evening Aarti/g, replace: 'Encore Performance' },
  { regex: /Prasad Counter/g, replace: 'Merchandise Stand' },
  { regex: /Main Sanctum/g, replace: 'Main Stage' },
  { regex: /poojas/g, replace: 'performances' },
  { regex: /devotees/g, replace: 'fans' },
  { regex: /Book Darshan/g, replace: 'Buy Tickets' },
];

for (const { regex, replace } of replacements) {
  content = content.replace(regex, replace);
}

fs.writeFileSync(pageFile, content, 'utf8');
console.log('UI text in page.tsx updated for general events.');
