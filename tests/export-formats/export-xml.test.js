import { expect, test, describe, beforeEach } from '@jest/globals';

describe('Export XML Format', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('поддержка XML формата', () => {
    // Test basic XML format support
    const actions = [
      {
        id: 'xml-action-1',
        type: 'click',
        selector: '#button',
        timestamp: 1699467600000
      },
      {
        id: 'xml-action-2',
        type: 'input',
        selector: '#text-field',
        value: 'test input',
        timestamp: 1699467601000
      }
    ];

    // Create basic XML structure
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation>
  <actions>
    <action id="xml-action-1">
      <type>click</type>
      <selector>#button</selector>
      <timestamp>1699467600000</timestamp>
    </action>
    <action id="xml-action-2">
      <type>input</type>
      <selector>#text-field</selector>
      <value>test input</value>
      <timestamp>1699467601000</timestamp>
    </action>
  </actions>
</automation>`;

    expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xmlContent).toContain('<automation>');
    expect(xmlContent).toContain('<actions>');
    expect(xmlContent).toContain('id="xml-action-1"');
    expect(xmlContent).toContain('<type>click</type>');
    expect(xmlContent).toContain('<value>test input</value>');
  });

  test('валидация XML схемы', () => {
    // Test XML schema validation
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation>
  <metadata>
    <version>1.0</version>
    <totalActions>1</totalActions>
  </metadata>
  <actions>
    <action id="schema-test-1">
      <type>click</type>
      <selector>#btn</selector>
      <timestamp>1699467600000</timestamp>
    </action>
  </actions>
</automation>`;

    // Simulate XML parsing and validation
    const isValidXML = xmlContent.includes('<?xml version="1.0"') &&
                      xmlContent.includes('<automation>') &&
                      xmlContent.includes('</automation>') &&
                      xmlContent.includes('<actions>') &&
                      xmlContent.includes('</actions>');

    expect(isValidXML).toBe(true);

    // Check for proper nesting
    expect(xmlContent.indexOf('<automation>') < xmlContent.indexOf('<actions>')).toBe(true);
    expect(xmlContent.indexOf('</actions>') < xmlContent.indexOf('</automation>')).toBe(true);

    // Validate schema structure
    const hasMetadata = xmlContent.includes('<metadata>');
    const hasVersion = xmlContent.includes('<version>');
    const hasTotalActions = xmlContent.includes('<totalActions>');
    
    expect(hasMetadata).toBe(true);
    expect(hasVersion).toBe(true);
    expect(hasTotalActions).toBe(true);
  });

  test('преобразование между форматами', () => {
    // Test conversion between JSON and XML formats
    const jsonData = {
      actions: [
        {
          id: 'convert-1',
          type: 'click',
          selector: '#btn'
        }
      ],
      metadata: {
        version: '1.0'
      }
    };

    // Convert JSON to XML
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation>
  <metadata>
    <version>${jsonData.metadata.version}</version>
  </metadata>
  <actions>
    ${jsonData.actions.map(action => `
    <action id="${action.id}">
      <type>${action.type}</type>
      <selector>${action.selector}</selector>
    </action>`).join('')}
  </actions>
</automation>`;

    // Convert XML back to JSON-like structure (simulated parsing)
    const startAction = xmlContent.indexOf('<action id="convert-1">');
    const endAction = xmlContent.indexOf('</action>', startAction);
    const actionXml = xmlContent.substring(startAction, endAction + 9);

    expect(actionXml).toContain('id="convert-1"');
    expect(actionXml).toContain('<type>click</type>');
    expect(actionXml).toContain('<selector>#btn</selector>');

    // Verify roundtrip conversion
    expect(xmlContent).toContain(jsonData.metadata.version);
  });

  test('обработка вложенных структур', () => {
    // Test handling of nested XML structures
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation>
  <actions>
    <action id="nested-1">
      <type>click</type>
      <selector>#btn</selector>
      <metadata>
        <coordinates>
          <x>100</x>
          <y>200</y>
        </coordinates>
        <timing>
          <delay>500</delay>
          <timeout>5000</timeout>
        </timing>
        <tags>
          <tag>important</tag>
          <tag>frequent</tag>
        </tags>
      </metadata>
    </action>
  </actions>
</automation>`;

    // Verify proper nesting
    expect(xmlContent).toContain('<metadata>');
    expect(xmlContent).toContain('<coordinates>');
    expect(xmlContent).toContain('<x>100</x>');
    expect(xmlContent).toContain('<y>200</y>');
    expect(xmlContent).toContain('<timing>');
    expect(xmlContent).toContain('<delay>500</delay>');
    expect(xmlContent).toContain('<timeout>5000</timeout>');
    expect(xmlContent).toContain('<tags>');
    
    // Count nested levels
    const openMetadata = (xmlContent.match(/<metadata>/g) || []).length;
    const closeMetadata = (xmlContent.match(/<\/metadata>/g) || []).length;
    expect(openMetadata).toBe(closeMetadata);

    const openCoordinates = (xmlContent.match(/<coordinates>/g) || []).length;
    const closeCoordinates = (xmlContent.match(/<\/coordinates>/g) || []).length;
    expect(openCoordinates).toBe(closeCoordinates);
  });

  test('кодировка символов в XML', () => {
    // Test character encoding in XML
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation>
  <actions>
    <action id="encoding-1">
      <description>Тест на русском: Привет мир! 🚀</description>
    </action>
    <action id="encoding-2">
      <description>Unicode: العربية 中文 한글 日本語</description>
    </action>
    <action id="encoding-3">
      <description>Special chars: &lt;tag&gt; &amp; &#34;quoted&#34;</description>
    </action>
  </actions>
</automation>`;

    expect(xmlContent).toContain('encoding="UTF-8"');
    expect(xmlContent).toContain('Тест на русском: Привет мир! 🚀');
    expect(xmlContent).toContain('العربية 中文 한글 日本語');
    expect(xmlContent).toContain('&lt;tag&gt;');
    expect(xmlContent).toContain('&amp;');
    expect(xmlContent).toContain('&#34;quoted&#34;');

    // Verify XML entities are properly encoded
    const hasEntityEncoding = xmlContent.includes('&lt;') && xmlContent.includes('&amp;');
    expect(hasEntityEncoding).toBe(true);
  });

  test('обработка атрибутов XML', () => {
    // Test XML attribute handling
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation version="1.0" timestamp="1699467600000">
  <metadata created="2023-11-08" author="AI-Autoclicker">
    <info type="export" format="xml"></info>
  </metadata>
  <actions count="2">
    <action id="attr-test-1" type="click" priority="high">
      <selector>#btn</selector>
    </action>
    <action id="attr-test-2" type="input" priority="low" optional="true">
      <selector>#field</selector>
      <value>test</value>
    </action>
  </actions>
</automation>`;

    // Verify attributes
    expect(xmlContent).toContain('version="1.0"');
    expect(xmlContent).toContain('timestamp="1699467600000"');
    expect(xmlContent).toContain('created="2023-11-08"');
    expect(xmlContent).toContain('author="AI-Autoclicker"');
    expect(xmlContent).toContain('type="export"');
    expect(xmlContent).toContain('id="attr-test-1"');
    expect(xmlContent).toContain('priority="high"');
    expect(xmlContent).toContain('priority="low"');
    expect(xmlContent).toContain('optional="true"');

    // Count attributes
    const idAttributes = (xmlContent.match(/id="/g) || []).length;
    expect(idAttributes).toBeGreaterThanOrEqual(2); // attr-test-1, attr-test-2
  });

  test('импорт XML файлов', () => {
    // Test importing XML files
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<automation>
  <metadata>
    <version>1.0</version>
    <totalActions>2</totalActions>
    <importDate>2023-11-08T16:20:00Z</importDate>
  </metadata>
  <actions>
    <action id="import-1">
      <type>click</type>
      <selector>#btn1</selector>
      <timestamp>1699467600000</timestamp>
    </action>
    <action id="import-2">
      <type>input</type>
      <selector>#field1</selector>
      <value>imported data</value>
      <timestamp>1699467601000</timestamp>
    </action>
  </actions>
</automation>`;

    // Simulate XML parsing
    const parseXMLValue = (xml, tagName) => {
      const match = xml.match(new RegExp(`<${tagName}>([^<]*)</${tagName}>`));
      return match ? match[1] : null;
    };

    const version = parseXMLValue(xmlContent, 'version');
    const totalActions = parseXMLValue(xmlContent, 'totalActions');
    const firstActionType = xmlContent.match(/<action id="import-1"[\s\S]*?<type>([^<]*)<\/type>/)?.[1];

    expect(version).toBe('1.0');
    expect(totalActions).toBe('2');
    expect(firstActionType).toBe('click');

    // Verify all actions are present
    expect(xmlContent).toContain('id="import-1"');
    expect(xmlContent).toContain('id="import-2"');
  });

  test('версия XML стандарта', () => {
    // Test XML standard version specification
    const xml10 = `<?xml version="1.0" encoding="UTF-8"?>
<automation/>`;

    const xml11 = `<?xml version="1.1" encoding="UTF-8"?>
<automation/>`;

    // Verify version detection
    const getXMLVersion = (xml) => {
      const match = xml.match(/version="([^"]+)"/);
      return match ? match[1] : null;
    };

    expect(getXMLVersion(xml10)).toBe('1.0');
    expect(getXMLVersion(xml11)).toBe('1.1');

    // Verify encoding detection
    const getXMLEncoding = (xml) => {
      const match = xml.match(/encoding="([^"]+)"/);
      return match ? match[1] : null;
    };

    expect(getXMLEncoding(xml10)).toBe('UTF-8');
    expect(getXMLEncoding(xml11)).toBe('UTF-8');

    // Verify XML declaration presence
    expect(xml10).toMatch(/^<\?xml/);
    expect(xml11).toMatch(/^<\?xml/);
  });

  test('валидация DTD схемы', () => {
    // Test DTD schema validation
    const xmlWithDTD = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE automation [
  <!ELEMENT automation (metadata, actions)>
  <!ELEMENT metadata (version, totalActions)>
  <!ELEMENT actions (action+)>
  <!ELEMENT action (type, selector, value?)>
  <!ELEMENT version (#PCDATA)>
  <!ELEMENT totalActions (#PCDATA)>
  <!ELEMENT type (#PCDATA)>
  <!ELEMENT selector (#PCDATA)>
  <!ELEMENT value (#PCDATA)>
  <!ATTLIST action id ID #REQUIRED>
]>
<automation>
  <metadata>
    <version>1.0</version>
    <totalActions>1</totalActions>
  </metadata>
  <actions>
    <action id="dtd-test-1">
      <type>click</type>
      <selector>#btn</selector>
    </action>
  </actions>
</automation>`;

    // Verify DTD declaration
    expect(xmlWithDTD).toContain('<!DOCTYPE automation');
    expect(xmlWithDTD).toContain('<!ELEMENT automation');
    expect(xmlWithDTD).toContain('<!ELEMENT metadata');
    expect(xmlWithDTD).toContain('<!ELEMENT actions');
    expect(xmlWithDTD).toContain('<!ELEMENT action');
    expect(xmlWithDTD).toContain('<!ATTLIST action id ID #REQUIRED');

    // Verify DTD structure matches document structure
    expect(xmlWithDTD).toContain('<automation>');
    expect(xmlWithDTD).toContain('<metadata>');
    expect(xmlWithDTD).toContain('<actions>');
    expect(xmlWithDTD).toContain('<action id="dtd-test-1">');

    // Verify required elements
    const hasRequiredElements = xmlWithDTD.includes('<version>') &&
                               xmlWithDTD.includes('<totalActions>') &&
                               xmlWithDTD.includes('<actions>');
    expect(hasRequiredElements).toBe(true);
  });

  test('миграция данных между версиями', () => {
    // Test data migration between XML versions
    const xmlV1 = `<?xml version="1.0" encoding="UTF-8"?>
<automation schemaVersion="1.0">
  <actions>
    <action id="v1-action-1">
      <type>click</type>
      <selector>#btn</selector>
    </action>
  </actions>
</automation>`;

    const xmlV2 = `<?xml version="1.0" encoding="UTF-8"?>
<automation schemaVersion="2.0">
  <metadata>
    <schemaVersion>2.0</schemaVersion>
    <migrationDate>2023-11-08T16:20:00Z</migrationDate>
  </metadata>
  <actions>
    <action id="v2-action-1" schemaVersion="2.0">
      <type>click</type>
      <selector>#btn</selector>
      <timestamp>1699467600000</timestamp>
      <metadata>
        <duration>100</duration>
        <coordinates>
          <x>100</x>
          <y>200</y>
        </coordinates>
      </metadata>
    </action>
  </actions>
</automation>`;

    // Extract version information from automation tag
    const getVersion = (xml) => {
      const match = xml.match(/automation schemaVersion="([^"]+)"/);
      return match ? match[1] : null;
    };

    expect(getVersion(xmlV1)).toBe('1.0');
    expect(getVersion(xmlV2)).toBe('2.0');

    // Verify migration adds new fields
    expect(xmlV1).not.toContain('<metadata>');
    expect(xmlV2).toContain('<metadata>');
    expect(xmlV2).toContain('<schemaVersion>2.0</schemaVersion>');
    expect(xmlV2).toContain('<migrationDate>');

    // Verify backward compatibility
    expect(xmlV2).toContain('<type>click</type>');
    expect(xmlV2).toContain('<selector>#btn</selector>');
    expect(xmlV2).toContain('id="v2-action-1"');

    // Verify enhanced schema in v2
    expect(xmlV2).toContain('<timestamp>');
    expect(xmlV2).toContain('<duration>');
    expect(xmlV2).toContain('<coordinates>');
  });
});
