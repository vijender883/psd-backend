# API Documentation for Frontend Integration

This document outlines the **NEW** Backend API endpoints that replace the legacy endpoints used in the frontend. Please update the frontend service calls (`dsaApi.js`, `CodingLab.jsx`, `Labs.jsx`) to use these new endpoints.

## 1. Code Execution (Analysis & Running)
**Base Path**: `/api/code`

| Frontend Feature | Old Endpoint | **New Endpoint** | Method | Request Body Changes |
| :--- | :--- | :--- | :--- | :--- |
| **Get Problems** | `/simulation/${id}/problems` | `/simulation/:simulationId/problems` | `GET` | Response: `{ problemIds: [...] }`. Now returns IDs only. Fetch details separately. |
| **Get Problem Details** | `/simulation/${id}/problems/${pId}` | `/simulation/problem` | `POST` | **Changed to POST**. Body: `{ simulationId, problemId, userId }`. Returns text, template, & 2 test cases. |
| **Dry Run Code** | `/simulations/${id}/${uId}/${name}/run` | `/simulations/run` | `POST` | Params moved to Body. Body: `{ simulationId, userId, userName, problemId, code, language }`. Runs 3 test cases only. |
| **Submit Code** | `/simulations/${id}/analyze` | `/simulations/submit-problem` | `POST` | Body: `{ simulationId, userId, userName, problemId, code, language... }`. Runs ALL test cases. Marks `isSubmitted: true`. |
| **Get Simulation Time** | `/scheduledStartTime/${id}` | `/simulation-time/:simulationId` | `GET` | Returns `{ startTime, endTime }`. |

### Detailed Request/Response

#### 1.1 Fetch Problem Details
*   **New Endpoint**: `POST /api/code/simulation/problem`
*   **Replaces**: `GET /api/code/simulation/:simulationId/problems/:problemId`
*   **Request**:
    ```json
    {
      "simulationId": "678e...",
      "problemId": "twoSum",
      "userId": "user_123"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "problem": {
        "id": "twoSum",
        "title": "Two Sum",
        "description": "...",
        "test_cases": [ ...first 2 cases... ]
      },
      "code": "previous_saved_code...",
      "isSubmitted": false
    }
    ```

#### 1.2 Run Code (Dry Run)
*   **New Endpoint**: `POST /api/code/simulations/run`
*   **Replaces**: `POST /api/code/simulations/:simulationId/:userId/:username/run`
*   **Request**:
    ```json
    {
      "simulationId": "...",
      "userId": "...",
      "userName": "...",
      "problemId": "...",
      "code": "...",
      "language": "python"
    }
    ```
*   **Response**: Same as before (list of test case results, first 3 cases executed).

#### 1.3 Submit Problem
*   **New Endpoint**: `POST /api/code/simulations/submit-problem`
*   **Replaces**: `POST /api/code/simulations/:simulationId/analyze`
*   **Request**: Same as Run, plus `timeComplexity`, `spaceComplexity`.
*   **Behavior**: Executes all test cases. Records final score.

---

## 2. Simulations & Metadata
**Base Path**: `/api/simulations`

| Frontend Feature | Old Endpoint | **New Endpoint** | Method | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **List Simulations** | - | `/simulation-list` | `GET` | Returns list of all simulations. |
| **Add Simulation** | - | `/add-simulation` | `POST` | Admin use. Body: `{ title, problemIds: [...] }`. |

*(Note: Registration/Participants endpoints were refactored. Please rely on Leaderboard updates for implicit participation tracking or use the new List endpoint for display).*

---

## 3. Leaderboard
**Base Path**: `/api/leaderboard`

| Frontend Feature | Old Endpoint | **New Endpoint** | Method | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Update Score** | `/simulations/${id}/leaderboard/update` | `/simulations/:simulationId/leaderboard/update` | `POST` | Body: `{ userId, simulationId, username }`. Updates score based on stored submissions (MCQ 30% + DSA 70%). |
| **Get Leaderboard** | `/simulations/${id}/leaderboard` | `/simulations/:simulationId/leaderboard` | `GET` | Returns ranked list. |
