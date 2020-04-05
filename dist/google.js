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
// Place search URL. 600 is the Here place category for Shopping
let URL_ROOT = "https://discover.search.hereapi.com/v1/discover?q=600&limit=1&apdiKey={apiKey}&at={latlng}";
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    defaultMeta: { service: 'barcodeSvc' },
    transports: [new winston_1.default.transports.Console()]
});
class PlaceLookupSvc {
    constructor(authToken) {
        URL_ROOT = URL_ROOT.replace("{apiKey}", authToken);
    }
    placeFromLatLng(lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = URL_ROOT.replace("{latlng}", `${lat},${lng}`);
            const placeResponse = yield GetJson(url);
            logger.info("Place lookup returned: " + placeResponse);
            if (!placeResponse) {
                throw new Error("Location does not exist");
            }
            return placeResponse;
        });
    }
}
exports.PlaceLookupSvc = PlaceLookupSvc;
//# sourceMappingURL=google.js.map