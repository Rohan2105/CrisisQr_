const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'sEcxvJjYMfNiOBN49hxf';

export async function fetchMapTilerRoute(
  start: [number, number], // [lng, lat]
  end: [number, number]    // [lng, lat]
): Promise<any> {
  try {
    const url = `https://api.maptiler.com/routing/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?key=${MAPTILER_KEY}&geometries=geojson&overview=full`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    }
    return null;
  } catch (error) {
    console.error('MapTiler Routing Error:', error);
    return null;
  }
}
