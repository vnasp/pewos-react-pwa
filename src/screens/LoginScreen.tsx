import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setError("Revisa tu correo para confirmar tu cuenta");
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-indigo-600">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <img
            src="/assets/icon.png"
            alt="Pewos Agenda"
            className="w-16 h-auto mb-4"
          />
          <h1 className="text-white text-3xl font-bold tracking-wide">
            Pewos Agenda
          </h1>
          <p className="text-white/80 text-center mt-2">
            Gestiona la salud de tus mascotas
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white font-semibold block mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full bg-white px-4 py-4 rounded-xl text-gray-700 text-base border border-gray-300 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-white font-semibold block mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full bg-white px-4 py-4 rounded-xl text-gray-700 text-base border border-gray-300 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && (
            <p className="text-white bg-white/20 rounded-xl px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full bg-orange-500 text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 active:scale-95 transition-transform mt-2"
          >
            {loading
              ? "Cargando..."
              : isSignUp
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="mt-6 text-white/80 text-sm text-center w-full"
        >
          {isSignUp
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Regístrate"}
        </button>
      </div>
    </div>
  );
}
