'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Thermometer,
  Clock,
  Map,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  label: string;
  value?: string | number;
  icon?: ReactNode;
  className?: string;
}

function StatusIndicator({ status, label, value, icon, className }: StatusIndicatorProps) {
  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
    unknown: 'bg-gray-500',
  };

  const statusIcons = {
    healthy: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    critical: <XCircle className="h-4 w-4" />,
    unknown: <Clock className="h-4 w-4" />,
  };

  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-background/50 backdrop-blur-sm border', className)}>
      <div className={cn('w-2 h-2 rounded-full', statusColors[status])} />
      {icon || statusIcons[status]}
      <span className="text-sm font-medium">{label}</span>
      {value !== undefined && (
        <Badge variant="secondary" className="ml-auto">
          {value}
        </Badge>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: ReactNode;
  status?: 'healthy' | 'warning' | 'critical';
  className?: string;
}

function MetricCard({ title, value, change, changeType, icon, status, className }: MetricCardProps) {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
  };

  const statusBorderColors = {
    healthy: 'border-green-200',
    warning: 'border-yellow-200',
    critical: 'border-red-200',
  };

  return (
    <Card className={cn('p-6 relative overflow-hidden', status && statusBorderColors[status], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <p className={cn('text-sm', changeColors[changeType])}>
              {changeType === 'increase' ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function DashboardLayout({ children, title = "SmartOLT GIS Monitor", className }: DashboardLayoutProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white',
      // Optimized for 4K displays
      'grid grid-rows-[auto_1fr_auto] gap-4 p-4',
      'max-w-[3840px] mx-auto', // Max width for 4K
      className
    )}>
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-background/10 backdrop-blur-md rounded-xl border border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wifi className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">Network Operations Center</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <StatusIndicator
            status="healthy"
            label="API Status"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatusIndicator
            status="healthy"
            label="Database"
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)}
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-12 gap-4 min-h-0">
        {/* Left Sidebar - Quick Stats */}
        <aside className="col-span-3 space-y-4 overflow-y-auto">
          <Card className="p-4 bg-background/10 backdrop-blur-md border border-white/10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Network Overview
            </h2>
            <div className="space-y-3">
              <MetricCard
                title="OLTs"
                value="3"
                change={0}
                changeType="increase"
                icon={<Wifi className="h-8 w-8 text-blue-500" />}
                status="healthy"
              />
              <MetricCard
                title="ONUs"
                value="1,247"
                change={2.3}
                changeType="increase"
                icon={<Wifi className="h-8 w-8 text-green-500" />}
                status="warning"
              />
              <MetricCard
                title="Active Alerts"
                value="2"
                change={-1}
                changeType="decrease"
                icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
                status="critical"
              />
              <MetricCard
                title="Temperature"
                value="26°C"
                icon={<Thermometer className="h-8 w-8 text-yellow-500" />}
                status="healthy"
              />
            </div>
          </Card>

          <Card className="p-4 bg-background/10 backdrop-blur-md border border-white/10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
            </h2>
            <div className="space-y-2">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ONU Loss of Signal</span>
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Customer Selatan 1 - 2 hours ago</p>
              </div>
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ONU Offline</span>
                  <Badge variant="secondary" className="text-xs">Major</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Customer Central 2 - 4 hours ago</p>
              </div>
            </div>
          </Card>
        </aside>

        {/* Center - Main Map/Content */}
        <div className="col-span-6 bg-background/10 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Map className="h-5 w-5" />
              Network Map
            </h2>
          </div>
          <div className="h-full min-h-[600px] relative">
            {children}
          </div>
        </div>

        {/* Right Sidebar - Device Details */}
        <aside className="col-span-3 space-y-4 overflow-y-auto">
          <Card className="p-4 bg-background/10 backdrop-blur-md border border-white/10">
            <h2 className="text-lg font-semibold mb-4">Device Status</h2>
            <div className="space-y-3">
              <StatusIndicator
                status="healthy"
                label="OLT Jakarta Central"
                value="Online"
                icon={<Wifi className="h-4 w-4" />}
              />
              <StatusIndicator
                status="healthy"
                label="OLT Jakarta Selatan"
                value="Online"
                icon={<Wifi className="h-4 w-4" />}
              />
              <StatusIndicator
                status="healthy"
                label="OLT Jakarta Utara"
                value="Online"
                icon={<Wifi className="h-4 w-4" />}
              />
              <StatusIndicator
                status="warning"
                label="Total ONUs"
                value="1,189 Online"
                icon={<Wifi className="h-4 w-4" />}
              />
              <StatusIndicator
                status="critical"
                label="Offline ONUs"
                value="58"
                icon={<WifiOff className="h-4 w-4" />}
              />
            </div>
          </Card>

          <Card className="p-4 bg-background/10 backdrop-blur-md border border-white/10">
            <h2 className="text-lg font-semibold mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Uptime</span>
                <span className="text-sm font-semibold">99.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Signal Strength</span>
                <span className="text-sm font-semibold">-12.5 dBm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Response Time</span>
                <span className="text-sm font-semibold">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Throughput</span>
                <span className="text-sm font-semibold">2.4 Gbps</span>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between p-4 bg-background/10 backdrop-blur-md rounded-xl border border-white/10">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>SmartOLT GIS Monitor v1.0</span>
          <span>•</span>
          <span>Optimized for 4K Displays</span>
          {isFullscreen && (
            <>
              <span>•</span>
              <span className="text-green-400">Fullscreen Mode</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            System Healthy
          </span>
        </div>
      </footer>
    </div>
  );
}