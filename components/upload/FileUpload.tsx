import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { getActiveBackend } from '@/lib/backend-config';

interface FileUploadProps {
  onUploadComplete?: (fileData: any) => void;
  onError?: (error: any) => void;
  model?: 'gemini' | 'openai';
  conversationId?: string;
}

export default function FileUpload({ onUploadComplete, onError, model = 'gemini', conversationId }: FileUploadProps) {
  const t = useTranslations('FileUpload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    console.log('Cliente: Iniciando subida de archivo', selectedFile.name);
    setIsUploading(true);
    
    try {
      // Si no hay conversationId, crear una nueva conversación primero
      let finalConversationId = conversationId;
      
      if (!finalConversationId) {
        console.log('Cliente: No hay conversationId, creando nueva conversación...');
        
        try {
          const formattedDate = `${new Date().getDate().toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}, ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
          
          const convResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `${formattedDate}`,
            }),
          });
          
          if (!convResponse.ok) {
            throw new Error('Failed to create conversation');
          }
          
          const newConversation = await convResponse.json();
          finalConversationId = newConversation.id;
          console.log('Cliente: Nueva conversación creada:', finalConversationId);
        } catch (error) {
          console.error('Cliente: Error creando conversación:', error);
          throw new Error('No se pudo crear una conversación para el archivo');
        }
      }
      
      // Obtener el backend activo
      const activeBackend = getActiveBackend();
      console.log('Cliente: Backend activo:', activeBackend);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Añadir el modelo seleccionado al formData
      formData.append('model', model);
      // Añadir el conversationId (obligatorio)
      if (!finalConversationId) {
        throw new Error('No conversation available for file upload');
      }
      formData.append('conversationId', finalConversationId);
      // Añadir el backend activo
      formData.append('activeBackend', activeBackend);
      console.log('Cliente: FormData creado con el archivo', selectedFile.name, 'y modelo', model, 'conversationId:', finalConversationId, 'backend:', activeBackend);
      
      // Subir el archivo utilizando nuestro endpoint que utiliza n8n
      console.log('Cliente: Enviando solicitud a /api/uploads');
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Cliente: Respuesta recibida, status:', response.status);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Cliente: Datos recibidos:', data);
      
      if (onUploadComplete) {
        console.log('Cliente: Llamando a onUploadComplete con los datos');
        onUploadComplete(data);
      }
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log('Cliente: Archivo subido exitosamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <svg
            className="w-12 h-12 mb-4 text-gray-500 dark:text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            {selectedFile ? selectedFile.name : t('dragDropText')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('allowedFileTypes')}</p>
        </div>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-600 dark:hover:text-gray-200"
        >
          {t('selectFile')}
        </Button>
      </div>

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white"
      >
        <svg 
          className="w-4 h-4 mr-2"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isUploading ? t('uploading') : t('uploadFile')}
      </Button>
    </div>
  );
}