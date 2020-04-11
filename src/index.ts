import winston from "winston"
import express from "express"
import bodyParser from "body-parser"
import fs from "fs"
import https from "https"
import { DbSvc } from "./DbSvc"
import { PlaceLookupSvc } from "./PlaceLookupSvc"
import { BarcodeSvc } from "./BarcodeSvc"
import { BarcodeLookupResult } from "./models/BarcodeLookupResult"
import { Product } from "./models/Product"
import { BarcodeReport } from "./models/BarcodeReport"
import { SearchParams } from "./models/SearchParams"


const logger = winston.createLogger({
   level: 'debug',
   format: winston.format.json(),
   defaultMeta: { service: 'index' },
   transports: [new winston.transports.Console()]
});

try {
   const placesSvc = new PlaceLookupSvc(process.env.HEREAPI_TOKEN);
   const barcodeSvc = new BarcodeSvc();
   const dbSvc = new DbSvc(process.env.DATABASE_URL || "postgres://service:53ndgjdg0idf0ds@localhost:5433/coforage")

   dbSvc.init();

   const app = express();
   app.use("/web", function(req, res) {
      res.sendfile(`dist/web/${req.path}`);
   });

   app.use("/api/*", bodyParser.urlencoded({ extended: false }));
   app.use("/api/*", bodyParser.json());
   app.use("/api/*", async (req, res, next) => {
      if (req.method.toLowerCase() === "options") {
         next()
         return
      }

      if(!req.headers || !req.headers.authorization) {
         res.status(401)
         res.json({ message: "API authentication is required to use this service"})
         res.end()
         return
      }

      const auth = await dbSvc.validateAuthToken(req.headers.authorization)
      if (!auth || !auth.username) {
         logger.error(`Invalid API token provided: ${req.headers.authorization}`)
         res.status(401)
         res.json({ message: "The provided API authentication is invalid"})
         res.end()
         return
      }
      // Validation passed
      logger.info(`Valid request from ${auth.username}`)
      next()
   })

   // API endpoints
   /**
    * Search for a store inventory of a product by barcode and lat and lng and radius, barcode and geohash and radius,
    * name and lat and lng and radius, name and geohash and radius, name and store ID, or barcode and store ID
    */
   app.post('/api/product/search', async (req, res) => {
      try {
         const results = await dbSvc.search(req.body as SearchParams)
         res.status(200)
         res.json(results)
      } catch(e) {
         logger.error(`Product search threw exception!\r\n${JSON.stringify(e)}`)
         res.status(400)
         res.json({ message: e.message })
         return;
      }

      res.end()
   })

   app.post('/api/product', async (req, res) => {
      if (!req.body.barcode) {
         res.status(400)
         res.json({ message: "barcode is required", parameter: "barcode" })
         return;
      }

      if (req.body.barcode.length < 12 || req.body.barcode.length > 13) {
         res.status(400)
         res.json({ message: "barcode must be 12 or 13 digits", parameter: "barcode" })
         return;
      }

      if (isNaN(+req.body.barcode)) {
         res.status(400)
         res.json({ message: "barcode must be digits", parameter: "barcode" })
         return;
      }

      if (!req.body.lat) {
         res.status(400)
         res.json({ message: "lat is required", parameter: "lat" })
         return;
      }

      const lat = +req.body.lat
      if (isNaN(lat)) {
         res.status(400)
         res.json({ message: "lat must be digits", parameter: "lat" })
         return;
      }

      if (!req.body.lng) {
         res.status(400)
         res.json({ message: "lng is required", parameter: "lng" })
         return;
      }

      const lng = +req.body.lng
      if (isNaN(lng)) {
         res.status(400)
         res.json({ message: "lng must be digits", parameter: "lng" })
         res.end()
         return;
      }

      if (!req.body.amount) {
         res.status(400)
         res.json({ message: "amount is required", parameter: "amount" })
         res.end()
         return;
      }

      const amount = +req.body.amount
      if (isNaN(amount)) {
         res.status(400)
         res.json({ message: "amount must be digits", parameter: "amount" })
         res.end()
         return;
      }

      if (amount < 0 || amount > 100) {
         res.status(400)
         res.json({ message: "amount must be between 0 and 100", parameter: "amount" })
         res.end()
         return;
      }

      if (req.body.barcode.length === 12) {
         req.body.barcode = "0" + req.body.barcode
      }

      const barcode = req.body.barcode
      logger.info(`Barcode: ${barcode}`)
      logger.info(`Lat: ${lat}`)
      logger.info(`Lng: ${lng}`)
      logger.info(`Product amount: ${amount}`)

      // Try to find the store from past submissions at this location
      let store = await dbSvc.getStoreByLocation(lat, lng)
      if (!store) {
         // Try to find store name from geocoordinate -> address lookup
         // If that fails, client needs to ask the user for the store name
         try {
            store = await placesSvc.placeFromLatLng(lat, lng)
            if(store) {
               store = await dbSvc.insertStore(store)
            }
         } catch(e) {
            logger.error(`Place lookup threw exception!\r\n${JSON.stringify(e)}`)
            store = undefined
         }

         if (!store) {
            res.status(404)
            res.json({ error: 'STORE_NOT_FOUND', message: `No store found at ${lat},${lng}` });
            res.end()
            return
         }
      }

      // Hooray, we at least found the referenced store. On to the barcode.

      // First try to find the barcode in our database
      let product: Product = await dbSvc.getProductByBarcode(barcode)

      if (!product) {
         // Looks like this is the first time we've gotten a report for this product
         let barcodeResult: BarcodeLookupResult
         try {
            // Look up barcode from https://world.openfoodfacts.org/
            barcodeResult = await barcodeSvc.lookup(barcode)
            product = new Product()
            product.barcode = barcodeResult.barcode
            product.name = barcodeResult.name
            product.genericname = barcodeResult.genericName
            product.imageurl = barcodeResult.imageUrl
            product.company = barcodeResult.company
            product = await dbSvc.insertProduct(product)
         } catch(e) {
            logger.error(`Barcode lookup threw exception!\r\n${JSON.stringify(e)}`)
         }

         if (!barcodeResult) {
            res.status(404)
            res.json({ error: 'PRODUCT_NOT_FOUND', message: `No product found for barcode ${barcode}` });
            res.end()
            return
         }
      }

      // Sweet, now we have a store AND a product!

      // Time to record the latest report of this product
      const barcodeReport: BarcodeReport = new BarcodeReport()
      barcodeReport.barcode = product.barcode
      barcodeReport.storeId = store.id
      barcodeReport.amount = amount

      try {
         await dbSvc.insertReport(barcodeReport)
      } catch(e) {
         logger.error("Report insert failed: " + e)
         res.status(500)
         res.json({ error: 'REPORT_INSERT_FAILED', message: `Could not update state report for barcode ${barcode}` });
         res.end()
         return
      }

      res.json({ message: "success" });
      res.end()
      return
   })

   app.use("/", function(req, res){
      res.sendfile("dist/web/index.html");
   })

/*    app.use("/php*", async (req, res, next) => {
      // Block everything else
      res.status(900)
      res.end()
   }) */

   const serverPort = 8080
   if (process.env.HTTPS) {
      https.createServer({
         key: fs.readFileSync("/opt/bitnami/letsencrypt/certificates/myyt.space.key"),
         cert: fs.readFileSync("/opt/bitnami/letsencrypt/certificates/myyt.space.crt")
       }, app).listen(serverPort, () => {
         logger.info(`HTTPS Server now listening at port ${serverPort}`)
      })
   } else {
      const server = app.listen(serverPort, () => {
         logger.info(`Server now listening at port ${serverPort}`)
      })
   }

} catch(e) {
   logger.error("Great. Something got hosed. " + e)
}