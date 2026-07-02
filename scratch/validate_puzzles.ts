import fs from 'fs';
import path from 'path';
import { JsonValidator } from '../src/core/chess/JsonValidator';

const puzzlesDir = path.join(process.cwd(), 'src/data/puzzles');
const files = fs.readdirSync(puzzlesDir).filter(f => f.endsWith('.json'));

let hasErrors = false;

for (const file of files) {
  const filePath = path.join(puzzlesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`\nValidating ${file}...`);
  const result = JsonValidator.validate(data);
  
  if (result.success) {
    console.log(`✅ Success! Found ${result.puzzles?.length} valid puzzles.`);
    if (result.warnings && result.warnings.length > 0) {
      console.log(`⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(w => console.log(`   - ${w}`));
    }
  } else {
    console.log(`❌ FAILED! Error: ${result.error}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}
