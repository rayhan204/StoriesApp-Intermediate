import Map from '../utils/map.js';

export async function storyMapper(report) {
    return {
      ...report,
      location: {
        ...report.location,
        placeName: await Map.getPlaceNameByCoordinate(report.location.latitude, report.location.longitude),
      },
    };
  }
