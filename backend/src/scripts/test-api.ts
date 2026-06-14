// Import the prisma instance from the local database library to manage DB connections
import { prisma } from "../libs/database"

// Define the main asynchronous function to execute API integration tests
async function main() {
  try {
    // Send a POST request to login endpoint with admin credentials to obtain auth token
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST", // HTTP request method
      headers: {
        "Content-Type": "application/json", // Indicate payload is JSON format
      },
      // Pass the username and password in the request body as a JSON string
      body: JSON.stringify({
        username: "admin",
        password: "Admin123@",
      }),
    })
    
    // Parse the JSON response received from the login endpoint
    const loginData = (await loginRes.json()) as { data?: { token?: string } }
    // Extract the authorization token from the response structure
    const token = loginData.data?.token

    // Define an array of test endpoints that require authentication
    const testCases = [
      "http://localhost:5000/api/employees?limit=200",
    ]

    // Iterate through each endpoint URL specified in the test cases
    for (const url of testCases) {
      try {
        // Send a GET request to the target URL including the authorization token in the header
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`, // Bearer authentication token format
          },
        })
        // Print the HTTP request target and the returned HTTP status code
        console.log(`URL: ${url} -> Status: ${res.status}`)
        // Parse the response body as a JSON structure
        const json = (await res.json()) as unknown
        // Print the formatted response JSON data to the terminal console
        console.log("Response data:", JSON.stringify(json, null, 2))
      } catch (err) {
        // Print an error message if an individual API request fails
        console.error(`Failed to fetch ${url}:`, err)
      }
    }
  } catch (err) {
    // Print an error message if the entire testing workflow encounters a failure
    console.error("Error executing API test cases:", err)
  }
}

// Invoke the main function to start testing the APIs
main()
  // Catch any unhandled errors thrown from main execution
  .catch((err) => {
    console.error(err)
  })
  // Ensure the database connection is closed properly after execution completes
  .finally(() => {
    void prisma.$disconnect()
  })

