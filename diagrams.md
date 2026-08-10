# SkillBridge Simplified Diagrams

This document contains simplified diagrams represented in Mermaid syntax, ideal for a clean and readable project report.

---

## 1. System Architecture Diagram
A simplified high-level view of the SkillBridge application architecture.

```mermaid
graph TD
    Client["Next.js Frontend"]
    API["Django REST API"]
    DB[("MongoDB Database")]
    Paystack["Paystack Payments"]
    Termii["Termii SMS"]

    Client -- HTTPS --> API
    API -- MongoEngine --> DB
    API --- Paystack
    API --- Termii
```

---

## 2. Database Schema (Key Collections)
An entity-relationship diagram highlighting the primary database documents and their core properties.

```mermaid
erDiagram
    User {
        string email
        string role "customer | worker | admin"
    }
    WorkerProfile {
        string city
        boolean is_approved
    }
    Booking {
        string status
        decimal quoted_amount
    }
    Payment {
        string paystack_reference
        decimal amount
    }

    User ||--|| WorkerProfile : "has profile"
    User ||--o{ Booking : "books"
    WorkerProfile ||--o{ Booking : "receives"
    Booking ||--|| Payment : "has payment"
```

---

## 3. Booking Lifecycle
A streamlined state machine showing the main flow of a service booking.

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> accepted : Worker accepts
    pending --> rejected : Worker rejects
    accepted --> in_progress : Worker starts job
    in_progress --> completed : Worker completes job
    completed --> done : Customer releases funds
    completed --> disputed : Customer disputes job
    disputed --> done : Admin release
    disputed --> refunded : Admin refund
    done --> [*]
    rejected --> [*]
    refunded --> [*]
```

---

## 4. Authentication Flow (Email OTP)
A sequence diagram representing the passwordless authentication process.

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Email

    User->>Frontend: Enters Email
    Frontend->>Backend: Request OTP
    Backend->>Email: Send code
    Email-->>User: Delivers code
    User->>Frontend: Enters code
    Frontend->>Backend: Verify code
    Backend-->>Frontend: JWT session
```

---

## 5. Paystack Escrow Payment Flow
A sequence diagram detailing the payment flow from escrow hold to final release.

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant Backend
    participant Paystack
    actor Worker

    Customer->>Frontend: Pay for Booking
    Frontend->>Backend: Initialize Payment
    Backend->>Paystack: Request Checkout URL
    Paystack-->>Frontend: Checkout page
    Customer->>Paystack: Completes payment
    Paystack->>Backend: Webhook: Payment Success (Escrow held)
    Worker->>Backend: Mark job completed
    Customer->>Backend: Release funds
    Backend->>Worker: Payout (88% net)
```

---

## 6. System Use Case Diagram
Visualizes the relationship between the primary actors and the use cases in the SkillBridge platform.

```mermaid
graph LR
    Customer["👤 Customer"]
    Worker["🛠️ Worker"]
    Admin["🔑 Admin"]

    subgraph SkillBridge["SkillBridge Platform"]
        UC_Auth(["OTP Login"])
        UC_Book(["Book & Pay Escrow"])
        UC_Release(["Release Funds"])
        UC_Complete(["Mark Job Done"])
        UC_Arbitrate(["Arbitrate Disputes"])
        UC_Verify(["Approve Workers"])
    end

    Customer --> UC_Auth
    Customer --> UC_Book
    Customer --> UC_Release

    Worker --> UC_Auth
    Worker --> UC_Complete

    Admin --> UC_Verify
    Admin --> UC_Arbitrate
```

---

## 7. Booking Process Flowchart
A simplified flowchart tracking the core booking and payment flow.

```mermaid
flowchart TD
    Start([Start]) --> Book[Customer books service]
    Book --> Pay[Pay via Paystack Escrow]
    Pay --> Decision{Worker accepts?}
    
    Decision -- No --> Refund[Refund customer] --> End([End])
    Decision -- Yes --> Execute[Worker performs service]
    
    Execute --> Complete[Worker marks complete]
    Complete --> Satisfied{Customer satisfied?}
    
    Satisfied -- Yes --> Release[Release funds to worker] --> End
    Satisfied -- No --> Dispute[Disputed status]
    
    Dispute --> Arbitrate{Admin arbitration}
    Arbitrate -- Release --> Release
    Arbitrate -- Refund --> Refund
```
