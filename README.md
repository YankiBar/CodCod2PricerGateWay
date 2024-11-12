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
