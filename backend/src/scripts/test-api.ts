import { prisma } from "../libs/database"

async function main() {
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
  const loginData = await loginRes.json() as any
  const token = loginData.data?.token

  const testCases = [
    "http://localhost:5000/api/employees?limit=200",
  ]

  for (const url of testCases) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log(`URL: ${url} -> Status: ${res.status}`)
    const json = await res.json() as any
    console.log("Response data:", JSON.stringify(json, null, 2))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
