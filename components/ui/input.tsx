'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    // Estilos base aplicados directamente como CSS inline
    const baseStyles = {
      height: '2.5rem',
      width: '100%',
      borderRadius: '0.375rem',
      borderWidth: '1px',
      borderColor: '#d1d5db', // Gris neutro para el borde
      backgroundColor: '#f9fafb', // Fondo gris muy claro para modo claro
      color: '#111827', // Color de texto oscuro para modo claro
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      outline: 'none',
      ...style
    };

    // Agregar estilo para el modo oscuro si es necesario
    if (typeof document !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (isDarkMode) {
        baseStyles.borderColor = '#374151'; // Borde para modo oscuro
        baseStyles.backgroundColor = '#374151'; // Fondo gris medio para modo oscuro
        baseStyles.color = '#f3f4f6'; // Color de texto claro para modo oscuro
      }
    }

    return (
      <input
        type={type}
        className={cn(
          "placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={baseStyles}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
