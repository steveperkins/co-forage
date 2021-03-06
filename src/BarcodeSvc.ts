/**
 * BarcodeSvc.ts
 * The Barcode service performs queries based on the barcode.
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */

import winston from "winston"
import { BarcodeLookupResult } from "./models/BarcodeLookupResult";
import axios from "axios"

/** Third-party API for querying product information from a barcode. */
const URL_ROOT = "https://world.openfoodfacts.org/api/v0/product/"

/** Logger for this class. */
const logger = winston.createLogger({
   level: 'debug',
   format: winston.format.json(),
   defaultMeta: { service: 'BarcodeSvc' },
   transports: [new winston.transports.Console()]
});

axios.defaults.headers.common["User-Agent"] = "Coforage - Android - Version 0.1"
axios.defaults.responseType = "json"

export class BarcodeSvc {

    /**
     * Perform the lookup (query) against third-party APIs for product information. If not
     * found, an error will be thrown.
     * 
     * @param barcode  the barcode (string representation)
     * 
     * @returns [[BarcodeLookupResult]] the results of the query
     */
    async lookup(barcode: string): Promise<BarcodeLookupResult> {
        if (barcode.length === 12) {
            barcode = "0" + barcode
        }
        const response = (await axios.get(`${URL_ROOT}${barcode}.json`)).data
        logger.info("BarcodeSvc returned: " + JSON.stringify(response));

        // Determining success here is a pisser. openfoodfacts.org sometimes returns "product found" but nearly all fields in the JSON document
        // are empty. Since we can't rely on the returned status code, we have to check whether the product is marked "empty".
        if (!response
            || response.status !== 1
            || !response.product
            || !response.product.states_tags
            || response.product.states_tags.indexOf("en:empty") > -1) {
            logger.error(`Barcode ${barcode} not found`)
            throw new Error("Barcode not found")
        }

        const product = new BarcodeLookupResult();
        product.name = response.product.product_name
        product.barcode = response.code
        product.company = response.product.brands
        product.genericName = response.product.generic_name_en
        product.imageUrl = response.product.image_front_url

        return product
    }

}