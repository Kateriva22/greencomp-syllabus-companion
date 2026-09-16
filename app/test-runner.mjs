import { readFileSync } from 'fs';
import { segmentDocument } from './dist/lib/parsing/sectionSegmenter.js';
import { analyzeDocument } from './dist/lib/analysis/engine.js';

const markdown = readFileSync('../test-cases/test-case-01/input_syllabus.md', 'utf-8');
const sections = segmentDocument(markdown);

console.log('Sections found:');
sections.forEach(s => {
  console.log(`  - ${s.kind}: "${s.heading.slice(0,50)}..."`);
});

const result = analyzeDocument({
  sections,
  document: { title: 'Test', sourceType: 'text' },
  cycle: 'P4-P5'
});

console.log('\n\nSuggestions:');
result.suggestions.forEach(s => {
  console.log(`\n${s.id}: ${s.category}`);
  console.log(`  Priority: ${s.priority}, Confidence: ${s.confidence}`);
  console.log(`  Location: ${s.location}`);
  console.log(`  Excerpt: ${s.current_excerpt.slice(0,80)}...`);
});

console.log('\n\nCoverage:');
Object.entries(result.coverage).forEach(([id, level]) => {
  if (level !== 0) console.log(`  ${id}: ${level}`);
});

console.log('\n\nStrengths:', result.strengths.length);
result.strengths.forEach(s => {
  console.log(`  - ${s.evidence}`);
});
