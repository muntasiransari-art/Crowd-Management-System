const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_PROCESS = ['src', 'scripts'];

// 1. Rename files and directories
const renames = [
  ['src/models/temple.model.ts', 'src/models/venue.model.ts'],
  ['src/app/(dashboard)/temple', 'src/app/(dashboard)/organizer'],
  ['src/app/(dashboard)/pilgrim', 'src/app/(dashboard)/attendee'],
  ['src/app/api/temple', 'src/app/api/venue'],
  ['src/app/api/temples', 'src/app/api/venues'],
  ['src/app/api/pilgrim', 'src/app/api/attendee'],
  ['scripts/seed-temple.ts', 'scripts/seed-venue.ts'],
  ['scripts/seed-temples.ts', 'scripts/seed-venues.ts'],
  ['scripts/seed-pilgrim.ts', 'scripts/seed-attendee.ts'],
];

for (const [oldPath, newPath] of renames) {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldPath} -> ${newPath}`);
  }
}

// 2. Global Search and Replace
const replacements = [
  { regex: /PilgrimGuard/g, replace: 'EventGuard' },
  { regex: /pilgrimguard/g, replace: 'eventguard' },
  { regex: /Temple/g, replace: 'Venue' },
  { regex: /temple/g, replace: 'venue' },
  { regex: /Temples/g, replace: 'Venues' },
  { regex: /temples/g, replace: 'venues' },
  { regex: /Pilgrim/g, replace: 'Attendee' },
  { regex: /pilgrim/g, replace: 'attendee' },
  { regex: /Darshan/g, replace: 'Entry' },
  { regex: /darshan/g, replace: 'entry' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json') || fullPath.endsWith('.md'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

for (const dir of DIRECTORIES_TO_PROCESS) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
}

console.log("Refactoring complete!");
