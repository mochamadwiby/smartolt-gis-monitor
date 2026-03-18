import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';

// SmartOLT API Base Types
export const SmartOLTResponseSchema = z.object({
  status: z.boolean(),
  response: z.any().optional(),
  error: z.string().optional(),
});

export const OLTSchema = z.object({
  id: z.string(),
  name: z.string(),
  olt_hardware_version: z.string(),
  ip: z.string(),
  telnet_port: z.string(),
  snmp_port: z.string(),
});

export const OLTUptimeSchema = z.object({
  olt_id: z.string(),
  olt_name: z.string(),
  uptime: z.string(),
  env_temp: z.string(),
});

export const OLTPONPortSchema = z.object({
  board: z.string(),
  pon_port: z.string(),
  pon_type: z.string(),
  admin_status: z.string(),
  operational_status: z.string(),
  description: z.string(),
  min_range: z.string(),
  max_range: z.string(),
  tx_power: z.string(),
  onus_count: z.number(),
  online_onus_count: z.number(),
  average_signal: z.number(),
});

export const OLTOutageSchema = z.object({
  olt_id: z.string(),
  olt_name: z.string(),
  board: z.string(),
  port: z.string(),
  pon_description: z.string(),
  total_onus: z.string(),
  cause: z.string(),
  los_count: z.string(),
  power_count: z.string(),
  latest_status_change: z.string(),
});

export const ONUTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  pon_type: z.string(),
  capability: z.string(),
  ethernet_ports: z.number(),
  wifi_ports: z.number(),
  voip_ports: z.number(),
  catv: z.string(),
  allow_custom_profiles: z.string(),
});

export const UnconfiguredONUSchema = z.object({
  pon_type: z.string(),
  board: z.string(),
  port: z.string(),
  onu: z.string(),
  sn: z.string(),
  onu_type_name: z.string(),
  onu_type_id: z.string(),
  olt_id: z.string(),
});

export const ONUGpsCoordinateSchema = z.object({
  unique_external_id: z.string(),
  latitude: z.string(),
  longitude: z.string(),
});

