
/**
 * Store.ts
 * The Store class models a named location, a site that contains zero or more [[Product]].
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */
export class Store {
    id: number
    name: string
    address: string
    country: string
    lat: number
    lng: number
    geohash: string
    created: number
}