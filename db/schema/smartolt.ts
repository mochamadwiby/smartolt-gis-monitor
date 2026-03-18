import {
  pgTable,
  pgEnum,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  varchar,
  real,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const deviceStatusEnum = pgEnum('device_status', ['online', 'offline', 'los', 'warning', 'unknown']);
export const oltStatusEnum = pgEnum('olt_status', ['up', 'down', 'maintenance']);
export const ponTypeEnum = pgEnum('pon_type', ['gpon', 'epon']);
export const odpTypeEnum = pgEnum('odp_type', ['splitter', 'closure', 'patch_panel']);
export const connectionTypeEnum = pgEnum('connection_type', ['fiber', 'pon', 'patch_cord']);
export const connectionStatusEnum = pgEnum('connection_status', ['active', 'inactive', 'fault']);
export const alertLevelEnum = pgEnum('alert_level', ['critical', 'major', 'minor', 'info']);
export const alertTypeEnum = pgEnum('alert_type', [
  'onu_offline',
  'onu_los',
  'olt_down',
  'signal_degraded',
  'high_temperature',
  'power_failure',
  'maintenance_required'
]);

// OLT Table
export const olts = pgTable('olts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hardwareVersion: text('hardware_version').notNull(),
  ip: text('ip').notNull(),
  telnetPort: text('telnet_port').notNull(),
  snmpPort: text('snmp_port').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  address: text('address'),
  altitude: numeric('altitude', { precision: 8, scale: 2 }),
  status: oltStatusEnum('status').default('up'),
  uptime: text('uptime'),
  temperature: text('temperature'),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  ipIndex: index('olts_ip_idx').on(table.ip),
  locationIndex: index('olts_location_idx').on(table.latitude, table.longitude),
  statusIndex: index('olts_status_idx').on(table.status),
}));

// ONU Table
export const onus = pgTable('onus', {
  id: text('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  serialNumber: text('serial_number').notNull(),
  name: text('name').notNull(),
  oltId: text('olt_id').notNull().references(() => olts.id, { onDelete: 'cascade' }),
  oltName: text('olt_name').notNull(),
  board: text('board').notNull(),
  port: text('port').notNull(),
  onuNumber: text('onu_number').notNull(),
  onuTypeId: text('onu_type_id').notNull(),
  onuTypeName: text('onu_type_name').notNull(),
  zoneId: text('zone_id'),
  zoneName: text('zone_name'),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  address: text('address'),
  altitude: numeric('altitude', { precision: 8, scale: 2 }),
  odpId: text('odp_id').references(() => odps.id, { onDelete: 'set null' }),
  odpName: text('odp_name'),
  mode: text('mode').notNull(), // 'Routing' or 'Bridging'
  wanMode: text('wan_mode').notNull(),
  ipAddress: text('ip_address'),
  subnetMask: text('subnet_mask'),
  defaultGateway: text('default_gateway'),
  dns1: text('dns1'),
  dns2: text('dns2'),
  status: deviceStatusEnum('status'),
  administrativeStatus: text('administrative_status').notNull(), // 'Enabled' or 'Disabled'
  catvStatus: text('catv_status').notNull(),
  signalStrength: text('signal_strength'),
  signalValue: real('signal_value'), // numeric signal value in dBm
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  externalIdIndex: index('onus_external_id_idx').on(table.externalId),
  oltIdIndex: index('onus_olt_id_idx').on(table.oltId),
  locationIndex: index('onus_location_idx').on(table.latitude, table.longitude),
  statusIndex: index('onus_status_idx').on(table.status),
  serialNumberIndex: index('onus_serial_number_idx').on(table.serialNumber),
  boardPortIndex: index('onus_board_port_idx').on(table.oltId, table.board, table.port),
}));

// ODP (Optical Distribution Point) Table
export const odps = pgTable('odps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: odpTypeEnum('type').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
  address: text('address'),
  altitude: numeric('altitude', { precision: 8, scale: 2 }),
  description: text('description'),
  oltId: text('olt_id').notNull().references(() => olts.id, { onDelete: 'cascade' }),
  board: text('board').notNull(),
  port: text('port').notNull(),
  splitRatio: integer('split_ratio'), // e.g., 1:8, 1:16, 1:32
  capacity: integer('capacity'), // Maximum number of ONUs that can connect
  status: text('status').notNull().default('active'), // 'active', 'inactive', 'maintenance'
  installedDate: timestamp('installed_date'),
  lastMaintenance: timestamp('last_maintenance'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  oltIdIndex: index('odps_olt_id_idx').on(table.oltId),
  locationIndex: index('odps_location_idx').on(table.latitude, table.longitude),
  statusIndex: index('odps_status_idx').on(table.status),
  boardPortIndex: index('odps_board_port_idx').on(table.oltId, table.board, table.port),
}));

