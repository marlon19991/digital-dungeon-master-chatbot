


import React, { useState, useEffect, useCallback } from 'react';
import { ExperienceLevel, type Character, type AbilityScores, type AbilityKey, BaseRaceDetail, BaseClassDetail, BaseBackgroundDetail, HitDice, ChampionAbilities, Spell, SpellSlots, PactMagicSlots } from '../types';
import Button from './shared/Button';
// FIX: Import newly added CheckCircleIcon, RefreshIcon, ChevronDownIcon, ChevronUpIcon
import { UserPlusIcon, ArrowLeftIcon, SparklesIcon, CheckCircleIcon, RefreshIcon, ChevronDownIcon, ChevronUpIcon } from './shared/Icons';
import { geminiService } from '../services/geminiService';
import { STANDARD_ABILITY_SCORES, ABILITIES, ALL_RACES_ADVANCED, ALL_CLASSES_ADVANCED, ALL_BACKGROUNDS_ADVANCED, MAX_ABILITY_REROLLS, MULTICLASS_REQUIREMENTS, getAverageHitDieValue, SPELLS_DATA, ITEMS_DATA } from '../constants';
import { calculateAbilityModifier, getCombinedProficiencies, calculateAc, getProficiencyBonus } from '../utils/characterUtils'; 

interface CharacterCreationScreenProps {
  onCharacterCreated: (characterData: Omit<Character, 'id' | 'experienceLevel'>) => void;
  onBack: () => void;
  experienceLevel: ExperienceLevel;
}

type BeginnerStep = 'race' | 'class' | 'abilityScores' | 'nameAndSummary';
type AdvancedStep = 'race' | 'primaryClass' | 'multiclassDecision' | 'multiclassSelection' | 'abilityRolls' | 'abilityAssignment' | 'background' | 'nameAndSummary';

const roll4d6DropLowest = (): number => {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  rolls.shift();
  return rolls.reduce((sum, roll) => sum + roll, 0);
};


