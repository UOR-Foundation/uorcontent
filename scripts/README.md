# UOR Framework Content Scripts

This directory contains utility scripts for working with UOR Framework content.

## Content Connectivity Scripts

### validate-content-connectivity.js

Validates that all content (concepts, resources, predicates) is properly connected through the topic hierarchy.

```bash
node validate-content-connectivity.js -d ../converted
```

Options:
- `-d, --directory <path>`: Path to the converted content directory (default: './content/converted')
- `-v, --verbose`: Display detailed validation information
- `--fix`: Suggest fixes for disconnected content (does not modify files)

### fix-content-connectivity.js

Generates fix files to solve connectivity issues in the content.

```bash
node fix-content-connectivity.js -d ../converted -o ../fixes
```

Options:
- `-d, --directory <path>`: Path to the converted content directory (default: './content/converted')
- `-o, --output <path>`: Directory to write fix files to (default: './content/fixes')
- `-v, --verbose`: Display detailed information
- `--dry-run`: Show what would be done without making changes

### apply-connectivity-fixes.js

Applies generated fixes to solve connectivity issues.

```bash
node apply-connectivity-fixes.js
```

Options:
- `-c, --content-dir <path>`: Path to the converted content directory (default: './content/converted')
- `-f, --fixes-dir <path>`: Path to the fixes directory (default: './content/fixes')
- `-v, --verbose`: Display detailed information
- `--dry-run`: Show what would be done without making changes
- `--cleanup`: Remove the fix predicates and start fresh

## Usage Workflow

1. **Validate Content**
   ```bash
   node validate-content-connectivity.js -d ../converted
   ```

2. **Generate Fixes**
   ```bash
   node fix-content-connectivity.js -d ../converted -o ../fixes
   ```

3. **Apply Fixes**
   ```bash
   node apply-connectivity-fixes.js
   ```

4. **Re-validate Content**
   ```bash
   node validate-content-connectivity.js -d ../converted
   ```

5. **Regenerate Indexes**
   ```bash
   cd ../utils && node generate-index.js -d ../converted -o ../converted/index
   ```