import { apiClient } from "./src/lib/api/api-client.ts"; // Wait, I can just use native fetch

async function main() {
  try {
    const res = await fetch("http://localhost:5000/api/employees/approvers");
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch(e) {
    console.log("Error:", e.message);
  }
}
main();
