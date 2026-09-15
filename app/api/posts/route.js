// app/api/posts/route.js
import { NextResponse } from "next/server";
import { withLogging } from '@/lib/withLogging';

async function handler() {
  return NextResponse.json({ status: "stub ok" });
}

export const POST = withLogging(handler);