# Co-forage API
An API for recording and displaying crowd-sourced store inventory. When users in a retail store publish a barcode, location, and amount remaining, Co-forage looks up the barcode and closest store and stores the amount remaining. When another user wants to find a product by barcode or name (e.g. *ketchup*), they send a location and the barcode or name to find the nearest stores with the closest product.

All requests and responses are in JSON format. This API uses the Open Food Facts API: https://world.openfoodfacts.org to look up barcodes. If a barcode isn't available in Open Food Facts, you can add it!

This API uses the Here API for finding retail stores near the user's location.

## Authentication
To start using this API, you must register for an authentication token by email perkins.steve+codevid@gmail.com. Include your name, application name, and a short description of your application.

Once you have a token, send it in the `Authorization` header of every request. If you get the error "API authentication is required to use this service", your request is probably missing the `Authorization` header or the token.

## Searching for product reports
`POST /api/product/search`

You can search for a store inventory of a product by:
* barcode and lat and lng and radius
* barcode and geohash and radius
* name and lat and lng and radius
* name and geohash and radius
* name and store ID (you'll want to start your search by location first so the user can narrow down which store they want)
* barcode and store ID (you'll want to start your search by location first so the user can narrow down which store they want)

Geohash reference: [http://www.movable-type.co.uk/scripts/geohash.html](http://www.movable-type.co.uk/scripts/geohash.html)

### Sample request:
`POST /api/product/search`

```json
{
  "barcode": "069000019832",
  "lat": 43.042244,
  "lng": -89.349671,
  "radius": 5
}
```
The `radius` parameter is the number of characters in the geohash to use when searching for nearby stores. 5 is the most precise (~1.5 miles) and 1 is the least (the whole world).

| Parameter | Notes|
|-----------|:--------|
| barcode   | EAN-13 product barcode |
| genericName| Start of the product's name. The API tries to find a matching product with the same first letters (e.g. 'Ketch%') to find ketchup products). |
| lat       | Latitude of the user's current location. If `geohash` or `storeId` is provided, `lat` and `lng` are ignored. |
| lng       | Longitude of the user's current location. If `geohash` or `storeId` is provided, `lat` and `lng` are ignored. |
| geohash | Geohash of the user's current location |
| storeId | Coforage store ID. If `storeId` is provided, all other location parameters are ignored, including `radius`. |
| radius | Indicator of how close to the user's location search results should be restricted. 1 is the whole world, 5 is the most precise (~1.5 miles). |

### Sample response:
```json
200 OK
[{
  "store": {
    "lat": "43.042480000000",
    "lng": "-89.350390000000"
  },
  "products": [{
    "product": {
      "genericname": "Diet Pepsi",
      "company": "Pepsi",
      "imageurl": null
    },
    "amount": 33,
    "lastreported": "1586100130"
  }]}]
```
You could also get a 200 OK response with an empty array as the body. This means the search succeeded, but we couldn't find any matching products in the stores near the user's location.

### Errors
| Error | Description |
|:---------------------------------------------------|:------------------------|
| One of barcode or genericName is required | Both `barcode` and `genericName` were missing from the request body |


## Publishing a product report
`POST /api/product`

Sending a new product report only requires a location, barcode, and amount remaining.

### Sample request:
`POST /api/product`

```json
{
  "barcode": "069000019832",
  "lat": 43.042244,
  "lng": -89.349671,
  "amount": 33
}
```
All barcodes must be in EAN-13 format. If you send a 12-digit barcode, a "0" will be prefixed.

| Parameter | Notes|
|-----------|:--------|
| barcode   | EAN-13 product barcode |
| lat       | Latitude of the user's location in the store, as precise as possible |
| lng       | Longitude of the user's location in the store, as precise as possible |
| amount    | Percentage of product left on the shelf, 0 - 100% |

### Sample response:
```json
200 OK
{
  "message": "success"
}
```

### Errors
#### Barcode not found
```json
400 Bad Request
{
  "message": "success"
}
```
The given barcode was not found in the Open Food Facts API, so we can't determine the name of the product. If possible, you should ask the user to add the barcode at Open Food Facts.

#### Could not find store
```json
400 Bad Request
{
  "message": "Could not find store"
}
```
The given user location was not near enough to a retail store to be associated. 

**Parameter errors**
#### barcode is required
```json
400 Bad Request
{
  "message": "barcode is required",
  "parameter": "barcode"
}
```
The `barcode` parameter was missing from the request body.

#### barcode must be 12 or 13 digits
```json
400 Bad Request
{
  "message": "barcode must be 12 or 13 digits",
  "parameter": "barcode"
}
```
The `barcode` parameter was too short or too long to be an EAN-13 barcode.

#### barcode must be 12 or 13 digits
```json
400 Bad Request
{
  "message": "barcode must be digits",
  "parameter": "barcode"
}
```
The `barcode` parameter contained non-digit characters, which makes it an invalid EAN-13 barcode.

#### lat is required
```json
400 Bad Request
{
  "message": "lat is required",
  "parameter": "lat"
}
```
The `lat` parameter was missing from the request body.

#### lng is required
```json
400 Bad Request
{
  "message": "lng is required",
  "parameter": "lng"
}
```
The `lng` parameter was missing from the request body.

#### lat must be digits
```json
400 Bad Request
{
  "message": "lat must be digits",
  "parameter": "lat"
}
```
The `lat` parameter was non-numeric.

#### lng must be digits
```json
400 Bad Request
{
  "message": "lng must be digits",
  "parameter": "lng"
}
```
The `lng` parameter was non-numeric.

#### amount is required
```json
400 Bad Request
{
  "message": "amount is required",
  "parameter": "amount"
}
```
The `amount` parameter was missing from the request body.

#### amount must be digits
```json
400 Bad Request
{
  "message": "amount must be digits",
  "parameter": "amount"
}
```
The `amount` parameter was non-numeric.

#### amount must be between 0 and 100
```json
400 Bad Request
{
  "message": "amount must be between 0 and 100",
  "parameter": "amount"
}
```
The `amount` parameter was outside the allowed percentage range.

#### (no message)
```json
400 Bad Request
{
  "message": ""
}
```
This usually means the Here API blew up.

#### (no message)
```json
500 Internal Server Error
{ 
  "error": "REPORT_INSERT_FAILED", 
  "message": "Could not update state report for barcode (barcode)"
}
```
For an unknown reason, the database wouldn't allow us to record the inventory report. You can't do anything about this unless you want to send a message to perkins.steve+codevid@gmail.com.