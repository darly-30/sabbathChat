"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    if (formData.password.length < 7) {
      setError("La contraseña debe tener al menos 7 caracteres");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar");
      }

      // Iniciar sesión automáticamente después del registro
      const locale = getCurrentLocale();
      await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl: `/${locale}/chat`,
      });
      
    } catch (error: any) {
      setError(error.message || "Error al registrar el usuario");
      console.error("Error en registro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener la localización actual de la URL
  const getCurrentLocale = () => {
    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split('/');
      // El primer segmento después de la barra debe ser el locale
      if (pathSegments.length > 1 && pathSegments[1]) {
        return pathSegments[1]; // Por ejemplo, "es-ES", "en-US", etc.
      }
    }
    return "es-ES"; // Locale por defecto si no se puede determinar
  };
  
  const handleGoogleLogin = () => {
    const locale = getCurrentLocale();
    signIn("google", { callbackUrl: `/${locale}/chat` });
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Regístrate para comenzar a usar la aplicación
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-white bg-red-500 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="!border-gray-300 !dark:border-gray-600 !border-opacity-100 bg-white dark:bg-gray-800 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="Tu nombre"
            style={{ borderColor: 'rgb(209 213 219)' }}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="!border-gray-300 !dark:border-gray-600 !border-opacity-100 bg-white dark:bg-gray-800 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="tu@email.com"
            style={{ borderColor: 'rgb(209 213 219)' }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="!border-gray-300 !dark:border-gray-600 !border-opacity-100 bg-white dark:bg-gray-800 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="********"
            style={{ borderColor: 'rgb(209 213 219)' }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmar Contraseña
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="!border-gray-300 !dark:border-gray-600 !border-opacity-100 bg-white dark:bg-gray-800 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="********"
            style={{ borderColor: 'rgb(209 213 219)' }}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">O regístrate con</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-700 dark:text-gray-300">
          ¿Ya tienes una cuenta?{" "}
          <a href={`/${getCurrentLocale()}/login`} className="text-blue-500 hover:underline font-medium">
            Iniciar Sesión
          </a>
        </p>
      </div>
    </div>
  );
}