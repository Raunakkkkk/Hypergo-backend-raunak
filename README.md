# SDE Intern Backend Assignment: Property Listing System

## Requirements

- CRUD operations for property listings
- Advanced filtering and search capabilities
- User authentication system
- Property favorites functionality
- Bonus features:
  - Property recommendations
  - System deployment

## Technical Stack

- Node.js/Express.js
- MongoDB (Database)
- Redis (Caching)
- JWT (Authentication)

# Property Management System API Documentation

This is a RESTful API for a property management system built with Node.js, Express, MongoDB, and Redis.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## API Endpoints

### Authentication

#### Register User

- **POST** `/api/auth/register`
- **Description**: Register a new user
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with token

#### Login

- **POST** `/api/auth/login`
- **Description**: Login user
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with token

### Properties

#### List Properties

- **GET** `/api/properties`
- **Description**: Get all properties with advanced filtering
- **Query Parameters**:
  - `type` (Bungalow, Apartment, Villa, House, Plot)
  - `minPrice`, `maxPrice`
  - `state`, `city`
  - `minArea`, `maxArea`
  - `bedrooms`, `bathrooms`
  - `furnished` (Furnished, Unfurnished, Semi-Furnished)
  - `amenities` (pipe-separated list)
  - `listingType` (rent, sale)
  - `sortBy`, `sortOrder`
  - `page` (default: 1)
  - `limit` (default: 25)
- **Response**: List of properties with pagination info

#### Get Property

- **GET** `/api/properties/:id`
- **Description**: Get property by ID (supports both MongoDB \_id and custom id)
- **Response**: Property object

#### Create Property

- **POST** `/api/properties`
- **Description**: Create new property (requires authentication)
- **Body**:
  ```json
  {
    "title": "string",
    "type": "Bungalow|Apartment|Villa|House|Plot",
    "price": "number",
    "state": "string",
    "city": "string",
    "areaSqFt": "number",
    "bedrooms": "number",
    "bathrooms": "number",
    "amenities": "string",
    "furnished": "Furnished|Unfurnished|Semi-Furnished",
    "availableFrom": "ISO8601 date",
    "listedBy": "string",
    "tags": "string",
    "colorTheme": "hex color",
    "rating": "number (0-5)",
    "listingType": "rent|sale"
  }
  ```
- **Response**: Created property object

#### Update Property

- **PUT** `/api/properties/:id`
- **Description**: Update property (requires authentication, only by creator)
- **Body**: Same as create property
- **Response**: Updated property object

#### Delete Property

- **DELETE** `/api/properties/:id`
- **Description**: Delete property (requires authentication, only by creator)
- **Response**: Success message

### Favorites

#### Get User Favorites

- **GET** `/api/favorites`
- **Description**: Get user's favorite properties (requires authentication)
- **Response**: List of favorite properties

#### Add to Favorites

- **POST** `/api/favorites/:propertyId`
- **Description**: Add property to favorites (requires authentication)
- **Response**: Created favorite object

#### Remove from Favorites

- **DELETE** `/api/favorites/:propertyId`
- **Description**: Remove property from favorites (requires authentication)
- **Response**: Success message

#### Check Favorite Status

- **GET** `/api/favorites/check/:propertyId`
- **Description**: Check if a property is in user's favorites (requires authentication)
- **Response**: `{ isFavorite: boolean }`

### Recommendations

#### Search Users

- **GET** `/api/recommendations/search-user`
- **Description**: Search users by email (requires authentication)
- **Query Parameters**:
  - `email`: Email to search for
- **Response**: User object (if found)

#### Get Sent Recommendations

- **GET** `/api/recommendations/sent`
- **Description**: Get recommendations sent by the current user (requires authentication)
- **Response**: List of recommendations with property and recipient details

#### Create Recommendation

- **POST** `/api/recommendations/:propertyId`
- **Description**: Recommend a property to a user (requires authentication)
- **Body**:
  ```json
  {
    "recipientEmail": "string",
    "message": "string (optional, max 500 chars)"
  }
  ```
- **Response**: Created recommendation object

#### Delete Recommendation

- **DELETE** `/api/recommendations/:recommendationId`
- **Description**: Delete a recommendation (requires authentication, only by sender)
- **Response**: Success message

## Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per 15 minutes for authenticated routes:
  - `/api/auth/*`
  - `/api/favorites/*`
  - `/api/recommendations/*`
- 50 requests per 15 minutes for public routes:
  - `/api/properties/*`

## Caching

The API uses Redis for caching to improve performance. The following endpoints are cached:

- Property listings (GET `/api/properties`)

  - Cache duration: 5 minutes
  - Cache key: Based on query parameters
  - Cache invalidation: On property creation, update, or deletion

- Property details (GET `/api/properties/:id`)

  - Cache duration: 5 minutes
  - Cache key: Based on property ID
  - Cache invalidation: On property update or deletion

- Favorites

  - GET `/api/favorites`
    - Cache duration: 5 minutes
    - Cache key: Based on user ID
    - Cache invalidation: On adding or removing favorites
  - GET `/api/favorites/check/:propertyId`
    - Cache duration: 5 minutes
    - Cache key: Based on user ID and property ID
    - Cache invalidation: On adding or removing the specific property from favorites

- Recommendations
  - GET `/api/recommendations/sent`
    - Cache duration: 5 minutes
    - Cache key: Based on user ID
    - Cache invalidation: On recommendation creation, deletion, or status update
  - GET `/api/recommendations/received`
    - Cache duration: 5 minutes
    - Cache key: Based on user ID
    - Cache invalidation: On recommendation creation, deletion, or status update

Cache invalidation is implemented for all write operations to ensure data consistency. The cache duration is set to 5 minutes for all endpoints to balance between performance and data freshness.
