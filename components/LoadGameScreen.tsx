

import React, { useState, useEffect } from 'react';
import type { Character } from '../types';
import Button from './shared/Button';
import { loadCharacter as loadCharacterFromStorage } from '../services/localStorageService';
import { FolderOpenIcon, ArrowLeftIcon, UserCircleIcon } from './shared/Icons';


interface LoadGameScreenProps {
  onCharacterLoaded: (character: Character) => void;
  onBack: () => void;
}

const LoadGameScreen: React.FC<LoadGameScreenProps> = ({ onCharacterLoaded, onBack }) => {
  const [savedCharacter, setSavedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const char = loadCharacterFromStorage();
      setSavedCharacter(char);
    } catch (err) {
      console.error("Error cargando personaje:", err);
      setError("Fallo al cargar el personaje guardado. ¡Los antiguos pergaminos podrían estar corruptos!");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadCharacter = () => {
    if (savedCharacter) {
      onCharacterLoaded(savedCharacter);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <p className="text-xl text-yellow-300">Buscando tu leyenda en los archivos...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="text-center p-4">
        <p className="text-xl text-red-400 mb-4">{error}</p>
        <Button onClick={onBack} className="bg-slate-600 hover:bg-slate-500 text-white">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver a un Lugar Seguro
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-3xl font-bold text-yellow-300 mb-6 flex items-center">
        <FolderOpenIcon className="w-8 h-8 mr-3 text-yellow-400" />
        Continúa Tu Saga
      </h2>
      
      {savedCharacter ? (
        <div className="w-full max-w-md bg-slate-700 p-8 rounded-lg shadow-md text-center">
          <UserCircleIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-xl text-slate-200 mb-2">¡Bienvenido de nuevo, <span className="font-semibold text-yellow-300">{savedCharacter.name}</span>!</p>
          {/* FIX: Use primaryClass instead of class */}
          <p className="text-md text-slate-300 mb-6">Tu viaje como <span className="font-medium text-purple-300">{savedCharacter.primaryClass}</span> ({savedCharacter.experienceLevel}) te espera.</p>
          <Button onClick={handleLoadCharacter} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Cargar Aventura
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-slate-700 p-8 rounded-lg shadow-md text-center">
          <p className="text-xl text-slate-300 mb-6">No se encontró ninguna aventura guardada en los archivos.</p>
          <p className="text-sm text-slate-400 mb-6">¿Quizás te gustaría comenzar una nueva leyenda?</p>
        </div>
      )}
      
      <Button onClick={onBack} className="mt-8 bg-slate-600 hover:bg-slate-500 text-white">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Volver a Bienvenida
      </Button>
    </div>
  );
};

export default LoadGameScreen;