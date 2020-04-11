import { Product } from "./Product"


/**
 * ProductInventoryReport.ts
 * The Product Inventory Report represents the quantity of a [[Product]] at a point in time.
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */
export class ProductInventoryReport {
    product: Product
    amount: number
    lastreported: number
}