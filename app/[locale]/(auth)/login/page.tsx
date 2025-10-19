import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: 'Iniciar Sesión',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}