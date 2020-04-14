/**
 * PlaceLookupSvc.ts
 * The database query to get store information.
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */

import winston from "winston"
import axios from "axios"
import { Store } from "./models/Store";

// Place search URL. 600 is the Here place category for Shopping
let URL_ROOT = "https://discover.search.hereapi.com/v1/discover?limit=1&apiKey={apiKey}&q=Shopping&in=circle:{latlng};r=300"

/** Logger for this class. */
const logger = winston.createLogger({
   level: "debug",
   format: winston.format.json(),
   defaultMeta: { service: 'PlaceLookupSvc' },
   transports: [new winston.transports.Console()]
});

axios.defaults.responseType = "json"

// const testResponse = {"items":[{"title":"Walmart","id":"here:pds:place:840jx7ps-4abb9f6606d30c6e118cc69b795ace40","resultType":"place","address":{"label":"Walmart, 2151 Royal Ave, Madison, WI 53713, United States","countryCode":"USA","countryName":"United States","state":"Wisconsin","county":"Dane","city":"Madison","street":"Royal Ave","postalCode":"53713","houseNumber":"2151"},"position":{"lat":43.04319,"lng":-89.34939},"access":[{"lat":43.04332,"lng":-89.34938}],"distance":108,"categories":[{"id":"600-6200-0063"},{"id":"600-6300-0066"},{"id":"700-7850-0000"},{"id":"700-7850-0122"},{"id":"700-7850-0123"},{"id":"700-7850-0125"}],"contacts":[{"phone":[{"value":"+16082268651"}],"www":[{"value":"http://www.walmart.com"},{"value":"http://www.walmart.com/store/3857/monona-wi/details"}]}],"openingHours":[{"text":["Mon-Sun: 07:00 - 19:00"],"isOpen":true,"structured":[{"start":"T070000","duration":"PT12H00M","recurrence":"FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"}]}]}]}
export class PlaceLookupSvc {
    constructor(authToken: string) {
        URL_ROOT = URL_ROOT.replace("{apiKey}", authToken)
    }

    /**
     * Query for a [[Store]] base on long and lat.
     * @param lat the latitude to search by
     * @param lng the long to search by
     * @returns [[Store]] the store entity matching the search criteria
     */
    async placeFromLatLng(lat: number, lng: number): Promise<Store> {
        const url = URL_ROOT.replace("{latlng}", `${lat},${lng}`)
        try {
            const placeResponse = (await axios.get(url)).data
            logger.info("Place lookup returned: " + JSON.stringify(placeResponse));
            if(!placeResponse || !placeResponse.items || placeResponse.items.length <= 0) {
                throw new Error("Could not find store")
            }
            const item = placeResponse.items[0]
            const store = new Store()
            store.name = item.title
            store.address = item.address.label
            store.country = item.address.countryCode
            store.lat = item.position.lat
            store.lng = item.position.lng
            return store

        } catch(e) {
            // The GetJson library is absolutely awful about errors. It won't surface the ACTUAL ERROR or, you know...the HTTP status code.
            // Instead, all you get is "Unexpected response code."
            logger.error("Here API returned non-200 status code")
            return undefined
        }
    }
}