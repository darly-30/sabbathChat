import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: 'Crear Cuenta',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}