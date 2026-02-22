import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PasswordStrengthIndicator, {
  isPasswordStrong,
} from "../components/PasswordStrengthIndicator";

type Mode = "login" | "register";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signIn, signUp } = useAuth();

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "register" && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (mode === "register" && !isPasswordStrong(password)) {
      setError("La contraseña no cumple los requisitos de seguridad");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await signUp(email, password);
        setSuccess("¡Cuenta creada! Revisá tu correo para confirmarla.");
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message ?? "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen flex flex-col bg-indigo-600">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/assets/icon.webp"
            alt="Pewos"
            className="w-16 h-auto mb-4"
            fetchPriority="high"
          />
          <h1 className="text-white text-3xl font-bold tracking-wide">Pewos</h1>
          <p className="text-white/70 text-sm text-center mt-1">
            Gestiona la salud de tus mascotas
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-indigo-700/60 rounded-2xl p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isLogin ? "bg-white text-indigo-700" : "text-white/70"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              !isLogin ? "bg-white text-indigo-700" : "text-white/70"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/90 text-sm font-semibold block mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full bg-white px-4 py-3.5 rounded-xl text-gray-700 text-base outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-white/90 text-sm font-semibold block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full bg-white px-4 py-3.5 pr-12 rounded-xl text-gray-700 text-base outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!isLogin && <PasswordStrengthIndicator password={password} />}
          </div>

          {!isLogin && (
            <div>
              <label className="text-white/90 text-sm font-semibold block mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-white px-4 py-3.5 pr-12 rounded-xl text-gray-700 text-base outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-white bg-red-500/40 rounded-xl px-4 py-3 text-sm">
              {error}
            </p>
          )}
          {success && (
            <p className="text-white bg-green-500/40 rounded-xl px-4 py-3 text-sm">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 active:scale-95 transition-transform mt-2"
          >
            {loading
              ? "Cargando..."
              : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
