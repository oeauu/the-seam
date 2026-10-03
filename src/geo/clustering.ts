import type { ArchiveRecord, LocationCluster } from "../types";

export function clusterRecords(records: ArchiveRecord[], distanceThresholdKm = 40): LocationCluster[] {
  const clusters: LocationCluster[] = [];

  for (const record of records) {
    if (!record.place.coordinates) continue;
    const { longitude, latitude } = record.place.coordinates;

    // Find existing cluster within threshold
    const match = clusters.find(c => {
      const dLat = (c.coordinates.latitude - latitude) * 111;
      const dLon = (c.coordinates.longitude - longitude) * 111 * Math.cos((latitude * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      return dist <= distanceThresholdKm;
    });

    if (match) {
      match.recordIds.push(record.id);
      match.records.push(record);
    } else {
      clusters.push({
        id: `cluster-${record.id}`,
        name: record.place.name,
        coordinates: { longitude, latitude },
        recordIds: [record.id],
        records: [record]
      });
    }
  }

  return clusters;
}
