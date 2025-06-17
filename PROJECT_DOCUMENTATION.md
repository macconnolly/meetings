# Project Documentation: Enhanced Meeting Intelligence System

## 1. Overview

This document provides a comprehensive overview of the Enhanced Meeting Intelligence System. The system is designed to process meeting transcripts, extract key information using AI, and store this information as structured "memory" objects in a centralized Supermemory instance. Its core features include idempotency, organization-level data scoping, and robust error handling.

## 2. System Architecture

The system is built as a modular Node.js application, orchestrated by a main pipeline script (`pipe.js`).

### Core Components:

-   **`pipe.js` (Orchestrator):** The main entry point. It simulates the Pipedream workflow, reading input data, invoking the processing pipeline, and handling top-level errors.
-   **`src/core/AIProcessor.js`:** Interfaces with the OpenRouter API to perform AI-driven analysis on meeting transcripts. It extracts entities, topics, and other specified metadata.
-   **`src/core/SupermemoryClient.js`:** A dedicated client for interacting with the Supermemory API. It handles the creation and updating of memory objects, ensuring idempotency and handling API-specific errors. It includes retry logic for transient network issues and for handling eventual consistency in the search API.
-   **`src/core/MemoryFactory.js`:** Responsible for constructing the memory objects according to the schema required by Supermemory. It ensures that all objects are correctly tagged with the organization identifier.
-   **`src/utils/helpers.js`:** Contains utility functions used across the application.
-   **`src/utils/MetricsCollector.js`:** A utility for collecting and logging performance and operational metrics.

### Configuration:

-   **`config/production.json`:** Stores all configuration variables, including API endpoints, the crucial `organization_tag`, and other system parameters.
-   **`.env`:** Stores sensitive API keys for OpenRouter and Supermemory. This file is not checked into version control.

### Testing:

-   **`test/integration/pipeline.test.js`:** An integration test suite using Mocha that simulates a full pipeline run. It uses real API calls to validate the end-to-end functionality, including the create-or-update logic and organization filtering.
-   **`test/fixtures/`:** Contains sample data for testing, including meeting metadata and transcripts.

## 3. Setup and Installation

1.  **Prerequisites:** Node.js and npm must be installed.
2.  **Clone the repository.**
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following:
    ```
    OPENROUTER_API_KEY=your_openrouter_api_key
    SUPERMEMORY_API_KEY=your_supermemory_api_key
    ```
5.  **Configure the Application:**
    Review and update `config/production.json` as needed. The `organization_tag` is critical for data scoping.

## 4. Running the System

### Running the Pipeline:

To execute the main processing pipeline:

```bash
node pipe.js
```

### Running Tests:

To run the integration test suite:

```bash
npx mocha test/integration/pipeline.test.js
```

## 5. Key Features and Logic

### Idempotency

The system is designed to be fully idempotent. The `SupermemoryClient.js` implements a "create-or-update" logic:

1.  It first attempts to create a new memory object with a `customId`.
2.  If the API returns an error indicating that the `customId` already exists, the client switches to an update flow.
3.  It then searches for the existing memory object using the `/search` endpoint and the `customId`. This search includes a retry mechanism to handle potential delays in data indexing (eventual consistency).
4.  Once found, the client updates the existing memory object with the new data.

### Organization-Level Data Scoping

All memory objects are tagged with an `organization_tag` defined in `config/production.json`. This tag is automatically included in the `containerTags` of every memory object created by the `MemoryFactory.js`. This ensures that all data is properly scoped to a specific organization, preventing data leakage and allowing for filtered queries.

### Error Handling

-   **API Errors:** The `SupermemoryClient.js` and `AIProcessor.js` include robust error handling for API requests, logging detailed error information.
-   **Retries:** The `SupermemoryClient.js` implements a retry mechanism with exponential backoff for network-related errors and for the search-after-create operation to handle eventual consistency.
-   **Validation Errors:** The system logs detailed validation errors (e.g., from the Supermemory API's Zod schema) to aid in debugging.

## 6. Current Status and Known Issues

### Status:

The core pipeline is implemented and functional. The system can successfully process meeting data, generate memory objects, and perform the create-or-update logic.

### Known Issues:

-   **Supermemory Search API:** The `/search` endpoint is not reliably returning results when filtering by `customId`. The exact filter format required by the API is still under investigation. The current implementation uses a `filters` object, but this may need to be adjusted. This is the primary blocker for fully validating the idempotent update flow.

## 7. Supermemory API Reference

This section provides a summary of the key Supermemory API endpoints used in this project, based on the official documentation.

### 7.1 Search Memories (`POST /v3/search`)

This endpoint is used to search for memories. It is the cornerstone of the "create-or-update" logic, used to find existing memories before deciding whether to create a new one or update an existing one.

**Endpoint:** `POST /v3/search`

**Key Request Parameters:**

-   `q` (string): A search query string. While required, it can be a non-empty string like a space if filtering is the main goal.
-   `filters` (object): An object to apply advanced filters. The documentation specifies a structure that can use `AND` or `OR` arrays of filter conditions. To find a memory by our `customId`, the payload should look like this:
    ```json
    {
      "AND": [
        { "key": "customId", "value": "your-custom-id" }
      ]
    }
    ```
-   `containerTags` (array of strings): This is critical for our multi-tenant design. The search is scoped to the `organization_tag` to ensure we only find memories belonging to the correct organization.

**Response:**

The API returns an object containing an array of `results`. Each result is a memory object that includes `documentId`, `chunks`, `score`, and `metadata`.

### 7.2 Get Memory by ID (`GET /v3/memories/{id}`)

This endpoint retrieves a single, specific memory object using its unique, system-generated Supermemory ID.

**Endpoint:** `GET /v3/memories/{id}`

**Path Parameter:**

-   `id` (string): The unique identifier of the memory (e.g., `acxV5LHMEsG2hMSNb4umbn`). This is **not** the same as our `customId`.

**Response:**

The endpoint returns the complete memory object, including its `id`, `customId`, `title`, `summary`, `content`, `metadata`, and `containerTags`.
