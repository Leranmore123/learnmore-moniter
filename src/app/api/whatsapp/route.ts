import { NextResponse } from 'next/server';
import { GET as getBotHandler, POST as postBotHandler } from './bot/route';

export async function GET(req: Request) {
  return getBotHandler();
}

export async function POST(req: Request) {
  return postBotHandler(req);
}
