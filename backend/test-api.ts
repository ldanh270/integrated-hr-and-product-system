async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hrp.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;

    const res = await fetch('http://localhost:5000/api/applications?page=1&pageSize=10&status=pending&type=leave', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("STATUS:", res.status);
    const data = await res.json();
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err: unknown) {
    console.error("ERROR:", err instanceof Error ? err.message : err);
  }
}
run();
