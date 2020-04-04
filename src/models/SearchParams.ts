/**
 * API search parameters. Clients can search for product inventory state reports by
 * location (geocoordinate or geohash) and radius, a known store (storeId), and
 * either a barcode or start of a product's generic name (category).
 *
 * If `storeId` is provided, all other geolocation attributes are ignored.
 * If `geohash` is provided, `lat` and `lng` are ignored but `radius` is respected.
 * If `barcode` is provided, `genericName` is ignored.
 */
export class SearchParams {
    /**
     * User's position latitude
     */
    lat: string
    /**
     * User's position longitude
     */
    lng: string
    /**
     * User's geocoordinate as a geohash. Required only if lat and lng are not provided.
     */
    geohash: string
    radius: number = 1 // radius in miles
    /**
     * Barcode to search for. One of barcode or genericName is required.
     */
    barcode: string
    /**
     * Optional prefix for searching product generic names
     */
    genericName: string
    /**
     * Optional store ID. If a store ID is provided, lat/lng, geohash, and radius are ignored.
     */
    storeId: number
}