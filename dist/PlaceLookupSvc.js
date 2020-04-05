"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const axios_1 = __importDefault(require("axios"));
const Store_1 = require("./models/Store");
// Place search URL. 600 is the Here place category for Shopping
let URL_ROOT = "https://discover.search.hereapi.com/v1/discover?limit=1&apiKey={apiKey}&q=Shopping&in=circle:{latlng};r=300";
const logger = winston_1.default.createLogger({
    level: "debug",
    format: winston_1.default.format.json(),
    defaultMeta: { service: 'PlaceLookupSvc' },
    transports: [new winston_1.default.transports.Console()]
});
axios_1.default.defaults.responseType = "json";
// const testResponse = {"items":[{"title":"Walmart","id":"here:pds:place:840jx7ps-4abb9f6606d30c6e118cc69b795ace40","resultType":"place","address":{"label":"Walmart, 2151 Royal Ave, Madison, WI 53713, United States","countryCode":"USA","countryName":"United States","state":"Wisconsin","county":"Dane","city":"Madison","street":"Royal Ave","postalCode":"53713","houseNumber":"2151"},"position":{"lat":43.04319,"lng":-89.34939},"access":[{"lat":43.04332,"lng":-89.34938}],"distance":108,"categories":[{"id":"600-6200-0063"},{"id":"600-6300-0066"},{"id":"700-7850-0000"},{"id":"700-7850-0122"},{"id":"700-7850-0123"},{"id":"700-7850-0125"}],"contacts":[{"phone":[{"value":"+16082268651"}],"www":[{"value":"http://www.walmart.com"},{"value":"http://www.walmart.com/store/3857/monona-wi/details"}]}],"openingHours":[{"text":["Mon-Sun: 07:00 - 19:00"],"isOpen":true,"structured":[{"start":"T070000","duration":"PT12H00M","recurrence":"FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"}]}]}]}
class PlaceLookupSvc {
    constructor(authToken) {
        URL_ROOT = URL_ROOT.replace("{apiKey}", authToken);
    }
    placeFromLatLng(lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = URL_ROOT.replace("{latlng}", `${lat},${lng}`);
            try {
                const placeResponse = (yield axios_1.default.get(url)).data;
                logger.info("Place lookup returned: " + JSON.stringify(placeResponse));
                if (!placeResponse || !placeResponse.items || placeResponse.items.length <= 0) {
                    throw new Error("Could not find store");
                }
                const item = placeResponse.items[0];
                const store = new Store_1.Store();
                store.name = item.title;
                store.address = item.address.label;
                store.country = item.address.countryCode;
                store.lat = item.position.lat;
                store.lng = item.position.lng;
                return store;
            }
            catch (e) {
                // The GetJson library is absolutely awful about errors. It won't surface the ACTUAL ERROR or, you know...the HTTP status code.
                // Instead, all you get is "Unexpected response code."
                logger.error("Here API returned non-200 status code");
                return undefined;
            }
        });
    }
}
exports.PlaceLookupSvc = PlaceLookupSvc;
//# sourceMappingURL=PlaceLookupSvc.js.map