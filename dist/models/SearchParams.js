"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * API search parameters. Clients can search for product inventory state reports by
 * location (geocoordinate or geohash) and radius, a known store (storeId), and
 * either a barcode or start of a product's generic name (category).
 *
 * If `storeId` is provided, all other geolocation attributes are ignored.
 * If `geohash` is provided, `lat` and `lng` are ignored but `radius` is respected.
 * If `barcode` is provided, `genericName` is ignored.
 */
class SearchParams {
    constructor() {
        this.radius = 1; // radius in miles
    }
}
exports.SearchParams = SearchParams;
//# sourceMappingURL=SearchParams.js.map