import type { ArchiveRecord, LocationCluster } from "../types";

export function clusterRecords(records: ArchiveRecord[], distanceThresholdKm = 40): LocationCluster[] {
  const clusters: LocationCluster[] = [];

  for (const record of records) {
    if (!record.place.coordinates) continue;
    const { longitude, latitude } = record.place.coordinates;

    // Find existing cluster within threshold
    const match = clusters.find(c => {
      const radians = Math.PI / 180;
      const dLat = (c.coordinates.latitude - latitude) * radians;
      const dLon = (c.coordinates.longitude - longitude) * radians;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(latitude * radians) * Math.cos(c.coordinates.latitude * radians) * Math.sin(dLon / 2) ** 2;
      const dist = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
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
