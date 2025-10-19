'use client';

import { useState, useEffect, useRef } from 'react';
import { BackendType, getActiveBackend, setActiveBackend } from '@/lib/backend-config';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export default function BackendSelector() {
  const [selectedBackend, setSelectedBackend] = useState<BackendType>('n8n');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Cargar el backend seleccionado al iniciar
    const activeBackend = getActiveBackend();
    setSelectedBackend(activeBackend);
    
    console.log('%c🚀 BackendSelector inicializado', 'color: #9C27B0; font-weight: bold; font-size: 12px;');
    console.log(`%cBackend activo: ${activeBackend}`, 'color: #9C27B0; font-size: 12px;');
  }, []);

  // Cerrar dropdown cuando se haga click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBackendChange = (backend: BackendType) => {
    if (backend === selectedBackend) {
      console.log(`%c⚠️  El backend ${backend} ya estaba seleccionado`, 'color: #FF9800; font-weight: bold;');
      setShowDropdown(false);
      return;
    }
    
    setSelectedBackend(backend);
    setActiveBackend(backend);
    setShowDropdown(false);
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF6B00;');
    console.log(
      `%c🔄 CAMBIO DE BACKEND EN LA UI`,
      'color: #FF6B00; font-weight: bold; font-size: 13px;'
    );
    console.log(`%cNuevo backend seleccionado: ${backend.toUpperCase()}`, 'color: #FFB74D; font-weight: bold; font-size: 12px;');
    console.log(`%cTiempo: ${new Date().toLocaleTimeString()}`, 'color: #0099CC; font-size: 11px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF6B00;');
    
    // Refrescar la página para aplicar los cambios
    router.refresh();
  };

  const getBackendLabel = (backend: BackendType): string => {
    return backend === 'n8n' ? 'n8n' : 'Python';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all"
      >
        <span className="mr-1">{getBackendLabel(selectedBackend)}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-32 bg-zinc-800 rounded-lg shadow-xl py-1 z-10 border border-zinc-700">
          <button
            onClick={() => handleBackendChange('n8n')}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              selectedBackend === 'n8n' 
                ? 'bg-green-500/20 text-green-400 font-medium' 
                : 'text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            n8n
          </button>
          <button
            onClick={() => handleBackendChange('python')}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              selectedBackend === 'python' 
                ? 'bg-green-500/20 text-green-400 font-medium' 
                : 'text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Python
          </button>
        </div>
      )}
    </div>
  );
}