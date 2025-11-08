"use client";

import { NetworkMap } from "@/components/gis/network-map";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useDashboardMetrics } from "@/hooks/use-smartolt";

export default function Home() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  return (
    <DashboardLayout>
      <NetworkMap
        center={[-6.2088, 106.8456]} // Jakarta coordinates
        zoom={11}
        showConnections={true}
        showLabels={true}
        animateConnections={true}
        onDeviceClick={(device) => {
          console.log('Device clicked:', device);
        }}
      />
    </DashboardLayout>
  );
}