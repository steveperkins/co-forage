import { Store } from "./Store"
import { ProductInventoryReport } from "./ProductInventoryReport"


/**
 * StoreInventoryReport.ts
 * The Store Inventory Report represents a [[Store]] and all of the [[ProductInventoryReport]] associated with it.
 * 
 * Created by S Perkins on 2020-04-01
 * 
 */
export class StoreInventoryReport {
    store: Store
    products: ProductInventoryReport[]
}