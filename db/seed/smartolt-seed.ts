import { db } from '@/db';
import { olts, odps, onus, connections, alerts } from '@/db/schema/smartolt';
import { NewOLT, NewODP, NewONU, NewConnection } from '@/db/schema/smartolt';

// Sample data for Jakarta area (Indonesia)
const sampleOLTs: NewOLT[] = [
  {
    id: 'olt-001',
    name: 'OLT Jakarta Central',
    hardwareVersion: 'Huawei-MA5680T',
    ip: '192.168.1.10',
    telnetPort: '2333',
    snmpPort: '2161',
    latitude: -6.2088,
    longitude: 106.8456,
    address: 'Jakarta Pusat, Jakarta, Indonesia',
    status: 'up',
    temperature: '24°C',
    metadata: {
      model: 'MA5680T',
      capacity: 1024,
      location: 'Main Office'
    }
  },
  {
    id: 'olt-002',
    name: 'OLT Jakarta Selatan',
    hardwareVersion: 'ZTE-C320',
    ip: '192.168.1.11',
    telnetPort: '2333',
    snmpPort: '2161',
    latitude: -6.2615,
    longitude: 106.8106,
    address: 'Jakarta Selatan, Jakarta, Indonesia',
    status: 'up',
    temperature: '28°C',
    metadata: {
      model: 'C320',
      capacity: 512,
      location: 'Branch Office South'
    }
  },
  {
    id: 'olt-003',
    name: 'OLT Jakarta Utara',
    hardwareVersion: 'Huawei-MA5608T',
    ip: '192.168.1.12',
    telnetPort: '2333',
    snmpPort: '2161',
    latitude: -6.1384,
    longitude: 106.8759,
    address: 'Jakarta Utara, Jakarta, Indonesia',
    status: 'up',
    temperature: '26°C',
    metadata: {
      model: 'MA5608T',
      capacity: 256,
      location: 'Branch Office North'
    }
  }
];

const sampleODPs: NewODP[] = [
  // OLT-001 ODPs
  {
    id: 'odp-001',
    name: 'ODP Central A',
    type: 'splitter',
    latitude: -6.2088,
    longitude: 106.8456,
    oltId: 'olt-001',
    board: '0',
    port: '1',
    splitRatio: 1:16,
    capacity: 16,
    status: 'active',
    installedDate: new Date('2023-01-15'),
    metadata: {
      manufacturer: 'FiberHome',
      model: '16-Port Splitter',
      location: 'Central District A'
    }
  },
  {
    id: 'odp-002',
    name: 'ODP Central B',
    type: 'splitter',
    latitude: -6.2100,
    longitude: 106.8470,
    oltId: 'olt-001',
    board: '0',
    port: '2',
    splitRatio: 1:32,
    capacity: 32,
    status: 'active',
    installedDate: new Date('2023-02-20'),
    metadata: {
      manufacturer: 'Huawei',
      model: '32-Port Splitter',
      location: 'Central District B'
    }
  },
  // OLT-002 ODPs
  {
    id: 'odp-003',
    name: 'ODP Selatan A',
    type: 'closure',
    latitude: -6.2615,
    longitude: 106.8106,
    oltId: 'olt-002',
    board: '1',
    port: '1',
    splitRatio: 1:8,
    capacity: 8,
    status: 'active',
    installedDate: new Date('2023-03-10'),
    metadata: {
      manufacturer: 'FiberHome',
      model: '8-Port Closure',
      location: 'South District A'
    }
  },
  {
    id: 'odp-004',
    name: 'ODP Selatan B',
    type: 'splitter',
    latitude: -6.2630,
    longitude: 106.8120,
    oltId: 'olt-002',
    board: '1',
    port: '2',
    splitRatio: 1:16,
    capacity: 16,
    status: 'active',
    installedDate: new Date('2023-04-05'),
    metadata: {
      manufacturer: 'ZTE',
      model: '16-Port Splitter',
      location: 'South District B'
    }
  },
  // OLT-003 ODPs
  {
    id: 'odp-005',
    name: 'ODP Utara A',
    type: 'closure',
    latitude: -6.1384,
    longitude: 106.8759,
    oltId: 'olt-003',
    board: '0',
    port: '1',
    splitRatio: 1:8,
    capacity: 8,
    status: 'active',
    installedDate: new Date('2023-05-12'),
    metadata: {
      manufacturer: 'FiberHome',
      model: '8-Port Closure',
      location: 'North District A'
    }
  }
];

