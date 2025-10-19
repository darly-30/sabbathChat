import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: 'Crear Cuenta',
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <RegisterForm />
      </div>
    </div>
  );
}