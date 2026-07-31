// app/privacy/page.jsx
import fs from 'fs';
import path from 'path';

export default function PrivacyPolicy() {
  const filePath = path.join(process.cwd(), 'content', 'privacy-policy.html');
  const html = fs.readFileSync(filePath, 'utf8');

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}