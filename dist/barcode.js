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
const GetJson = require("get-json");
const URL_ROOT = "https://world.openfoodfacts.org/api/v0/product";
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    defaultMeta: { service: 'barcodeSvc' },
    transports: [new winston_1.default.transports.Console()]
});
class BarcodeSvc {
    lookup(barcode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (barcode.length === 12) {
                barcode = "0" + barcode;
            }
            const response = yield GetJson(`${URL_ROOT}${barcode}`);
            logger.info("BarcodeSvc returned: " + response);
            return response;
        });
    }
}
exports.BarcodeSvc = BarcodeSvc;
//# sourceMappingURL=barcode.js.map