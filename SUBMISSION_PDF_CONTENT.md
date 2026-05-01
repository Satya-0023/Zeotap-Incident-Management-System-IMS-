# Infrastructure / SRE Intern Assignment — Submission

**Candidate:** Satya
**Position:** Infrastructure / SRE Intern
**Submission Date:** May 1, 2026
**GitHub Repository:** https://github.com/Satya-0023/Zeotap-Incident-Management-System

---

## 1. Project Overview

This project implements a production-grade Incident Management System (IMS) designed for high-availability distributed environments.

The system handles **high-throughput ingestion (up to 10,000 signals/sec)**, processes signals asynchronously using a queue-based architecture, performs **intelligent debouncing**, and manages a complete incident lifecycle with **mandatory Root Cause Analysis (RCA)** and automatic **MTTR calculation**.

---

## 2. Technical Architecture & Backpressure

The system follows a **Producer–Consumer architecture** to handle burst traffic and ensure system stability.

* **Ingestion Layer:**
  Incoming signals are written to **Redis Streams (XADD)**, which acts as a durable buffer.

* **Processing Layer:**
  Worker services consume signals via **Redis Consumer Groups (XREADGROUP)** at a controlled rate.

* **Backpressure Handling:**

  * Redis Streams absorbs burst traffic (10k signals/sec)
  * Producers are decoupled from consumers
  * Workers process at stable throughput
  * Redis-based rate limiting protects the ingestion layer

* **Storage Strategy:**

| Layer           | Technology | Purpose                             |
| --------------- | ---------- | ----------------------------------- |
| Data Lake       | MongoDB    | Append-only storage for raw signals |
| Source of Truth | PostgreSQL | Work Items + RCA (ACID compliance)  |
| Hot Path Cache  | Redis      | Real-time dashboard state           |

---

## 3. Design Patterns & Core Logic

* **Strategy Pattern (Alerting):**
  Enables pluggable severity mapping:

  * RDBMS failures → P0
  * Cache failures → P2

* **State Pattern (Workflow Engine):**
  Manages incident lifecycle:
  OPEN → INVESTIGATING → RESOLVED → CLOSED

  **Constraint:**
  Incidents cannot transition to CLOSED without a valid RCA.

* **Atomic Debouncing:**
  Implemented using Redis `SET NX EX 10`:

  * Multiple signals within 10 seconds → single incident
  * All signals are still stored and linked

---

## 4. Resilience, Concurrency & Observability

* **Retry Logic:**
  Exponential backoff for database operations ensures resilience against transient failures.

* **Concurrency Handling:**

  * PostgreSQL optimistic locking (version column) prevents lost updates
  * Redis atomic operations ensure safe debouncing

* **Processing Semantics:**

  * At-least-once delivery via Redis Streams
  * Idempotent handling at application level

* **Health Checks:**
  `/health` endpoint verifies connectivity to Redis, MongoDB, and PostgreSQL

* **Metrics & Aggregation:**

  * Signals/sec logged every 5 seconds
  * MongoDB aggregation → signals per minute
  * PostgreSQL queries → incidents by severity

---

## 5. RCA & MTTR

* RCA includes:

  * Root cause category
  * Fix applied
  * Prevention steps

* **Validation:**
  Incident closure is blocked unless RCA is complete

* **MTTR Calculation:**
  MTTR = RCA submission time − first signal timestamp

---

## 6. Verification Results

* **Load Testing:**
  Successfully handled burst traffic (1,000+ signals) with stable processing

* **Debouncing Validation:**
  Verified multiple signals collapse into a single incident within the time window

* **End-to-End Workflow:**
  Signal → Incident → RCA → MTTR → Closure verified

* **Dockerized Deployment:**
  Entire system runs via:

  ```bash
  docker-compose up --build
  ```

---

## 7. Setup Instructions

1. Clone the repository

2. Run:

   ```bash
   docker-compose up --build
   ```

3. Access:

   * Frontend: http://localhost:3000
   * Backend: http://localhost:3001

4. Run simulator:

   ```bash
   cd backend
   npm run simulate
   ```

---

## 8. Conclusion

This system demonstrates a scalable and resilient architecture aligned with real-world SRE practices, including:

* Asynchronous processing via queues
* Backpressure handling
* Fault tolerance and retry mechanisms
* Strong data separation and consistency
* Clean, extensible design using proven patterns

The implementation focuses on **reliability, scalability, and maintainability**, reflecting production-grade system design principles.
