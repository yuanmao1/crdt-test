# Tiny-YJS Collaborative Editing Test Case

This project is a simple collaborative editing algorithm inspired by the `yjs` library. It implements a basic version of the collaborative editing protocol and includes local testing to simulate the collaborative editing experience.

## Overview

The goal of this project is to implement a toy-level version of the collaborative editing algorithm based on `yjs`. The project focuses on testing and demonstrating how version vectors work in a collaborative document editing environment.

## Workflow for Remote Collaborative Editing

To remotely use the collaborative editing algorithm, follow these 3 steps:

### Step 1: Broadcast and Retrieve Version Vectors
- Send a broadcast to other clients to notify them of your current document state.
- Each client should then respond with their version vector, which indicates the parts of the document they have.

### Step 2: Retrieve Missing Items
- Using the received version vector from the other clients, call `Doc.getMissing` to retrieve any missing items that are necessary to synchronize the document state with the other clients.

### Step 3: Send Missing Items and Deleted Elements
- Send the missing items (in the form of a `MissingList`) and a set of deleted elements (denoted as `ds`) to the other clients.
- This ensures that all clients can apply the updates and stay synchronized with the latest version of the document.

## Local Testing

This project includes a local test environment that demonstrates how the collaborative algorithm works. You can test the algorithm by simulating multiple clients editing the same document locally.

### How to Run

1. Clone the repository.
2. Install any necessary dependencies.
3. Run the example to simulate a collaborative editing session.
4. Follow the steps above to observe the algorithm in action.
>>>>>>> 9fdc96befc12713c94a8f9ecdf1f72d7b3c00fba
