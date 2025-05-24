
import React, { useState, useCallback, useEffect } from 'react';
import { Screen, APP_TITLE, ALL_CLASSES_ADVANCED as CLASSES_DATA, ALL_RACES_ADVANCED as RACES_DATA, ALL_BACKGROUNDS_ADVANCED as BACKGROUNDS_DATA, SPELLS_DATA, ITEMS_DATA, XP_THRESHOLDS_PER_LEVEL } from './constants'; // Renombrar para evitar conflicto
import type { Character, ExperienceLevel, AbilityScores, ChampionAbilities, Spell, SpellSlots, PactMagicSlots, BaseClassDetail, BaseBackgroundDetail } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import ExperienceLevelScreen from './components/ExperienceLevelScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import LoadGameScreen from './components/LoadGameScreen';
import GameScreen from './components/GameScreen';
import { saveCharacter as saveCharacterToStorage, loadCharacter as loadCharacterFromStorage, clearCharacter as clearCharacterFromStorage } from './services/localStorageService';
import { calculateAbilityModifier, getCombinedProficiencies, calculateAc, getProficiencyBonus } from './utils/characterUtils';

export const initializeSpellcastingForCharacterUpdate = ( 
    loadedChar: Character, // Use a more generic name as it's used for new chars too
    primaryClassDetails: BaseClassDetail | undefined,
    secondaryClassDetails: BaseClassDetail | undefined
  ): Pick<Character, 'knownSpells' | 'spellSlots' | 'pactMagicSlots'> => {
    let charToUpdate = { ...loadedChar }; // Work on a copy
    let knownSpellsList: Spell[] = charToUpdate.knownSpells ? [...charToUpdate.knownSpells] : [];
    let spellSlotsToUpdate: SpellSlots | undefined = charToUpdate.spellSlots ? JSON.parse(JSON.stringify(charToUpdate.spellSlots)) : undefined;
    let pactMagicSlotsToUpdate: PactMagicSlots | undefined = charToUpdate.pactMagicSlots ? JSON.parse(JSON.stringify(charToUpdate.pactMagicSlots)) : undefined;

    const totalLevel = charToUpdate.level;
    let primaryClassLevel = totalLevel;
    let secondaryClassLevel = 0;

    if (secondaryClassDetails && primaryClassDetails && charToUpdate.multiclassOption === secondaryClassDetails.name) {
      // This logic assumes leveling up one class at a time in a multiclass scenario.
      // For simplicity, let's assume level distribution is roughly even or based on a fixed split for initial creation.
      // A more robust system would track individual class levels.
      // For now, if totalLevel is 2 and multiclass, assume 1 level in each. If > 2, it's more complex.
      // We'll simplify: if multiclass option exists, primary gets char.level-1 (min 1), secondary gets 1.
      // This is a simplification. Real D&D multiclassing requires tracking levels per class.
      if (totalLevel > 1) {
        primaryClassLevel = totalLevel -1;
        secondaryClassLevel = 1; 
      } else { // totalLevel is 1, cannot be multiclass effectively yet.
        primaryClassLevel = 1;
        secondaryClassLevel = 0;
      }
    }


    if (primaryClassDetails?.spellcasting) {
      const scDef = primaryClassDetails.spellcasting;
      if (!spellSlotsToUpdate) spellSlotsToUpdate = {};

      const progressionIndex = primaryClassLevel > 0 ? primaryClassLevel -1 : 0;

      if(scDef.slotProgressionTable && progressionIndex < scDef.slotProgressionTable.length && scDef.slotProgressionTable[progressionIndex]) {
        scDef.slotProgressionTable[progressionIndex].forEach((numSlots, slotLvlIndex) => {
          if (numSlots > 0) {
            const key = `level${slotLvlIndex + 1}` as keyof SpellSlots;
            spellSlotsToUpdate![key] = { max: numSlots, current: numSlots };
          }
        });
      }
      // Simplified spell learning
      if (scDef.spellList && scDef.knownSpells) {
        const numKnown = typeof scDef.knownSpells === 'function' ? scDef.knownSpells(primaryClassLevel, calculateAbilityModifier(charToUpdate.abilities[scDef.spellAbility])) : scDef.knownSpells;
        scDef.spellList.slice(0, numKnown).forEach(spellName => {
          if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) {
            knownSpellsList.push(SPELLS_DATA[spellName]);
          }
        });
      }
      if (scDef.spellList && scDef.knownCantrips) {
         const numKnownCantrips = typeof scDef.knownCantrips === 'function' ? scDef.knownCantrips(primaryClassLevel) : scDef.knownCantrips;
         scDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, numKnownCantrips).forEach(spellName => {
           if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
         });
      }
    } else if (primaryClassDetails?.pactMagic) {
      const pmDef = primaryClassDetails.pactMagic;
      pactMagicSlotsToUpdate = {
        level: pmDef.slotLevelAtLevel(primaryClassLevel),
        max: pmDef.slotsAtLevel(primaryClassLevel),
        current: pmDef.slotsAtLevel(primaryClassLevel),
      };
       if (pmDef.spellList) {
         const cantripsToLearn = pmDef.knownCantripsAtLevel(primaryClassLevel);
         pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, cantripsToLearn).forEach(spellName => {
           if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
         });
         const spellsToLearn = pmDef.knownSpellsAtLevel(primaryClassLevel);
         pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0).slice(0, spellsToLearn).forEach(spellName => {
            if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
         });
       }
    }

    // Secondary Class Spellcasting (Additive for spell slots, careful with pact magic)
    if (secondaryClassDetails && secondaryClassLevel > 0) {
       if (secondaryClassDetails.spellcasting) {
            const scDef = secondaryClassDetails.spellcasting;
            if (!spellSlotsToUpdate) spellSlotsToUpdate = {};
            const progressionIndexSec = secondaryClassLevel > 0 ? secondaryClassLevel - 1 : 0; 
            
            if(scDef.slotProgressionTable && progressionIndexSec < scDef.slotProgressionTable.length && scDef.slotProgressionTable[progressionIndexSec]) {
                scDef.slotProgressionTable[progressionIndexSec].forEach((numSlots, slotLvlIndex) => {
                if (numSlots > 0) {
                    const key = `level${slotLvlIndex + 1}` as keyof SpellSlots;
                    if (!spellSlotsToUpdate![key]) spellSlotsToUpdate![key] = { max: 0, current: 0};
                    // D&D 5e multiclass spell slots are more complex, this is a simplified sum.
                    // For casters like Paladin/Ranger, their effective caster level is halved.
                    // True calculation: sum effective caster levels, then look up on a combined table.
                    // This simplified sum is okay for very low levels (1+1).
                    spellSlotsToUpdate![key]!.max += numSlots; 
                    spellSlotsToUpdate![key]!.current += numSlots; 
                }
                });
            }
            if (scDef.spellList && scDef.knownSpells) {
                const numKnown = typeof scDef.knownSpells === 'function' ? scDef.knownSpells(secondaryClassLevel, calculateAbilityModifier(charToUpdate.abilities[scDef.spellAbility])) : scDef.knownSpells;
                 scDef.spellList.slice(0, numKnown).forEach(spellName => {
                    if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) {
                        knownSpellsList.push(SPELLS_DATA[spellName]);
                    }
                });
            }
             if (scDef.spellList && scDef.knownCantrips) {
                 const numKnownCantrips = typeof scDef.knownCantrips === 'function' ? scDef.knownCantrips(secondaryClassLevel) : scDef.knownCantrips;
                 scDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, numKnownCantrips).forEach(spellName => {
                   if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
                 });
            }
        } else if (secondaryClassDetails.pactMagic) {
            // Generally, you don't combine Pact Magic slots with other spell slots in the same way.
            // If primary was not Pact Magic, then secondary Pact Magic is separate.
            if (!primaryClassDetails?.pactMagic) { 
                const pmDef = secondaryClassDetails.pactMagic;
                pactMagicSlotsToUpdate = { 
                    level: pmDef.slotLevelAtLevel(secondaryClassLevel),
                    max: pmDef.slotsAtLevel(secondaryClassLevel),
                    current: pmDef.slotsAtLevel(secondaryClassLevel),
                };
                 if (pmDef.spellList) {
                     const cantripsToLearn = pmDef.knownCantripsAtLevel(secondaryClassLevel);
                     pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, cantripsToLearn).forEach(spellName => {
                       if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
                     });
                     const spellsToLearn = pmDef.knownSpellsAtLevel(secondaryClassLevel);
                     pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0).slice(0, spellsToLearn).forEach(spellName => {
                       if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
                     });
                }
            } // If both are Pact Magic, it doesn't stack levels/slots directly either, this would need more specific D&D rule implementation.
        }
    }
    
    return {
        knownSpells: knownSpellsList.sort((a,b) => a.level - b.level || a.name.localeCompare(b.name)),
        spellSlots: spellSlotsToUpdate,
        pactMagicSlots: pactMagicSlotsToUpdate,
    };
}


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
        // AC calculation needs equipment. Default to empty array if not present for migration.
        const ac = calculateAc(loadedChar.abilities, profs.armors, loadedChar.equipment || []);
        loadedChar = { ...loadedChar, armorClass: loadedChar.armorClass ?? ac, weaponProficiencies: loadedChar.weaponProficiencies ?? profs.weapons, armorProficiencies: loadedChar.armorProficiencies ?? profs.armors, savingThrowProficiencies: loadedChar.savingThrowProficiencies ?? profs.savingThrows, skills: loadedChar.skills ?? profs.skills };
        if(!loadedChar.equipment) loadedChar.equipment = []; // Ensure equipment array exists
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
      // Check if spellcasting for secondary class is missing
      if (secondaryClassDetails?.spellcasting && !loadedChar.spellSlots && !primaryClassDetails?.spellcasting) needsSpellcastingInit = true;
      if (secondaryClassDetails?.pactMagic && !loadedChar.pactMagicSlots && !primaryClassDetails?.pactMagic) needsSpellcastingInit = true;


      if (needsSpellcastingInit) {
        const spellcastingUpdates = initializeSpellcastingForCharacterUpdate(loadedChar, primaryClassDetails, secondaryClassDetails);
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
      
      // If level changed, re-initialize spellcasting based on the new level and existing classes
      if (updatedStats.level && updatedStats.level !== prevCharacter.level) {
        const primaryClassDetails = CLASSES_DATA.find(c => c.name === newCharacterState.primaryClass);
        const secondaryClassDetails = newCharacterState.multiclassOption ? CLASSES_DATA.find(c => c.name === newCharacterState.multiclassOption) : undefined;
        const spellUpdates = initializeSpellcastingForCharacterUpdate(newCharacterState, primaryClassDetails, secondaryClassDetails);
        newCharacterState = {...newCharacterState, ...spellUpdates};
      }
      
      // Always recalculate AC if abilities or equipment could have changed
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
    const newCharacter: Character = { ...newCharacterData, id: Date.now().toString(), experienceLevel: selectedExperienceLevel, feats: newCharacterData.feats || [] };
    setCharacter(newCharacter); saveCharacterToStorage(newCharacter); navigateTo(Screen.Game);
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

    if (needsSpellcastingMigrationOnLoad) {
        const spellUpdates = initializeSpellcastingForCharacterUpdate(charToLoad, primaryClassDetailsLoad, secondaryClassDetailsLoad);
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
