#!/bin/bash
set -e

echo "========================================="
echo "AI-CLICKER TEST DIAGNOSTICS REPORT"
echo "Generated: $(date)"
echo "========================================="

echo ""
echo "1. ENVIRONMENT"
echo "---"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Jest version: $(npm list jest | head -1)"
echo "OS: $(uname -a)"

echo ""
echo "2. PROJECT STRUCTURE"
echo "---"
echo "Total JS files in src/: $(find src -name "*.js" | wc -l)"
echo "Total test files: $(find . -name "*.test.js" -o -name "*.spec.js" | wc -l)"
echo "node_modules size: $(du -sh node_modules | cut -f1)"

echo ""
echo "3. CONFIGURATION FILES"
echo "---"
ls -la jest.config.cjs .babelrc .eslintrc* 2>/dev/null || echo "Some config files missing"

echo ""
echo "4. CRITICAL FILES STATUS"
echo "---"
for file in src/common/validator.js src/common/logger.js src/background/index.js src/common/helpers.js; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")
    echo "✓ $file ($lines lines)"
  else
    echo "✗ $file MISSING"
  fi
done

echo ""
echo "5. RUNNING TESTS WITH DIAGNOSTICS"
echo "---"
npm test -- --no-coverage --listTests 2>&1 | head -20

echo ""
echo "DIAGNOSTICS COMPLETE"