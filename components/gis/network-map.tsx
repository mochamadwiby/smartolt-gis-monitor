'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useOLTs, useONUCoordinates, useNetworkTopology } from '@/hooks/use-smartolt';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  MapPin,
  Activity,
  ZoomIn,
  ZoomOut,
  Maximize,
  Layers,
  Loader2
} from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface Device {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline' | 'los' | 'warning' | 'unknown';
  type: 'olt' | 'onu' | 'odp';
  metadata?: Record<string, any>;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: string;
  targetType: string;
  status: 'active' | 'inactive' | 'fault';
  signalLoss?: number;
}

interface NetworkMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  onDeviceClick?: (device: Device) => void;
  showConnections?: boolean;
  showLabels?: boolean;
  animateConnections?: boolean;
}

export function NetworkMap({
  className,
  center = [-6.2088, 106.8456], // Jakarta coordinates
  zoom = 11,
  onDeviceClick,
  showConnections = true,
  showLabels = true,
  animateConnections = true,
}: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const connectionsRef = useRef<L.Polyline[]>([]);
  const animationFrameRef = useRef<number>();

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [showOLTs, setShowOLTs] = useState(true);
  const [showONUs, setShowONUs] = useState(true);
  const [showODPs, setShowODPs] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const { data: olts, isLoading: oltsLoading } = useOLTs();
  const { data: onusCoordinates, isLoading: onusLoading } = useONUCoordinates();
  const { data: topology, isLoading: topologyLoading } = useNetworkTopology();

  // Combine all devices
  const devices: Device[] = useMemo(() => {
    const allDevices: Device[] = [];

    // Add OLTs
    if (olts?.data) {
      olts.data.forEach((olt: any) => {
        if (olt.latitude && olt.longitude) {
          allDevices.push({
            id: olt.id,
            name: olt.name,
            latitude: parseFloat(olt.latitude),
            longitude: parseFloat(olt.longitude),
            status: olt.status === 'up' ? 'online' : 'offline',
            type: 'olt',
            metadata: {
              ip: olt.ip,
              hardwareVersion: olt.hardware_version,
              temperature: olt.temperature,
            },
          });
        }
      });
    }

    // Add ONUs with coordinates
    if (onusCoordinates?.data) {
      onusCoordinates.data.forEach((onu: any) => {
        if (onu.latitude && onu.longitude) {
          allDevices.push({
            id: onu.unique_external_id,
            name: onu.name || `ONU-${onu.unique_external_id}`,
            latitude: parseFloat(onu.latitude),
            longitude: parseFloat(onu.longitude),
            status: 'online', // Default status, should be updated with real status
            type: 'onu',
            metadata: {
              serialNumber: onu.sn,
            },
          });
        }
      });
    }

    return allDevices;
  }, [olts, onusCoordinates]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false, // Custom zoom controls
      attributionControl: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapLoading(false);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  // Custom icons for different device types and statuses
  const getDeviceIcon = useCallback((device: Device) => {
    const statusColors = {
      online: '#22c55e',
      offline: '#ef4444',
      los: '#dc2626',
      warning: '#f59e0b',
      unknown: '#6b7280',
    };

    const typeIcons = {
      olt: '📡',
      onu: '🏠',
      odp: '🔌',
    };

    const color = statusColors[device.status];
    const icon = typeIcons[device.type];

    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        ">
          ${icon}
        </div>
      `,
      className: 'device-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }, []);

  // Add or update markers
  useEffect(() => {
    if (!mapInstanceRef.current || devices.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Add markers for filtered devices
    const filteredDevices = devices.filter(device => {
      if (device.type === 'olt' && !showOLTs) return false;
      if (device.type === 'onu' && !showONUs) return false;
      if (device.type === 'odp' && !showODPs) return false;
      return true;
    });

    filteredDevices.forEach(device => {
      const marker = L.marker([device.latitude, device.longitude], {
        icon: getDeviceIcon(device),
      });

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">
            ${device.name}
          </h3>
          <p style="margin: 4px 0;">
            <strong>Type:</strong> ${device.type.toUpperCase()}
          </p>
          <p style="margin: 4px 0;">
            <strong>Status:</strong>
            <span style="
              color: ${device.status === 'online' ? '#22c55e' :
                      device.status === 'offline' ? '#ef4444' :
                      device.status === 'los' ? '#dc2626' :
                      device.status === 'warning' ? '#f59e0b' : '#6b7280'};
            ">
              ${device.status.toUpperCase()}
            </span>
          </p>
          ${device.metadata?.ip ? `<p style="margin: 4px 0;"><strong>IP:</strong> ${device.metadata.ip}</p>` : ''}
          ${device.metadata?.serialNumber ? `<p style="margin: 4px 0;"><strong>SN:</strong> ${device.metadata.serialNumber}</p>` : ''}
          ${device.metadata?.temperature ? `<p style="margin: 4px 0;"><strong>Temp:</strong> ${device.metadata.temperature}</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Handle click
      marker.on('click', () => {
        setSelectedDevice(device);
        onDeviceClick?.(device);
      });

      // Hover effects
      marker.on('mouseover', function(e) {
        const icon = this.getElement();
        if (icon) {
          icon.style.transform = 'scale(1.2)';
          icon.style.zIndex = '1000';
        }
      });

      marker.on('mouseout', function(e) {
        const icon = this.getElement();
        if (icon) {
          icon.style.transform = 'scale(1)';
          icon.style.zIndex = '';
        }
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are devices
    if (filteredDevices.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [devices, showOLTs, showONUs, showODPs, getDeviceIcon, onDeviceClick]);

  // Draw animated connections between devices
  useEffect(() => {
    if (!mapInstanceRef.current || !showConnections || !topology?.data) return;

    const map = mapInstanceRef.current;

    // Clear existing connections
    connectionsRef.current.forEach(connection => map.removeLayer(connection));
    connectionsRef.current = [];

    // Draw connections (sample implementation)
    topology.data.connections.forEach((connection: Connection) => {
      const sourceDevice = devices.find(d => d.id === connection.sourceId);
      const targetDevice = devices.find(d => d.id === connection.targetId);

      if (sourceDevice && targetDevice) {
        const color = connection.status === 'active' ? '#22c55e' :
                     connection.status === 'fault' ? '#ef4444' : '#6b7280';

        const polyline = L.polyline(
          [
            [sourceDevice.latitude, sourceDevice.longitude],
            [targetDevice.latitude, targetDevice.longitude],
          ],
          {
            color,
            weight: 2,
            opacity: 0.7,
            dashArray: connection.status === 'inactive' ? '5, 10' : undefined,
          }
        );

        polyline.addTo(map);
        connectionsRef.current.push(polyline);

        // Animate connections if enabled
        if (animateConnections && connection.status === 'active') {
          animateConnection(polyline);
        }
      }
    });

    return () => {
      connectionsRef.current.forEach(connection => map.removeLayer(connection));
      connectionsRef.current = [];
    };
  }, [topology, devices, showConnections, animateConnections]);

  // Animate connection with moving dots
  const animateConnection = useCallback((polyline: L.Polyline) => {
    const latlngs = polyline.getLatLngs();

    const animate = () => {
      // This is a simplified animation
      // In a real implementation, you'd create moving dots along the path
      if (animateConnections && polyline._map) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  }, [animateConnections]);

  // Map controls
  const zoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const zoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const fitBounds = () => {
    if (markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstanceRef.current?.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const isLoading = oltsLoading || onusLoading || topologyLoading;

  return (
    <div className={cn('relative w-full h-full', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading network map...</span>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Card className="p-2 bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fitBounds}
              className="h-8 w-8 p-0"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-2 bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-1">
              <Layers className="h-4 w-4" />
              <span className="text-xs font-medium">Layers</span>
            </div>
            <label className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showOLTs}
                onChange={(e) => setShowOLTs(e.target.checked)}
                className="rounded"
              />
              OLTs
            </label>
            <label className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showONUs}
                onChange={(e) => setShowONUs(e.target.checked)}
                className="rounded"
              />
              ONUs
            </label>
            <label className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showODPs}
                onChange={(e) => setShowODPs(e.target.checked)}
                className="rounded"
              />
              ODPs
            </label>
            <label className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showConnections}
                onChange={(e) => setShowConnections(e.target.checked)}
                className="rounded"
              />
              Connections
            </label>
          </div>
        </Card>
      </div>

      {/* Device Info Panel */}
      {selectedDevice && (
        <Card className="absolute top-4 right-4 z-10 p-4 bg-background/90 backdrop-blur-sm w-80">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold">{selectedDevice.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDevice(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="secondary">{selectedDevice.type.toUpperCase()}</Badge>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={selectedDevice.status === 'online' ? 'default' : 'destructive'}
              >
                {selectedDevice.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-mono text-xs">
                {selectedDevice.latitude.toFixed(4)}, {selectedDevice.longitude.toFixed(4)}
              </span>
            </div>

            {selectedDevice.metadata && Object.entries(selectedDevice.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 z-10 p-3 bg-background/90 backdrop-blur-sm">
        <h4 className="text-sm font-semibold mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Offline/LOS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Warning</span>
          </div>
        </div>
      </Card>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}