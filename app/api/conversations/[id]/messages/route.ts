import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth';
import { MessageRole } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering

// GET handler for fetching messages of a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const conversationId = params.id;
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Fetch all messages for the conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        role: true,
        sources: true,
        usage: true,
        createdAt: true
      }
    });
    
    // Transform roles from enum to expected string format
    const formattedMessages = messages.map(msg => ({
      ...msg,
      role: msg.role.toLowerCase()
    }));
    
    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST handler for saving a message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const conversationId = params.id;
    const { content, role, sources, usage } = await req.json();
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: { 
        id: conversationId,
        userId: user.id
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Create new message
    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        content,
        role: role.toUpperCase() as MessageRole,
        sources: sources || undefined,
        usage: usage || undefined
      }
    });
    
    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json({
      ...newMessage,
      role: newMessage.role.toLowerCase()
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}