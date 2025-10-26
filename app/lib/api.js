const API_URL = 'http://localhost:3000';

export async function checkServer() {
  const res = await fetch(`${API_URL}/`);
  const text = await res.text();
  console.log(text);
}
