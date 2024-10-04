import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase'; // Asegúrate de que `firebase.js` esté configurado correctamente

const PrivateRoute = ({ children }) => {
  const [user] = useAuthState(auth);

  return user ? children : <Navigate to="/login" />; // Redirigir al login si no está autenticado
};

export default PrivateRoute;
