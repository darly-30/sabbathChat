// app/api/chat/send/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { BackendService } from '@/lib/services/backend-service';
import { getActiveBackend } from '@/lib/backend-config';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth';
import { MessageRole } from '@prisma/client';
import { formatSessionInfo } from '@/lib/services/shared';

export const runtime = 'nodejs'; // SSE estable

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering

// Support both GET and POST methods
export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

// Shared handler for both GET and POST
async function handleRequest(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        `data: ${JSON.stringify({ 
          type: 'error', 
          data: { 
            message: 'Authentication required', 
            code: 'UNAUTHORIZED' 
          } 
        })}\n\n`, 
        {
          headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          status: 401
        }
      );
    }

  let message: string, conversationId: string, settings: UserSettings | undefined, model: 'gemini' | 'openai', activeBackend: any;
    
    // Check if request is from EventSource (GET with query params) or fetch (POST with body)
    const url = new URL(req.url);
    const dataParam = url.searchParams.get('data');
    
    if (dataParam) {
      // Parse from URL parameter (for EventSource)
      const parsedData = JSON.parse(decodeURIComponent(dataParam));
      message = parsedData.message;
      conversationId = parsedData.conversationId;
      settings = parsedData.settings;
      model = parsedData.model || 'gemini'; // Por defecto usa Gemini si no se especifica
      activeBackend = parsedData.activeBackend;
    } else {
      // Parse from request body (for regular POST)
      const body = await req.json().catch(() => ({}));
      message = body.message;
      conversationId = body.conversationId;
      settings = body.settings;
      model = body.model || 'gemini'; // Por defecto usa Gemini si no se especifica
      activeBackend = body.activeBackend;
    }
    
    // Validar y normalizar el backend
    if (!['python', 'n8n'].includes(activeBackend)) {
      activeBackend = 'n8n';
    }
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return new Response(
        `data: ${JSON.stringify({ 
          type: 'error', 
          data: { 
            message: 'User not found', 
            code: 'USER_NOT_FOUND' 
          } 
        })}\n\n`, 
        {
          headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          status: 404
        }
      );
    }
    
    // If conversationId is provided, make sure it belongs to the user
    if (conversationId && conversationId !== 'new') {
      const conversation = await prisma.conversation.findUnique({
        where: { 
          id: conversationId,
          userId: user.id
        }
      });
      
      if (!conversation) {
        // If no conversation found or not belonging to user, create a new one
        const newConversation = await prisma.conversation.create({
          data: {
            title: `Conversación ${new Date().toLocaleString()}`,
            userId: user.id
          }
        });
        
        conversationId = newConversation.id;
      }
    } else if (!conversationId || conversationId === 'new') {
      // Create a new conversation if none is provided
      const newConversation = await prisma.conversation.create({
        data: {
          title: `Conversación ${new Date().toLocaleString()}`,
          userId: user.id
        }
      });
      
      conversationId = newConversation.id;
    }
    
    if (!message) {
      return new Response(
        `data: ${JSON.stringify({ 
          type: 'error', 
          data: { 
            message: 'Message is required', 
            code: 'INVALID_REQUEST' 
          } 
        })}\n\n`, 
        {
          headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      );
    }
    
    // Create backend service with the active backend from the client
    const backendService = new BackendService(model as 'gemini' | 'openai', activeBackend);
    
    try {
      // Save user message to the database
      await prisma.message.create({
        data: {
          conversationId,
          content: message,
          role: MessageRole.USER
        }
      });
      
      // Obtener chatbotId si está disponible en la conversación
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      console.log('📋 Conversación encontrada:', conversation?.id);
      console.log('📋 Backend activo:', activeBackend);
      console.log('📋 Settings de la conversación:', JSON.stringify(conversation?.settings, null, 2));
      
      // Obtener chatbotId según el backend
      let chatbotId: string | undefined;
      
      if (activeBackend === 'python') {
        // Python requiere un chatbotId
        const pythonSettings = (conversation?.settings as any)?.pythonSessionData;
        chatbotId = pythonSettings?.chatbotId || (conversation?.settings as any)?.chatbotId;
        
        if (chatbotId) {
          console.log(`✅ ${formatSessionInfo('python', pythonSettings || conversation?.settings)}`);
        } else {
          console.log(`❌ ${formatSessionInfo('python', null)}`);
        }
      } else if (activeBackend === 'n8n') {
        // n8n no requiere chatbotId, pero podemos registrar que está listo
        console.log(`✅ ${formatSessionInfo('n8n', null)}`);
      }
      
      console.log('� ChatbotId final:', chatbotId || 'N/A');
      
      // Send message using the configured backend service
      const responseData = await backendService.sendMessage(
        message,
        settings?.topK ?? 5,
        settings?.temperature ?? 0.7,
        chatbotId
      );
      
      // Create encoder for SSE
      const encoder = new TextEncoder();
      
      // Create message object for database
      let assistantMessageContent = '';
      let assistantMessageSources = responseData.sources || null;
      let assistantMessageUsage = responseData.usage || null;
      
      // Create stream
      const stream = new ReadableStream({
        async start(controller) {
          // Helper to push SSE events
          const push = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          
          // Chunk output into blocks of 600-800 characters
          const chunks = responseData.output.match(/[\s\S]{600,800}|[\s\S]{1,800}/g) ?? [];
          
          // Send each chunk as a message event
          for (const chunk of chunks) {
            assistantMessageContent += chunk;
            push({ type: 'message', data: { content: chunk } });
            
            // Add a small delay between chunks to simulate typing
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Send sources if available
          if (responseData.sources) {
            push({ type: 'sources', data: { sources: responseData.sources } });
          }
          
          // Send usage if available
          if (responseData.usage) {
            push({ type: 'usage', data: { usage: responseData.usage } });
          }
          
          // Save assistant response to the database
          await prisma.message.create({
            data: {
              conversationId,
              content: assistantMessageContent,
              role: MessageRole.ASSISTANT,
              sources: assistantMessageSources ? assistantMessageSources as any : undefined,
              usage: assistantMessageUsage ? assistantMessageUsage as any : undefined
            }
          });
          
          // Update conversation title if it's the first message
          const messageCount = await prisma.message.count({
            where: { conversationId }
          });
          
          if (messageCount <= 2) {
            // Generate title from first user message
            const title = message.length > 30 
              ? message.substring(0, 30) + '...'
              : message;
              
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { title }
            });
          }
          
          // Update conversation's updatedAt
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          });
          
          // Send completion event with conversation ID
          push({ 
            type: 'complete', 
            data: { 
              ok: true,
              conversationId
            } 
          });
          
          // Close the stream
          controller.close();
        }
      });

      // Return the stream as an SSE response
      return new Response(stream, { 
        headers: { 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error from backend service:', errorMessage);
      
      // Determinar el código de error apropiado
      let errorCode = 'BACKEND_SERVICE_ERROR';
      if (errorMessage.includes('archivo PDF') || errorMessage.includes('chatbot')) {
        errorCode = 'PYTHON_FILE_REQUIRED';
      }
      
      return new Response(
        `data: ${JSON.stringify({ type: 'error', data: { message: errorMessage, code: errorCode } })}\n\n`, 
        {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        }
      );
    }
  } catch (error) {
    console.error('Error processing chat message:', error);
    return new Response(
      `data: ${JSON.stringify({ type: 'error', data: { message: 'Internal server error', code: 'INTERNAL_ERROR' } })}\n\n`, 
      {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        status: 500
      }
    );
  }
}
