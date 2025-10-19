import { NextRequest, NextResponse } from 'next/server';
import { BackendService } from '@/lib/services/backend-service';
import { BackendType, getActiveBackend } from '@/lib/backend-config';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth';
import { formatSessionInfo } from '@/lib/services/shared';

export async function POST(request: NextRequest) {
  console.log('Servidor: Recibiendo solicitud de subida de archivo');

  try {
    // Obtener sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const conversationId = (formData.get('conversationId') as string) || undefined;
    // Obtenemos el modelo seleccionado del formData (si no existe, usamos 'gemini' por defecto)
    const model = (formData.get('model') as string) || 'gemini';
    // Obtenemos el backend activo del cliente
    const clientActiveBackend = (formData.get('activeBackend') as string) || undefined;
    
    // Si no viene del cliente, usar getActiveBackend() como fallback (aunque en servidor no funcione correctamente)
    let activeBackend: BackendType = (clientActiveBackend as BackendType) || getActiveBackend();
    if (!['python', 'n8n'].includes(activeBackend)) {
      activeBackend = 'n8n';
    }
    
    console.log('Servidor: Modelo seleccionado para la subida:', model);
    console.log('Servidor: Backend activo (del cliente):', clientActiveBackend);
    console.log('Servidor: Backend activo (final):', activeBackend);
    console.log('Servidor: Conversation ID:', conversationId);
    
    if (!file) {
      console.error('Servidor: No se encontró el archivo en la solicitud');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('Servidor: Archivo recibido:', file.name, file.size, 'bytes');

    // Utilizamos el servicio de backend para subir el archivo
    const backendService = new BackendService(model as 'gemini' | 'openai', activeBackend);
    const uploadResult = await backendService.uploadFile(file);
    
    console.log('📤 Resultado de subida:', uploadResult);
    console.log('📤 fileId:', uploadResult.fileId);
    
    if (!uploadResult.success) {
      console.error('Servidor: Error al subir archivo:', uploadResult.message);
      return NextResponse.json(
        { error: uploadResult.message || 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Guardar settings específicos del backend en la conversación
    if (conversationId) {
      try {
        console.log(`📝 Guardando configuración para backend: ${activeBackend}`);
        
        // Obtener la conversación actual
        const currentConversation = await prisma.conversation.findUnique({
          where: { id: conversationId }
        });
        
        // Combinar settings existentes
        const existingSettings = currentConversation?.settings as any || {};
        let newSettings: any = {
          ...existingSettings,
          backend: activeBackend,
          uploadedAt: new Date().toISOString()
        };
        
        // Guardar datos específicos según el backend
        if (activeBackend === 'python') {
          if (!uploadResult.fileId) {
            throw new Error('Python backend: No chatbot_id received');
          }
          newSettings.chatbotId = uploadResult.fileId;
          newSettings.pythonSessionData = {
            chatbotId: uploadResult.fileId,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            fileSize: file.size,
            fileType: file.type
          };
        } else if (activeBackend === 'n8n') {
          newSettings.n8nSessionData = {
            model: model,
            uploadedAt: new Date().toISOString()
          };
        }
        
        const updatedConversation = await prisma.conversation.update({
          where: { id: conversationId },
          data: { settings: newSettings }
        });
        
        console.log(`✅ ${formatSessionInfo(activeBackend, newSettings)}`);
        console.log('📋 Settings actualizados:', JSON.stringify(updatedConversation.settings, null, 2));
      } catch (dbError) {
        console.error(`❌ Error guardando settings para ${activeBackend}:`, dbError);
        // Continuamos de todas formas
      }
    }
    
    console.log('Servidor: Archivo subido exitosamente:', uploadResult);
    // Retornar más información: incluir tanto fileId como fileUrl
    return NextResponse.json({
      ...uploadResult,
      chatbotId: uploadResult.fileId, // Alias para facilitar el acceso en el cliente
      success: true
    });
    
  } catch (error) {
    console.error('Servidor: Error procesando la subida del archivo:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process file upload', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}