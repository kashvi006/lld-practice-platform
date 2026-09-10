import { app } from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`LLD Practice Platform Backend running on http://localhost:${PORT}`);
});