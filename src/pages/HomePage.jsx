import { ArrowRightIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { Link } from 'react-router-dom';



const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(99vh-4rem)] bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Bienvenido al Diagramador de Clase UML</h1>
    <p className="mb-6 text-lg">Crea y gestiona tus diagramas de clases UML fácilmente.</p>
    <Link 
  to="/board" 
  className="flex items-center justify-center px-10 py-6 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
>
  Empezar
  <ArrowRightIcon className="h-5 w-5 ml-3" />
</Link>

    </div>
  );
};

export default HomePage;