const sampleONUs: NewONU[] = [
  // ONU connected to ODP-001
  {
    id: 'onu-001',
    externalId: 'central-cust-001',
    serialNumber: 'ZTEGC00123456',
    name: 'Customer Central 1',
    oltId: 'olt-001',
    oltName: 'OLT Jakarta Central',
    board: '0',
    port: '1',
    onuNumber: '1',
    onuTypeId: '29',
    onuTypeName: 'ZTE-F623',
    zoneId: 'zone-001',
    zoneName: 'Central Zone A',
    latitude: -6.2085,
    longitude: 106.8453,
    odpId: 'odp-001',
    odpName: 'ODP Central A',
    mode: 'Routing',
    wanMode: 'DHCP',
    ipAddress: '192.168.100.10',
    status: 'online',
    administrativeStatus: 'Enabled',
    catvStatus: 'Enabled',
    signalStrength: 'Good',
    signalValue: -12.5,
    lastSeen: new Date(),
    metadata: {
      customerName: 'PT. Maju Jaya',
      servicePlan: '100Mbps',
      installationDate: '2023-06-01'
    }
  },
  {
    id: 'onu-002',
    externalId: 'central-cust-002',
    serialNumber: 'ZTEGC00123457',
    name: 'Customer Central 2',
    oltId: 'olt-001',
    oltName: 'OLT Jakarta Central',
    board: '0',
    port: '1',
    onuNumber: '2',
    onuTypeId: '30',
    onuTypeName: 'ZTE-F660',
    zoneId: 'zone-001',
    zoneName: 'Central Zone A',
    latitude: -6.2090,
    longitude: 106.8458,
    odpId: 'odp-001',
    odpName: 'ODP Central A',
    mode: 'Routing',
    wanMode: 'Static IP',
    ipAddress: '192.168.100.11',
    status: 'offline',
    administrativeStatus: 'Enabled',
    catvStatus: 'Not supported',
    signalStrength: 'Unknown',
    metadata: {
      customerName: 'CV. Teknologi Indonesia',
      servicePlan: '50Mbps',
      installationDate: '2023-06-15'
    }
  },
  // ONU connected to ODP-002
  {
    id: 'onu-003',
    externalId: 'central-cust-003',
    serialNumber: 'HWTSC00123458',
    name: 'Customer Central 3',
    oltId: 'olt-001',
    oltName: 'OLT Jakarta Central',
    board: '0',
    port: '2',
    onuNumber: '1',
    onuTypeId: '44',
    onuTypeName: 'ZTE-F401',
    zoneId: 'zone-002',
    zoneName: 'Central Zone B',
    latitude: -6.2105,
    longitude: 106.8475,
    odpId: 'odp-002',
    odpName: 'ODP Central B',
    mode: 'Bridging',
    wanMode: 'DHCP',
    status: 'online',
    administrativeStatus: 'Enabled',
    catvStatus: 'Disabled',
    signalStrength: 'Very Good',
    signalValue: -8.2,
    lastSeen: new Date(),
    metadata: {
      customerName: 'PT. Digital Solutions',
      servicePlan: '200Mbps',
      installationDate: '2023-07-01'
    }
  },
  // ONU connected to ODP-003
  {
    id: 'onu-004',
    externalId: 'selatan-cust-001',
    serialNumber: 'ZTEGC00123459',
    name: 'Customer Selatan 1',
    oltId: 'olt-002',
    oltName: 'OLT Jakarta Selatan',
    board: '1',
    port: '1',
    onuNumber: '1',
    onuTypeId: '29',
    onuTypeName: 'ZTE-F623',
    zoneId: 'zone-003',
    zoneName: 'South Zone A',
    latitude: -6.2620,
    longitude: 106.8110,
    odpId: 'odp-003',
    odpName: 'ODP Selatan A',
    mode: 'Routing',
    wanMode: 'DHCP',
    status: 'los',
    administrativeStatus: 'Enabled',
    catvStatus: 'Enabled',
    signalStrength: 'LOS',
    metadata: {
      customerName: 'PT. Communication Tech',
      servicePlan: '100Mbps',
      installationDate: '2023-08-01',
      lastIssueDate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    }
  },
  // ONU connected to ODP-005
  {
    id: 'onu-005',
    externalId: 'utara-cust-001',
    serialNumber: 'ZTEGC00123460',
    name: 'Customer Utara 1',
    oltId: 'olt-003',
    oltName: 'OLT Jakarta Utara',
    board: '0',
    port: '1',
    onuNumber: '1',
    onuTypeId: '30',
    onuTypeName: 'ZTE-F660',
    zoneId: 'zone-004',
    zoneName: 'North Zone A',
    latitude: -6.1380,
    longitude: 106.8755,
    odpId: 'odp-005',
    odpName: 'ODP Utara A',
    mode: 'Routing',
    wanMode: 'PPPoE',
    status: 'online',
    administrativeStatus: 'Enabled',
    catvStatus: 'Enabled',
    signalStrength: 'Good',
    signalValue: -15.3,
    lastSeen: new Date(),
    metadata: {
      customerName: 'PT. Network Solutions',
      servicePlan: '150Mbps',
      installationDate: '2023-09-01'
    }
  }
];

