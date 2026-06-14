import { prisma } from "../libs/database"

async function main() {
  try {
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin",
        password: "Admin123@",
      }),
    })
    const loginData = (await loginRes.json()) as { data?: { token?: string } }
    const token = loginData.data?.token

    const testCases = [
      "http://localhost:5000/api/employees?limit=200",
    ]

    for (const url of testCases) {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log(`URL: ${url} -> Status: ${res.status}`)
        const json = (await res.json()) as unknown
        console.log("Response data:", JSON.stringify(json, null, 2))
      } catch (err) {
        console.error(`Failed to fetch ${url}:`, err)
      }
    }
  } catch (err) {
    console.error("Error executing API test cases:", err)
  }
}

main()
  .catch((err) => {
    console.error(err)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
