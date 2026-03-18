import { z } from 'zod';

// Enhanced device status enum
export const DeviceStatusEnum = z.enum(['online', 'offline', 'los', 'warning', 'unknown']);
export type DeviceStatus = z.infer<typeof DeviceStatusEnum>;

export const PONTypeEnum = z.enum(['gpon', 'epon']);
export type PONType = z.infer<typeof PONTypeEnum>;

export const OLTStatusEnum = z.enum(['up', 'down', 'maintenance']);
export type OLTStatus = z.infer<typeof OLTStatusEnum>;

// Geographic location schema
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  altitude: z.number().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

// Enhanced OLT schema with additional fields
export const EnhancedOLTSchema = z.object({
  id: z.string(),
  name: z.string(),
  hardware_version: z.string(),
  ip: z.string(),
  telnet_port: z.string(),
  snmp_port: z.string(),
  location: LocationSchema.optional(),
  status: OLTStatusEnum.optional(),
  uptime: z.string().optional(),
  temperature: z.string().optional(),
  last_updated: z.date().optional(),
});

export type EnhancedOLT = z.infer<typeof EnhancedOLTSchema>;

// Enhanced ONU schema with GIS data
export const EnhancedONUSchema = z.object({
  id: z.string(),
  external_id: z.string(),
  serial_number: z.string(),
  name: z.string(),
  olt_id: z.string(),
  olt_name: z.string(),
  board: z.string(),
  port: z.string(),
  onu_number: z.string(),
  onu_type_id: z.string(),
  onu_type_name: z.string(),
  zone_id: z.string(),
  zone_name: z.string(),
  location: LocationSchema.optional(),
  odb_id: z.string().optional(),
  odb_name: z.string().optional(),
  mode: z.enum(['Routing', 'Bridging']),
  wan_mode: z.string(),
  ip_address: z.string().nullable(),
  subnet_mask: z.string().nullable(),
  default_gateway: z.string().nullable(),
  dns1: z.string().nullable(),
  dns2: z.string().nullable(),
  status: DeviceStatusEnum.optional(),
  administrative_status: z.enum(['Enabled', 'Disabled']),
  catv_status: z.enum(['Enabled', 'Disabled', 'Not supported']),
  signal_strength: z.string().optional(),
  signal_value: z.number().optional(),
  last_seen: z.date().optional(),
  last_updated: z.date().optional(),
  service_ports: z.array(z.object({
    service_port: z.string(),
    vlan: z.string(),
    cvlan: z.string(),
    svlan: z.string(),
    tag_transform_mode: z.string(),
    upload_speed: z.string(),
    download_speed: z.string(),
  })),
});

export type EnhancedONU = z.infer<typeof EnhancedONUSchema>;

// ODP (Optical Distribution Point) schema
export const ODPSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['splitter', 'closure', 'patch_panel']),
  location: LocationSchema,
  description: z.string().optional(),
  olt_id: z.string(),
  board: z.string(),
  port: z.string(),
  split_ratio: z.number().optional(), // e.g., 1:8, 1:16, 1:32
  connected_onus: z.array(z.string()).optional(), // Array of ONU external IDs
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  installed_date: z.date().optional(),
  last_maintenance: z.date().optional(),
});

export type ODP = z.infer<typeof ODPSchema>;

// Connection schema for network topology
export const ConnectionSchema = z.object({
  id: z.string(),
  source_type: z.enum(['olt', 'odp', 'onu']),
  source_id: z.string(),
  target_type: z.enum(['olt', 'odp', 'onu']),
  target_id: z.string(),
  connection_type: z.enum(['fiber', 'pon', 'patch_cord']),
  status: z.enum(['active', 'inactive', 'fault']),
  length: z.number().optional(), // in meters
  signal_loss: z.number().optional(), // in dB
  created_date: z.date().optional(),
  last_updated: z.date().optional(),
});

export type Connection = z.infer<typeof ConnectionSchema>;

// Network topology data
export const NetworkTopologySchema = z.object({
  olts: z.array(EnhancedOLTSchema),
  odps: z.array(ODPSchema),
  onus: z.array(EnhancedONUSchema),
  connections: z.array(ConnectionSchema),
});

export type NetworkTopology = z.infer<typeof NetworkTopologySchema>;

// Alert and monitoring schemas
export const AlertLevelEnum = z.enum(['critical', 'major', 'minor', 'info']);
export type AlertLevel = z.infer<typeof AlertLevelEnum>;

export const AlertTypeEnum = z.enum([
  'onu_offline',
  'onu_los',
  'olt_down',
  'signal_degraded',
  'high_temperature',
  'power_failure',
  'maintenance_required'
]);
export type AlertType = z.infer<typeof AlertTypeEnum>;

export const AlertSchema = z.object({
  id: z.string(),
  type: AlertTypeEnum,
  level: AlertLevelEnum,
  device_id: z.string(),
  device_type: z.enum(['olt', 'onu', 'odp']),
  device_name: z.string(),
  title: z.string(),
  description: z.string(),
  location: LocationSchema.optional(),
  timestamp: z.date(),
  acknowledged: z.boolean().default(false),
  acknowledged_by: z.string().optional(),
  acknowledged_at: z.date().optional(),
  resolved: z.boolean().default(false),
  resolved_at: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Alert = z.infer<typeof AlertSchema>;

// Dashboard metrics
export const DashboardMetricsSchema = z.object({
  total_olts: z.number(),
  online_olts: z.number(),
  total_onus: z.number(),
  online_onus: z.number(),
  offline_onus: z.number(),
  los_onus: z.number(),
  total_odps: z.number(),
  active_odps: z.number(),
  average_temperature: z.number().optional(),
  alerts_count: z.object({
    critical: z.number(),
    major: z.number(),
    minor: z.number(),
    info: z.number(),
  }),
  last_updated: z.date(),
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

// API Response wrapper for pagination
export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
  }),
});

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

// Filter and query types
export const DeviceFilterSchema = z.object({
  olt_id: z.string().optional(),
  board: z.string().optional(),
  port: z.string().optional(),
  zone_id: z.string().optional(),
  status: DeviceStatusEnum.optional(),
  onu_type: z.string().optional(),
  location_bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
  date_range: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
});

export type DeviceFilter = z.infer<typeof DeviceFilterSchema>;

// Cache configuration
export const CacheConfigSchema = z.object({
  ttl: z.number().default(60), // seconds
  stale_while_revalidate: z.boolean().default(true),
  background_refetch: z.boolean().default(true),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

// Real-time update event types
export const RealTimeEventSchema = z.object({
  type: z.enum(['device_status_change', 'new_alert', 'alert_resolved', 'location_update']),
  device_id: z.string(),
  device_type: z.enum(['olt', 'onu', 'odp']),
  timestamp: z.date(),
  data: z.record(z.any()),
});

export type RealTimeEvent = z.infer<typeof RealTimeEventSchema>;

// Animation effects for map connections
export const AnimationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  speed: z.number().default(2), // seconds
  color: z.string().default('#00ff00'),
  width: z.number().default(2),
  dash_array: z.string().default('5, 10'),
});

export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;