const sampleConnections: NewConnection[] = [
  // OLT to ODP connections
  {
    id: 'conn-001',
    sourceType: 'olt',
    sourceId: 'olt-001',
    targetType: 'odp',
    targetId: 'odp-001',
    connectionType: 'fiber',
    status: 'active',
    length: 50.5,
    signalLoss: 0.2,
    fiberCount: 12,
    metadata: {
      cableType: 'Single Mode',
      installedDate: '2023-01-10'
    }
  },
  {
    id: 'conn-002',
    sourceType: 'olt',
    sourceId: 'olt-001',
    targetType: 'odp',
    targetId: 'odp-002',
    connectionType: 'fiber',
    status: 'active',
    length: 75.2,
    signalLoss: 0.3,
    fiberCount: 24,
    metadata: {
      cableType: 'Single Mode',
      installedDate: '2023-02-15'
    }
  },
  {
    id: 'conn-003',
    sourceType: 'olt',
    sourceId: 'olt-002',
    targetType: 'odp',
    targetId: 'odp-003',
    connectionType: 'fiber',
    status: 'active',
    length: 100.0,
    signalLoss: 0.4,
    fiberCount: 12,
    metadata: {
      cableType: 'Single Mode',
      installedDate: '2023-03-05'
    }
  },
  {
    id: 'conn-004',
    sourceType: 'olt',
    sourceId: 'olt-002',
    targetType: 'odp',
    targetId: 'odp-004',
    connectionType: 'fiber',
    status: 'active',
    length: 120.8,
    signalLoss: 0.5,
    fiberCount: 24,
    metadata: {
      cableType: 'Single Mode',
      installedDate: '2023-04-01'
    }
  },
  {
    id: 'conn-005',
    sourceType: 'olt',
    sourceId: 'olt-003',
    targetType: 'odp',
    targetId: 'odp-005',
    connectionType: 'fiber',
    status: 'active',
    length: 80.3,
    signalLoss: 0.3,
    fiberCount: 12,
    metadata: {
      cableType: 'Single Mode',
      installedDate: '2023-05-08'
    }
  },
  // ODP to ONU connections
  {
    id: 'conn-006',
    sourceType: 'odp',
    sourceId: 'odp-001',
    targetType: 'onu',
    targetId: 'onu-001',
    connectionType: 'pon',
    status: 'active',
    length: 25.5,
    signalLoss: 0.8,
    metadata: {
      fiberType: 'Drop Cable',
      installedDate: '2023-06-01'
    }
  },
  {
    id: 'conn-007',
    sourceType: 'odp',
    sourceId: 'odp-001',
    targetType: 'onu',
    targetId: 'onu-002',
    connectionType: 'pon',
    status: 'inactive',
    length: 30.2,
    signalLoss: 1.2,
    metadata: {
      fiberType: 'Drop Cable',
      installedDate: '2023-06-15',
      issue: 'Customer disconnected'
    }
  },
  {
    id: 'conn-008',
    sourceType: 'odp',
    sourceId: 'odp-002',
    targetType: 'onu',
    targetId: 'onu-003',
    connectionType: 'pon',
    status: 'active',
    length: 45.7,
    signalLoss: 1.1,
    metadata: {
      fiberType: 'Drop Cable',
      installedDate: '2023-07-01'
    }
  },
  {
    id: 'conn-009',
    sourceType: 'odp',
    sourceId: 'odp-003',
    targetType: 'onu',
    targetId: 'onu-004',
    connectionType: 'pon',
    status: 'fault',
    length: 35.8,
    signalLoss: 5.5,
    metadata: {
      fiberType: 'Drop Cable',
      installedDate: '2023-08-01',
      issue: 'Fiber cut detected'
    }
  },
  {
    id: 'conn-010',
    sourceType: 'odp',
    sourceId: 'odp-005',
    targetType: 'onu',
    targetId: 'onu-005',
    connectionType: 'pon',
    status: 'active',
    length: 28.3,
    signalLoss: 0.9,
    metadata: {
      fiberType: 'Drop Cable',
      installedDate: '2023-09-01'
    }
  }
];

