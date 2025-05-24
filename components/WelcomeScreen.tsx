
import React from 'react';
import { DungeonMasterIcon, ScrollIcon, SwordIcon, OpenBookIcon } from './shared/Icons';
import Button from './shared/Button';

interface WelcomeScreenProps {
  onStartNewAdventure: () => void;
  onContinueAdventure: () => void;
  hasSavedCharacter: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartNewAdventure, onContinueAdventure, hasSavedCharacter }) => {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg">
      <DungeonMasterIcon className="w-24 h-24 text-yellow-400 mb-6" />
      
      <h2 className="text-3xl font-bold text-yellow-300 mb-4" style={{ fontFamily: "'MedievalSharp', cursive" }}>
        ¡El Maestro de Mazmorras Digital te Espera!
      </h2>
      
      <div className="bg-slate-700 p-6 rounded-md shadow-inner mb-8 max-w-xl text-left">
        <p className="text-lg text-slate-200 mb-4 leading-relaxed">
          ¡Escucha, viajero! Ante ti yacen caminos ignotos, aventuras aún por escribir en el éter digital. Soy tu guía, tu narrador, tu Maestro de Mazmorras en este reino de píxeles y posibilidades.
        </p>
        <p className="text-lg text-slate-200 leading-relaxed">
          ¿Forjarás una nueva leyenda desde el tejido mismo de la creación, o retomarás los hilos de una historia ya comenzada?
        </p>
      </div>

      <div className="space-y-5 w-full max-w-sm">
        <Button 
          onClick={onStartNewAdventure}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          aria-label="Iniciar una nueva aventura y crear un personaje"
        >
          <SwordIcon className="w-5 h-5 mr-2" />
          Iniciar Nueva Aventura
        </Button>
        
        <Button 
          onClick={onContinueAdventure}
          disabled={!hasSavedCharacter}
          className={`w-full ${hasSavedCharacter ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 cursor-not-allowed'} text-white`}
          aria-label={hasSavedCharacter ? "Continuar tu aventura guardada" : "No se encontró una aventura guardada"}
        >
          <OpenBookIcon className="w-5 h-5 mr-2" />
          Continuar Aventura
        </Button>
        {!hasSavedCharacter && (
          <p className="text-sm text-slate-400 mt-2">No se encontró una aventura guardada. ¡Empieza una nueva!</p>
        )}
      </div>
      
      <div className="mt-10 text-slate-400 flex items-center">
        <ScrollIcon className="w-6 h-6 mr-2 text-yellow-500" />
        <p className="text-sm">Tus elecciones moldean la historia...</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
