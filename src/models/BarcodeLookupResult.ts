
/**
 * BarcodeLookupResult.ts
 * The Barcode Lookup Results represents the results of a barcode search. The intent is to
 * return product information from (possibly) different third-party APIs.
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */
export class BarcodeLookupResult {
    barcode: string
    name: string
    genericName: string
    company: string
    imageUrl: string
    created: number
}