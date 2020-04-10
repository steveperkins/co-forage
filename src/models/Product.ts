
/**
 * Products.ts
 * The Product class models an individual type of item found in a [[Store]].
 * A product is diferentiated by barcode, name and company. Examples might be
 * "Oreos", "Double Stuff Oreos", and "Vanilla Oreos".
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */
export class Product {
    barcode: string
    name: string
    genericname: string
    company: string
    imageurl: string
    created: number
}