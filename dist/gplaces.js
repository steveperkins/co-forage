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
const google_places_web_1 = __importDefault(require("google-places-web"));
class GooglePlacesSvc {
    constructor(authToken) {
        google_places_web_1.default.apiKey = authToken;
    }
    placeFromLatLng(lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield google_places_web_1.default.nearbysearch({
                location: `${lat},${lng}`,
                radius: 10,
                type: undefined,
                rankby: 'PROMINENCE'
            });
            if (!response.results || response.results.length <= 0) {
                return undefined;
            }
            return response.results[0];
        });
    }
}
exports.GooglePlacesSvc = GooglePlacesSvc;
//# sourceMappingURL=gplaces.js.map