const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCharacterCreated, onBack, experienceLevel }) => {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [characterClass, setCharacterClass] = useState<string>(ALL_CLASSES_ADVANCED[0]?.name || 'Guerrero');
  const [generatedSuggestion, setGeneratedSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(experienceLevel === ExperienceLevel.Intermediate);
  const availableClasses = ALL_CLASSES_ADVANCED.map(c => c.name);

  const [beginnerStep, setBeginnerStep] = useState<BeginnerStep>('race');
  const [beginnerCharName, setBeginnerCharName] = useState<string>('');
  const [abilityAssignments, setAbilityAssignments] = useState<Record<AbilityKey, number | undefined>>(
    ABILITIES.reduce((acc, curr) => ({ ...acc, [curr.key]: undefined }), {} as Record<AbilityKey, number | undefined>)
  );
  const [beginnerSummary, setBeginnerSummary] = useState<Omit<Character, 'id' | 'experienceLevel'> | null>(null);

  const [advancedStep, setAdvancedStep] = useState<AdvancedStep>('race');
  const [advancedCharName, setAdvancedCharName] = useState<string>('');
  const [selectedRace, setSelectedRace] = useState<BaseRaceDetail | null>(null);
  const [selectedPrimaryClass, setSelectedPrimaryClass] = useState<BaseClassDetail | null>(null);
  const [wantsMulticlass, setWantsMulticlass] = useState<boolean>(false);
  const [selectedSecondaryClass, setSelectedSecondaryClass] = useState<BaseClassDetail | null>(null);
  const [rolledAbilityScores, setRolledAbilityScores] = useState<number[]>([]);
  const [assignedAdvAbilities, setAssignedAdvAbilities] = useState<Partial<AbilityScores>>({});
  const [availableRolledScores, setAvailableRolledScores] = useState<number[]>([]);
  const [rerollAttemptsLeft, setRerollAttemptsLeft] = useState<number>(MAX_ABILITY_REROLLS);
  const [selectedBackground, setSelectedBackground] = useState<BaseBackgroundDetail | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (experienceLevel === ExperienceLevel.Intermediate) {
      const fetchSuggestion = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedSuggestion(null);
        const prompt = `Eres un Asistente Creativo para un juego de D&D digital.
El nivel de experiencia del jugador con D&D es: ${experienceLevel}.
Las clases de personaje disponibles son: ${availableClasses.join(', ')}.
Basado en este nivel de experiencia, por favor proporciona dos sugerencias de personaje distintas. Para cada una, proporciona un nombre, una clase (de ${availableClasses.join(', ')}), un rasgo de personalidad único y un posible gancho para la historia (1-2 frases).
Presenta tus sugerencias claramente y en español.`;

        try {
          const suggestion = await geminiService.generateText(prompt);
          setGeneratedSuggestion(suggestion);
        } catch (err) {
          console.error("Error generando sugerencia de personaje:", err);
          setError("Los antiguos espíritus de la creación están en silencio (fallo al obtener sugerencias). Por favor, inténtalo de nuevo o crea tu héroe manualmente.");
        } finally {
          setIsGenerating(false);
        }
      };
      fetchSuggestion();
    } else {
      setIsGenerating(false);
    }
  }, [experienceLevel, availableClasses]);

  const initializeSpellcastingForCharacter = (
    charData: Partial<Omit<Character, 'id' | 'experienceLevel'>>,
    primaryClass: BaseClassDetail,
    secondaryClass: BaseClassDetail | null,
    level: number,
    abilities: AbilityScores
  ): Partial<Omit<Character, 'id' | 'experienceLevel'>> => {
    const updatedData = { ...charData };
    let knownSpells: Spell[] = [];
    
    // Primary Class Spellcasting
    if (primaryClass.spellcasting) {
      const scDef = primaryClass.spellcasting;
      const primaryLevel = secondaryClass ? 1 : level; 
      
      updatedData.spellSlots = {};
      if (scDef.slotProgressionTable[primaryLevel -1]) {
        scDef.slotProgressionTable[primaryLevel-1].forEach((numSlots, slotLvlIndex) => {
          if (numSlots > 0) {
            updatedData.spellSlots![`level${slotLvlIndex + 1}` as keyof SpellSlots] = { max: numSlots, current: numSlots };
          }
        });
      }

      if (scDef.spellList) {
        let spellsToLearn = 2; 
         if (primaryClass.name === "Paladín" && primaryLevel >=2) { 
             const chaMod = calculateAbilityModifier(abilities.cha);
             spellsToLearn = Math.max(1, chaMod + Math.floor(primaryLevel/2));
         } else if (primaryClass.name === "Clérigo" || primaryClass.name === "Druida") {
            const wisMod = calculateAbilityModifier(abilities.wis);
            spellsToLearn = Math.max(1, wisMod + primaryLevel); // Simplified, actual prepared is more complex
         } else if (primaryClass.name === "Mago") {
            const intMod = calculateAbilityModifier(abilities.int);
            spellsToLearn = Math.max(1, intMod + primaryLevel); // Simplified known, actual is 6 + more per level
         }


        scDef.spellList.slice(0, spellsToLearn).forEach(spellName => {
          if (SPELLS_DATA[spellName] && !knownSpells.find(s => s.name === spellName)) {
            knownSpells.push(SPELLS_DATA[spellName]);
          }
        });
      }
    } else if (primaryClass.pactMagic) {
      const pmDef = primaryClass.pactMagic;
      const primaryLevel = secondaryClass ? 1 : level;

      updatedData.pactMagicSlots = {
        level: pmDef.slotLevelAtLevel(primaryLevel),
        max: pmDef.slotsAtLevel(primaryLevel),
        current: pmDef.slotsAtLevel(primaryLevel),
      };
      
      const cantripsToLearn = pmDef.knownCantripsAtLevel(primaryLevel);
      pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, cantripsToLearn).forEach(spellName => {
          if (SPELLS_DATA[spellName] && !knownSpells.find(s => s.name === spellName)) {
            knownSpells.push(SPELLS_DATA[spellName]);
          }
      });

      const spellsToLearn = pmDef.knownSpellsAtLevel(primaryLevel);
      pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0).slice(0, spellsToLearn).forEach(spellName => {
          if (SPELLS_DATA[spellName] && !knownSpells.find(s => s.name === spellName)) {
            knownSpells.push(SPELLS_DATA[spellName]);
          }
      });
    }

    if (secondaryClass) {
      const secondaryLevel = 1; 
      if (secondaryClass.spellcasting) {
        const scDef = secondaryClass.spellcasting;
        if (!updatedData.spellSlots) updatedData.spellSlots = {};
        
        if (scDef.slotProgressionTable[secondaryLevel-1]) {
            scDef.slotProgressionTable[secondaryLevel-1].forEach((numSlots, slotLvlIndex) => {
              if (numSlots > 0) {
                const key = `level${slotLvlIndex + 1}` as keyof SpellSlots;
                if (!updatedData.spellSlots![key]) updatedData.spellSlots![key] = { max: 0, current: 0};
                updatedData.spellSlots![key]!.max += numSlots;
                updatedData.spellSlots![key]!.current += numSlots;
              }
            });
        }

        if (scDef.spellList) {
          let spellsToLearn = 1; 
          if (secondaryClass.name === "Paladín" && secondaryLevel >=2) {
             const chaMod = calculateAbilityModifier(abilities.cha);
             spellsToLearn = Math.max(1, chaMod + Math.floor(secondaryLevel/2));
          }
          scDef.spellList.slice(0, spellsToLearn).forEach(spellName => {
            if (SPELLS_DATA[spellName] && !knownSpells.find(s => s.name === spellName)) {
              knownSpells.push(SPELLS_DATA[spellName]);
            }
          });
        }

      } else if (secondaryClass.pactMagic) {
        const pmDef = secondaryClass.pactMagic;
        if (!updatedData.pactMagicSlots) { 
             updatedData.pactMagicSlots = {
                level: pmDef.slotLevelAtLevel(secondaryLevel),
                max: pmDef.slotsAtLevel(secondaryLevel),
                current: pmDef.slotsAtLevel(secondaryLevel),
            };
        } 
        const cantripsToLearn = pmDef.knownCantripsAtLevel(secondaryLevel);
        pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, cantripsToLearn).forEach(spellName => {
            if (SPELLS_DATA[spellName] && !knownSpells.find(s => s.name === spellName)) {
              knownSpells.push(SPELLS_DATA[spellName]);
            }
        });
        const spellsToLearn = pmDef.knownSpellsAtLevel(secondaryLevel);
        pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0).slice(0, spellsToLearn).forEach(spellName => {
            if (SPELLS_DATA[spellName] && !knownSpells.find(s => s.name === spellName)) {
              knownSpells.push(SPELLS_DATA[spellName]);
            }
        });
      }
    }
    updatedData.knownSpells = knownSpells.sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
    return updatedData;
  };


  const handleSubmitIntermediate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && characterClass) {
      const chosenClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === characterClass);
      if (!chosenClassDetails) {
        setError("Clase seleccionada no es válida.");
        return;
      }
      const defaultAbilities: AbilityScores = { str: 12, dex: 12, con: 12, int: 10, wis: 10, cha: 10 };
      const conModifier = calculateAbilityModifier(defaultAbilities.con);
      const maxHp = chosenClassDetails.hitDie + conModifier;
      const characterLevel = 1;
      const defaultBackground = ALL_BACKGROUNDS_ADVANCED.find(b => b.name === 'Aventurero') || ALL_BACKGROUNDS_ADVANCED[0];

      const profs = getCombinedProficiencies(
        ALL_RACES_ADVANCED.find(r => r.name === 'Humano')!, 
        chosenClassDetails,
        null,
        defaultBackground
      );
      
      const defaultEquipment = chosenClassDetails.startingEquipment || [ITEMS_DATA["Daga"]?.name || "Daga"];
      if(defaultBackground.equipment) defaultEquipment.push(...defaultBackground.equipment)

      const calculatedAC = calculateAc(defaultAbilities, profs.armors, defaultEquipment);
      const championAbilities: ChampionAbilities | undefined = chosenClassDetails.name === 'Guerrero' ? { secondWindUsed: false, actionSurgeUsed: false } : undefined;
      const startingGold = defaultBackground.startingGold || 10;


      let characterData: Omit<Character, 'id' | 'experienceLevel'> = {
        name: name.trim(),
        primaryClass: characterClass,
        level: characterLevel,
        race: 'Humano',
        abilities: defaultAbilities,
        background: defaultBackground.name,
        skills: profs.skills,
        equipment: defaultEquipment,
        maxHp: maxHp,
        currentHp: maxHp,
        hitDice: { total: characterLevel, current: characterLevel, dieType: chosenClassDetails.hitDie },
        armorClass: calculatedAC,
        weaponProficiencies: profs.weapons,
        armorProficiencies: profs.armors,
        savingThrowProficiencies: profs.savingThrows,
        championAbilities: championAbilities,
        gold: startingGold,
        xp: 0,
      };
      characterData = initializeSpellcastingForCharacter(characterData, chosenClassDetails, null, characterLevel, defaultAbilities) as Omit<Character, 'id' | 'experienceLevel'>;
      onCharacterCreated(characterData);
    }
  };

  const handleBeginnerNextStep = () => {
    if (beginnerStep === 'race') setBeginnerStep('class');
    else if (beginnerStep === 'class') setBeginnerStep('abilityScores');
    else if (beginnerStep === 'abilityScores') {
      const assignedValues = Object.values(abilityAssignments).filter(v => v !== undefined) as number[];
      const allScoresAssigned = assignedValues.length === ABILITIES.length;
      const standardScoresCopy = [...STANDARD_ABILITY_SCORES].sort();
      const assignedValuesSorted = [...assignedValues].sort();
      const scoresMatchStandardArray = standardScoresCopy.length === assignedValuesSorted.length && standardScoresCopy.every((val, index) => val === assignedValuesSorted[index]);

      if (allScoresAssigned && scoresMatchStandardArray) {
         let finalAbilities = ABILITIES.reduce((acc, currAbility) => {
            acc[currAbility.key] = abilityAssignments[currAbility.key]!;
            return acc;
        }, {} as AbilityScores);

        finalAbilities = Object.fromEntries(
            Object.entries(finalAbilities).map(([key, value]) => [key, value + 1])
        ) as AbilityScores;

        const conModifier = calculateAbilityModifier(finalAbilities.con);
        const beginnerClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === 'Guerrero')!;
        const maxHp = beginnerClassDetails.hitDie + conModifier;
        const characterLevel = 1;
        
        const raceDetails = ALL_RACES_ADVANCED.find(r => r.name === 'Humano')!;
        const backgroundDetails = ALL_BACKGROUNDS_ADVANCED.find(b => b.name === 'Soldado')!;
        const profs = getCombinedProficiencies(raceDetails, beginnerClassDetails, null, backgroundDetails);
        
        const equipment = beginnerClassDetails.startingEquipment ? [...beginnerClassDetails.startingEquipment] : [];
        if(backgroundDetails.equipment) equipment.push(...backgroundDetails.equipment);

        const calculatedAC = calculateAc(finalAbilities, profs.armors, equipment);
        const championAbilities: ChampionAbilities | undefined = beginnerClassDetails.name === 'Guerrero' ? { secondWindUsed: false, actionSurgeUsed: false } : undefined;
        const startingGold = backgroundDetails.startingGold || 10;

        let summaryData: Omit<Character, 'id' | 'experienceLevel'> = {
            name: beginnerCharName.trim() || "Héroe sin Nombre",
            primaryClass: 'Guerrero',
            level: characterLevel,
            race: 'Humano',
            abilities: finalAbilities,
            background: 'Soldado',
            skills: profs.skills,
            equipment: equipment,
            maxHp: maxHp,
            currentHp: maxHp,
            hitDice: { total: characterLevel, current: characterLevel, dieType: beginnerClassDetails.hitDie },
            armorClass: calculatedAC,
            weaponProficiencies: profs.weapons,
            armorProficiencies: profs.armors,
            savingThrowProficiencies: profs.savingThrows,
            championAbilities: championAbilities,
            gold: startingGold,
            xp: 0,
        };
        summaryData = initializeSpellcastingForCharacter(summaryData, beginnerClassDetails, null, characterLevel, finalAbilities) as Omit<Character, 'id' | 'experienceLevel'>;
        setBeginnerSummary(summaryData);
        setBeginnerStep('nameAndSummary');
      } else {
        alert("Por favor, asigna todas las puntuaciones estándar (15, 14, 13, 12, 10, 8) exactamente una vez a cada característica.");
        return;
      }
    }
  };
  const handleAbilityScoreChange = (abilityKey: AbilityKey, value: string) => { setAbilityAssignments(prev => ({ ...prev, [abilityKey]: value ? parseInt(value, 10) : undefined })); };

  const handleBeginnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beginnerCharName.trim()) { alert("¡Tu héroe necesita un nombre!"); return; }
    if (beginnerSummary) {
      const finalAbilitiesWithHumanBonus = beginnerSummary.abilities; 
      const conModifier = calculateAbilityModifier(finalAbilitiesWithHumanBonus.con);
      const beginnerClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === 'Guerrero')!;
      const maxHp = beginnerClassDetails.hitDie + conModifier;

      const raceDetails = ALL_RACES_ADVANCED.find(r => r.name === 'Humano')!;
      const backgroundDetails = ALL_BACKGROUNDS_ADVANCED.find(b => b.name === 'Soldado')!;
      const profs = getCombinedProficiencies(raceDetails, beginnerClassDetails, null, backgroundDetails);
      const calculatedAC = calculateAc(finalAbilitiesWithHumanBonus, profs.armors, beginnerSummary.equipment);
      const championAbilities: ChampionAbilities | undefined = beginnerClassDetails.name === 'Guerrero' ? { secondWindUsed: false, actionSurgeUsed: false } : undefined;
      const startingGold = backgroundDetails.startingGold || 10;
      
      let characterData: Omit<Character, 'id' | 'experienceLevel'> = {
        ...beginnerSummary,
        name: beginnerCharName.trim(),
        abilities: finalAbilitiesWithHumanBonus,
        maxHp: maxHp,
        currentHp: maxHp,
        hitDice: { total: 1, current: 1, dieType: beginnerClassDetails.hitDie },
        armorClass: calculatedAC, 
        weaponProficiencies: profs.weapons,
        armorProficiencies: profs.armors,
        savingThrowProficiencies: profs.savingThrows,
        championAbilities: championAbilities,
        gold: startingGold,
        xp: 0,
      };
      characterData = initializeSpellcastingForCharacter(characterData, beginnerClassDetails, null, 1, finalAbilitiesWithHumanBonus) as Omit<Character, 'id' | 'experienceLevel'>;
      onCharacterCreated(characterData);
    } else { setError("Ocurrió un error. Por favor, intenta reiniciar la creación del personaje."); }
  };
  const restartBeginnerFlow = () => {
    setBeginnerStep('race');
    setBeginnerCharName('');
    setAbilityAssignments(ABILITIES.reduce((acc, curr) => ({ ...acc, [curr.key]: undefined }), {} as Record<AbilityKey, number | undefined>));
    setBeginnerSummary(null);
    setError(null);
   };

  const handleRollAbilities = () => {
    if (rerollAttemptsLeft > 0) {
      const newScores = Array.from({ length: 6 }, roll4d6DropLowest);
      setRolledAbilityScores(newScores);
      setAvailableRolledScores([...newScores]);
      setAssignedAdvAbilities({});
      if (rolledAbilityScores.length > 0) {
           setRerollAttemptsLeft(prev => prev - 1);
      }
    }
  };

  const handleAdvancedAbilityAssign = (abilityKey: AbilityKey, score: number | string) => {
    const numScore = Number(score);
    setAssignedAdvAbilities(prev => {
        const newAssignments = { ...prev };
        if (prev[abilityKey] !== undefined && !availableRolledScores.includes(prev[abilityKey]!)) {
            setAvailableRolledScores(currentAvailable => [...currentAvailable, prev[abilityKey]!].sort((a,b)=> b-a));
        }
        
        if (score !== "" && !isNaN(numScore)) { 
            newAssignments[abilityKey] = numScore;
            setAvailableRolledScores(currentAvailable => currentAvailable.filter(s => s !== numScore).sort((a,b)=>b-a));
        } else { 
            delete newAssignments[abilityKey];
        }
        return newAssignments;
    });
};


  const calculateFinalAdvAbilities = useCallback((): AbilityScores => {
    const baseScores = ABILITIES.reduce((acc, ab) => {
        acc[ab.key] = assignedAdvAbilities[ab.key] || 8;
        return acc;
    }, {} as AbilityScores);

    if (selectedRace?.abilityBonuses) {
      for (const key in selectedRace.abilityBonuses) {
        const ability = key as AbilityKey;
        baseScores[ability] = (baseScores[ability] || 0) + (selectedRace.abilityBonuses[ability] || 0);
      }
    }
    return baseScores;
  }, [assignedAdvAbilities, selectedRace]);

  const checkMulticlassRequirements = (finalAbilities: AbilityScores): boolean => {
    if (!wantsMulticlass || !selectedPrimaryClass || !selectedSecondaryClass) return true;

    const primaryReqs = MULTICLASS_REQUIREMENTS[selectedPrimaryClass.name];
    const secondaryReqs = MULTICLASS_REQUIREMENTS[selectedSecondaryClass.name];

    let primaryMet = true;
    if (primaryReqs) {
        primaryMet = Object.entries(primaryReqs).every(([key, val]) => finalAbilities[key as AbilityKey] >= val!);
    }
    let secondaryMet = true;
    if (secondaryReqs) {
        secondaryMet = Object.entries(secondaryReqs).every(([key, val]) => finalAbilities[key as AbilityKey] >= val!);
    }
    return primaryMet && secondaryMet;
  };

  const handleAdvancedNextStep = () => {
    setError(null);
    switch (advancedStep) {
      case 'race': if (selectedRace) setAdvancedStep('primaryClass'); else setError("Debes seleccionar una raza."); break;
      case 'primaryClass': if (selectedPrimaryClass) setAdvancedStep('multiclassDecision'); else setError("Debes seleccionar una clase primaria."); break;
      case 'multiclassDecision': setAdvancedStep(wantsMulticlass ? 'multiclassSelection' : 'abilityRolls'); break;
      case 'multiclassSelection': if (selectedSecondaryClass || !wantsMulticlass) setAdvancedStep('abilityRolls'); else setError("Debes seleccionar una clase secundaria o indicar que no quieres multiclase."); break;
      case 'abilityRolls': if (rolledAbilityScores.length === 6) setAdvancedStep('abilityAssignment'); else setError("Debes tirar tus puntuaciones de característica primero."); break;
      case 'abilityAssignment':
        const allAssigned = Object.keys(assignedAdvAbilities).length === 6 && ABILITIES.every(ab => assignedAdvAbilities[ab.key] !== undefined);
        if (!allAssigned) { setError("Debes asignar todas las puntuaciones tiradas."); return; }
        const finalAbilities = calculateFinalAdvAbilities();
        if (!checkMulticlassRequirements(finalAbilities)) {
            setError("Las puntuaciones asignadas (con bonos raciales) no cumplen los requisitos para la multiclase seleccionada. Reasigna o cambia de clase.");
            return;
        }
        setAdvancedStep('background');
        break;
      case 'background': if (selectedBackground) setAdvancedStep('nameAndSummary'); else setError("Debes seleccionar un trasfondo."); break;
      case 'nameAndSummary': break;
    }
  };

  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancedCharName.trim()) { setError("¡Tu leyenda necesita un nombre!"); return; }
    if (!selectedRace || !selectedPrimaryClass || !selectedBackground || Object.keys(assignedAdvAbilities).length !== 6) {
        setError("Faltan datos cruciales del personaje. Revisa los pasos anteriores.");
        return;
    }
    const finalAbilities = calculateFinalAdvAbilities();
    if (!checkMulticlassRequirements(finalAbilities)) {
        setError("Las puntuaciones finales no cumplen los requisitos de multiclase. Por favor, ajusta.");
        return;
    }

    const conModifier = calculateAbilityModifier(finalAbilities.con);
    let maxHp = 0;
    let characterLevel = 1;
    let primaryHitDie = selectedPrimaryClass.hitDie;

    if (wantsMulticlass && selectedSecondaryClass) {
        characterLevel = 2;
        maxHp += primaryHitDie + conModifier;
        maxHp += getAverageHitDieValue(selectedSecondaryClass.hitDie) + conModifier;
    } else {
        maxHp = primaryHitDie + conModifier;
    }

    const profs = getCombinedProficiencies(selectedRace, selectedPrimaryClass, wantsMulticlass ? selectedSecondaryClass : null, selectedBackground);
    
    const equipment = selectedPrimaryClass.startingEquipment ? [...selectedPrimaryClass.startingEquipment] : [];
    if(selectedBackground.equipment) equipment.push(...selectedBackground.equipment);


    const calculatedAC = calculateAc(finalAbilities, profs.armors, equipment);
    const championAbilities: ChampionAbilities | undefined = selectedPrimaryClass.name === 'Guerrero' ? { secondWindUsed: false, actionSurgeUsed: false } : undefined;
    const startingGold = selectedBackground.startingGold || 10;

    let characterData: Omit<Character, 'id' | 'experienceLevel'> = {
        name: advancedCharName.trim(),
        race: selectedRace.name,
        primaryClass: selectedPrimaryClass.name,
        multiclassOption: wantsMulticlass && selectedSecondaryClass ? selectedSecondaryClass.name : undefined,
        subclass: undefined,
        level: characterLevel,
        abilities: finalAbilities,
        background: selectedBackground.name,
        skills: profs.skills,
        equipment: equipment,
        maxHp: maxHp,
        currentHp: maxHp,
        hitDice: {
            total: characterLevel,
            current: characterLevel,
            dieType: primaryHitDie,
        },
        armorClass: calculatedAC,
        weaponProficiencies: profs.weapons,
        armorProficiencies: profs.armors,
        savingThrowProficiencies: profs.savingThrows,
        rolledScores: rolledAbilityScores,
        rerollAttemptsLeft: rerollAttemptsLeft,
        championAbilities: championAbilities,
        gold: startingGold,
        xp: 0,
    };
    characterData = initializeSpellcastingForCharacter(characterData, selectedPrimaryClass, wantsMulticlass ? selectedSecondaryClass : null, characterLevel, finalAbilities) as Omit<Character, 'id' | 'experienceLevel'>;
    onCharacterCreated(characterData);
  };

  const restartAdvancedFlow = () => {
    setAdvancedStep('race');
    setAdvancedCharName('');
    setSelectedRace(null);
    setSelectedPrimaryClass(null);
    setWantsMulticlass(false);
    setSelectedSecondaryClass(null);
    setRolledAbilityScores([]);
    setAvailableRolledScores([]);
    setAssignedAdvAbilities({});
    setRerollAttemptsLeft(MAX_ABILITY_REROLLS);
    setSelectedBackground(null);
    setError(null);
  };

  const toggleDetails = (key: string) => {
    setShowDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };


  if (experienceLevel === ExperienceLevel.Beginner) {
    let stepContent;
    let currentBeginnerAbilitiesForDisplay = beginnerSummary?.abilities;
    if (beginnerStep === 'abilityScores' || (beginnerStep === 'nameAndSummary' && !beginnerSummary)) {
        const baseAssigned = ABILITIES.reduce((acc, currAbility) => {
            acc[currAbility.key] = abilityAssignments[currAbility.key] || 0;
            return acc;
        }, {} as AbilityScores);
        currentBeginnerAbilitiesForDisplay = Object.fromEntries(
            Object.entries(baseAssigned).map(([key, value]) => [key, value + 1])
        ) as AbilityScores;
    }


    switch (beginnerStep) {
      case 'race': stepContent = (
        <div className="w-full">
          <h3 className="text-xl font-semibold text-yellow-200 mb-3 text-center">Elige tu Linaje (Raza)</h3>
          <p className="text-slate-300 mb-4 text-center">Para simplificar, comenzarás como Humano. ¡Son versátiles y adaptables!</p>
          <div className="p-4 bg-slate-700 rounded-md text-center">
            <p className="text-lg font-medium text-purple-300">Humano</p>
            <p className="text-sm text-slate-300">Como humano, recibes +1 a todas tus puntuaciones de característica.</p>
          </div>
          <Button onClick={handleBeginnerNextStep} className="mt-6 w-full bg-green-600 hover:bg-green-700">Siguiente: Elige tu Clase</Button>
        </div>
        ); break;
      case 'class': stepContent = (
         <div className="w-full">
          <h3 className="text-xl font-semibold text-yellow-200 mb-3 text-center">Elige tu Vocación (Clase)</h3>
          <p className="text-slate-300 mb-4 text-center">Para tu primera aventura, te recomendamos la clase de Guerrero. ¡Son fuertes y fáciles de aprender!</p>
           <div className="p-4 bg-slate-700 rounded-md text-center">
            <p className="text-lg font-medium text-purple-300">Guerrero</p>
            <p className="text-sm text-slate-300">Maestro del combate, el guerrero es hábil con una variedad de armas y armaduras. Su Dado de Golpe es d10.</p>
          </div>
          <Button onClick={handleBeginnerNextStep} className="mt-6 w-full bg-green-600 hover:bg-green-700">Siguiente: Define Habilidades</Button>
        </div>
      ); break;
      case 'abilityScores':
        const unassignedStandardScores = STANDARD_ABILITY_SCORES.filter(score => !Object.values(abilityAssignments).includes(score)).sort((a,b) => b-a);
        stepContent = (
           <div className="w-full">
            <h3 className="text-xl font-semibold text-yellow-200 mb-2 text-center">Puntuaciones de Característica</h3>
            <p className="text-slate-300 mb-1 text-sm text-center">Asigna estas puntuaciones estándar: <strong className="text-yellow-300">15, 14, 13, 12, 10, 8</strong>.</p>
            <p className="text-slate-400 mb-4 text-xs text-center">Cada puntuación debe usarse una vez. Los humanos reciben +1 a todo después.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {ABILITIES.map(ability => (
                <div key={ability.key} className="flex flex-col">
                  <label htmlFor={`ability-${ability.key}`} className="text-sm font-medium text-slate-300 mb-0.5">{ability.name}</label>
                  <select
                    id={`ability-${ability.key}`}
                    value={abilityAssignments[ability.key] || ""}
                    onChange={(e) => handleAbilityScoreChange(ability.key, e.target.value)}
                    className="p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:ring-purple-500"
                  >
                    <option value="">-- Elegir --</option>
                    {abilityAssignments[ability.key] && <option value={abilityAssignments[ability.key]}>{abilityAssignments[ability.key]}</option>}
                    {unassignedStandardScores.map(score => (
                      <option key={`${ability.key}-${score}`} value={score}>{score}</option>
                    ))}
                  </select>
                   <p className="text-xs text-slate-400 mt-0.5 h-8 overflow-y-auto">{ability.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 bg-slate-600/50 rounded">
                <h4 className="text-sm font-semibold text-yellow-200">Puntuaciones Finales (con +1 Humano):</h4>
                <ul className="text-xs grid grid-cols-2 sm:grid-cols-3">
                    {currentBeginnerAbilitiesForDisplay && ABILITIES.map(ab => <li key={`final-${ab.key}`}>{ab.name}: <strong className="text-yellow-300">{currentBeginnerAbilitiesForDisplay[ab.key] || '-'}</strong></li>)}
                </ul>
            </div>
            <Button onClick={handleBeginnerNextStep} className="mt-6 w-full bg-green-600 hover:bg-green-700">Siguiente: Nombre y Resumen</Button>
          </div>
        ); break;
       case 'nameAndSummary':
        if (!beginnerSummary || !currentBeginnerAbilitiesForDisplay) return <p className="text-red-400 text-center">Error al cargar resumen. Por favor, reinicia.</p>;
        const conModForSummary = calculateAbilityModifier(currentBeginnerAbilitiesForDisplay.con);
        const hpForSummary = (ALL_CLASSES_ADVANCED.find(c=>c.name === "Guerrero")?.hitDie || 10) + conModForSummary;

        stepContent = (
            <form onSubmit={handleBeginnerSubmit} className="mt-6 space-y-4 w-full">
                <h3 className="text-xl font-semibold text-yellow-200 mb-3 text-center">Nombra a tu Héroe</h3>
                 <div className="bg-slate-700 p-4 rounded-md shadow-inner text-sm space-y-1">
                    <p><strong>Raza:</strong> {beginnerSummary.race}</p>
                    <p><strong>Clase:</strong> {beginnerSummary.primaryClass}</p>
                    <p><strong>Puntuaciones Finales (con +1 Humano):</strong></p>
                    <ul className="list-disc list-inside ml-4 text-xs">
                        {ABILITIES.map(ab => <li key={`sum-${ab.key}`}>{ab.name}: {currentBeginnerAbilitiesForDisplay[ab.key]}</li>)}
                    </ul>
                    <p><strong>CA:</strong> {beginnerSummary.armorClass}</p>
                    <p><strong>Puntos de Golpe Máximos:</strong> {hpForSummary}</p>
                    <p><strong>Trasfondo:</strong> {beginnerSummary.background}</p>
                    <p><strong>Habilidades:</strong> {beginnerSummary.skills.join(', ')}</p>
                    <p><strong>Comp. Armas:</strong> {beginnerSummary.weaponProficiencies.join(', ')}</p>
                     <p><strong>Comp. Armaduras:</strong> {beginnerSummary.armorProficiencies.join(', ')}</p>
                     <p><strong>Oro Inicial:</strong> {beginnerSummary.gold} po</p>
                     <p><strong>XP Inicial:</strong> {beginnerSummary.xp}</p>
                </div>
                <div>
                    <label htmlFor="charName" className="block text-sm font-medium text-slate-300 mb-1">Nombre de tu Héroe:</label>
                    <input
                        type="text"
                        id="charName"
                        value={beginnerCharName}
                        onChange={e => setBeginnerCharName(e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100"
                        placeholder="Ej: Lira la Valiente"
                        required
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="button" onClick={restartBeginnerFlow} className="bg-slate-600 hover:bg-slate-500 w-full sm:w-auto">
                        <RefreshIcon className="w-4 h-4 mr-2"/> Reiniciar
                    </Button>
                    <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">
                        <CheckCircleIcon className="w-5 h-5 mr-2"/>¡Crear Héroe!
                    </Button>
                </div>
            </form>
        ); break;
      default: stepContent = <p>Paso desconocido.</p>;
    }
     return (
      <div className="flex flex-col items-center p-4 w-full">
         <h2 className="text-3xl font-bold text-yellow-300 mb-1 flex items-center">
          <UserPlusIcon className="w-8 h-8 mr-3 text-yellow-400" />
          Crea tu Primer Héroe
        </h2>
        <p className="text-slate-400 mb-6 text-sm">Nivel de Experiencia: {experienceLevel}</p>
        {error && <p className="text-red-400 bg-red-900 p-2 rounded-md mb-3 text-sm">{error}</p>}
        <div className="w-full max-w-lg p-4 md:p-6 bg-slate-800/60 rounded-lg shadow-xl border border-slate-700">
            {stepContent}
        </div>
        <Button onClick={onBack} className="mt-8 bg-slate-600 hover:bg-slate-500 text-white">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver a Nivel de Experiencia
        </Button>
      </div>
    );

  } else if (experienceLevel === ExperienceLevel.Advanced) {
    let advancedContent;
    const finalAbilitiesForDisplay = calculateFinalAdvAbilities();

    switch (advancedStep) {
      case 'race':
        advancedContent = (
          <div>
            <h3 className="text-xl font-semibold text-yellow-200 mb-3">Elige tu Linaje (Raza)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto fantasy-scroll pr-2">
              {ALL_RACES_ADVANCED.map(race => (
                <div key={race.name} className={`p-3 rounded-md border ${selectedRace?.name === race.name ? 'bg-purple-700 border-purple-500' : 'bg-slate-700 border-slate-600 hover:border-purple-400'}`}>
                  <h4 className="font-semibold text-lg text-purple-300 flex justify-between items-center cursor-pointer" onClick={() => toggleDetails(race.name)}>
                    {race.name}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedRace(race); }} className={`ml-2 px-2 py-1 text-xs rounded ${selectedRace?.name === race.name ? 'bg-green-500' : 'bg-slate-600 hover:bg-green-600'}`}>
                      {selectedRace?.name === race.name ? 'Seleccionado' : 'Elegir'}
                    </button>
                    {showDetails[race.name] ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </h4>
                  {showDetails[race.name] && (
                    <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                      <p>{race.description}</p>
                      <p><strong>Bonus:</strong> {Object.entries(race.abilityBonuses).map(([key, val]) => `${key.toUpperCase()}: +${val}`).join(', ')}</p>
                      {race.features && <p><strong>Rasgos:</strong> {race.features.join(', ')}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handleAdvancedNextStep} className="mt-4 bg-green-600 hover:bg-green-700" disabled={!selectedRace}>Siguiente: Clase Primaria</Button>
          </div>
        );
        break;
    case 'primaryClass':
        advancedContent = (
          <div>
            <h3 className="text-xl font-semibold text-yellow-200 mb-3">Elige tu Vocación Principal (Clase)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto fantasy-scroll pr-2">
              {ALL_CLASSES_ADVANCED.map(c => (
                <div key={c.name} className={`p-3 rounded-md border ${selectedPrimaryClass?.name === c.name ? 'bg-purple-700 border-purple-500' : 'bg-slate-700 border-slate-600 hover:border-purple-400'}`}>
                  <h4 className="font-semibold text-lg text-purple-300 flex justify-between items-center cursor-pointer" onClick={() => toggleDetails(c.name)}>
                    {c.name}
                     <button onClick={(e) => { e.stopPropagation(); setSelectedPrimaryClass(c); }} className={`ml-2 px-2 py-1 text-xs rounded ${selectedPrimaryClass?.name === c.name ? 'bg-green-500' : 'bg-slate-600 hover:bg-green-600'}`}>
                      {selectedPrimaryClass?.name === c.name ? 'Seleccionado' : 'Elegir'}
                    </button>
                    {showDetails[c.name] ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </h4>
                   {showDetails[c.name] && (
                    <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                        <p><strong>Dado de Golpe:</strong> d{c.hitDie}</p>
                        <p><strong>Hab. Primaria:</strong> {c.primaryAbility.join(', ').toUpperCase()}</p>
                        <p><strong>Salvac.:</strong> {c.savingThrows.join(', ').toUpperCase()}</p>
                        <p><strong>Comp. Armas:</strong> {c.weaponProficiencies.join(', ')}</p>
                        <p><strong>Comp. Armaduras:</strong> {c.armorProficiencies.join(', ')}</p>
                        {c.multiclassRequirements && <p><strong>Multi. Req.:</strong> {Object.entries(c.multiclassRequirements).map(([key, val]) => `${key.toUpperCase()} ${val}`).join(', ')}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
                <Button onClick={() => setAdvancedStep('race')} className="bg-slate-600 hover:bg-slate-500">Volver a Raza</Button>
                <Button onClick={handleAdvancedNextStep} className="bg-green-600 hover:bg-green-700" disabled={!selectedPrimaryClass}>Siguiente: Multiclase</Button>
            </div>
          </div>
        );
        break;
    case 'multiclassDecision':
        advancedContent = (
            <div>
                <h3 className="text-xl font-semibold text-yellow-200 mb-3">¿Iniciar con Multiclase?</h3>
                <p className="text-slate-300 mb-4 text-sm">Puedes empezar con nivel 1 en tu clase primaria y nivel 1 en una clase secundaria (personaje de nivel 2 total). Necesitarás cumplir los requisitos de atributos para ambas.</p>
                <div className="flex gap-4">
                    <Button onClick={() => { setWantsMulticlass(true); handleAdvancedNextStep(); }} className="bg-purple-600 hover:bg-purple-700">Sí, elegir clase secundaria</Button>
                    <Button onClick={() => { setWantsMulticlass(false); setSelectedSecondaryClass(null); handleAdvancedNextStep(); }} className="bg-slate-600 hover:bg-slate-500">No, solo clase primaria</Button>
                </div>
                 <Button onClick={() => setAdvancedStep('primaryClass')} className="bg-slate-600 hover:bg-slate-500 mt-4">Volver a Clase Primaria</Button>
            </div>
        );
        break;
    case 'multiclassSelection':
        advancedContent = (
          <div>
            <h3 className="text-xl font-semibold text-yellow-200 mb-3">Elige tu Vocación Secundaria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto fantasy-scroll pr-2">
              {ALL_CLASSES_ADVANCED.filter(c => c.name !== selectedPrimaryClass?.name).map(c => (
                 <div key={c.name} className={`p-3 rounded-md border ${selectedSecondaryClass?.name === c.name ? 'bg-purple-700 border-purple-500' : 'bg-slate-700 border-slate-600 hover:border-purple-400'}`}>
                  <h4 className="font-semibold text-lg text-purple-300 flex justify-between items-center cursor-pointer" onClick={() => toggleDetails(c.name + '-multi')}>
                    {c.name}
                     <button onClick={(e) => { e.stopPropagation(); setSelectedSecondaryClass(c); }} className={`ml-2 px-2 py-1 text-xs rounded ${selectedSecondaryClass?.name === c.name ? 'bg-green-500' : 'bg-slate-600 hover:bg-green-600'}`}>
                      {selectedSecondaryClass?.name === c.name ? 'Seleccionado' : 'Elegir'}
                    </button>
                     {showDetails[c.name + '-multi'] ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </h4>
                   {showDetails[c.name + '-multi'] && (
                    <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                        <p><strong>Hab. Primaria:</strong> {c.primaryAbility.join(', ').toUpperCase()}</p>
                        {c.multiclassRequirements && <p><strong>Multi. Req.:</strong> {Object.entries(c.multiclassRequirements).map(([key, val]) => `${key.toUpperCase()} ${val}`).join(', ')}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
                <Button onClick={() => setAdvancedStep('multiclassDecision')} className="bg-slate-600 hover:bg-slate-500">Volver</Button>
                <Button onClick={handleAdvancedNextStep} className="bg-green-600 hover:bg-green-700" disabled={!selectedSecondaryClass}>Siguiente: Habilidades</Button>
            </div>
          </div>
        );
        break;
    case 'abilityRolls':
        advancedContent = (
            <div>
                <h3 className="text-xl font-semibold text-yellow-200 mb-3">Tirar Puntuaciones de Característica (4d6, descarta el más bajo)</h3>
                <p className="text-slate-300 mb-1 text-sm">Tira 6 veces. Puedes volver a tirar todas las puntuaciones un máximo de {MAX_ABILITY_REROLLS} veces.</p>
                <p className="text-slate-400 mb-4 text-xs">Intentos de re-tirada restantes: {rerollAttemptsLeft - (rolledAbilityScores.length > 0 ? 1:0) }</p>
                <Button onClick={handleRollAbilities} disabled={rerollAttemptsLeft <= 0 && rolledAbilityScores.length > 0} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 mb-4">
                    {rolledAbilityScores.length === 0 ? "Tirar Dados" : "Volver a Tirar Todo"} ({rerollAttemptsLeft-(rolledAbilityScores.length > 0 ? 1:0)} restantes)
                </Button>
                {rolledAbilityScores.length > 0 && (
                    <div className="my-4 p-3 bg-slate-600 rounded">
                        <p className="text-lg font-bold text-yellow-300 text-center">Tus Tiradas: {rolledAbilityScores.join(' - ')}</p>
                    </div>
                )}
                 <div className="flex gap-2 mt-4">
                    <Button onClick={() => setAdvancedStep(wantsMulticlass ? 'multiclassSelection' : 'multiclassDecision')} className="bg-slate-600 hover:bg-slate-500">Volver</Button>
                    <Button onClick={handleAdvancedNextStep} className="bg-green-600 hover:bg-green-700" disabled={rolledAbilityScores.length !== 6}>Siguiente: Asignar</Button>
                </div>
            </div>
        );
        break;
    case 'abilityAssignment':
        advancedContent = (
            <div>
                <h3 className="text-xl font-semibold text-yellow-200 mb-3">Asignar Puntuaciones Tiradas</h3>
                <p className="text-slate-300 mb-1 text-sm">Puntuaciones disponibles para asignar: <strong className="text-yellow-300">{availableRolledScores.join(', ')}</strong></p>
                {selectedRace && <p className="text-xs text-slate-400 mb-3">Bonos raciales (<strong className="text-purple-300">{selectedRace.name}</strong>): {Object.entries(selectedRace.abilityBonuses).map(([k,v]) => `${k.toUpperCase()} +${v}`).join(', ')} se aplicarán después.</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {ABILITIES.map(ability => (
                        <div key={ability.key} className="flex flex-col">
                            <label htmlFor={`adv-${ability.key}`} className="text-sm font-medium text-slate-300 mb-0.5">{ability.name}</label>
                            <select
                                id={`adv-${ability.key}`}
                                value={assignedAdvAbilities[ability.key] || ""}
                                onChange={(e) => handleAdvancedAbilityAssign(ability.key, e.target.value)}
                                className="p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:ring-purple-500"
                            >
                                <option value="">-- Elegir --</option>
                                {assignedAdvAbilities[ability.key] && <option value={assignedAdvAbilities[ability.key]}>{assignedAdvAbilities[ability.key]}</option>}
                                {availableRolledScores.map(score => (
                                    <option key={`${ability.key}-${score}`} value={score}>{score}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-0.5 h-8 overflow-y-auto">{ability.description}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-3 p-2 bg-slate-600/50 rounded">
                    <h4 className="text-sm font-semibold text-yellow-200">Puntuaciones Finales (con bono racial):</h4>
                    <ul className="text-xs grid grid-cols-2 sm:grid-cols-3">
                        {ABILITIES.map(ab => <li key={`final-${ab.key}`}>{ab.name}: <strong className="text-yellow-300">{finalAbilitiesForDisplay[ab.key] || '-'}</strong></li>)}
                    </ul>
                </div>
                {wantsMulticlass && selectedPrimaryClass && selectedSecondaryClass && (
                    <p className="text-xs text-red-400 mt-2">
                        Recuerda: Para {selectedPrimaryClass.name}/{selectedSecondaryClass.name} necesitas:
                        {MULTICLASS_REQUIREMENTS[selectedPrimaryClass.name] && ` ${selectedPrimaryClass.name}: ${Object.entries(MULTICLASS_REQUIREMENTS[selectedPrimaryClass.name]!).map(([k,v])=> `${k.toUpperCase()} ${v}`).join(', ')}`}.
                        {MULTICLASS_REQUIREMENTS[selectedSecondaryClass.name] && ` ${selectedSecondaryClass.name}: ${Object.entries(MULTICLASS_REQUIREMENTS[selectedSecondaryClass.name]!).map(([k,v])=> `${k.toUpperCase()} ${v}`).join(', ')}`}.
                    </p>
                )}

                <div className="flex gap-2 mt-4">
                    <Button onClick={() => setAdvancedStep('abilityRolls')} className="bg-slate-600 hover:bg-slate-500">Volver a Tiradas</Button>
                    <Button onClick={handleAdvancedNextStep} className="bg-green-600 hover:bg-green-700" disabled={Object.keys(assignedAdvAbilities).length !== 6}>Siguiente: Trasfondo</Button>
                </div>
            </div>
        );
        break;
    case 'background':
        advancedContent = (
            <div>
                <h3 className="text-xl font-semibold text-yellow-200 mb-3">Elige tu Pasado (Trasfondo)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto fantasy-scroll pr-2">
                  {ALL_BACKGROUNDS_ADVANCED.map(bg => (
                    <div key={bg.name} className={`p-3 rounded-md border ${selectedBackground?.name === bg.name ? 'bg-purple-700 border-purple-500' : 'bg-slate-700 border-slate-600 hover:border-purple-400'}`}>
                      <h4 className="font-semibold text-lg text-purple-300 flex justify-between items-center cursor-pointer" onClick={() => toggleDetails(bg.name)}>
                        {bg.name}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedBackground(bg); }} className={`ml-2 px-2 py-1 text-xs rounded ${selectedBackground?.name === bg.name ? 'bg-green-500' : 'bg-slate-600 hover:bg-green-600'}`}>
                          {selectedBackground?.name === bg.name ? 'Seleccionado' : 'Elegir'}
                        </button>
                        {showDetails[bg.name] ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </h4>
                      {showDetails[bg.name] && (
                        <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                            <p><strong>Habilidades:</strong> {bg.skillProficiencies.join(', ')}</p>
                            {bg.toolProficiencies && <p><strong>Herram.:</strong> {bg.toolProficiencies.join(', ')}</p>}
                            {bg.languages && <p><strong>Idiomas:</strong> {Array.isArray(bg.languages) ? bg.languages.join(', ') : bg.languages}</p>}
                            <p><strong>Equipo:</strong> {bg.equipment.join(', ')}</p>
                            <p><strong>Rasgo ({bg.featureName}):</strong> {bg.featureDescription}</p>
                            {bg.startingGold && <p><strong>Oro Inicial:</strong> {bg.startingGold} po</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                    <Button onClick={() => setAdvancedStep('abilityAssignment')} className="bg-slate-600 hover:bg-slate-500">Volver a Habilidades</Button>
                    <Button onClick={handleAdvancedNextStep} className="bg-green-600 hover:bg-green-700" disabled={!selectedBackground}>Siguiente: Resumen</Button>
                </div>
            </div>
        );
        break;
    case 'nameAndSummary':
        const finalAdvAbilitiesForSummary = calculateFinalAdvAbilities();
        const conModForAdvSummary = calculateAbilityModifier(finalAdvAbilitiesForSummary.con);
        let hpForAdvSummary = 0;
        let levelForAdvSummary = 1;
        let hitDiceForAdvSummary: HitDice = { total: 1, current: 1, dieType: selectedPrimaryClass?.hitDie || 6 };

        if (selectedPrimaryClass) {
            if (wantsMulticlass && selectedSecondaryClass) {
                levelForAdvSummary = 2;
                hpForAdvSummary = (selectedPrimaryClass.hitDie + conModForAdvSummary) + (getAverageHitDieValue(selectedSecondaryClass.hitDie) + conModForAdvSummary);
                hitDiceForAdvSummary = { total: 2, current: 2, dieType: selectedPrimaryClass.hitDie };
            } else {
                hpForAdvSummary = selectedPrimaryClass.hitDie + conModForAdvSummary;
                hitDiceForAdvSummary = { total: 1, current: 1, dieType: selectedPrimaryClass.hitDie };
            }
        }
        
        const advProfs = getCombinedProficiencies(selectedRace, selectedPrimaryClass, wantsMulticlass ? selectedSecondaryClass : null, selectedBackground);
        
        const advEquipment = selectedPrimaryClass?.startingEquipment ? [...selectedPrimaryClass.startingEquipment] : [];
        if(selectedBackground?.equipment) advEquipment.push(...selectedBackground.equipment);

        const advAc = calculateAc(finalAdvAbilitiesForSummary, advProfs.armors, advEquipment);
        const advChampionAbilities: ChampionAbilities | undefined = selectedPrimaryClass?.name === 'Guerrero' ? { secondWindUsed: false, actionSurgeUsed: false } : undefined;
        const advStartingGold = selectedBackground?.startingGold || 10;

        // Spellcasting info for summary
        let spellSummary: string[] = [];
        const tempCharForSpells = initializeSpellcastingForCharacter({}, selectedPrimaryClass!, wantsMulticlass ? selectedSecondaryClass : null, levelForAdvSummary, finalAdvAbilitiesForSummary);
        
        if (tempCharForSpells.knownSpells && tempCharForSpells.knownSpells.length > 0) {
            spellSummary.push(`Conjuros Conocidos: ${tempCharForSpells.knownSpells.map(s => `${s.name} (N${s.level})`).join(', ')}`);
        }
        if (tempCharForSpells.spellSlots) {
            const slotsDesc = Object.entries(tempCharForSpells.spellSlots)
                .map(([lvl, info]) => `${info.max} de Nivel ${lvl.replace('level', '')}`)
                .filter(s => s.startsWith("1") || s.startsWith("2") || s.startsWith("3") || s.startsWith("4") || s.startsWith("5")) 
                .join('; ');
            if (slotsDesc) spellSummary.push(`Espacios de Conjuro: ${slotsDesc}`);
        }
        if (tempCharForSpells.pactMagicSlots) {
            spellSummary.push(`Magia de Pacto: ${tempCharForSpells.pactMagicSlots.max} espacios de Nivel ${tempCharForSpells.pactMagicSlots.level}`);
        }


        advancedContent = (
            <form onSubmit={handleAdvancedSubmit}>
                <h3 className="text-xl font-semibold text-yellow-200 mb-3">Nombra tu Leyenda y Revisa</h3>
                <div className="mb-4">
                    <label htmlFor="advCharName" className="block text-sm font-medium text-slate-300 mb-1">Nombre de tu Héroe:</label>
                    <input
                        type="text"
                        id="advCharName"
                        value={advancedCharName}
                        onChange={(e) => setAdvancedCharName(e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100"
                        placeholder="Ej: Valerius Arkantos"
                        required
                    />
                </div>
                <div className="bg-slate-700 p-4 rounded-md shadow-inner text-sm space-y-1 max-h-80 overflow-y-auto fantasy-scroll">
                    <p><strong>Raza:</strong> {selectedRace?.name || 'N/A'}</p>
                    <p><strong>Clase Primaria:</strong> {selectedPrimaryClass?.name || 'N/A'}</p>
                    {wantsMulticlass && selectedSecondaryClass && <p><strong>Clase Secundaria:</strong> {selectedSecondaryClass.name}</p>}
                    <p><strong>Nivel:</strong> {levelForAdvSummary}</p>
                    <p><strong>CA:</strong> {advAc}</p>
                    <p><strong>Puntos de Golpe Máximos:</strong> {hpForAdvSummary}</p>
                    <p><strong>Dados de Golpe:</strong> {hitDiceForAdvSummary.total}d{hitDiceForAdvSummary.dieType}</p>
                    <p><strong>Características:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-xs">
                        {ABILITIES.map(ab => <li key={`sum-${ab.key}`}>{ab.name}: {finalAdvAbilitiesForSummary[ab.key] || '-'}</li>)}
                    </ul>
                    <p><strong>Trasfondo:</strong> {selectedBackground?.name || 'N/A'}</p>
                    <p><strong>Habilidades:</strong> {advProfs.skills.join(', ') || 'N/A'}</p>
                    <p><strong>Comp. Armas:</strong> {advProfs.weapons.join(', ') || 'N/A'}</p>
                    <p><strong>Comp. Armaduras:</strong> {advProfs.armors.join(', ') || 'N/A'}</p>
                    <p><strong>Comp. Salvaciones:</strong> {advProfs.savingThrows.map(st => st.toUpperCase()).join(', ') || 'N/A'}</p>
                    <p><strong>Equipo:</strong> {advEquipment.join(', ') || 'Equipo Básico'}</p>
                    <p><strong>Oro Inicial:</strong> {advStartingGold} po</p>
                    <p><strong>XP Inicial:</strong> 0</p>
                     {advChampionAbilities && (
                        <>
                        <p><strong>Aliento de Combate Disponible:</strong> Sí</p>
                        <p><strong>Oleada de Acción Disponible:</strong> Sí</p>
                        </>
                    )}
                    {spellSummary.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-slate-600/50">
                            <h5 className="font-semibold text-purple-300">Magia:</h5>
                            {spellSummary.map((s, i) => <p key={i} className="text-xs">{s}</p>)}
                        </div>
                    )}
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button type="button" onClick={() => setAdvancedStep('background')} className="bg-slate-600 hover:bg-slate-500 w-full sm:w-auto">Volver a Trasfondo</Button>
                    <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto" disabled={!advancedCharName.trim()}>
                        <CheckCircleIcon className="w-5 h-5 mr-2"/>Confirmar Mi Leyenda
                    </Button>
                </div>
                 <Button type="button" onClick={restartAdvancedFlow} className="text-sm text-slate-400 hover:text-yellow-300 underline mt-3 flex items-center justify-center mx-auto">
                    <RefreshIcon className="w-4 h-4 mr-1"/>Reiniciar Creación Avanzada
                </Button>
            </form>
        );
        break;
      default: advancedContent = <p>Paso desconocido.</p>;
    }

    return (
      <div className="flex flex-col items-center p-4 w-full">
        <h2 className="text-3xl font-bold text-yellow-300 mb-1 flex items-center">
          <UserPlusIcon className="w-8 h-8 mr-3 text-yellow-400" />
          Crea tu Leyenda Avanzada
        </h2>
        <p className="text-slate-400 mb-4 text-sm">Nivel de Experiencia: {experienceLevel}</p>
        {error && <p className="text-red-400 bg-red-900 p-2 rounded-md mb-3 text-sm text-center">{error}</p>}
        <div className="w-full max-w-xl lg:max-w-2xl p-4 md:p-6 bg-slate-800/60 rounded-lg shadow-xl border border-slate-700">
            {advancedContent}
        </div>
        <Button onClick={onBack} className="mt-6 bg-slate-600 hover:bg-slate-500 text-white">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver a Nivel de Experiencia
        </Button>
      </div>
    );

  } else { // Intermediate Flow (Gemini)
    return (
      <div className="flex flex-col items-center p-4">
        <h2 className="text-3xl font-bold text-yellow-300 mb-6 flex items-center">
          <UserPlusIcon className="w-8 h-8 mr-3 text-yellow-400" />
          Forja tu Héroe
        </h2>
         <p className="text-slate-400 mb-6 text-sm">Nivel de Experiencia: {experienceLevel}</p>

        {isGenerating && (
            <div className="text-center my-6">
                <SparklesIcon className="w-10 h-10 text-yellow-400 mx-auto animate-pulse mb-2" />
                <p className="text-lg text-slate-300">Los espíritus creativos están conjurando sugerencias...</p>
            </div>
         )}
        {error && (
            <div className="my-6 p-4 bg-red-800/30 border border-red-700 rounded-md text-center">
                <p className="text-red-300">{error}</p>
                <Button onClick={onBack} className="mt-4 bg-slate-600 hover:bg-slate-500">Reintentar o Volver</Button>
            </div>
        )}
        {generatedSuggestion && !isGenerating && (
             <div className="my-6 p-4 bg-slate-700/50 border border-slate-600 rounded-md w-full max-w-xl">
                <h3 className="text-lg font-semibold text-yellow-200 mb-2">Sugerencias de los Antiguos:</h3>
                <pre className="text-sm text-slate-200 whitespace-pre-wrap overflow-x-auto fantasy-scroll p-2 bg-slate-800/50 rounded">{generatedSuggestion}</pre>
            </div>
        )}

        <form onSubmit={handleSubmitIntermediate} className="w-full max-w-md space-y-6 bg-slate-700 p-8 rounded-lg shadow-md">
          <div>
            <label htmlFor="characterNameInt" className="block text-sm font-medium text-slate-300 mb-1">Nombre del Personaje:</label>
            <input id="characterNameInt" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 bg-slate-800 border-slate-600 rounded text-slate-100" placeholder="Ej: Roric el Audaz" />
          </div>
          <div>
            <label htmlFor="characterClassInt" className="block text-sm font-medium text-slate-300 mb-1">Clase del Personaje:</label>
            <select id="characterClassInt" value={characterClass} onChange={e => setCharacterClass(e.target.value)} className="w-full p-2 bg-slate-800 border-slate-600 rounded text-slate-100">
                {ALL_CLASSES_ADVANCED.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-400">Para el nivel Intermedio, los detalles como raza, habilidades y trasfondo se simplificarán o asignarán valores por defecto para agilizar la creación. La CA y los Puntos de Golpe se calcularán automáticamente.</p>
          <div className="flex gap-4 pt-4">
            <Button type="button" onClick={onBack} className="bg-slate-600 hover:bg-slate-500 text-white">
                <ArrowLeftIcon className="w-4 h-4 mr-2"/>Volver
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isGenerating || !name.trim()}>
                <CheckCircleIcon className="w-5 h-5 mr-2"/>Crear Personaje
            </Button>
          </div>
        </form>
      </div>
    );
  }
};

export default CharacterCreationScreen;