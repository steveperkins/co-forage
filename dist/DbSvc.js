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
const ngeohash_1 = __importDefault(require("ngeohash"));
const pg_1 = require("pg");
const Store_1 = require("./models/Store");
const Product_1 = require("./models/Product");
const StoreInventoryReport_1 = require("./models/StoreInventoryReport");
const ProductInventoryReport_1 = require("./models/ProductInventoryReport");
const GET_STORE_BY_GEOHASH_SQL = "SELECT * FROM store WHERE geohash LIKE $1 LIMIT 1"; // TODO We'll have to add the % manually
// node-postgres provides no way to find the auto-generated key when a record is inserted. This is the best we've got.
const GET_NEWEST_STORE_SQL = "SELECT * FROM store WHERE id = (SELECT last_value from store_id_seq)";
const INSERT_STORE_SQL = "INSERT INTO store (name, address, country, lat, lng, geohash) VALUES($1, $2, $3, $4, $5, $6)";
const GET_PRODUCT_BY_BARCODE_SQL = "SELECT * FROM product WHERE barcode=$1 LIMIT 1";
const INV_REPORT_BASE = `SELECT store.id AS storeId, store.name AS storeName, store.address AS storeAddress, store.country AS storeCountry, store.lat, store.lng, store.geohash, store.created AS storeCreated, p.barcode, p.name AS productName, p.genericname, p.company, p.imageUrl, sb.amount, sb.lastreported
FROM store_barcode sb JOIN product p ON sb.barcode=p.barcode JOIN store ON sb.storeid=store.id`;
const INV_REPORT_BY_STORE_ID_BARCODE = `${INV_REPORT_BASE} WHERE store.id=$1 AND p.barcode = $2 ORDER BY store.id, p.barcode`;
const INV_REPORT_BY_STORE_ID_GENERICNAME = `${INV_REPORT_BASE} WHERE store.id=$1 AND p.genericname LIKE $2 ORDER BY store.id, p.barcode`;
const INV_REPORT_BY_GEOHASH_BARCODE = `${INV_REPORT_BASE} WHERE store.geohash LIKE $1 AND p.barcode = $2 ORDER BY store.id, p.barcode`;
const INV_REPORT_BY_GEOHASH_GENERICNAME = `${INV_REPORT_BASE} WHERE store.geohash LIKE $1 AND p.genericname LIKE $2 ORDER BY store.id, p.barcode`;
const INSERT_PRODUCT_SQL = "INSERT INTO product (barcode, name, genericname, company, imageurl) VALUES($1, $2, $3, $4, $5)";
const INSERT_PRODUCT_REPORT_SQL = "INSERT INTO store_barcode (storeid, barcode, amount) VALUES($1, $2, $3) ON CONFLICT (storeid, barcode) DO UPDATE SET amount=$3, lastreported=EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)";
const INSERT_AUTH_TOKEN_SQL = "INSERT INTO auth (token, username, usernontact, usernotes) VALUES($1, $2, $3, $4)";
const FIND_AUTH_TOKEN_SQL = "SELECT * FROM auth WHERE token=$1";
const ARCHIVE_STORE_INVENTORY_REPORT = "INSERT INTO store_barcode_history SELECT * FROM store_barcode WHERE storeid=$1 AND barcode=$2";
const GET_STORE_BARCODE_HISTORY = `SELECT store.id AS storeId, store.name AS storeName, store.address AS storeAddress, store.country AS storeCountry, store.lat, store.lng, store.geohash, store.created AS storeCreated, p.barcode, p.name AS productName, p.genericname, p.company, p.imageUrl, sb.amount, sb.lastreported
FROM store_barcode_history sb JOIN product p ON sb.barcode=p.barcode JOIN store ON sb.storeid=store.id
WHERE storeId=$1 AND barcode=$1`;
class DbSvc {
    constructor(host, port, dbname, user, password) {
        this.pool = new pg_1.Pool({
            host,
            database: dbname,
            user,
            password,
            port
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query(`CREATE TABLE IF NOT EXISTS store (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255) NOT NULL,
            country VARCHAR(255) NOT NULL,
            lat NUMERIC(15, 12),
            lng NUMERIC(15, 12),
            geohash VARCHAR(10),
            created TIMESTAMP DEFAULT NOW()
        )`);
            yield this.pool.query(`CREATE TABLE IF NOT EXISTS product (
            barcode VARCHAR(14) PRIMARY KEY NOT NULL,
            name VARCHAR(255) NOT NULL,
            genericname VARCHAR(255),
            company VARCHAR(255),
            imageurl VARCHAR(255),
            created TIMESTAMP DEFAULT NOW()
        )`);
            yield this.pool.query(`CREATE TABLE IF NOT EXISTS store_barcode (
            storeid BIGINT REFERENCES store(id),
            barcode VARCHAR(14) REFERENCES product(barcode),
            amount INTEGER NOT NULL,
            lastreported BIGINT DEFAULT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP),
            lastreports BIGINT DEFAULT 0,
            created TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY(storeid, barcode)
        )`);
            // It's going to be super interesting to see inventory trends over time!
            yield this.pool.query(`CREATE TABLE IF NOT EXISTS store_barcode_history (
            storeid BIGINT REFERENCES store(id),
            barcode VARCHAR(14) REFERENCES product(barcode),
            amount INTEGER NOT NULL,
            lastreported BIGINT,
            lastreports BIGINT DEFAULT 0,
            created TIMESTAMP
        )`);
            this.pool.query(`CREATE TABLE IF NOT EXISTS auth (
            token VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255),
            usercontact VARCHAR(255),
            notes VARCHAR(255),
            created TIMESTAMP DEFAULT NOW()
        )`);
        });
    }
    search(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryResult;
            if (params.barcode && params.barcode.length < 13) {
                params.barcode = "0" + params.barcode;
            }
            if (params.storeId) {
                if (params.barcode) {
                    queryResult = yield this.pool.query(INV_REPORT_BY_STORE_ID_BARCODE, [params.storeId, params.barcode]);
                }
                else if (params.genericName) {
                    queryResult = yield this.pool.query(INV_REPORT_BY_STORE_ID_GENERICNAME, [params.storeId, `${params.genericName}%`]);
                }
                else {
                    throw new Error("One of barcode or genericName is required");
                }
            }
            else {
                // Determine the search geohash
                let hash;
                if (params.geohash) {
                    hash = ngeohash_1.default;
                }
                else if (params.lat && params.lng) {
                    // Geohash radii are based on bit levels. 1 == the entire world. 5 == up to 1.5 miles. 6 == something like .3 miles.
                    if (params.radius <= 0) {
                        params.radius = 1;
                    } // whole world
                    if (params.radius > 5) {
                        params.radius = 5;
                    } // 1.5 miles minimum
                    hash = ngeohash_1.default.encode(params.lat, params.lng, params.radius);
                }
                if (params.barcode) {
                    queryResult = yield this.pool.query(INV_REPORT_BY_GEOHASH_BARCODE, [`${params.geohash}%`, params.barcode]);
                }
                else if (params.genericName) {
                    queryResult = yield this.pool.query(INV_REPORT_BY_GEOHASH_GENERICNAME, [`${params.geohash}%`, `${params.genericName}%`]);
                }
                else {
                    throw new Error("One of barcode or genericName is required");
                }
            }
            const reports = [];
            if (queryResult.rows.length > 0) {
                let currentStoreReport;
                for (const row of queryResult.rows) {
                    // Convert to StoreInventoryReport objects
                    if (!currentStoreReport || !currentStoreReport.store || row.storeid !== currentStoreReport.store.id) {
                        currentStoreReport = new StoreInventoryReport_1.StoreInventoryReport();
                        currentStoreReport.store = this.rowToStore(row);
                        currentStoreReport.products = [];
                        reports.push(currentStoreReport);
                    }
                    const productReport = new ProductInventoryReport_1.ProductInventoryReport();
                    productReport.product = this.rowToProduct(row);
                    productReport.amount = row.amount;
                    productReport.lastreported = row.lastreported;
                    currentStoreReport.products.push(productReport);
                }
            }
            return reports;
        });
    }
    getStoreByLocation(lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate geohash to identify the store's general area
            const hash = ngeohash_1.default.encode(lat, lng, 5);
            const result = yield this.pool.query(GET_STORE_BY_GEOHASH_SQL, [`${hash}%`]);
            return result.rows[0];
        });
    }
    insertStore(store) {
        return __awaiter(this, void 0, void 0, function* () {
            store.geohash = ngeohash_1.default.encode(store.lat, store.lng);
            yield this.pool.query(INSERT_STORE_SQL, [store.name, store.address, store.country, store.lat, store.lng, store.geohash]);
            const result = yield this.pool.query(GET_NEWEST_STORE_SQL);
            return result.rows[0];
        });
    }
    getProductByBarcode(barcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(GET_PRODUCT_BY_BARCODE_SQL, [barcode]);
            return result.rows[0];
        });
    }
    insertProduct(product) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query(INSERT_PRODUCT_SQL, [product.barcode, product.name, product.genericname, product.company, product.imageurl]);
            return product;
        });
    }
    insertReport(report) {
        return __awaiter(this, void 0, void 0, function* () {
            // Archive any existing report for this store and product
            yield this.pool.query(ARCHIVE_STORE_INVENTORY_REPORT, [report.storeId, report.barcode]);
            // Add the new report
            yield this.pool.query(INSERT_PRODUCT_REPORT_SQL, [report.storeId, report.barcode, report.amount]);
            return report;
        });
    }
    validateAuthToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(FIND_AUTH_TOKEN_SQL, [token]);
            return result.rows[0];
        });
    }
    rowToStore(row) {
        const store = new Store_1.Store();
        store.id = row.storeId;
        store.address = row.storeAddress;
        store.country = row.storeCountry;
        store.geohash = row.storeGeohash;
        store.lat = row.lat;
        store.lng = row.lng;
        store.created = row.storeCreated;
        return store;
    }
    rowToProduct(row) {
        const product = new Product_1.Product();
        product.name = row.productName;
        product.genericname = row.genericname;
        product.company = row.company;
        product.imageurl = row.imageurl;
        return product;
    }
}
exports.DbSvc = DbSvc;
//# sourceMappingURL=DbSvc.js.map