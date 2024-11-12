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
2.  **Install dependencies**:

> bash
>
> Copy
>
> npm install

3.  **Set up environment variables**: Copy the .env.example
    configuration file to .env and fill in the required environment
    variables.

**Usage**

To start the application, run:

bash

Copy

npm run start

You can start the application in watch mode during development:

bash

Copy

npm run start:dev

The API will be available at http://localhost:3000.

**Configuration**

Configure the necessary API endpoints and credentials in the .env file:

dotenv

Copy

CODCOD_CONTENT_URL=\<Your_Codcod_Content_URL\>

CODCOD_MEDIA_URL=\<Your_Codcod_Media_URL\>

STORE_ID=\<Your_Store_ID\>

PRICER_API_URL=\<Your_Pricer_API_URL\>

PRICER_USERNAME=\<Your_Pricer_Username\>

PRICER_PASSWORD=\<Your_Pricer_Password\>

**Services Overview**

**CodcodService**

The CodcodService is responsible for interacting with the Codcod APIs to
retrieve branch items, promotions, and dynamic signs.

-   **Methods**:

    -   getAllBranchItems(storeId: string): Fetches all branch items for
        the given store ID.

    -   getAllBranchPromos(storeId: string): Retrieves all branch
        promotions.

    -   getUpdatedItems(lastUpdateTime: string, StoreID: string): Gets
        items updated since the last given timestamp.

    -   getItemSign(itemId: string, size: string): Fetches a sign for a
        specific item.

**PricerService**

The PricerService manages interactions with the pricing API, handling
operations such as updating items, fetching labels, and managing images.

-   **Methods**:

    -   updateItem(itemId: string, itemName: string): Updates the
        item\'s name.

    -   fetchOriginalCountry(itemId: string): Fetches the original
        country of a specific item.

    -   getAllItemIds(): Retrieves all item IDs from the pricer service.

**GatewayService**

The GatewayService orchestrates the flow of data between the Codcod and
Pricer services. It uses cron jobs to periodically fetch updates and
manage images for items and promotions.

-   **Methods**:

    -   processUpdates(): Reads updates from the Codcod API and
        processes items and promotions.

    -   processImages(itemIds: { itemId: string; modelName: string
        }\[\]): Updates images for specified items based on country
        codes.

**Logging**

Custom logging is achieved using the MyLogger service, which provides
structured logs throughout the application, recording significant events
and errors.

**Contributing**

Contributions are welcome! Please open an issue or submit a pull request
for any changes or improvements you would like to see.

**License**

This project is licensed under the MIT License. See the
[[LICENSE]{.underline}](https://chat.chatbotapp.ai/chats/LICENSE) file
for more details.
