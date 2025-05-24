
import React from 'react';
import { ExperienceLevel } from '../types';
import Button from './shared/Button';
import { ArrowLeftIcon, UserCheckIcon } from './shared/Icons'; 

interface ExperienceLevelScreenProps {
  onExperienceSelected: (level: ExperienceLevel) => void;
  onBack: () => void;
}

const ExperienceLevelScreen: React.FC<ExperienceLevelScreenProps> = ({ onExperienceSelected, onBack }) => {
  const levels = [
    { level: ExperienceLevel.Beginner, description: "Nuevo en estos reinos, ansioso por aprender lo básico." },
    { level: ExperienceLevel.Intermediate, description: "Algunas misiones en tu haber, cómodo con los desafíos." },
    { level: ExperienceLevel.Advanced, description: "Un veterano curtido, listo para sagas complejas." },
  ];

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-3xl font-bold text-yellow-300 mb-4 text-center flex items-center justify-center">
        <UserCheckIcon className="w-8 h-8 mr-3 text-yellow-400" />
        Mide tu Experiencia
      </h2>
      <p className="text-slate-300 mb-8 text-lg text-center max-w-xl">
        Valiente aventurero, tus hazañas pasadas (o la ausencia de ellas) en reinos como Dungeons & Dragons definen el camino a seguir. ¿Cuán curtido estás en el arte del rol y la empresa heroica? Tu respuesta ayuda a los espíritus a guiar tu leyenda naciente.
      </p>
      
      <div className="space-y-5 w-full max-w-md">
        {levels.map(({ level, description }) => (
          <Button
            key={level}
            onClick={() => onExperienceSelected(level)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-left p-4 flex flex-col items-start"
            aria-label={`Seleccionar nivel de experiencia: ${level}`}
          >
            <span className="font-semibold text-lg">{level}</span>
            <span className="text-sm text-purple-200 mt-1">{description}</span>
          </Button>
        ))}
      </div>

      <Button 
        onClick={onBack} 
        className="mt-10 bg-slate-600 hover:bg-slate-500 text-white"
        aria-label="Volver a la pantalla de bienvenida"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Volver a Bienvenida
      </Button>
    </div>
  );
};

export default ExperienceLevelScreen;
