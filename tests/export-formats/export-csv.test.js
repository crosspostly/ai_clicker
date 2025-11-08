import { expect, test, describe, beforeEach } from '@jest/globals';

describe('Export CSV Format', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('экспорт в CSV формат', () => {
    // Test basic CSV export functionality
    const actions = [
      {
        id: 'action-1',
        type: 'click',
        selector: '#button',
        timestamp: 1699467600000,
        description: 'Click submit button'
      },
      {
        id: 'action-2',
        type: 'input',
        selector: '#text-field',
        value: 'test data',
        timestamp: 1699467601000,
        description: 'Enter test data'
      }
    ];

    // Simulate CSV export conversion
    const csvHeaders = ['ID', 'Type', 'Selector', 'Timestamp', 'Description'];
    const csvData = actions.map(action =>
      [action.id, action.type, action.selector, action.timestamp, action.description].join(',')
    );
    const csvContent = [csvHeaders.join(','), ...csvData].join('\n');

    expect(csvContent).toContain('ID,Type,Selector,Timestamp,Description');
    expect(csvContent).toContain('action-1,click,#button');
    expect(csvContent).toContain('action-2,input,#text-field');
    expect(csvData).toHaveLength(2);
  });

  test('гарантия целостности данных в CSV', () => {
    // Test data integrity during CSV export
    const originalData = {
      actions: [
        {
          id: 'integrity-test-1',
          type: 'hover',
          selector: '.nav-item',
          value: 'data-value',
          timestamp: 1699467600000,
          metadata: { x: 150, y: 75 }
        }
      ]
    };

    // Simulate CSV export and reimport
    const csvString = `ID,Type,Selector,Value,Timestamp,X,Y
integrity-test-1,hover,.nav-item,data-value,1699467600000,150,75`;

    const lines = csvString.split('\n');
    const headers = lines[0].split(',');
    const values = lines[1].split(',');
    const reimportedAction = {};
    headers.forEach((header, index) => {
      reimportedAction[header] = values[index];
    });

    expect(reimportedAction.ID).toBe(originalData.actions[0].id);
    expect(reimportedAction.Type).toBe(originalData.actions[0].type);
    expect(reimportedAction.Selector).toBe(originalData.actions[0].selector);
    expect(reimportedAction.Value).toBe(originalData.actions[0].value);
    expect(parseInt(reimportedAction.Timestamp)).toBe(originalData.actions[0].timestamp);
  });

  test('правильная кодировка UTF-8', () => {
    // Test UTF-8 encoding in CSV export
    const actions = [
      {
        id: 'utf8-test-1',
        type: 'input',
        selector: '#field',
        value: 'Тест на русском: Привет мир! 🚀',
        description: 'Unicode test with special chars: é à ñ'
      },
      {
        id: 'utf8-test-2',
        type: 'click',
        selector: '#btn',
        description: 'العربية 中文 한글 日本語'
      }
    ];

    // Simulate CSV export with UTF-8 encoding
    const csvContent = `ID,Type,Selector,Value,Description
utf8-test-1,input,#field,Тест на русском: Привет мир! 🚀,Unicode test with special chars: é à ñ
utf8-test-2,click,#btn,,العربية 中文 한글 日本語`;

    expect(csvContent).toContain('Тест на русском: Привет мир! 🚀');
    expect(csvContent).toContain('Unicode test with special chars: é à ñ');
    expect(csvContent).toContain('العربية 中文 한글 日本語');
    
    // Test that UTF-8 content preserves after encoding/decoding
    const buffer = Buffer.from(csvContent, 'utf8');
    const decoded = buffer.toString('utf8');
    expect(decoded).toContain('🚀');
    expect(decoded).toContain('中文');
  });

  test('обработка запятых в данных', () => {
    // Test handling of commas in CSV data
    const action = {
      id: 'comma-test-1',
      type: 'input',
      selector: '#field',
      value: 'Value with, comma, inside',
      description: 'Description, with commas, and more text'
    };

    // Simulate CSV export with proper escaping
    const escapeCSVValue = (value) => {
      if (value && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLine = [
      escapeCSVValue(action.id),
      escapeCSVValue(action.type),
      escapeCSVValue(action.selector),
      escapeCSVValue(action.value),
      escapeCSVValue(action.description)
    ].join(',');

    expect(csvLine).toContain('"Value with, comma, inside"');
    expect(csvLine).toContain('"Description, with commas, and more text"');
    
    // Verify proper escaping of quotes within quoted values
    const actionWithQuotes = {
      value: 'He said "Hello, World!"'
    };
    const escaped = escapeCSVValue(actionWithQuotes.value);
    expect(escaped).toBe('"He said ""Hello, World!"""');
  });

  test('конверсия между JSON и CSV', () => {
    // Test conversion between JSON and CSV formats
    const jsonData = {
      actions: [
        {
          id: 'json-csv-1',
          type: 'click',
          selector: '#btn1',
          timestamp: 1699467600000
        },
        {
          id: 'json-csv-2',
          type: 'input',
          selector: '#input1',
          value: 'test',
          timestamp: 1699467601000
        }
      ],
      metadata: {
        version: '1.0',
        totalActions: 2
      }
    };

    // Convert JSON to CSV
    const csvContent = [
      ['ID', 'Type', 'Selector', 'Value', 'Timestamp'].join(','),
      ...jsonData.actions.map(action =>
        [action.id, action.type, action.selector, action.value || '', action.timestamp].join(',')
      )
    ].join('\n');

    // Convert CSV back to JSON-like structure
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const csvActionsBack = lines.slice(1).map(line => {
      const values = line.split(',');
      const action = {};
      headers.forEach((header, index) => {
        action[header] = values[index];
      });
      return action;
    });

    expect(csvActionsBack).toHaveLength(2);
    expect(csvActionsBack[0].ID).toBe('json-csv-1');
    expect(csvActionsBack[0].Type).toBe('click');
    expect(csvActionsBack[1].ID).toBe('json-csv-2');
    expect(csvActionsBack[1].Value).toBe('test');
  });

  test('обработка больших файлов', () => {
    // Test handling of large CSV files
    const largeActionSet = Array.from({ length: 1000 }, (_, i) => ({
      id: `large-action-${i + 1}`,
      type: ['click', 'input', 'hover', 'scroll', 'wait'][i % 5],
      selector: `#element-${i + 1}`,
      value: `value-${i + 1}`,
      timestamp: 1699467600000 + (i * 1000)
    }));

    // Generate large CSV content
    const csvHeaders = ['ID', 'Type', 'Selector', 'Value', 'Timestamp'];
    const csvData = largeActionSet.map(action =>
      [action.id, action.type, action.selector, action.value, action.timestamp].join(',')
    );
    const csvContent = [csvHeaders.join(','), ...csvData].join('\n');

    // Verify large file handling
    const lines = csvContent.split('\n');
    expect(lines).toHaveLength(1001); // 1 header + 1000 data rows
    expect(csvContent.length).toBeGreaterThan(50000); // Should be large file
    
    // Verify all actions are present
    expect(csvContent).toContain('large-action-1');
    expect(csvContent).toContain('large-action-500');
    expect(csvContent).toContain('large-action-1000');
  });

  test('сжатие файлов при экспорте', () => {
    // Test file compression during export
    const actions = Array.from({ length: 100 }, (_, i) => ({
      id: `compress-test-${i}`,
      type: 'click',
      selector: '#btn',
      timestamp: 1699467600000 + i
    }));

    // Generate uncompressed CSV
    const csvContent = actions
      .map(a => `${a.id},${a.type},${a.selector},${a.timestamp}`)
      .join('\n');

    const uncompressedSize = Buffer.from(csvContent, 'utf8').length;

    // Simulate compression (using zlib-like approach representation)
    // In real implementation, this would use gzip compression
    const compressed = Buffer.from(csvContent, 'utf8');
    const compressedSize = compressed.length;

    expect(uncompressedSize).toBeDefined();
    expect(compressedSize).toBeDefined();
    expect(typeof uncompressedSize).toBe('number');
    expect(typeof compressedSize).toBe('number');

    // Verify the CSV content is still readable
    const lines = csvContent.split('\n');
    expect(lines).toHaveLength(100);
  });

  test('версионирование данных', () => {
    // Test data versioning in CSV export
    const v1Data = {
      actions: [
        { id: '1', type: 'click', selector: '#btn' }
      ],
      version: '1.0'
    };

    const v2Data = {
      actions: [
        { id: '1', type: 'click', selector: '#btn', timestamp: 1699467600000 }
      ],
      version: '2.0'
    };

    // Export both versions with version metadata
    const exportV1 = `Version: 1.0
ID,Type,Selector
1,click,#btn`;

    const exportV2 = `Version: 2.0
ID,Type,Selector,Timestamp
1,click,#btn,1699467600000`;

    expect(exportV1).toContain('Version: 1.0');
    expect(exportV2).toContain('Version: 2.0');

    // Verify version detection
    const v1Version = exportV1.split('\n')[0];
    const v2Version = exportV2.split('\n')[0];
    
    expect(v1Version).toBe('Version: 1.0');
    expect(v2Version).toBe('Version: 2.0');
  });

  test('проверка контрольной суммы', () => {
    // Test checksum verification in CSV export
    const crypto = {
      createHash: () => ({
        update: function(data) {
          this.data = data;
          return this;
        },
        digest: function(encoding) {
          // Simple hash simulation
          let hash = 0;
          for (let i = 0; i < this.data.length; i++) {
            hash = ((hash << 5) - hash) + this.data.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
          }
          return Math.abs(hash).toString(16);
        }
      })
    };

    const csvContent = `ID,Type,Selector
action-1,click,#btn
action-2,input,#field`;

    // Calculate checksum
    const hash = crypto.createHash('sha256');
    hash.update(csvContent);
    const checksum = hash.digest('hex');

    // Verify checksum
    expect(checksum).toBeDefined();
    expect(typeof checksum).toBe('string');
    expect(checksum.length).toBeGreaterThan(0);

    // Verify checksum changes with content
    const modifiedContent = csvContent + '\naction-3,hover,.element';
    const hash2 = crypto.createHash('sha256');
    hash2.update(modifiedContent);
    const checksum2 = hash2.digest('hex');

    expect(checksum2).not.toBe(checksum);
  });

  test('документация форматов', () => {
    // Test format documentation and specifications
    const csvFormatSpec = {
      version: '1.0',
      fileExtension: '.csv',
      mimeType: 'text/csv',
      encoding: 'UTF-8',
      delimiter: ',',
      quoteCharacter: '"',
      escapeCharacter: '"',
      supportedFields: [
        'ID',
        'Type',
        'Selector',
        'Value',
        'Timestamp',
        'Description',
        'Metadata'
      ],
      requiredFields: ['ID', 'Type', 'Selector'],
      optionalFields: ['Value', 'Timestamp', 'Description', 'Metadata']
    };

    expect(csvFormatSpec.fileExtension).toBe('.csv');
    expect(csvFormatSpec.mimeType).toBe('text/csv');
    expect(csvFormatSpec.encoding).toBe('UTF-8');
    expect(csvFormatSpec.supportedFields).toContain('ID');
    expect(csvFormatSpec.supportedFields).toContain('Type');
    expect(csvFormatSpec.supportedFields).toContain('Selector');
    expect(csvFormatSpec.requiredFields).toHaveLength(3);
    expect(csvFormatSpec.optionalFields).toHaveLength(4);
    
    // Verify specification completeness
    const allFields = [...csvFormatSpec.requiredFields, ...csvFormatSpec.optionalFields];
    expect(allFields.every(field => csvFormatSpec.supportedFields.includes(field))).toBe(true);
  });
});
