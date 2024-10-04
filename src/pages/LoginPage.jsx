import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  // State para usuario y contraseña
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(null); // Para manejar errores
  const navigate = useNavigate(); // Para redirigir después del login exitoso
  const auth = getAuth(); // Inicializar la autenticación de Firebase

  // Función para manejar el login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Autenticar al usuario con Firebase
      await signInWithEmailAndPassword(auth, user, pass);
      navigate('/'); // Redirigir al home o tablero después del login exitoso
    } catch (err) {
      setError('Error al iniciar sesión: ' + err.message); // Manejar errores
    }
  };

  return (
    <>
      <div className="text-center mt-24">
        <div className="flex items-center justify-center">
          <svg fill="none" viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-4xl tracking-tight">Iniciar Sesión</h2>
        <span className="text-sm">
          or <a href="/register" className="text-blue-500">Registrate</a>
        </span>
      </div>
      <div className="flex justify-center my-2 mx-4 md:mx-0">
        <form className="w-full max-w-xl bg-white rounded-lg p-6" onSubmit={handleLogin}>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-full px-3 mb-6">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="email">Email address</label>
              <input
                className="appearance-none block w-full bg-white text-gray-900 font-medium border border-gray-400 rounded-lg py-3 px-3 leading-tight focus:outline-none"
                type="email"
                required
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>
            <div className="w-full md:w-full px-3 mb-6">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="password">Password</label>
              <input
                className="appearance-none block w-full bg-white text-gray-900 font-medium border border-gray-400 rounded-lg py-3 px-3 leading-tight focus:outline-none"
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
            <div className="w-full flex items-center justify-between px-3 mb-3">
              <label htmlFor="remember" className="flex items-center w-1/2">
                <input type="checkbox" name="remember" className="mr-1 bg-white" />
                <span className="text-sm text-gray-700 pt-1">Remember Me</span>
              </label>
              <div className="w-1/2 text-right">
                <a href="#" className="text-blue-500 text-sm tracking-tight">Forget your password?</a>
              </div>
            </div>
            {error && <p className="text-red-500 text-center w-full">{error}</p>}
            <div className="w-full md:w-full px-3 mb-6">
              <button className="appearance-none block w-full bg-blue-600 text-gray-100 font-bold border border-gray-200 rounded-lg py-3 px-3 leading-tight hover:bg-blue-500 focus:outline-none focus:bg-white focus:border-gray-500">
                Sign in
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginPage;
