export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">
          Finance Automation
        </h1>
        <p className="text-center text-gray-600 mb-4">
          Connectez-vous avec votre compte Microsoft
        </p>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Se connecter avec Microsoft
        </button>
      </div>
    </div>
  );
};
