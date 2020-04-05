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
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
class DbInit {
    init(host, port, dbname, user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = new pg_1.Pool({
                host,
                database: dbname,
                user,
                password,
                port
            });
            yield pool.query(`CREATE TABLE IF NOT EXISTS store (
            id BIGINT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255) NOT NULL,
            country VARCHAR(255) NOT NULL,
            lat NUMERIC(15, 12),
            lng NUMERIC(15, 12),
            geohash VARCHAR(10),
            created TIMESTAMP DEFAULT NOW()
        )`);
            yield pool.query(`CREATE TABLE IF NOT EXISTS product (
            barcode VARCHAR(14) PRIMARY KEY NOT NULL,
            name VARCHAR(255) NOT NULL,
            size VARCHAR(255),
            created TIMESTAMP DEFAULT NOW()
        )`);
            yield pool.query(`CREATE TABLE IF NOT EXISTS store_barcode (
            store_id BIGINT REFERENCES store(id),
            barcode VARCHAR(14) REFERENCES product(barcode),
            amount INTEGER NOT NULL,
            last_reported BIGINT NOT NULL,
            last_reports BIGINT DEFAULT 0,
            created TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY(store_id, barcode)
        )`);
            pool.end();
        });
    }
}
exports.DbInit = DbInit;
//# sourceMappingURL=db-init.js.map