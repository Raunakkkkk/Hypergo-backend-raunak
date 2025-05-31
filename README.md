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

- **POST** `/auth/register`
- **Description**: Register a new user
- **Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with token

#### Login

- **POST** `/auth/login`
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

- **GET** `/properties`
- **Description**: Get all properties with pagination
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `sort` (e.g., "price:asc", "createdAt:desc")
  - `search` (search in title and description)
  - `minPrice`
  - `maxPrice`
  - `type` (apartment, house, etc.)
  - `location`
- **Response**: List of properties with pagination info

#### Get Property

- **GET** `/properties/:id`
- **Description**: Get property by ID
- **Response**: Property object

#### Create Property

- **POST** `/properties`
- **Description**: Create new property (requires authentication)
- **Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "price": "number",
    "type": "string",
    "location": "string",
    "features": ["string"],
    "images": ["string"]
  }
  ```
- **Response**: Created property object

#### Update Property

- **PUT** `/properties/:id`
- **Description**: Update property (requires authentication)
- **Body**: Same as create property
- **Response**: Updated property object

#### Delete Property

- **DELETE** `/properties/:id`
- **Description**: Delete property (requires authentication)
- **Response**: Success message

### Favorites

#### Get User Favorites

- **GET** `/favorites`
- **Description**: Get user's favorite properties (requires authentication)
- **Response**: List of favorite properties

#### Add to Favorites

- **POST** `/favorites/:propertyId`
- **Description**: Add property to favorites (requires authentication)
- **Response**: Success message

#### Remove from Favorites

- **DELETE** `/favorites/:propertyId`
- **Description**: Remove property from favorites (requires authentication)
- **Response**: Success message

### Recommendations

#### Search Users

- **GET** `/recommendations/search-user`
- **Description**: Search users by username or email
- **Query Parameters**:
  - `query`: Search term
- **Response**: List of matching users

#### Get Recommendations

- **GET** `/recommendations`
- **Description**: Get property recommendations for a user
- **Query Parameters**:
  - `userId`: ID of the user to get recommendations for
- **Response**: List of recommended properties

#### Create Recommendation

- **POST** `/recommendations`
- **Description**: Create a property recommendation for a user
- **Body**:
  ```json
  {
    "propertyId": "string",
    "recommendedTo": "string" // user ID
  }
  ```
- **Response**: Created recommendation object

#### Delete Recommendation

- **DELETE** `/recommendations/:id`
- **Description**: Delete a recommendation
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

Cache invalidation is implemented for all write operations to ensure data consistency.
