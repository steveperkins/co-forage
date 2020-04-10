
/**
 * BarcodeReport.ts
 * The Barcode Report represents the quantity of a barcoded item at a [[Store]] at a point in time. The [[Store]] is
 * identified by it's id.
 * 
 * The intent of lastreports is to be the number of reports aggregated to produce the current state of the [[Store]].
 * The fields created and lastreported are duplicated values.
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */
export class BarcodeReport {
    barcode: string
    storeId: number
    amount: number
    lastreported: number
    lastreports: number
    created: number
}