// Network Connections Table
export const connections = pgTable('connections', {
  id: text('id').primaryKey(),
  sourceType: text('source_type').notNull(), // 'olt', 'odp', 'onu'
  sourceId: text('source_id').notNull(),
  targetType: text('target_type').notNull(), // 'olt', 'odp', 'onu'
  targetId: text('target_id').notNull(),
  connectionType: connectionTypeEnum('connection_type').notNull(),
  status: connectionStatusEnum('status').notNull().default('active'),
  length: numeric('length', { precision: 8, scale: 2 }), // in meters
  signalLoss: numeric('signal_loss', { precision: 6, scale: 3 }), // in dB
  fiberCount: integer('fiber_count').default(1),
  createdDate: timestamp('created_date').defaultNow(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  sourceIndex: index('connections_source_idx').on(table.sourceType, table.sourceId),
  targetIndex: index('connections_target_idx').on(table.targetType, table.targetId),
  statusIndex: index('connections_status_idx').on(table.status),
}));

// Alerts Table
export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  type: alertTypeEnum('type').notNull(),
  level: alertLevelEnum('level').notNull(),
  deviceId: text('device_id').notNull(),
  deviceType: text('device_type').notNull(), // 'olt', 'onu', 'odp'
  deviceName: text('device_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedBy: text('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  metadata: jsonb('metadata'),
}, (table) => ({
  deviceIdIndex: index('alerts_device_id_idx').on(table.deviceId, table.deviceType),
  levelIndex: index('alerts_level_idx').on(table.level),
  typeIndex: index('alerts_type_idx').on(table.type),
  timestampIndex: index('alerts_timestamp_idx').on(table.timestamp),
  acknowledgedIndex: index('alerts_acknowledged_idx').on(table.acknowledged),
  resolvedIndex: index('alerts_resolved_idx').on(table.resolved),
}));

// API Cache Table
export const apiCache = pgTable('api_cache', {
  endpoint: text('endpoint').notNull(),
  cacheKey: text('cache_key').notNull(),
  responseData: jsonb('response_data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  endpointKeyIndex: index('api_cache_endpoint_key_idx').on(table.endpoint, table.cacheKey),
  expiresAtIndex: index('api_cache_expires_at_idx').on(table.expiresAt),
}));

// Dashboard Metrics Cache Table
export const metricsCache = pgTable('metrics_cache', {
  cacheKey: text('cache_key').primaryKey(),
  metricData: jsonb('metric_data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  expiresAtIndex: index('metrics_cache_expires_at_idx').on(table.expiresAt),
}));

// Device History Table for tracking changes
export const deviceHistory = pgTable('device_history', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  deviceType: text('device_type').notNull(), // 'olt', 'onu', 'odp'
  changeType: text('change_type').notNull(), // 'status_change', 'location_update', 'config_change'
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  changedAt: timestamp('changed_at').defaultNow(),
  changedBy: text('changed_by'), // system or user
  reason: text('reason'),
  metadata: jsonb('metadata'),
}, (table) => ({
  deviceIndex: index('device_history_device_idx').on(table.deviceId, table.deviceType),
  changeTypeIndex: index('device_history_change_type_idx').on(table.changeType),
  changedAtIndex: index('device_history_changed_at_idx').on(table.changedAt),
}));

// Relations
export const oltsRelations = relations(olts, ({ many }) => ({
  onus: many(onus),
  odps: many(odps),
  sourceConnections: many(connections, { relation: 'sourceConnections' }),
  targetConnections: many(connections, { relation: 'targetConnections' }),
}));

export const onusRelations = relations(onus, ({ one, many }) => ({
  olt: one(olts, {
    fields: [onus.oltId],
    references: [olts.id],
  }),
  odp: one(odps, {
    fields: [onus.odpId],
    references: [odps.id],
  }),
  sourceConnections: many(connections, { relation: 'sourceConnections' }),
  targetConnections: many(connections, { relation: 'targetConnections' }),
  alerts: many(alerts),
  history: many(deviceHistory),
}));

export const odpsRelations = relations(odps, ({ one, many }) => ({
  olt: one(olts, {
    fields: [odps.oltId],
    references: [olts.id],
  }),
  onus: many(onus),
  sourceConnections: many(connections, { relation: 'sourceConnections' }),
  targetConnections: many(connections, { relation: 'targetConnections' }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  // These would be set up with proper relations if we had connection tables
  // For now, we'll keep them simple
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  onu: one(onus, {
    fields: [alerts.deviceId],
    references: [onus.id],
  }),
}));

export const deviceHistoryRelations = relations(deviceHistory, ({ one }) => ({
  onu: one(onus, {
    fields: [deviceHistory.deviceId],
    references: [onus.id],
  }),
}));

// Export types for TypeScript usage
export type OLT = typeof olts.$inferSelect;
export type NewOLT = typeof olts.$inferInsert;

export type ONU = typeof onus.$inferSelect;
export type NewONU = typeof onus.$inferInsert;

export type ODP = typeof odps.$inferSelect;
export type NewODP = typeof odps.$inferInsert;

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type APICache = typeof apiCache.$inferSelect;
export type NewAPICache = typeof apiCache.$inferInsert;

export type MetricsCache = typeof metricsCache.$inferSelect;
export type NewMetricsCache = typeof metricsCache.$inferInsert;

export type DeviceHistory = typeof deviceHistory.$inferSelect;
export type NewDeviceHistory = typeof deviceHistory.$inferInsert;