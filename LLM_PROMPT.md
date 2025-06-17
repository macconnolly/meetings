
### LLM Prompt for Supermemory API Issue

**Context:**

I am developing a Node.js-based Enhanced Meeting Intelligence System. The system processes meeting transcripts, uses an AI model (via OpenRouter) to extract insights, and stores these as structured data objects in Supermemory. A key requirement is **idempotency**: if a meeting is processed more than once, the system should update the existing memory object instead of creating a duplicate.

I have implemented a create-or-update flow in my `SupermemoryClient.js` module. The logic is as follows:

1.  Attempt to create a memory with a specific `customId`.
2.  If the Supermemory API returns a "customId already exists" error, I catch this error.
3.  I then call a `_findMemoryByCustomId` method, which uses the `/api/v1/memory/search` endpoint to find the existing memory.
4.  Once the memory is found, I will proceed to update it (the update logic is not yet the issue).

**The Problem:**

The `_findMemoryByCustomId` method is failing. The Supermemory `/search` endpoint consistently returns an empty array `[]`, even when I know for a fact that a memory with the specified `customId` exists (because the create call just failed for that exact reason).

Here is the code for the search method:

```javascript
async _findMemoryByCustomId(customId) {
    const url = `${this.baseUrl}/api/v1/memory/search`;
    const payload = {
        q: ' ', // Also tried with the customId, and empty string
        filters: {
            customId: customId
        }
    };

    // ... (retry logic here, which is working correctly)

    const response = await axios.post(url, payload, { headers: this.headers });
    return response.data; // This is always []
}
```

**What I've Tried:**

1.  **Varying the `q` parameter:** I have tried setting `q` to the `customId`, to a single space `' '`, and to an empty string `''`.
2.  **Varying the `filters` object:** I have tried different structures for the filter, but the documentation is unclear on the exact format for filtering by `customId`.
3.  **Manual cURL:** I have tried to replicate the search with a manual cURL command, with the same empty result.

**Request:**

1.  Please analyze the problem and provide the **correct payload structure** for the Supermemory `/api/v1/memory/search` endpoint to reliably find a memory object by its `customId`.
2.  Explain the expected format of the `filters` object and the `q` parameter for this specific use case.
3.  If possible, provide a working `cURL` command or `axios` code snippet that demonstrates the correct search query.
