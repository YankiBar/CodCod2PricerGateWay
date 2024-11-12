# Catalog Manager API

A NestJS application that provides a set of services for managing items and promotions in a retail store environment, integrating with external APIs for data fetching and image processing.

## Table of Contents
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Services Overview](#services-overview)
  - [CodcodService](#codcodservice)
  - [PricerService](#pricerservice)
  - [GatewayService](#gatewayservice)
- [Logging](#logging)
- [Example API Usage](#example-api-usage)
  - [Get All Branch Items](#get-all-branch-items)
  - [Get All Branch Promotions](#get-all-branch-promotions)
  - [Update Item](#update-item)
- [Error Handling](#error-handling)
- [FAQs](#faqs)
- [Running Tests](#running-tests)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Technologies
- [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- [TypeScript](https://www.typescriptlang.org/) - A superset of JavaScript that compiles to plain JavaScript.
- [RxJS](https://rxjs.dev/) - A library for reactive programming using Observables.

## Installation
To set up the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
Install dependencies:

bash
Copy
npm install
Set up environment variables:
Copy the .env.example configuration file to .env and fill in the required environment variables.

Usage
To start the application, run:

bash
Copy
npm run start
You can start the application in watch mode during development:

bash
Copy
npm run start:dev
The API will be available at http://localhost:3000.

Configuration
Configure the necessary API endpoints and credentials in the .env file:

dotenv
Copy
CODCOD_CONTENT_URL=<Your_Codcod_Content_URL>
CODCOD_MEDIA_URL=<Your_Codcod_Media_URL>
STORE_ID=<Your_Store_ID>
PRICER_API_URL=<Your_Pricer_API_URL>
PRICER_USERNAME=<Your_Pricer_Username>
PRICER_PASSWORD=<Your_Pricer_Password>
Services Overview
CodcodService
The CodcodService is responsible for interacting with the Codcod APIs to retrieve branch items, promotions, and dynamic signs. 

Methods:
getAllBranchItems(storeId: string): Fetches all branch items for the given store ID.
getAllBranchPromos(storeId: string): Retrieves all branch promotions.
getUpdatedItems(lastUpdateTime: string, StoreID: string): Gets items updated since the last given timestamp.
getItemSign(itemId: string, size: string): Fetches a sign for a specific item.
PricerService
The PricerService manages interactions with the pricing API, handling operations such as updating items, fetching labels, and managing images.

Methods:
updateItem(itemId: string, itemName: string): Updates the item's name.
fetchOriginalCountry(itemId: string): Fetches the original country of a specific item.
getAllItemIds(): Retrieves all item IDs from the pricer service.
GatewayService
The GatewayService orchestrates the flow of data between the Codcod and Pricer services. It uses cron jobs to periodically fetch updates and manage images for items and promotions.

Methods:
processUpdates(): Reads updates from the Codcod API and processes items and promotions.
processImages(itemIds: { itemId: string; modelName: string }[]): Updates images for specified items based on country codes.
Logging
Custom logging is achieved using the MyLogger service, which provides structured logs throughout the application, recording significant events and errors.

Example API Usage
To help users understand how to interact with your API, here are a few example endpoints.

Get All Branch Items
http
Copy
GET /branch-items?storeId=<store-id>
Response:

json
Copy
{
  "data": {
    "Items": [
      {
        "barcode": "123456789",
        "dsc": "Item Description"
      }
    ]
  }
}
continue

avatar
ChatGPT
Continuing with the README.md file:

markdown
Copy
### Get All Branch Promotions
```http
GET /promotions?storeId=<store-id>
Response:

json
Copy
{
  "data": {
    "promos": [
      {
        "promonum": "Promo123",
        "dsc": "Promotion Description"
      }
    ]
  }
}
Update Item
http
Copy
PATCH /items
Content-Type: application/json

{
  "itemId": "123456789",
  "itemName": "New Item Name"
}
Response:

json
Copy
{
  "message": "Item updated successfully."
}
Error Handling
Your application uses a logging mechanism to provide insights into any issues. Users can view logged errors in the console or log files.

Common errors may include:

404 Not Found: Returned when the requested resource does not exist.
400 Bad Request: Returned when the request is malformed.
500 Internal Server Error: Returned whenever there is an unforeseen circumstance affecting the application.
The API will return error messages in a consistent format:

json
Copy
{
  "statusCode": 500,
  "message": "Failed to fetch original country for itemId: ITEM_ID"
}
FAQs
Q: How frequently does the system update item and promo data?
A: The GatewayService is set to process updates every 10 minutes.

Q: How do I change the update frequency?
A: Modify the cron expression in the GatewayService (for example, changing CronExpression.EVERY_10_MINUTES to CronExpression.EVERY_HOUR).

Q: What should I do if I encounter a 500 error?
A: Check the logs for any specific messages that indicate the cause of the failure. Ensure that all external services are reachable.

Running Tests
If you have tests implemented, provide information on how to run them:

To run the tests for your application, use:

bash
Copy
npm run test
For a more detailed testing output, you can run:

bash
Copy
npm run test:verbose
Changelog
Version 1.0.0

Initial release with Codcod and Pricer integrations.
Implemented image fetching and updating logic.
Version 1.1.0

Added logging enhancements for better debugging.
Optimized fetching logic in GatewayService.
Contributing
Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements you would like to see.

License
This project is licensed under the MIT License. See the LICENSE file for more details.

text
Copy

### Summary
This `README.md` file provides a comprehensive guide for users and developers interacting with your NestJS application. By detailing the setup process, usage examples, error handling, and contribution guidelines, users will be better equipped to work with your project.

Feel free to make adjustments based on your project's specific requirements or add any additional sections that you might think are important! If you need further assistance or updates, just let me know!
