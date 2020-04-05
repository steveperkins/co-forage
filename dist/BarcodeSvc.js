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
const winston_1 = __importDefault(require("winston"));
const BarcodeLookupResult_1 = require("./models/BarcodeLookupResult");
const axios_1 = __importDefault(require("axios"));
const URL_ROOT = "https://world.openfoodfacts.org/api/v0/product/";
const logger = winston_1.default.createLogger({
    level: 'debug',
    format: winston_1.default.format.json(),
    defaultMeta: { service: 'BarcodeSvc' },
    transports: [new winston_1.default.transports.Console()]
});
axios_1.default.defaults.headers.common["User-Agent"] = "Coforage - Android - Version 0.1";
axios_1.default.defaults.responseType = "json";
class BarcodeSvc {
    lookup(barcode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (barcode.length === 12) {
                barcode = "0" + barcode;
            }
            const response = (yield axios_1.default.get(`${URL_ROOT}${barcode}.json`)).data;
            logger.info("BarcodeSvc returned: " + JSON.stringify(response));
            // Determining success here is a pisser. openfoodfacts.org sometimes returns "product found" but nearly all fields in the JSON document
            // are empty. Since we can't rely on the returned status code, we have to check whether the product is marked "empty".
            if (!response
                || response.status !== 1
                || !response.product
                || !response.product.states_tags
                || response.product.states_tags.indexOf("en:empty") > -1) {
                logger.error(`Barcode ${barcode} not found`);
                throw new Error("Barcode not found");
            }
            const product = new BarcodeLookupResult_1.BarcodeLookupResult();
            product.name = response.product.product_name;
            product.barcode = response.code;
            product.company = response.product.brands;
            product.genericName = response.product.generic_name_en;
            product.imageUrl = response.product.image_front_url;
            return product;
        });
    }
}
exports.BarcodeSvc = BarcodeSvc;
//# sourceMappingURL=BarcodeSvc.js.map