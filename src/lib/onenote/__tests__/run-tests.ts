import { OneNoteParserService, parseContentToBlocks, structurePagesFromBlocks } from '../parser';
import JSZip from 'jszip';

async function runTests() {
  console.log('🧪 Running OneNote Parser & Normalizer Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Test Block Normalization
  console.log('--- 1. Block Normalizer Tests ---');
  const sampleMarkdown = `
# Chapter 1: Thermodynamics
This is the introductory paragraph on heat engines.

## 1.1 First Law of Thermodynamics
- Energy cannot be created or destroyed
- Heat added = change in internal energy + work done

1. Isothermal process
2. Adiabatic process

[ ] Review Carnot Cycle formula
[x] Complete problem set 1

> Note: Efficiency is always less than 100%.

\`\`\`python
def thermal_efficiency(q_in, q_out):
    return 1 - (q_out / q_in)
\`\`\`

| Cycle | Working Fluid | Efficiency |
| Carnot | Ideal Gas | 1 - Tc/Th |
| Rankine | Water/Steam | High |
`;

  const blocks = parseContentToBlocks(sampleMarkdown);
  assert(blocks.length > 5, 'Should parse multiple block types');
  assert(blocks.some(b => b.type === 'heading' && b.level === 1), 'Should parse H1 heading');
  assert(blocks.some(b => b.type === 'heading' && b.level === 2), 'Should parse H2 heading');
  assert(blocks.some(b => b.type === 'list' && !b.ordered), 'Should parse unordered bullet list');
  assert(blocks.some(b => b.type === 'list' && b.ordered), 'Should parse ordered numbered list');
  assert(blocks.some(b => b.type === 'task' && b.checked), 'Should parse completed task');
  assert(blocks.some(b => b.type === 'task' && !b.checked), 'Should parse pending task');
  assert(blocks.some(b => b.type === 'quote'), 'Should parse blockquote');
  assert(blocks.some(b => b.type === 'code'), 'Should parse code block');
  assert(blocks.some(b => b.type === 'table'), 'Should parse table block');

  // 2. Test Page Structuring
  console.log('\n--- 2. Page Structuring Tests ---');
  const pages = structurePagesFromBlocks(blocks, 'Default Title');
  assert(pages.length >= 1, 'Should create at least one structured page');
  assert(pages[0].title === 'Chapter 1: Thermodynamics', 'Should use H1 heading as page title');
  assert(pages[0].blocks.length > 0, 'Page should contain structured blocks');

  // 3. Test .onepkg Package Extraction
  console.log('\n--- 3. .onepkg Multi-Section Package Tests ---');
  const zip = new JSZip();
  zip.file('Section 1 - Heat.one', Buffer.from('# Heat & Temperature\nThermal equilibrium notes.'));
  zip.file('Section 2 - Entropy.one', Buffer.from('# Entropy & Disorder\nSecond law notes.'));
  zip.file('Open Notebook.onetoc2', Buffer.from('metadata toc'));

  const pkgBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  const doc = await OneNoteParserService.parseOneNoteBuffer(pkgBuffer, 'Physics_Notebook.onepkg');

  assert(doc.type === 'onenote', 'Doc type should be onenote');
  assert(doc.isPackage === true, 'Doc should be identified as a package');
  assert(doc.totalSections === 2, 'Should extract 2 sections from .onepkg');
  assert(doc.sections.some(s => s.name.includes('Section 1 - Heat')), 'Should have Section 1');
  assert(doc.sections.some(s => s.name.includes('Section 2 - Entropy')), 'Should have Section 2');

  // 4. Test Security: Path Traversal & Suspicious Entries
  console.log('\n--- 4. Security & Path Traversal Tests ---');
  const maliciousZip = new JSZip();
  maliciousZip.file('../../etc/passwd.one', Buffer.from('malicious content'));
  maliciousZip.file('Valid_Section.one', Buffer.from('# Valid Section\nSafe content.'));

  const maliciousBuffer = await maliciousZip.generateAsync({ type: 'arraybuffer' });
  const safeDoc = await OneNoteParserService.parseOneNoteBuffer(maliciousBuffer, 'Test.onepkg');

  assert(!safeDoc.sections.some(s => s.name.includes('passwd')), 'Path traversal entry should be skipped');
  assert(safeDoc.sections.some(s => s.name.includes('Valid_Section')), 'Valid section should be extracted');

  // Summary
  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
