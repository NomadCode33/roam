// app/terms/page.jsx
import fs from 'fs';
import path from 'path';

export default function Terms() {
  const filePath = path.join(process.cwd(), 'content', 'terms-and-conditions.html');
  const html = fs.readFileSync(filePath, 'utf8');

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}