export async function seedSmartOLTData() {
  console.log('🌱 Seeding SmartOLT data...');

  try {
    // Insert OLTs
    console.log('📡 Inserting OLTs...');
    await db.insert(olts).values(sampleOLTs);
    console.log(`✅ Inserted ${sampleOLTs.length} OLTs`);

    // Insert ODPs
    console.log('🔌 Inserting ODPs...');
    await db.insert(odps).values(sampleODPs);
    console.log(`✅ Inserted ${sampleODPs.length} ODPs`);

    // Insert ONUs
    console.log('🏠 Inserting ONUs...');
    await db.insert(onus).values(sampleONUs);
    console.log(`✅ Inserted ${sampleONUs.length} ONUs`);

    // Insert Connections
    console.log('🔗 Inserting connections...');
    await db.insert(connections).values(sampleConnections);
    console.log(`✅ Inserted ${sampleConnections.length} connections`);

    // Insert sample alerts
    console.log('🚨 Inserting sample alerts...');
    const sampleAlerts = [
      {
        id: 'alert-001',
        type: 'onu_los' as const,
        level: 'critical' as const,
        deviceId: 'onu-004',
        deviceType: 'onu' as const,
        deviceName: 'Customer Selatan 1',
        title: 'ONU Loss of Signal',
        description: 'ONU has lost optical signal. Possible fiber cut or equipment failure.',
        latitude: -6.2620,
        longitude: 106.8110,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        acknowledged: false,
        resolved: false,
        metadata: {
          signalLoss: 5.5,
          lastKnownSignal: -12.8,
          possibleCause: 'Fiber cut'
        }
      },
      {
        id: 'alert-002',
        type: 'onu_offline' as const,
        level: 'major' as const,
        deviceId: 'onu-002',
        deviceType: 'onu' as const,
        deviceName: 'Customer Central 2',
        title: 'ONU Offline',
        description: 'ONU is offline and not responding to polls.',
        latitude: -6.2090,
        longitude: 106.8458,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        acknowledged: true,
        acknowledgedBy: 'system',
        acknowledgedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        resolved: false,
        metadata: {
          lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000),
          customerNotified: true
        }
      }
    ];

    await db.insert(alerts).values(sampleAlerts);
    console.log(`✅ Inserted ${sampleAlerts.length} alerts`);

    console.log('🎉 SmartOLT data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - OLTs: ${sampleOLTs.length}`);
    console.log(`   - ODPs: ${sampleODPs.length}`);
    console.log(`   - ONUs: ${sampleONUs.length}`);
    console.log(`   - Connections: ${sampleConnections.length}`);
    console.log(`   - Alerts: ${sampleAlerts.length}`);

  } catch (error) {
    console.error('❌ Error seeding SmartOLT data:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedSmartOLTData()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}