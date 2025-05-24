
import React, { useState, useCallback, useEffect } from 'react';
import { Screen, APP_TITLE, ALL_CLASSES_ADVANCED as CLASSES_DATA, ALL_RACES_ADVANCED as RACES_DATA, ALL_BACKGROUNDS_ADVANCED as BACKGROUNDS_DATA, SPELLS_DATA, ITEMS_DATA, XP_THRESHOLDS_PER_LEVEL } from './constants';
import type { Character, ExperienceLevel, AbilityScores, ChampionAbilities, Spell, SpellSlots, PactMagicSlots, BaseClassDetail, BaseBackgroundDetail } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import ExperienceLevelScreen from './components/ExperienceLevelScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import LoadGameScreen from './components/LoadGameScreen';
import GameScreen from './components/GameScreen';
import { saveCharacter as saveCharacterToStorage, loadCharacter as loadCharacterFromStorage, clearCharacter as clearCharacterFromStorage } from './services/localStorageService';
import { calculateAbilityModifier, getCombinedProficiencies, calculateAc } from './utils/characterUtils';
import { manageCharacterSpellcasting } from './utils/spellcastingUtils';


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Welcome);
  const [character, setCharacter] = useState<Character | null>(null);
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let loadedChar = loadCharacterFromStorage();
    if (loadedChar) {
      let charNeedsUpdate = false;

      if (loadedChar.maxHp === undefined || loadedChar.currentHp === undefined || loadedChar.hitDice === undefined) {
          const conMod = calculateAbilityModifier(loadedChar.abilities?.con || 10);
          const classDetails = CLASSES_DATA.find(c => c.name === loadedChar.primaryClass);
          const defaultHitDie = classDetails?.hitDie || 8;
          const defaultMaxHp = defaultHitDie + conMod;
          const defaultLevel = loadedChar.level || 1;
          loadedChar = { ...loadedChar, maxHp: loadedChar.maxHp ?? defaultMaxHp, currentHp: loadedChar.currentHp ?? defaultMaxHp, hitDice: loadedChar.hitDice ?? { total: defaultLevel, current: defaultLevel, dieType: defaultHitDie } };
          charNeedsUpdate = true;
      }

      if (loadedChar.armorClass === undefined || !loadedChar.weaponProficiencies || !loadedChar.armorProficiencies || !loadedChar.savingThrowProficiencies) {
        const raceDetail = RACES_DATA.find(r => r.name === loadedChar.race) || null;
        const primaryClassDetail = CLASSES_DATA.find(c => c.name === loadedChar.primaryClass) || null;
        const secondaryClassDetail = loadedChar.multiclassOption ? CLASSES_DATA.find(c => c.name === loadedChar.multiclassOption) : null; 
        const backgroundDetail = BACKGROUNDS_DATA.find(b => b.name === loadedChar.background) || null;
        const profs = getCombinedProficiencies(raceDetail, primaryClassDetail, secondaryClassDetail, backgroundDetail);
        const ac = calculateAc(loadedChar.abilities, profs.armors, loadedChar.equipment || []);
        loadedChar = { ...loadedChar, armorClass: loadedChar.armorClass ?? ac, weaponProficiencies: loadedChar.weaponProficiencies ?? profs.weapons, armorProficiencies: loadedChar.armorProficiencies ?? profs.armors, savingThrowProficiencies: loadedChar.savingThrowProficiencies ?? profs.savingThrows, skills: loadedChar.skills ?? profs.skills };
        if(!loadedChar.equipment) loadedChar.equipment = [];
        charNeedsUpdate = true;
      }
      
      if (loadedChar.primaryClass === 'Guerrero' && loadedChar.championAbilities === undefined) {
        loadedChar.championAbilities = { secondWindUsed: false, actionSurgeUsed: false }; charNeedsUpdate = true;
      }
      if (loadedChar.gold === undefined) {
        const bg = BACKGROUNDS_DATA.find(b => b.name === loadedChar.background);
        loadedChar.gold = bg?.startingGold || 10; charNeedsUpdate = true;
      }
      if (loadedChar.xp === undefined) { loadedChar.xp = 0; charNeedsUpdate = true; }
      if (loadedChar.feats === undefined) { loadedChar.feats = []; charNeedsUpdate = true; }

      const primaryClassDetails = CLASSES_DATA.find(c => c.name === loadedChar.primaryClass);
      const secondaryClassDetails = loadedChar.multiclassOption ? CLASSES_DATA.find(c => c.name === loadedChar.multiclassOption) : undefined;
      
      let needsSpellcastingInit = false;
      if (primaryClassDetails?.spellcasting && !loadedChar.spellSlots) needsSpellcastingInit = true;
      if (primaryClassDetails?.pactMagic && !loadedChar.pactMagicSlots) needsSpellcastingInit = true;
      if (!loadedChar.knownSpells) needsSpellcastingInit = true;
      if (secondaryClassDetails?.spellcasting && !loadedChar.spellSlots && !primaryClassDetails?.spellcasting) needsSpellcastingInit = true;
      if (secondaryClassDetails?.pactMagic && !loadedChar.pactMagicSlots && !primaryClassDetails?.pactMagic) needsSpellcastingInit = true;


      if (needsSpellcastingInit && primaryClassDetails) { // Ensure primaryClassDetails exists
        const spellcastingUpdates = manageCharacterSpellcasting(loadedChar, primaryClassDetails, secondaryClassDetails, loadedChar.level);
        loadedChar = { ...loadedChar, ...spellcastingUpdates };
        charNeedsUpdate = true;
      }

      setCharacter(loadedChar);
      if (charNeedsUpdate) saveCharacterToStorage(loadedChar); 
    }
    setIsLoading(false);
  }, []);

  const navigateTo = useCallback((screen: Screen) => setCurrentScreen(screen), []);

  const updateCharacterStats = useCallback((updatedStats: Partial<Character>) => {
    setCharacter(prevCharacter => {
      if (!prevCharacter) return null;
      let newCharacterState = { ...prevCharacter, ...updatedStats };
      
      const primaryClassDetails = CLASSES_DATA.find(c => c.name === newCharacterState.primaryClass);
      const secondaryClassDetails = newCharacterState.multiclassOption ? CLASSES_DATA.find(c => c.name === newCharacterState.multiclassOption) : undefined;

      let reinitializeSpells = false;
      // Check if level changed
      if (updatedStats.level && updatedStats.level !== prevCharacter.level) {
          reinitializeSpells = true;
      }
      // Check if relevant ability scores changed (those affecting spellcasting ability or spells known for a class)
      if (updatedStats.abilities && primaryClassDetails?.spellcasting?.spellAbility) {
          const spellAbility = primaryClassDetails.spellcasting.spellAbility;
          if (updatedStats.abilities[spellAbility] !== undefined && updatedStats.abilities[spellAbility] !== prevCharacter.abilities[spellAbility]) {
              reinitializeSpells = true;
          }
      }
      // Add similar check for secondary class if it's a caster and its spellcasting ability changed
      if (updatedStats.abilities && secondaryClassDetails?.spellcasting?.spellAbility && newCharacterState.multiclassOption) {
          const spellAbilitySec = secondaryClassDetails.spellcasting.spellAbility;
          if (updatedStats.abilities[spellAbilitySec] !== undefined && updatedStats.abilities[spellAbilitySec] !== prevCharacter.abilities[spellAbilitySec]) {
              reinitializeSpells = true;
          }
      }
       if (updatedStats.abilities && primaryClassDetails?.pactMagic?.spellAbility) { // Warlock primary
          const spellAbility = primaryClassDetails.pactMagic.spellAbility;
          if (updatedStats.abilities[spellAbility] !== undefined && updatedStats.abilities[spellAbility] !== prevCharacter.abilities[spellAbility]) {
              reinitializeSpells = true;
          }
      }
      if (updatedStats.abilities && secondaryClassDetails?.pactMagic?.spellAbility && newCharacterState.multiclassOption) { // Warlock secondary
          const spellAbilitySec = secondaryClassDetails.pactMagic.spellAbility;
          if (updatedStats.abilities[spellAbilitySec] !== undefined && updatedStats.abilities[spellAbilitySec] !== prevCharacter.abilities[spellAbilitySec]) {
              reinitializeSpells = true;
          }
      }


      if (reinitializeSpells && primaryClassDetails) {
          const spellUpdates = manageCharacterSpellcasting(newCharacterState, primaryClassDetails, secondaryClassDetails, newCharacterState.level);
          newCharacterState = {...newCharacterState, ...spellUpdates};
      }
      
      if (updatedStats.abilities || updatedStats.equipment || updatedStats.armorProficiencies) {
         newCharacterState.armorClass = calculateAc(newCharacterState.abilities, newCharacterState.armorProficiencies, newCharacterState.equipment);
       }

      saveCharacterToStorage(newCharacterState);
      return newCharacterState;
    });
  }, []);

  const handleStartNewAdventure = useCallback(() => {
    setCharacter(null); setSelectedExperienceLevel(null); clearCharacterFromStorage(); navigateTo(Screen.ExperienceLevel);
  }, [navigateTo]);

  const handleExperienceSelected = useCallback((level: ExperienceLevel) => {
    setSelectedExperienceLevel(level); navigateTo(Screen.CharacterCreation);
  }, [navigateTo]);

  const handleContinueAdventure = useCallback(() => navigateTo(Screen.LoadGame), [navigateTo]);

  const handleCharacterCreated = useCallback((newCharacterData: Omit<Character, 'id' | 'experienceLevel'>) => {
    if (!selectedExperienceLevel) { console.error("Nivel de experiencia no seleccionado."); navigateTo(Screen.ExperienceLevel); return; }
    
    const primaryClassDetails = CLASSES_DATA.find(c => c.name === newCharacterData.primaryClass);
    const secondaryClassDetails = newCharacterData.multiclassOption ? CLASSES_DATA.find(c => c.name === newCharacterData.multiclassOption) : undefined;
    
    let characterWithSpells = { ...newCharacterData };
    if (primaryClassDetails) {
        const spellUpdates = manageCharacterSpellcasting(characterWithSpells, primaryClassDetails, secondaryClassDetails, newCharacterData.level);
        characterWithSpells = { ...characterWithSpells, ...spellUpdates };
    }

    const newCharacter: Character = {
        ...characterWithSpells,
        id: Date.now().toString(),
        experienceLevel: selectedExperienceLevel,
        feats: newCharacterData.feats || []
    } as Character; // Cast because characterWithSpells is partial until spells are added

    setCharacter(newCharacter);
    saveCharacterToStorage(newCharacter);
    navigateTo(Screen.Game);
  }, [navigateTo, selectedExperienceLevel]);

  const handleCharacterLoaded = useCallback((loadedChar: Character) => {
    let charToLoad = {...loadedChar};
    let charNeedsUpdateOnLoad = false;

     if (charToLoad.armorClass === undefined || !charToLoad.weaponProficiencies) {
        const raceDetail = RACES_DATA.find(r => r.name === charToLoad.race) || null;
        const primaryClassDetail = CLASSES_DATA.find(c => c.name === charToLoad.primaryClass) || null;
        const secondaryClassDetail = charToLoad.multiclassOption ? CLASSES_DATA.find(c => c.name === charToLoad.multiclassOption) : null;
        const backgroundDetail = BACKGROUNDS_DATA.find(b => b.name === charToLoad.background) || null;
        const profs = getCombinedProficiencies(raceDetail, primaryClassDetail, secondaryClassDetail, backgroundDetail);
        const ac = calculateAc(charToLoad.abilities, profs.armors, charToLoad.equipment || []);
        charToLoad = { ...charToLoad, armorClass: charToLoad.armorClass ?? ac, weaponProficiencies: charToLoad.weaponProficiencies ?? profs.weapons, armorProficiencies: charToLoad.armorProficiencies ?? profs.armors, savingThrowProficiencies: charToLoad.savingThrowProficiencies ?? profs.savingThrows, skills: charToLoad.skills ?? profs.skills };
        if(!charToLoad.equipment) charToLoad.equipment = [];
        charNeedsUpdateOnLoad = true;
    }
    const primaryClassDetailsLoad = CLASSES_DATA.find(c => c.name === charToLoad.primaryClass);
    const secondaryClassDetailsLoad = charToLoad.multiclassOption ? CLASSES_DATA.find(c => c.name === charToLoad.multiclassOption) : undefined;
    
    let needsSpellcastingMigrationOnLoad = false;
      if (primaryClassDetailsLoad?.spellcasting && !charToLoad.spellSlots) needsSpellcastingMigrationOnLoad = true;
      if (primaryClassDetailsLoad?.pactMagic && !charToLoad.pactMagicSlots) needsSpellcastingMigrationOnLoad = true;
      if (!charToLoad.knownSpells) needsSpellcastingMigrationOnLoad = true;
      if (secondaryClassDetailsLoad?.spellcasting && !charToLoad.spellSlots && !primaryClassDetailsLoad?.spellcasting) needsSpellcastingMigrationOnLoad = true;
      if (secondaryClassDetailsLoad?.pactMagic && !charToLoad.pactMagicSlots && !primaryClassDetailsLoad?.pactMagic) needsSpellcastingMigrationOnLoad = true;

    if (needsSpellcastingMigrationOnLoad && primaryClassDetailsLoad) { // Ensure primaryClassDetailsLoad exists
        const spellUpdates = manageCharacterSpellcasting(charToLoad, primaryClassDetailsLoad, secondaryClassDetailsLoad, charToLoad.level);
        charToLoad = { ...charToLoad, ...spellUpdates };
        charNeedsUpdateOnLoad = true;
    }
    if(charNeedsUpdateOnLoad) saveCharacterToStorage(charToLoad); 
    setCharacter(charToLoad); setSelectedExperienceLevel(charToLoad.experienceLevel); navigateTo(Screen.Game);
  }, [navigateTo]);

  const handleReturnToWelcome = useCallback(() => { setSelectedExperienceLevel(null); navigateTo(Screen.Welcome); }, [navigateTo]);
  const handleExitGame = useCallback(() => navigateTo(Screen.Welcome), [navigateTo]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><p className="text-xl text-yellow-300">Cargando tu destino...</p></div>;

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.Welcome: return <WelcomeScreen onStartNewAdventure={handleStartNewAdventure} onContinueAdventure={handleContinueAdventure} hasSavedCharacter={!!loadCharacterFromStorage()} />;
      case Screen.ExperienceLevel: return <ExperienceLevelScreen onExperienceSelected={handleExperienceSelected} onBack={handleReturnToWelcome} />;
      case Screen.CharacterCreation:
        if (!selectedExperienceLevel) { handleReturnToWelcome(); return <p>Redirigiendo...</p>; }
        return <CharacterCreationScreen onCharacterCreated={handleCharacterCreated} onBack={() => navigateTo(Screen.ExperienceLevel)} experienceLevel={selectedExperienceLevel} />;
      case Screen.LoadGame: return <LoadGameScreen onCharacterLoaded={handleCharacterLoaded} onBack={handleReturnToWelcome} />;
      case Screen.Game:
        if (!character) { handleReturnToWelcome(); return null; }
        return <GameScreen character={character} onExitGame={handleExitGame} updateCharacterStats={updateCharacterStats} />;
      default: return <p>Pantalla desconocida</p>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
      <header className="mb-8 text-center"><h1 className="text-5xl font-bold text-yellow-400 tracking-wider" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>{APP_TITLE}</h1></header>
      <main className="w-full max-w-2xl bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8 border border-slate-700">{renderScreen()}</main>
      <footer className="mt-8 text-center text-sm text-slate-500"><p>&copy; {new Date().getFullYear()} Tu Mazmorra Digital.</p></footer>
    </div>
  );
};
export default App;