export const ONUStatusSchema = z.object({
  unique_external_id: z.string(),
  sn: z.string(),
  name: z.string(),
  olt_id: z.string(),
  olt_name: z.string(),
  board: z.string(),
  port: z.string(),
  onu: z.string(),
  onu_type_id: z.string(),
  onu_type_name: z.string(),
  zone_id: z.string(),
  zone_name: z.string(),
  address: z.string().nullable(),
  odb_name: z.string(),
  mode: z.string(),
  wan_mode: z.string(),
  ip_address: z.string().nullable(),
  subnet_mask: z.string().nullable(),
  default_gateway: z.string().nullable(),
  dns1: z.string().nullable(),
  dns2: z.string().nullable(),
  username: z.string().nullable(),
  password: z.string().nullable(),
  catv: z.string(),
  administrative_status: z.string(),
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

export const ONUStatusSimpleSchema = z.object({
  onu_status: z.string(),
});

export const ONUAdministrativeStatusSchema = z.object({
  administrative_status: z.string(),
});

export const ONUCatvStatusSchema = z.object({
  onu_catv_status: z.string(),
});

export const ONUSignalSchema = z.object({
  onu_signal: z.string(),
  onu_signal_value: z.string(),
  onu_signal_1310: z.string(),
  onu_signal_1490: z.string(),
});

// Type definitions
export type SmartOLTResponse<T = any> = z.infer<typeof SmartOLTResponseSchema> & {
  response?: T;
};

export type OLT = z.infer<typeof OLTSchema>;
export type OLTUptime = z.infer<typeof OLTUptimeSchema>;
export type OLTPONPort = z.infer<typeof OLTPONPortSchema>;
export type OLTOutage = z.infer<typeof OLTOutageSchema>;
export type ONUType = z.infer<typeof ONUTypeSchema>;
export type UnconfiguredONU = z.infer<typeof UnconfiguredONUSchema>;
export type ONUGpsCoordinate = z.infer<typeof ONUGpsCoordinateSchema>;
export type ONUStatus = z.infer<typeof ONUStatusSchema>;
export type ONUStatusSimple = z.infer<typeof ONUStatusSimpleSchema>;
export type ONUAdministrativeStatus = z.infer<typeof ONUAdministrativeStatusSchema>;
export type ONUCatvStatus = z.infer<typeof ONUCatvStatusSchema>;
export type ONUSignal = z.infer<typeof ONUSignalSchema>;

export interface SmartOLTClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class SmartOLTClient {
  private client: AxiosInstance;
  private config: SmartOLTClientConfig;

  constructor(config: SmartOLTClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (request) => {
        console.log(`[SmartOLT] ${request.method?.toUpperCase()} ${request.url}`);
        return request;
      },
      (error) => {
        console.error('[SmartOLT] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[SmartOLT] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[SmartOLT] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    schema?: z.ZodSchema<T>
  ): Promise<SmartOLTResponse<T>> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const response: AxiosResponse<SmartOLTResponse<T>> = await this.client.request({
          method,
          url: endpoint,
          data,
        });

        // Validate response structure
        const validatedResponse = SmartOLTResponseSchema.parse(response.data);

        if (!validatedResponse.status) {
          throw new Error(validatedResponse.error || 'API request failed');
        }

        // Validate response data if schema provided
        if (schema && validatedResponse.response) {
          validatedResponse.response = schema.parse(validatedResponse.response);
        }

        return validatedResponse;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retryAttempts!) {
          console.log(`[SmartOLT] Retry attempt ${attempt + 1}/${this.config.retryAttempts}`);
          await this.delay(this.config.retryDelay! * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // OLT Endpoints
  async getOLTs(): Promise<SmartOLTResponse<OLT[]>> {
    return this.makeRequest('GET', '/api/system/get_olts', undefined, z.array(OLTSchema));
  }

  async getOLTsUptimeAndEnvTemperature(): Promise<SmartOLTResponse<OLTUptime[]>> {
    return this.makeRequest('GET', '/api/olt/get_olts_uptime_and_env_temperature', undefined, z.array(OLTUptimeSchema));
  }

  async getOLTPONPortsDetails(oltId: string): Promise<SmartOLTResponse<OLTPONPort[]>> {
    return this.makeRequest('GET', `/api/system/get_olt_pon_ports_details/${oltId}`, undefined, z.array(OLTPONPortSchema));
  }

  async getOLTOutagePons(oltId: string): Promise<SmartOLTResponse<OLTOutage[]>> {
    return this.makeRequest('GET', `/api/system/get_outage_pons/${oltId}`, undefined, z.array(OLTOutageSchema));
  }

  // ONU Type Endpoints
  async getONUTypes(): Promise<SmartOLTResponse<ONUType[]>> {
    return this.makeRequest('GET', '/api/system/get_onu_types', undefined, z.array(ONUTypeSchema));
  }

  async getONUTypesByPONType(ponType: string): Promise<SmartOLTResponse<ONUType[]>> {
    return this.makeRequest('GET', `/api/system/get_onu_types_by_pon_type/${ponType}`, undefined, z.array(ONUTypeSchema));
  }

  // ONU Endpoints
  async getUnconfiguredONUs(): Promise<SmartOLTResponse<UnconfiguredONU[]>> {
    return this.makeRequest('GET', '/api/onu/unconfigured_onus', undefined, z.array(UnconfiguredONUSchema));
  }

  async getUnconfiguredONUsForOLT(oltId: string): Promise<SmartOLTResponse<UnconfiguredONU[]>> {
    return this.makeRequest('GET', `/api/onu/unconfigured_onus_for_olt/${oltId}`, undefined, z.array(UnconfiguredONUSchema));
  }

  async getONUS_statuses(params?: {
    olt_id?: string;
    board?: string;
    port?: string;
    zone?: string;
  }): Promise<SmartOLTResponse<any[]>> {
    const searchParams = new URLSearchParams(params as any).toString();
    const endpoint = searchParams ? `/api/onu/get_onus_statuses?${searchParams}` : '/api/onu/get_onus_statuses';
    return this.makeRequest('GET', endpoint);
  }

  async getONUS_administrative_statuses(params?: {
    olt_id?: string;
    board?: string;
    port?: string;
    zone?: string;
  }): Promise<SmartOLTResponse<any[]>> {
    const searchParams = new URLSearchParams(params as any).toString();
    const endpoint = searchParams ? `/api/onu/get_onus_administrative_statuses?${searchParams}` : '/api/onu/get_onus_administrative_statuses';
    return this.makeRequest('GET', endpoint);
  }

  async getONUS_signals(params?: {
    olt_id?: string;
    board?: string;
    port?: string;
    zone?: string;
  }): Promise<SmartOLTResponse<any[]>> {
    const searchParams = new URLSearchParams(params as any).toString();
    const endpoint = searchParams ? `/api/onu/get_onus_signals?${searchParams}` : '/api/onu/get_onus_signals';
    return this.makeRequest('GET', endpoint);
  }

  async getAllONUS_gps_coordinates(params?: {
    olt_id?: string;
    board?: string;
    port?: string;
    zone?: string;
  }): Promise<SmartOLTResponse<ONUGpsCoordinate[]>> {
    const searchParams = new URLSearchParams(params as any).toString();
    const endpoint = searchParams ? `/api/onu/get_all_onus_gps_coordinates?${searchParams}` : '/api/onu/get_all_onus_gps_coordinates';
    return this.makeRequest('GET', endpoint, undefined, z.object({
      onus: z.array(ONUGpsCoordinateSchema)
    })).then(response => ({
      ...response,
      response: response.response?.onus || []
    }));
  }

  async getONUS_details(params?: {
    olt_id?: string;
    board?: string;
    port?: string;
    zone?: string;
    odb?: string;
  }): Promise<SmartOLTResponse<ONUStatus[]>> {
    const searchParams = new URLSearchParams(params as any).toString();
    const endpoint = searchParams ? `/api/onu/get_all_onus_details?${searchParams}` : '/api/onu/get_all_onus_details';
    return this.makeRequest('GET', endpoint);
  }

  // Individual ONU Endpoints
  async getONU_status(onuExternalId: string): Promise<SmartOLTResponse<ONUStatusSimple>> {
    return this.makeRequest('GET', `/api/onu/get_onu_status/${onuExternalId}`, undefined, ONUStatusSimpleSchema);
  }

  async getONU_administrative_status(onuExternalId: string): Promise<SmartOLTResponse<ONUAdministrativeStatus>> {
    return this.makeRequest('GET', `/api/onu/get_onu_administrative_status/${onuExternalId}`, undefined, ONUAdministrativeStatusSchema);
  }

  async getONU_catv_status(onuExternalId: string): Promise<SmartOLTResponse<ONUCatvStatus>> {
    return this.makeRequest('GET', `/api/onu/get_onu_catv_status/${onuExternalId}`, undefined, ONUCatvStatusSchema);
  }

  async getONU_signal(onuExternalId: string): Promise<SmartOLTResponse<ONUSignal>> {
    return this.makeRequest('GET', `/api/onu/get_onu_signal/${onuExternalId}`, undefined, ONUSignalSchema);
  }

  async getONU_details(onuExternalId: string): Promise<SmartOLTResponse<ONUStatus>> {
    return this.makeRequest('GET', `/api/onu/get_onu_details/${onuExternalId}`, undefined, z.object({
      onu_details: ONUStatusSchema
    })).then(response => ({
      ...response,
      response: response.response?.onu_details
    }));
  }

  async getONUS_details_by_sn(onuSn: string): Promise<SmartOLTResponse<ONUStatus[]>> {
    return this.makeRequest('GET', `/api/onu/get_onus_details_by_sn/${onuSn}`, undefined, z.object({
      onus: z.array(ONUStatusSchema)
    })).then(response => ({
      ...response,
      response: response.response?.onus || []
    }));
  }

  async getONU_full_status_info(onuExternalId: string): Promise<SmartOLTResponse<string>> {
    return this.makeRequest('GET', `/api/onu/get_onu_full_status_info/${onuExternalId}`, undefined, z.object({
      full_status_info: z.string()
    })).then(response => ({
      ...response,
      response: response.response?.full_status_info
    }));
  }

  async getONU_running_config(onuExternalId: string): Promise<SmartOLTResponse<string>> {
    return this.makeRequest('GET', `/api/onu/get_running_config/${onuExternalId}`, undefined, z.object({
      running_config: z.string()
    })).then(response => ({
      ...response,
      response: response.response?.running_config
    }));
  }

  async getONU_speed_profiles(onuExternalId: string): Promise<SmartOLTResponse<{upload_speed_profile_name: string, download_speed_profile_name: string}>> {
    return this.makeRequest('GET', `/api/onu/get_onu_speed_profiles/${onuExternalId}`, undefined, z.object({
      upload_speed_profile_name: z.string(),
      download_speed_profile_name: z.string()
    }));
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      await this.getOLTs();
      return true;
    } catch (error) {
      console.error('[SmartOLT] Connection test failed:', error);
      return false;
    }
  }

  getConfig(): SmartOLTClientConfig {
    return { ...this.config };
  }
}

// Factory function for creating SmartOLT client
export function createSmartOLTClient(config: SmartOLTClientConfig): SmartOLTClient {
  return new SmartOLTClient(config);
}

// Default client instance
let defaultClient: SmartOLTClient | null = null;

export function setDefaultSmartOLTClient(client: SmartOLTClient): void {
  defaultClient = client;
}

export function getSmartOLTClient(): SmartOLTClient {
  if (!defaultClient) {
    throw new Error('SmartOLT client not initialized. Call setDefaultSmartOLTClient() first.');
  }
  return defaultClient;
}

// Environment helper
export function createSmartOLTClientFromEnv(): SmartOLTClient {
  const subdomain = process.env.SMARTOLT_SUBDOMAIN;
  const apiKey = process.env.SMARTOLT_API_KEY;

  if (!subdomain || !apiKey) {
    throw new Error('SMARTOLT_SUBDOMAIN and SMARTOLT_API_KEY environment variables are required');
  }

  return createSmartOLTClient({
    baseUrl: `https://${subdomain}.smartolt.com`,
    apiKey,
  });
}