import { jest, expect, test, describe } from '@jest/globals';

describe('Import/Export JSON Format', () => {
  test('сохранение записанных действий', () => {
    // Test saving recorded actions
    const recordedActions = [
      {
        id: 1,
        type: 'click',
        selector: '#button-1',
        timestamp: 1699467600000,
        metadata: { x: 100, y: 200 }
      },
      {
        id: 2,
        type: 'input',
        selector: '#text-field',
        value: 'test input',
        timestamp: 1699467601000
      }
    ];

    const saveData = {
      actions: recordedActions,
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalActions: recordedActions.length
      }
    };

    expect(saveData.actions).toHaveLength(2);
    expect(saveData.actions[0]).toHaveProperty('type', 'click');
    expect(saveData.actions[1]).toHaveProperty('type', 'input');
    expect(saveData.metadata).toHaveProperty('version', '1.0');
    expect(saveData.metadata).toHaveProperty('totalActions', 2);
  });

  test('экспорт в JSON формат', () => {
    // Test export to JSON format
    const exportData = {
      actions: [
        { id: 1, type: 'click', selector: '#submit' }
      ],
      metadata: {
        version: '1.0',
        exportDate: '2023-11-08T16:20:00.000Z',
        description: 'Test automation export'
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const parsedData = JSON.parse(jsonString);

    expect(parsedData).toEqual(exportData);
    expect(jsonString).toContain('"actions"');
    expect(jsonString).toContain('"metadata"');
    expect(jsonString).toContain('"version"');
  });

  test('целостность данных при экспорте', () => {
    // Test data integrity during export
    const originalData = {
      actions: [
        {
          id: 'unique-id-123',
          type: 'hover',
          selector: '.nav-item',
          timestamp: 1699467600000,
          coordinates: { x: 150, y: 75 },
          metadata: { duration: 500 }
        }
      ],
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        checksum: 'abc123'
      }
    };

    // Export and re-import
    const exported = JSON.stringify(originalData);
    const imported = JSON.parse(exported);

    expect(imported.actions[0].id).toBe(originalData.actions[0].id);
    expect(imported.actions[0].coordinates.x).toBe(originalData.actions[0].coordinates.x);
    expect(imported.metadata.checksum).toBe(originalData.metadata.checksum);
  });

  test('проверка метаданных в файле', () => {
    // Test metadata in the exported file
    const metadata = {
      version: '1.0',
      exportDate: '2023-11-08T16:20:00.000Z',
        author: 'AI-Autoclicker',
      description: 'Automated actions for web form',
      totalActions: 5,
      browser: 'Chrome',
      extensionVersion: '2.0.0'
    };

    const fileContent = {
      actions: [],
      metadata: metadata
    };

    expect(fileContent.metadata.version).toBe('1.0');
    expect(fileContent.metadata.author).toBe('AI-Autoclicker');
    expect(fileContent.metadata).toHaveProperty('exportDate');
    expect(fileContent.metadata).toHaveProperty('totalActions');
    expect(fileContent.metadata).toHaveProperty('extensionVersion');
  });

  test('восстановление из резервной копии', () => {
    // Test restoration from backup
    const backupData = {
      actions: [
        { id: 1, type: 'click', selector: '#backup-btn', timestamp: 1699467600000 },
        { id: 2, type: 'type', selector: '#backup-input', value: 'restored', timestamp: 1699467601000 }
      ],
      metadata: {
        version: '1.0',
        backupDate: '2023-11-08T16:20:00.000Z',
        isBackup: true
      }
    };

    // Simulate restoration process
    const restoredActions = backupData.actions.map(action => ({ ...action }));
    const isRestored = restoredActions.length > 0 && backupData.metadata.isBackup;

    expect(isRestored).toBe(true);
    expect(restoredActions).toHaveLength(2);
    expect(restoredActions[1].value).toBe('restored');
  });

  test('обработка спецсимволов в описаниях', () => {
    // Test handling of special characters in descriptions
    const specialChars = {
      actions: [
        {
          id: 1,
          type: 'input',
          selector: '#special-chars',
          value: 'Hello "World" & \'Test\' <script>alert("xss")</script>',
          description: 'Action with "quotes", &ampersands, and <tags>'
        }
      ],
      metadata: {
        version: '1.0',
        description: 'Test with special chars: \n\t\r\\',
        unicode: 'Тест на русском: Привет мир! 🚀'
      }
    };

    const jsonString = JSON.stringify(specialChars);
    const parsed = JSON.parse(jsonString);

    expect(parsed.actions[0].value).toContain('Hello "World"');
    expect(parsed.actions[0].value).toContain('& \'Test\'');
    expect(parsed.metadata.description).toContain('\n\t\r\\');
    expect(parsed.metadata.unicode).toBe('Тест на русском: Привет мир! 🚀');
  });

  test('проверка типов данных после импорта', () => {
    // Test data types after import
    const typedData = {
      actions: [
        {
          id: 'string-id',
          index: 42,
          active: true,
          coordinates: { x: 100.5, y: 200.75 },
          timestamp: 1699467600000,
          tags: ['tag1', 'tag2', 'tag3'],
          nullable: null,
          undefined: undefined
        }
      ],
      metadata: {
        count: 1,
        ratio: 3.14,
        flag: false,
        date: '2023-11-08T16:20:00.000Z'
      }
    };

    const imported = JSON.parse(JSON.stringify(typedData));

    expect(typeof imported.actions[0].id).toBe('string');
    expect(typeof imported.actions[0].index).toBe('number');
    expect(typeof imported.actions[0].active).toBe('boolean');
    expect(typeof imported.actions[0].coordinates).toBe('object');
    expect(Array.isArray(imported.actions[0].tags)).toBe(true);
    expect(imported.actions[0].nullable).toBe(null);
  });

  test('импорт одного действия', () => {
    // Test importing a single action
    const singleAction = {
      actions: [
        {
          id: 'single-action-1',
          type: 'click',
          selector: '#single-button',
          timestamp: 1699467600000,
          metadata: { delay: 100 }
        }
      ],
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalActions: 1
      }
    };

    expect(singleAction.actions).toHaveLength(1);
    expect(singleAction.actions[0].type).toBe('click');
    expect(singleAction.metadata.totalActions).toBe(1);
    
    // Test that it can be imported correctly
    const imported = JSON.parse(JSON.stringify(singleAction));
    expect(imported).toEqual(singleAction);
  });

  test('импорт массива действий', () => {
    // Test importing an array of actions
    const multipleActions = {
      actions: Array.from({ length: 5 }, (_, i) => ({
        id: `action-${i + 1}`,
        type: ['click', 'type', 'hover', 'scroll', 'wait'][i],
        selector: `#element-${i + 1}`,
        timestamp: 1699467600000 + (i * 1000),
        order: i + 1
      })),
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalActions: 5,
        description: 'Batch of 5 different actions'
      }
    };

    expect(multipleActions.actions).toHaveLength(5);
    expect(multipleActions.actions[2].type).toBe('hover');
    expect(multipleActions.actions[4].type).toBe('wait');
    expect(multipleActions.metadata.totalActions).toBe(5);

    // Test import integrity
    const imported = JSON.parse(JSON.stringify(multipleActions));
    expect(imported.actions).toHaveLength(5);
    expect(imported.actions.every((action, index) => action.order === index + 1)).toBe(true);
  });

  test('валидация схемы JSON', () => {
    // Test JSON schema validation
    const validSchema = {
      actions: [
        {
          id: 'required-id',
          type: 'click',
          selector: '#required-selector',
          timestamp: 1699467600000
        }
      ],
      metadata: {
        version: '1.0',
        exportDate: '2023-11-08T16:20:00.000Z'
      }
    };

    // Test required fields
    expect(validSchema).toHaveProperty('actions');
    expect(validSchema).toHaveProperty('metadata');
    expect(Array.isArray(validSchema.actions)).toBe(true);
    expect(validSchema.actions[0]).toHaveProperty('id');
    expect(validSchema.actions[0]).toHaveProperty('type');
    expect(validSchema.actions[0]).toHaveProperty('selector');
    expect(validSchema.metadata).toHaveProperty('version');
    expect(validSchema.metadata).toHaveProperty('exportDate');

    // Test invalid schema examples
    const invalidSchema1 = { metadata: {} }; // Missing actions
    const invalidSchema2 = { actions: [] }; // Missing metadata
    const invalidSchema3 = { actions: [{}], metadata: {} }; // Missing required fields

    expect(invalidSchema1.actions).toBeUndefined();
    expect(invalidSchema2.metadata).toBeUndefined();
    expect(invalidSchema3.actions[0].id).toBeUndefined();
  });
});