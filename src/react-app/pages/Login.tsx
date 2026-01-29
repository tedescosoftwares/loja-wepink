import { useAuth } from "@getmocha/users-service/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LogIn, ArrowLeft } from "lucide-react";

export default function Login() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🥤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Distribuidora AmBev Admin</h1>
          <p className="text-gray-600">Acesse o painel administrativo</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={redirectToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <LogIn className="w-5 h-5" />
            Entrar com Google
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-gray-600 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar à Loja
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Apenas administradores autorizados podem acessar esta área
          </p>
        </div>
      </div>
    </div>
  );
}
