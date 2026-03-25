# API Documentation for Measurement Portal Backend

This document outlines the API endpoints available in the backend, including request payloads and response formats. All endpoints are prefixed with the base URL of the API.

## Endpoints

### Model Details

#### GET /model-details
Retrieves all model details from the database, including associated images and comments.

**Request:**
- Method: GET
- Body: None
- Query Parameters: None

**Response:**
- Status: 200 OK
- Body: Array of ModelDetails objects with nested images and comments

**ModelDetails Schema:**
```json
{
  "model_id": "string (UUID)",
  "model_name": "string",
  "model_glb_url": "string (URL to GLB file)",
  "landmarks_url": "string (URL to JSON landmarks file, nullable)",
  "category": "string (enum: 'adult' or 'kid')",
  "status": "string (enum: 'not_checked', 'approved', or 'pending')",
  "created_at": "string (ISO timestamp)",
  "updated_at": "string (ISO timestamp, nullable)",
  "images": [
    {
      "image_id": "string (UUID)",
      "model_id": "string (UUID)",
      "image_url": "string (URL to image file)"
    }
  ],
  "comments": [
    {
      "comment_id": "string (UUID)",
      "model_id": "string (UUID)",
      "comment": "string",
      "created_at": "string (ISO timestamp)"
    }
  ]
}
```

#### PUT /update-json-url
Updates the JSON landmarks data for a specific model by uploading to S3 and updating the database.

**Request:**
- Method: PUT
- Body:
```json
{
  "model_id": "string (UUID)",
  "json_data": "object (arbitrary JSON data for landmarks)"
}
```

**Response:**
- Status: 200 OK (on success)
- Status: 404 Not Found (if model not found)
- Status: 500 Internal Server Error (on upload or database failure)
- Body (success):
```json
{
  "success": true,
  "json_url": "string (URL to uploaded JSON file)"
}
```

#### PUT /update-status
Updates the status of a specific model.

**Request:**
- Method: PUT
- Body:
```json
{
  "model_id": "string (UUID)",
  "status": "string (enum: 'not_checked', 'approved', or 'pending')"
}
```

**Response:**
- Status: 200 OK (on success)
- Status: 404 Not Found (if model not found)
- Status: 500 Internal Server Error (on database failure)
- Body (success):
```json
{
  "success": true,
  "message": "Status updated successfully",
  "status": "string (the updated status)"
}
```

### Comments

#### GET /get-comment
Retrieves all comments for a specific model.

**Request:**
- Method: GET
- Body:
```json
{
  "model_id": "string (UUID)"
}
```
*Note: Typically, GET requests use query parameters, but this endpoint expects a JSON body.*

**Response:**
- Status: 200 OK
- Status: 500 Internal Server Error
- Body: Array of Comment objects

**Comment Schema:**
```json
{
  "comment_id": "string (UUID)",
  "model_id": "string (UUID)",
  "comment": "string",
  "created_at": "string (ISO timestamp)"
}
```

#### POST /add-comment
Adds a new comment to a specific model.

**Request:**
- Method: POST
- Body:
```json
{
  "model_id": "string (UUID)",
  "comment": "string"
}
```

**Response:**
- Status: 200 OK
- Status: 500 Internal Server Error
- Body: Comment object (the newly created comment)

### Sync

#### POST /sync-models
Synchronizes models from S3 buckets into the PostgreSQL database. This scans S3 for .glb files under 'models/' prefix, creates database entries, and associates images and JSON files.

**Request:**
- Method: POST
- Body: None

**Response:**
- Status: 200 OK
- Status: 500 Internal Server Error
- Body:
```json
{
  "total_processed": "integer (number of models processed)",
  "inserted": "integer (number of new models inserted)",
  "skipped": "integer (number of existing models skipped)"
}
```

## Error Handling
All endpoints may return standard HTTP error codes with JSON error messages:
- 400 Bad Request: Invalid request data
- 404 Not Found: Resource not found
- 500 Internal Server Error: Server-side errors

Error response format:
```json
{
  "detail": "string (error description)"
}
```

## Authentication
*Note: No authentication details are visible in the code. Please confirm with the backend team if authentication is required.*

## Data Types
- UUIDs are represented as strings in JSON
- Timestamps are in ISO 8601 format
- URLs are full S3 URLs
- JSON data for landmarks is arbitrary object structure
- Enums: category ('adult', 'kid'), status ('not_checked', 'approved', 'pending')</content>
<parameter name="filePath">m:\projects\FF\VIEWER\MEASUREMENT-PORTAL\ff-measurement-portal-backend\API_DOCUMENTATION.md