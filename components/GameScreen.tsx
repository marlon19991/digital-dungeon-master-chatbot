

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Character, Enemy, CombatParticipant, AttackRollResult, AbilityKey, ChampionAbilities, Spell, SpellSlots, PactMagicSlots, SkillCheckResult, SavingThrowResult, Shopkeeper, FeatDetail, SceneNode, SceneOption, GameScreenApi, SceneSkillCheckDetails as TypesSceneSkillCheckDetails, SceneCombatDetails, SceneRestDetails } from '../types';
import Button from './shared/Button';
import { geminiService } from '../services/geminiService';
import { PaperAirplaneIcon, SparklesIcon, ArrowPathIcon, ArrowUturnLeftIcon, UserCircleIcon, Cog6ToothIcon, HeartIcon, CubeIcon, PlusCircleIcon, MinusCircleIcon, ShieldExclamationIcon, HandRaisedIcon, WandSparklesIcon, ArrowsUpDownLeftRightIcon, PuzzlePieceIcon, MagnifyingGlassIcon, ClockIcon, ArrowRightIcon, BoltIcon, ShieldCheckIcon, BookOpenIcon, BrainIcon, WindIcon, EyeIcon, LockOpenIcon, ArrowsPointingOutIcon, ChatBubbleLeftRightIcon, ShieldPlusIcon, BackpackIcon, CircleDollarSignIcon, GlassDrinkIcon, ArrowUpOnSquareIcon, ArrowUpCircleIcon, ChevronDownIcon, ChevronUpIcon, StarIcon } from './shared/Icons';
import { rollD20 as rollD20ForDiceUtil, rollDie, rollDice } from '../utils/diceUtils';
import { SPELLS_DATA, ABILITIES, SKILL_TO_ABILITY_MAP, ITEMS_DATA, SHOPKEEPERS_DATA, XP_THRESHOLDS_PER_LEVEL, getAverageHitDieValue as getAvgHitDie, ALL_CLASSES_ADVANCED, FEATS_DATA, ADVENTURE_START_NODE_ID, PREDEFINED_ENEMY_GROUPS } from '../constants';
import { calculateAbilityModifier, getProficiencyBonus, getAttackRollDetails, getSkillCheckResult, getSavingThrowResult, calculateAc as calculateCharacterAc } from '../utils/characterUtils';
import { manageCharacterSpellcasting } from '../utils/spellcastingUtils';
import { adventureData } from '../adventureData';


interface GameScreenProps {
  character: Character;
  onExitGame: () => void;
  updateCharacterStats: (updatedStats: Partial<Character>) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'dm' | 'system' | 'scene';
  timestamp: Date;
  attackRollData?: AttackRollResult;
  skillCheckData?: SkillCheckResult;
  savingThrowData?: SavingThrowResult;
}

type ASIChoiceModalState = 'choice' | 'asi_detail_plus_two' | 'asi_detail_plus_one_one' | 'feat_detail' | null;


const GameScreen: React.FC<GameScreenProps> = ({ character: initialCharacter, onExitGame, updateCharacterStats: propagateUpdate }) => {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isDMThinking, setIsDMThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dmName = "Maestro de Mazmorras";

  const [currentSceneId, setCurrentSceneId] = useState<string>(ADVENTURE_START_NODE_ID);
  const [currentScene, setCurrentScene] = useState<SceneNode | null>(null);

  const [showShortRestModal, setShowShortRestModal] = useState<boolean>(false);
  const [hitDiceToSpend, setHitDiceToSpend] = useState<number>(1);
  
  const [isInCombat, setIsInCombat] = useState<boolean>(false);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  // combatParticipants is not strictly needed in state if initiativeOrder holds all current combatants
  // const [combatParticipants, setCombatParticipants] = useState<CombatParticipant[]>([]); 
  const [initiativeOrder, setInitiativeOrder] = useState<CombatParticipant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [playerTookActionThisTurn, setPlayerTookActionThisTurn] = useState(false);
  const [combatJustEnded, setCombatJustEnded] = useState<boolean>(false);
  const [lastAttackResult, setLastAttackResult] = useState<AttackRollResult | null>(null);
  const [combatVictoryNode, setCombatVictoryNode] = useState<string | undefined>(undefined);
  const [combatDefeatNode, setCombatDefeatNode] = useState<string | undefined>(undefined);


  const [playerHasBonusAction, setPlayerHasBonusAction] = useState<boolean>(true);
  const [playerUsedActionSurgeThisTurn, setPlayerUsedActionSurgeThisTurn] = useState<boolean>(false);

  const [showSpellbookModal, setShowSpellbookModal] = useState<boolean>(false);
  const [spellbookContext, setSpellbookContext] = useState<'casting' | 'divineSmite' | null>(null);
  // spellToCast is not used, casting directly from modal
  // const [spellToCast, setSpellToCast] = useState<Spell | null>(null);
  
  const [showEnvironmentalSkillCheckModal, setShowEnvironmentalSkillCheckModal] = useState<{ skill: string; ability: AbilityKey; actionDescription: string, sceneOption: SceneOption } | null>(null);
  const [skillCheckTargetDC, setSkillCheckTargetDC] = useState<number>(15);
  const [skillCheckHasAdvantage, setSkillCheckHasAdvantage] = useState<boolean>(false);
  const [skillCheckHasDisadvantage, setSkillCheckHasDisadvantage] = useState<boolean>(false);
  
  const [showSavingThrowModal, setShowSavingThrowModal] = useState<{ savingThrowAbility: AbilityKey; effectDescription: string, sceneOption: SceneOption } | null>(null);
  const [savingThrowTargetDC, setSavingThrowTargetDC] = useState<number>(13);
  const [savingThrowHasAdvantage, setSavingThrowHasAdvantage] = useState<boolean>(false);
  const [savingThrowHasDisadvantage, setSavingThrowHasDisadvantage] = useState<boolean>(false);

  const [activeWeapon, setActiveWeapon] = useState<string | null>(() => {
    return initialCharacter.equipment.find(itemName => ITEMS_DATA[itemName]?.type === 'weapon') || null;
  });
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [currentShopkeeper, setCurrentShopkeeper] = useState<Shopkeeper | null>(null);
  
  const [showASIChoiceModal, setShowASIChoiceModal] = useState<ASIChoiceModalState>(null);
  const [asiStat1, setAsiStat1] = useState<AbilityKey | ''>('');
  const [asiStat2, setAsiStat2] = useState<AbilityKey | ''>('');

  const localUpdateCharacterStats = useCallback((updatedStats: Partial<Character>) => {
    setCharacter(prev => {
      const newChar = { ...prev, ...updatedStats };
      // Ensure AC is recalculated if abilities or equipment changed that might affect it
      if (updatedStats.abilities || updatedStats.equipment || updatedStats.armorProficiencies) {
        newChar.armorClass = calculateCharacterAc(newChar.abilities, newChar.armorProficiencies, newChar.equipment);
      }
      propagateUpdate(newChar); 
      return newChar;
    });
  }, [propagateUpdate]);

  // Forward declaration for addMessage due to circular dependencies in callbacks
  const addMessageRef = useRef<typeof addMessage>(null);

  const addXp = useCallback((amount: number) => {
    if (amount <= 0) return;
    // Use functional update for setCharacter to ensure access to the latest state
    setCharacter(prevChar => {
      const newXp = prevChar.xp + amount;
      if (addMessageRef.current) {
        addMessageRef.current(`¡Has ganado ${amount} XP! (Total: ${newXp})`, 'system');
      }
      const charWithNewXp = { ...prevChar, xp: newXp };
      // Call checkAndHandleLevelUp with the character state that includes the new XP
      // checkAndHandleLevelUp itself will handle further state updates if level up occurs
      checkAndHandleLevelUp(newXp, charWithNewXp);
      // Return the state with new XP, further updates from level up will be handled by checkAndHandleLevelUp/finalizeLevelUp
      // propagateUpdate will be called by localUpdateCharacterStats or finalizeLevelUp
      return charWithNewXp; 
    });
  }, [ /* Dependencies for checkAndHandleLevelUp will be complex, handled by its own useCallback if needed */ ]);


  const addMessage = useCallback((text: string, sender: Message['sender'], data?: AttackRollResult | SkillCheckResult | SavingThrowResult) => {
    let fullText = text;
    if (data && 'details' in data && typeof data.details === 'string') {
        fullText = data.details;
    }
    const newMessage: Message = {
        id: `${sender}-${Date.now()}-${Math.random()}`, text: fullText.trim(), sender, timestamp: new Date(),
    };
    if (data) {
        if ('totalAttackRoll' in data) newMessage.attackRollData = data as AttackRollResult;
        else if ('skillName' in data) newMessage.skillCheckData = data as SkillCheckResult;
        else if ('savingThrowAbility' in data) newMessage.savingThrowData = data as SavingThrowResult;
    }
    setMessages(prev => [...prev, newMessage]);

    if (sender === 'dm') {
        const { itemsFound, goldFound } = parseGeminiLoot(text);
        // Use setCharacter with functional update to ensure we're working with the latest state
        setCharacter(prevChar => {
          let charToUpdate = { ...prevChar };
          let changed = false;
          if (itemsFound.length > 0 || goldFound > 0) {
              charToUpdate.equipment = [...charToUpdate.equipment, ...itemsFound];
              charToUpdate.gold = charToUpdate.gold + goldFound;
              changed = true;

              let lootMessageText = "Has encontrado: ";
              if (itemsFound.length > 0) lootMessageText += itemsFound.map(id => ITEMS_DATA[id]?.name || id).join(', ') + ". ";
              if (goldFound > 0) lootMessageText += `${goldFound} po.`;
              // Recursively call addMessage via ref if available, ensuring it's the memoized version
              if (addMessageRef.current) addMessageRef.current(lootMessageText, 'system');
          }
          const foundItem = parseFoundItem(text);
          if (foundItem) {
              charToUpdate.equipment = [...charToUpdate.equipment, foundItem];
              changed = true;
              if (addMessageRef.current) addMessageRef.current(`Has encontrado: ${ITEMS_DATA[foundItem]?.name || foundItem}.`, 'system');
          }
          
          if (changed) {
            // Call localUpdateCharacterStats (which calls propagateUpdate) only if actual changes occurred
            // This relies on localUpdateCharacterStats correctly handling prev state or direct values
            localUpdateCharacterStats({ equipment: charToUpdate.equipment, gold: charToUpdate.gold });
          }
          return charToUpdate; // Return the potentially modified character state
        });

        const xpAwardedByDm = parseGeminiXPAward(text);
        if (xpAwardedByDm > 0) addXp(xpAwardedByDm);
    }
  }, [localUpdateCharacterStats, addXp]); // Removed character from deps, using functional updates for setCharacter

  // Assign the memoized addMessage to the ref
  useEffect(() => {
    addMessageRef.current = addMessage;
  }, [addMessage]);


  const checkAndHandleLevelUp = useCallback((currentXp: number, charToCheck: Character) => {
    const currentLevel = charToCheck.level;
    if (currentLevel >= XP_THRESHOLDS_PER_LEVEL.length -1) return;
    const xpNeededForNextLevel = XP_THRESHOLDS_PER_LEVEL[currentLevel + 1];

    if (xpNeededForNextLevel !== undefined && charToCheck.xp >= xpNeededForNextLevel) {
        const newLevel = currentLevel + 1;
        if (addMessageRef.current) addMessageRef.current(`¡SUBIDA DE NIVEL! Has alcanzado el Nivel ${newLevel}.`, 'system');
        
        const primaryClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === charToCheck.primaryClass);
        if (!primaryClassDetails) return;

        const conMod = calculateAbilityModifier(charToCheck.abilities.con);
        const hpIncrease = getAvgHitDie(primaryClassDetails.hitDie) + conMod;
        const newMaxHp = charToCheck.maxHp + Math.max(1, hpIncrease);
        
        let updatedStatsForLevelUp: Partial<Character> = {
            level: newLevel, maxHp: newMaxHp, currentHp: newMaxHp,
            hitDice: { ...charToCheck.hitDice, total: newLevel, current: (charToCheck.hitDice.current + 1 > newLevel ? newLevel : charToCheck.hitDice.current + 1) }
        };
        
        if (primaryClassDetails.asiLevels?.includes(newLevel)) {
            setShowASIChoiceModal('choice'); 
            setCharacter(prev => ({...prev, ...updatedStatsForLevelUp})); 
            return; 
        }
        finalizeLevelUp(updatedStatsForLevelUp, charToCheck);
    }
  }, [ /* finalizeLevelUp will be a dep */ ]);


  const finalizeLevelUp = useCallback((levelUpChanges: Partial<Character>, charBeforeASI: Character) => {
    const charAfterInitialChanges = { ...charBeforeASI, ...levelUpChanges };
    const primaryClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === charAfterInitialChanges.primaryClass);
    const secondaryClassDetails = charAfterInitialChanges.multiclassOption ? ALL_CLASSES_ADVANCED.find(c => c.name === charAfterInitialChanges.multiclassOption) : undefined;
    
    const spellcastingUpdates = manageCharacterSpellcasting(charAfterInitialChanges, primaryClassDetails!, secondaryClassDetails, charAfterInitialChanges.level);
    const finalUpdatedStats: Partial<Character> = { ...charAfterInitialChanges, ...spellcastingUpdates };
    
    if (finalUpdatedStats.abilities || finalUpdatedStats.equipment || finalUpdatedStats.armorProficiencies) {
      finalUpdatedStats.armorClass = calculateCharacterAc(finalUpdatedStats.abilities!, finalUpdatedStats.armorProficiencies!, finalUpdatedStats.equipment!);
    }

    localUpdateCharacterStats(finalUpdatedStats);
    if (addMessageRef.current) addMessageRef.current(`Nivel ${finalUpdatedStats.level} alcanzado. HP máx: ${finalUpdatedStats.maxHp}. Capacidades actualizadas.`, 'system');
    
    setCharacter(prevFinalChar => {
        // Use a timeout to avoid immediate state update conflicts if checkAndHandleLevelUp causes further updates
        setTimeout(() => checkAndHandleLevelUp(prevFinalChar.xp, prevFinalChar), 0);
        return prevFinalChar;
    });
  }, [localUpdateCharacterStats, checkAndHandleLevelUp /* addMessageRef indirectly used */ ]);
  
  // Now that finalizeLevelUp is defined, checkAndHandleLevelUp's useCallback can be finalized
  // Re-declare checkAndHandleLevelUp with finalizeLevelUp in its dependency array if it wasn't implicitly captured.
  // However, since finalizeLevelUp calls checkAndHandleLevelUp, this forms a cycle if not careful.
  // The current structure with setTimeout in finalizeLevelUp for the recursive check might be okay.

  const handleGeminiResponse = useCallback(async (promptForDM: string) => {
    setIsDMThinking(true);
    let dmResponseText = "(Respuesta de marcador de posición del DM para la acción del jugador.)";
     if (typeof process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
       await new Promise(resolve => setTimeout(resolve, 1000));
        if (promptForDM.includes("Saquear y Buscar")) {
            dmResponseText = "Registras el área. [LOOT_ITEM:Daga] [LOOT_GOLD:5]";
        } else if (promptForDM.includes("éxito")) {
            dmResponseText = "¡Lo logras! El camino se despeja.";
        } else if (promptForDM.includes("fallo")) {
            dmResponseText = "Fallaste. Nada parece cambiar, o quizás las cosas empeoran un poco.";
        }
    } else {
        try {
            dmResponseText = await geminiService.generateText(promptForDM);
        } catch (error) {
            console.warn("API call failed, using fallback.", error);
            dmResponseText = `Las antiguas magias (API Gemini) fallan. Describe tu acción de nuevo o de otra forma. (Error: ${error instanceof Error ? error.message : String(error)})`;
        }
    }
    if (addMessageRef.current) addMessageRef.current(dmResponseText, 'dm');
    setIsDMThinking(false);
  }, [/* addMessageRef indirectly used */]);

  const handleOpenShop = useCallback((shopId: string) => {
    const shopData = SHOPKEEPERS_DATA[shopId];
    if (shopData) {
      setCurrentShopkeeper(shopData);
      setShowShopModal(true);
    } else {
      if (addMessageRef.current) addMessageRef.current("Tienda no disponible.", "system");
    }
  }, [/* setCurrentShopkeeper, setShowShopModal, addMessageRef */]);

  const handleInitiateCombat = useCallback((enemyGroupIds: string[], victoryNode?: string, defeatNode?: string, combatDesc?: string) => {
    setIsInCombat(true);
    setCombatJustEnded(false);
    setLastAttackResult(null);
    setCombatVictoryNode(victoryNode);
    setCombatDefeatNode(defeatNode);
    // ... (rest of the logic from original handleInitiateCombat)
    // Make sure to use addMessageRef.current where addMessage was used
    const currentEnemiesSetup: Enemy[] = [];
    enemyGroupIds.forEach(groupId => {
        const groupTemplate = PREDEFINED_ENEMY_GROUPS[groupId];
        if (groupTemplate) {
            groupTemplate.enemies.forEach((eTemplate, index) => {
                const enemyInstance = JSON.parse(JSON.stringify(eTemplate));
                enemyInstance.currentHp = enemyInstance.maxHp;
                enemyInstance.id = `${eTemplate.id}_${groupId}_${index}_${Math.random().toString(36).substring(2,7)}`;
                currentEnemiesSetup.push(enemyInstance);
            });
        } else console.warn(`Grupo de enemigos no encontrado: ${groupId}`);
    });
    if (currentEnemiesSetup.length === 0) {
        if(addMessageRef.current) addMessageRef.current("No hay enemigos para este encuentro.", "system");
        if(victoryNode) setCurrentSceneId(victoryNode); else if(addMessageRef.current) addMessageRef.current("El combate concluye.", "system");
        setIsInCombat(false); return;
    }
    setEnemies(currentEnemiesSetup);
    const participants: CombatParticipant[] = [ { ...character, participantType: 'player' }, ...currentEnemiesSetup.map(e => ({ ...e, participantType: 'enemy' as 'enemy' }))];
    participants.forEach(p => { const dexScore = p.participantType === 'player' ? (p as Character).abilities.dex : (p as Enemy).dexterity; p.initiativeRoll = rollD20ForDiceUtil().finalRoll + calculateAbilityModifier(dexScore); });
    participants.sort((a, b) => (b.initiativeRoll || 0) - (a.initiativeRoll || 0));
    setInitiativeOrder(participants); setCurrentTurnIndex(0); setCurrentTargetId(null); setPlayerTookActionThisTurn(false); setPlayerHasBonusAction(true); setPlayerUsedActionSurgeThisTurn(false);
    const initOrderText = participants.map((p, i) => `${i + 1}. ${p.name} (Iniciativa ${p.initiativeRoll})`).join('\n');
    if(addMessageRef.current) addMessageRef.current(`¡Combate iniciado! ${combatDesc || PREDEFINED_ENEMY_GROUPS[enemyGroupIds[0]]?.description || ""}\nOrden de Iniciativa:\n${initOrderText}`, 'system');
    const firstParticipant = participants[0];
    if (firstParticipant.participantType === 'player') { if(addMessageRef.current) addMessageRef.current(`${character.name}, ¡es tu turno!`, 'system'); }
    else { if(addMessageRef.current) addMessageRef.current(`Turno de ${firstParticipant.name}.`, 'system'); setTimeout(() => handleEnemyTurn(firstParticipant as Enemy), 1000); }
  }, [character /*, other state setters, handleEnemyTurn */]);


  const gameScreenApi = useMemo((): GameScreenApi => ({
    updateCharacterStats: localUpdateCharacterStats,
    addSystemMessage: (message, data) => addMessageRef.current ? addMessageRef.current(message, 'system', data) : undefined,
    addPlayerMessage: (message) => addMessageRef.current ? addMessageRef.current(message, 'user') : undefined,
    addDmMessage: (message) => addMessageRef.current ? addMessageRef.current(message, 'dm') : undefined,
    initiateCombat: handleInitiateCombat,
    openShop: handleOpenShop,
    changeScene: setCurrentSceneId, // Direct setter is stable
    getCharacter: () => character, // This will return the character state at the time gameScreenApi was created/memoized
  }), [localUpdateCharacterStats, handleInitiateCombat, handleOpenShop, setCurrentSceneId, character]);
  // Note: `character` in getCharacter means gameScreenApi changes if character identity changes.
  // This might be okay if onEnter/description logic expects it.
  // Or, getCharacter could be `() => charRef.current` if we introduce a charRef.

  useEffect(() => {
    setCharacter(initialCharacter);
    const firstWeapon = initialCharacter.equipment.find(itemName => ITEMS_DATA[itemName]?.type === 'weapon');
    setActiveWeapon(firstWeapon || null);
  }, [initialCharacter]);
  
  useEffect(() => {
    const newScene = adventureData[currentSceneId];
    if (newScene) {
        setCurrentScene(newScene);
        setShowEnvironmentalSkillCheckModal(null);
        setShowSavingThrowModal(null);
        setCombatJustEnded(false);

        if (newScene.description) {
            // Pass character directly, gameScreenApi is memoized
            const descText = typeof newScene.description === 'function' ? newScene.description(character, gameScreenApi) : newScene.description;
            if (addMessageRef.current) addMessageRef.current(descText, 'scene');
        }
        if (newScene.onEnter) {
            // Pass character directly
            Promise.resolve(newScene.onEnter(character, gameScreenApi)).catch(err => console.error("Error in onEnter:", err));
        }
    } else if (currentSceneId === "RESET_GAME_STATE") {
        onExitGame(); // onExitGame is a prop, assumed stable or memoized by parent
    } else {
        console.error(`Escena no encontrada: ${currentSceneId}`);
        if (addMessageRef.current) addMessageRef.current(`Error: La escena "${currentSceneId}" no existe. Volviendo a la introducción.`, 'system');
        setCurrentSceneId(ADVENTURE_START_NODE_ID); // setCurrentSceneId is stable
    }
  }, [currentSceneId, gameScreenApi, onExitGame, character /*character is kept here based on its usage in onEnter/description, loop risk is noted*/]);
  // The original eslint-disable is removed. If character causes loops,
  // then onEnter/description functions need to be refactored not to trigger updates that cause loops for the same scene.

  
  const currentParticipant = isInCombat ? initiativeOrder[currentTurnIndex] : null;
  const isPlayerTurn = isInCombat && currentParticipant?.participantType === 'player';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const parseGeminiLoot = (dmResponse: string): { itemsFound: string[], goldFound: number } => {
    const itemsFound: string[] = [];
    let goldFound = 0;
    const itemRegex = /\[\s*LOOT_ITEM\s*:\s*([^\]]+?)\s*\]/gi;
    const goldRegex = /\[\s*LOOT_GOLD\s*:\s*(\d+)\s*\]/gi;
    let match;

    while ((match = itemRegex.exec(dmResponse)) !== null) {
      const itemName = match[1].trim();
      if (ITEMS_DATA[itemName]) {
        itemsFound.push(itemName);
      } else {
        console.warn(`Loot no reconocido (después de trim): ${itemName}`);
      }
    }

    while ((match = goldRegex.exec(dmResponse)) !== null) {
      const goldValue = match[1].trim();
      const parsedGold = parseInt(goldValue, 10);
      if (!isNaN(parsedGold)) {
        goldFound += parsedGold;
      } else {
        console.warn(`Valor de oro inválido encontrado: ${goldValue}`);
      }
    }
    return { itemsFound, goldFound };
  };

  const parseFoundItem = (dmResponse: string): string | null => {
    const itemRegex = /\[\s*FOUND_ITEM\s*:\s*([^\]]+?)\s*\]/i;
    const match = dmResponse.match(itemRegex);
    if (match && match[1]) {
      const itemName = match[1].trim();
      if (ITEMS_DATA[itemName]) {
        return itemName;
      } else {
        console.warn(`Item encontrado no reconocido (después de trim): ${itemName}`);
        return null;
      }
    }
    return null;
  };

  const parseGeminiXPAward = (dmResponse: string): number => {
    const xpRegex = /\[\s*XP_AWARDED\s*:\s*(\d+)\s*\]/i;
    const match = dmResponse.match(xpRegex);
    if (match && match[1]) {
      const xpValue = match[1].trim();
      const parsedXP = parseInt(xpValue, 10);
      if (!isNaN(parsedXP)) {
        return parsedXP;
      } else {
        console.warn(`Valor de XP inválido encontrado: ${xpValue}`);
        return 0;
      }
    }
    return 0;
  };

  const addMessage = (text: string, sender: Message['sender'], data?: AttackRollResult | SkillCheckResult | SavingThrowResult) => {
    let fullText = text;
     // For skill/saving throw/attack results, the 'details' property contains the pre-formatted string
    if (data && 'details' in data && typeof data.details === 'string') {
        fullText = data.details;
    }
    
    const newMessage: Message = {
        id: `${sender}-${Date.now()}-${Math.random()}`, text: fullText.trim(), sender, timestamp: new Date(),
    };
    if (data) {
        if ('totalAttackRoll' in data) newMessage.attackRollData = data as AttackRollResult;
        else if ('skillName' in data) newMessage.skillCheckData = data as SkillCheckResult;
        else if ('savingThrowAbility' in data) newMessage.savingThrowData = data as SavingThrowResult;
    }


    setMessages(prev => [...prev, newMessage]);

    if (sender === 'dm') {
        const { itemsFound, goldFound } = parseGeminiLoot(text);
        if (itemsFound.length > 0 || goldFound > 0) {
            const currentCharacterState = { ...character }; // Use latest character state
            const newEquipment = [...currentCharacterState.equipment, ...itemsFound];
            const newGold = currentCharacterState.gold + goldFound;
            localUpdateCharacterStats({ equipment: newEquipment, gold: newGold });
            let lootMessage = "Has encontrado: ";
            if (itemsFound.length > 0) lootMessage += itemsFound.map(id => ITEMS_DATA[id]?.name || id).join(', ') + ". ";
            if (goldFound > 0) lootMessage += `${goldFound} po.`;
            addMessage(lootMessage, 'system');
        }
        const foundItem = parseFoundItem(text);
        if (foundItem) {
            localUpdateCharacterStats({ equipment: [...character.equipment, foundItem]});
            addMessage(`Has encontrado: ${ITEMS_DATA[foundItem]?.name || foundItem}.`, 'system');
        }
        const xpAwarded = parseGeminiXPAward(text);
        if (xpAwarded > 0) addXp(xpAwarded);
    }
  };
  
  const checkAndHandleLevelUp = (currentXp: number, charToCheck?: Character) => {
    const charForLevelCheck = charToCheck || character; 
    const currentLevel = charForLevelCheck.level;
    if (currentLevel >= XP_THRESHOLDS_PER_LEVEL.length -1) return; // Max level reached or bad data

    const xpNeededForNextLevel = XP_THRESHOLDS_PER_LEVEL[currentLevel + 1];

    if (xpNeededForNextLevel !== undefined && charForLevelCheck.xp >= xpNeededForNextLevel) {
        const newLevel = currentLevel + 1;
        addMessage(`¡SUBIDA DE NIVEL! Has alcanzado el Nivel ${newLevel}.`, 'system');
        const primaryClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === charForLevelCheck.primaryClass);
        if (!primaryClassDetails) return;

        const conMod = calculateAbilityModifier(charForLevelCheck.abilities.con);
        const hpIncrease = getAvgHitDie(primaryClassDetails.hitDie) + conMod;
        const newMaxHp = charForLevelCheck.maxHp + Math.max(1, hpIncrease);
        
        let updatedStatsForLevelUp: Partial<Character> = {
            level: newLevel, maxHp: newMaxHp, currentHp: newMaxHp,
            hitDice: { ...charForLevelCheck.hitDice, total: newLevel, current: (charForLevelCheck.hitDice.current + 1 > newLevel ? newLevel : charForLevelCheck.hitDice.current + 1) }
        };
        
        if (primaryClassDetails.asiLevels?.includes(newLevel)) {
            setShowASIChoiceModal('choice'); 
            // Apply level and HP changes first, ASI/Feat comes after modal choice
            setCharacter(prev => ({...prev, ...updatedStatsForLevelUp})); 
            // propagateUpdate is not called here, it's called in finalizeLevelUp
            return; 
        }
        finalizeLevelUp(updatedStatsForLevelUp, charForLevelCheck);
    }
};

const finalizeLevelUp = (levelUpChanges: Partial<Character>, charBeforeASI?: Character) => {
    const charAfterInitialChanges = { ...(charBeforeASI || character), ...levelUpChanges };
    const primaryClassDetails = ALL_CLASSES_ADVANCED.find(c => c.name === charAfterInitialChanges.primaryClass);
    const secondaryClassDetails = charAfterInitialChanges.multiclassOption ? ALL_CLASSES_ADVANCED.find(c => c.name === charAfterInitialChanges.multiclassOption) : undefined;
    
    const spellcastingUpdates = initializeSpellcastingForCharacterUpdate(charAfterInitialChanges, primaryClassDetails, secondaryClassDetails);

    const finalUpdatedStats: Partial<Character> = { ...charAfterInitialChanges, ...spellcastingUpdates };
    
    // Ensure AC is recalculated with potentially new Dex from ASI
    if (finalUpdatedStats.abilities || finalUpdatedStats.equipment || finalUpdatedStats.armorProficiencies) {
      finalUpdatedStats.armorClass = calculateCharacterAc(finalUpdatedStats.abilities!, finalUpdatedStats.armorProficiencies!, finalUpdatedStats.equipment!);
    }

    localUpdateCharacterStats(finalUpdatedStats); // This will call propagateUpdate
    addMessage(`Nivel ${finalUpdatedStats.level} alcanzado. HP máx: ${finalUpdatedStats.maxHp}. Capacidades actualizadas.`, 'system');
    
    // Check for further level-ups if a large XP amount was granted
    // Ensure we use the fully updated character state for the next check
    setCharacter(prevFinalChar => {
        setTimeout(() => checkAndHandleLevelUp(prevFinalChar.xp, prevFinalChar), 0);
        return prevFinalChar;
    });
};


const handleASIChoice = (choice: 'asi' | 'feat') => {
    if (choice === 'asi') setShowASIChoiceModal('asi_detail_plus_two'); // Default to +2 for simplicity in UI flow
    else setShowASIChoiceModal('feat_detail');
};

const handleApplyASI = (type: '+2' | '+1+1', stat1Key: AbilityKey, stat2Key?: AbilityKey) => {
    let newAbilities = { ...character.abilities };
    let asiAppliedMessage = "Puntuaciones de Característica mejoradas: ";
    if (type === '+2' && stat1Key) {
        newAbilities[stat1Key] = (newAbilities[stat1Key] || 0) + 2;
        asiAppliedMessage += `${ABILITIES.find(a=>a.key === stat1Key)?.name} +2.`;
    } else if (type === '+1+1' && stat1Key && stat2Key) {
        newAbilities[stat1Key] = (newAbilities[stat1Key] || 0) + 1;
        newAbilities[stat2Key] = (newAbilities[stat2Key] || 0) + 1;
        asiAppliedMessage += `${ABILITIES.find(a=>a.key === stat1Key)?.name} +1, ${ABILITIES.find(a=>a.key === stat2Key)?.name} +1.`;
    } else {
        addMessage("Selección de ASI inválida.", "system");
        return;
    }
    finalizeLevelUp({ abilities: newAbilities }, character); // Pass current char as charBeforeASI
    addMessage(asiAppliedMessage, 'system');
    setShowASIChoiceModal(null); setAsiStat1(''); setAsiStat2('');
};

const handleSelectFeat = (featId: string) => {
    const feat = FEATS_DATA[featId];
    if (!feat) return;
    const newFeats = [...(character.feats || []), featId];
    finalizeLevelUp({ feats: newFeats }, character); // Pass current char as charBeforeASI
    addMessage(`Has adquirido la dote: ${feat.name}! (${feat.description})`, 'system');
    setShowASIChoiceModal(null);
};

  const addXp = (amount: number) => {
    if (amount <= 0) return;
    const newXp = character.xp + amount;
    addMessage(`¡Has ganado ${amount} XP! (Total: ${newXp})`, 'system');
    localUpdateCharacterStats({ xp: newXp }); // Update XP first
    // Pass the character with updated XP to checkAndHandleLevelUp
    setCharacter(prev => {
        const charWithNewXp = {...prev, xp: newXp};
        checkAndHandleLevelUp(newXp, charWithNewXp); 
        return charWithNewXp;
    });
  };

  const handleGeminiResponse = useCallback(async (promptForDM: string) => {
      setIsDMThinking(true);
      let dmResponseText = "(Respuesta de marcador de posición del DM para la acción del jugador.)";
       if (typeof process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
         await new Promise(resolve => setTimeout(resolve, 1000));
          if (promptForDM.includes("Saquear y Buscar")) {
              dmResponseText = "Registras el área. [LOOT_ITEM:Daga] [LOOT_GOLD:5]";
          } else if (promptForDM.includes("éxito")) {
              dmResponseText = "¡Lo logras! El camino se despeja.";
          } else if (promptForDM.includes("fallo")) {
              dmResponseText = "Fallaste. Nada parece cambiar, o quizás las cosas empeoran un poco.";
          }
      } else {
          try {
              dmResponseText = await geminiService.generateText(promptForDM);
          } catch (error) {
              console.warn("API call failed, using fallback.", error);
              dmResponseText = `Las antiguas magias (API Gemini) fallan. Describe tu acción de nuevo o de otra forma. (Error: ${error instanceof Error ? error.message : String(error)})`;
          }
      }
      addMessage(dmResponseText, 'dm');
      setIsDMThinking(false);
  }, [addMessage, character]); 

  const handleSceneOptionSelect = async (option: SceneOption) => {
      addMessage(`Elegiste: ${typeof option.text === 'function' ? option.text(character) : option.text}`, 'user');
      if (option.onSelect) {
          await option.onSelect(character, gameScreenApi);
      }

      switch (option.actionType) {
          case 'moveToNode':
              if (option.targetNodeId) setCurrentSceneId(option.targetNodeId);
              break;
          case 'skillCheck':
              if (option.skillCheckDetails) {
                  setShowEnvironmentalSkillCheckModal({
                      skill: option.skillCheckDetails.skill,
                      ability: SKILL_TO_ABILITY_MAP[option.skillCheckDetails.skill] || 'int',
                      actionDescription: typeof option.text === 'function' ? option.text(character) : option.text,
                      sceneOption: option 
                  });
                  setSkillCheckTargetDC(option.skillCheckDetails.dc);
                  setSkillCheckHasAdvantage(option.skillCheckDetails.advantage || false);
                  setSkillCheckHasDisadvantage(option.skillCheckDetails.disadvantage || false);
              }
              break;
          case 'combat':
              if (option.combatDetails) {
                  handleInitiateCombat(option.combatDetails.enemyGroupIds, option.combatDetails.victoryNodeId, option.combatDetails.defeatNodeId, option.combatDetails.combatDescription);
              }
              break;
          case 'openShop':
              if (option.shopId) handleOpenShop(option.shopId);
              break;
          case 'rest':
              if(option.restDetails) handleRest(option.restDetails);
              break;
          default:
              if (option.targetNodeId) {
                  setCurrentSceneId(option.targetNodeId);
              } else {
                   const promptForDM = `El jugador, ${character.name}, eligió la opción: "${typeof option.text === 'function' ? option.text(character) : option.text}". En la escena "${currentScene?.title || currentSceneId}". Describe el resultado.`;
                   handleGeminiResponse(promptForDM);
              }
      }
  };
  
  const handleInitiateCombat = (enemyGroupIds: string[], victoryNode?: string, defeatNode?: string, combatDesc?: string) => {
    setIsInCombat(true);
    setCombatJustEnded(false);
    setLastAttackResult(null);
    setCombatVictoryNode(victoryNode);
    setCombatDefeatNode(defeatNode);

    const currentEnemies: Enemy[] = [];
    enemyGroupIds.forEach(groupId => {
        const groupTemplate = PREDEFINED_ENEMY_GROUPS[groupId];
        if (groupTemplate) {
            groupTemplate.enemies.forEach((eTemplate, index) => {
                 // Create a deep copy for each enemy instance
                const enemyInstance = JSON.parse(JSON.stringify(eTemplate));
                enemyInstance.currentHp = enemyInstance.maxHp;
                enemyInstance.id = `${eTemplate.id}_${groupId}_${index}_${Math.random().toString(36).substring(2,7)}`; // Ensure unique ID
                currentEnemies.push(enemyInstance);
            });
        } else {
            console.warn(`Grupo de enemigos no encontrado: ${groupId}`);
        }
    });
    
    if (currentEnemies.length === 0) {
        addMessage("No hay enemigos para este encuentro. ¿Un error del destino?", "system");
        if(victoryNode) setCurrentSceneId(victoryNode);
        else addMessage("El combate concluye... extrañamente.", "system");
        setIsInCombat(false);
        return;
    }
    setEnemies(currentEnemies);

    const participants: CombatParticipant[] = [
      { ...character, participantType: 'player' },
      ...currentEnemies.map(e => ({ ...e, participantType: 'enemy' as 'enemy' }))
    ];

    participants.forEach(p => {
      const dexScore = p.participantType === 'player' ? (p as Character).abilities.dex : (p as Enemy).dexterity;
      p.initiativeRoll = rollD20ForDiceUtil().finalRoll + calculateAbilityModifier(dexScore);
    });
    participants.sort((a, b) => (b.initiativeRoll || 0) - (a.initiativeRoll || 0));
    
    setInitiativeOrder(participants);
    setCurrentTurnIndex(0);
    setCurrentTargetId(null);
    setPlayerTookActionThisTurn(false);
    setPlayerHasBonusAction(true);
    setPlayerUsedActionSurgeThisTurn(false);

    const initOrderText = participants.map((p, i) => `${i + 1}. ${p.name} (Iniciativa ${p.initiativeRoll})`).join('\n');
    let startCombatMessage = `¡Combate iniciado! ${combatDesc || PREDEFINED_ENEMY_GROUPS[enemyGroupIds[0]]?.description || ""}\nOrden de Iniciativa:\n${initOrderText}`;
    addMessage(startCombatMessage, 'system');
    
    const firstParticipant = participants[0];
    if (firstParticipant.participantType === 'player') {
        addMessage(`${character.name}, ¡es tu turno!`, 'system');
    } else {
        addMessage(`Turno de ${firstParticipant.name}.`, 'system');
        setTimeout(() => handleEnemyTurn(firstParticipant as Enemy), 1000);
    }
  };
  
  const handlePlayerAttackTurn = () => {
    if (!currentTargetId || !isInCombat || !isPlayerTurn || (playerTookActionThisTurn && !playerUsedActionSurgeThisTurn) ) return;
    const targetEnemy = enemies.find(e => e.id === currentTargetId);
    if (!targetEnemy || targetEnemy.currentHp <= 0) {
      addMessage("Objetivo no válido o ya derrotado.", 'system'); return;
    }
    const weaponToUse = activeWeapon || "Mano Desnuda";
    const attackResult = getAttackRollDetails(character, targetEnemy.armorClass, weaponToUse, true); 
    setLastAttackResult(attackResult); 
    addMessage("", 'system', attackResult); // Pass data object to addMessage
    setPlayerTookActionThisTurn(true);

    if (attackResult.isHit && attackResult.totalDamageDealt) { 
      const newEnemyHp = Math.max(0, targetEnemy.currentHp - attackResult.totalDamageDealt);
      setEnemies(prevEnemies => prevEnemies.map(e => e.id === targetEnemy.id ? {...e, currentHp: newEnemyHp} : e));
      addMessage(`${character.name} inflige ${attackResult.totalDamageDealt} de daño a ${targetEnemy.name}. (HP: ${newEnemyHp}/${targetEnemy.maxHp})`, 'system');

      if (newEnemyHp <= 0) {
          addMessage(`${targetEnemy.name} ha sido derrotado!`, 'system');
          if (targetEnemy.xpValue) addXp(targetEnemy.xpValue);
          
           // Check if ALL enemies are defeated (including the one just hit)
          const allEnemiesDefeated = enemies.every(e => (e.id === targetEnemy.id ? newEnemyHp <= 0 : e.currentHp <= 0));
          if (allEnemiesDefeated) {
            endCombat(true); return;
          }
      }
      // Divine Smite Check (Paladin)
      if ((character.primaryClass === 'Paladín' || character.multiclassOption === 'Paladín') &&
          ((character.spellSlots && Object.values(character.spellSlots).some(s => s && s.current > 0)) || 
           (character.pactMagicSlots && character.pactMagicSlots.current > 0))) {
          setShowSpellbookModal(true); setSpellbookContext('divineSmite');
      }
    }
  };

  const handleEnemyTurn = (currentEnemy: Enemy) => {
    if (!isInCombat || character.currentHp <= 0 || currentEnemy.currentHp <=0) {
        nextTurn(); return;
    }
    
    const enemyAttackName = currentEnemy.attacks?.[0]?.name || "Ataque Básico";
    const attackResult = getAttackRollDetails(currentEnemy, calculateCharacterAc(character.abilities, character.armorProficiencies, character.equipment), enemyAttackName, false);
    
    let enemyTurnMessage = `Turno de ${currentEnemy.name}. `;
    if (currentEnemy.specialAbilitiesDescription) {
        enemyTurnMessage += `${currentEnemy.specialAbilitiesDescription} `;
    }
    addMessage(enemyTurnMessage, 'system');
    addMessage("", 'system', attackResult); // Pass data object for attack details

    if (attackResult.isHit && attackResult.totalDamageDealt) {
        const newPlayerHp = Math.max(0, character.currentHp - attackResult.totalDamageDealt);
        localUpdateCharacterStats({ currentHp: newPlayerHp });
        addMessage(`${currentEnemy.name} inflige ${attackResult.totalDamageDealt} de daño. (HP: ${newPlayerHp}/${character.maxHp})`, 'system');
        if(newPlayerHp <= 0) endCombat(false); 
    }
    if(isInCombat) setTimeout(nextTurn, 1500); 
  };
  
  const nextTurn = () => {
    if (!isInCombat) return;
    setLastAttackResult(null); 
    const liveEnemies = enemies.filter(e => e.currentHp > 0);
    if (liveEnemies.length === 0 && character.currentHp > 0) {
        endCombat(true); return;
    }
    if (character.currentHp <= 0) {
        endCombat(false); return;
    }
    
    let nextValidTurnIndex = currentTurnIndex;
    let foundNext = false;
    for (let i = 1; i <= initiativeOrder.length; i++) {
        const potentialIndex = (currentTurnIndex + i) % initiativeOrder.length;
        const potentialNextParticipant = initiativeOrder[potentialIndex];
        const entityCurrentHp = (potentialNextParticipant.participantType === 'player') 
            ? character.currentHp 
            : enemies.find(e => e.id === potentialNextParticipant.id)?.currentHp;
        
        if (entityCurrentHp !== undefined && entityCurrentHp > 0) {
            nextValidTurnIndex = potentialIndex;
            foundNext = true;
            break;
        }
    }

    if (!foundNext) { // Should not happen if combat hasn't ended
        console.error("No next valid turn found, but combat active.");
        endCombat(liveEnemies.length === 0); // Guess outcome
        return;
    }

    setCurrentTurnIndex(nextValidTurnIndex);
    const nextParticipant = initiativeOrder[nextValidTurnIndex];
    setCurrentTargetId(null); setPlayerTookActionThisTurn(false); setPlayerHasBonusAction(true);
    if (nextParticipant.participantType === 'player') {
      addMessage(`${character.name}, ¡es tu turno!`, 'system'); setPlayerUsedActionSurgeThisTurn(false); 
    } else {
      addMessage(`Turno de ${nextParticipant.name}.`, 'system');
      setTimeout(() => handleEnemyTurn(nextParticipant as Enemy), 1000);
    }
  };
  
  const endCombat = (playerVictory: boolean) => {
    setIsInCombat(false);
    const message = playerVictory ? "¡VICTORIA! Has derrotado a todos los enemigos." : "HAS SIDO DERROTADO... La oscuridad te envuelve.";
    addMessage(message, "system");
    setInitiativeOrder([]); setCurrentTurnIndex(0); setCurrentTargetId(null);
    // Do not clear enemies immediately if loot parsing depends on them, or clear after loot.
    // setEnemies([]); // Cleared by scene transition or specific post-combat logic

    if (playerVictory && combatVictoryNode) {
        setCurrentSceneId(combatVictoryNode);
    } else if (!playerVictory && combatDefeatNode) {
        setCurrentSceneId(combatDefeatNode);
    } else {
        setCombatJustEnded(true); // Show generic post-combat options if no specific node
    }
    // Clear these so they don't persist to next combat
    setCombatVictoryNode(undefined); 
    setCombatDefeatNode(undefined);
  };

  const handleEndPlayerTurn = () => {
    if (isInCombat && isPlayerTurn) {
      if (playerTookActionThisTurn || playerUsedActionSurgeThisTurn) nextTurn(); // Allow ending turn if only surge was used
      else addMessage("Debes realizar una acción o 'Pasar Turno'.", "system");
    }
  };

  const handlePassTurn = () => {
    if (isInCombat && isPlayerTurn) {
      addMessage(`${character.name} decide pasar el turno.`, 'user');
      setPlayerTookActionThisTurn(true); // Consumes action
      nextTurn();
    }
  };
  
  const handleGenericPlayerActionViaInput = () => {
    if (userInput.trim() === '' || isDMThinking) return;
    const currentActionText = userInput;
    addMessage(currentActionText, 'user');
    setUserInput('');
    
    if(isPlayerTurn && isInCombat) setPlayerTookActionThisTurn(true);

    const promptForDM = 
        `Contexto de Escena: ${currentScene?.title || currentSceneId} - ${typeof currentScene?.description === 'function' ? currentScene.description(character, gameScreenApi) : currentScene?.description}. ` +
        `El jugador, ${character.name} (Nivel ${character.level} ${character.primaryClass}, HP ${character.currentHp}/${character.maxHp}), dice/hace: "${currentActionText}". ` +
        (isInCombat ? `En combate contra ${enemies.filter(e=>e.currentHp > 0).map(e=>e.name).join(', ')}. ` : '') +
        `Describe el resultado o la respuesta del mundo/NPCs. Si es una acción que merece XP, usa [XP_AWARDED:Cantidad]. Si encuentra un objeto, [FOUND_ITEM:NombreExactoDelCatalogo]. Si encuentra oro, [LOOT_GOLD:Cantidad].`;
    handleGeminiResponse(promptForDM);
  };

  const handlePostCombatAction = (option: SceneOption) => {
    setCombatJustEnded(false); // Hide post-combat options
    // If the option is just a moveToNode, handle it directly.
    // Otherwise, it's likely a descriptive action for Gemini.
    if (option.actionType === 'moveToNode' && option.targetNodeId) {
        addMessage(`Elegiste: ${typeof option.text === 'function' ? option.text(character) : option.text}`, 'user');
        setCurrentSceneId(option.targetNodeId);
    } else {
        // For other actions like "Saquear", construct a prompt for Gemini
        const actionText = typeof option.text === 'function' ? option.text(character) : option.text;
        addMessage(`Elegiste: ${actionText}`, 'user');
        let promptForGemini = `Después del combate, ${character.name} decide: "${actionText}". `;
        if (actionText.toLowerCase().includes("saquear") || actionText.toLowerCase().includes("buscar")) {
            promptForGemini += `¿Qué objetos (usa formato [LOOT_ITEM:NombreExactoDelCatalogo]) y cuánto oro (usa formato [LOOT_GOLD:Cantidad]) encuentra? Si merece XP por la acción, usa [XP_AWARDED:Cantidad].`
        } else {
            promptForGemini += `Describe el resultado.`;
        }
        handleGeminiResponse(promptForGemini);
    }
  };
  
  const handleRest = (details: SceneRestDetails) => {
    if (details.type === 'short') {
        handleShortRest(details.completionNodeId);
        if(details.durationMessage) addMessage(details.durationMessage, 'system');
    } else if (details.type === 'long') {
        handleLongRest(details.completionNodeId);
        if(details.durationMessage) addMessage(details.durationMessage, 'system');
    }
  }

  const handleShortRest = (completionNodeId?: string) => setShowShortRestModal(true); // Modal will handle completionNodeId or use default behavior
  const confirmShortRest = (completionNodeId?: string) => {
    if (hitDiceToSpend <= 0 || hitDiceToSpend > character.hitDice.current) {
        addMessage("Cantidad de Dados de Golpe inválida.", 'system'); setShowShortRestModal(false); return;
    }
    let hpRestored = 0;
    const conModifier = calculateAbilityModifier(character.abilities.con);
    for (let i = 0; i < hitDiceToSpend; i++) hpRestored += Math.max(1, rollDie(character.hitDice.dieType) + conModifier);
    
    const newCurrentHp = Math.min(character.maxHp, character.currentHp + hpRestored);
    const newCurrentHitDice = character.hitDice.current - hitDiceToSpend;
    let updatedStats: Partial<Character> = {
        currentHp: newCurrentHp, hitDice: { ...character.hitDice, current: newCurrentHitDice },
    };
    if(character.championAbilities) updatedStats.championAbilities = { ...character.championAbilities, secondWindUsed: false, actionSurgeUsed: false };
    if (character.pactMagicSlots) updatedStats.pactMagicSlots = { ...character.pactMagicSlots, current: character.pactMagicSlots.max };

    localUpdateCharacterStats(updatedStats);
    addMessage(`${character.name} descansa brevemente, gasta ${hitDiceToSpend} DG y recupera ${hpRestored} HP. (HP: ${newCurrentHp}/${character.maxHp})`, 'system');
    if(character.primaryClass === 'Guerrero' || character.multiclassOption === 'Guerrero') addMessage("Aliento de Combate y Oleada de Acción recargados.", "system");
    if(character.pactMagicSlots) addMessage("Espacios de Pacto restaurados.", "system");
    setShowShortRestModal(false); setHitDiceToSpend(1);
    if (completionNodeId) setCurrentSceneId(completionNodeId);
  };

  const handleLongRest = (completionNodeId?: string) => {
    const newCurrentHp = character.maxHp;
    const hdRegained = Math.max(1, Math.floor(character.hitDice.total / 2));
    let updatedStats: Partial<Character> = {
        currentHp: newCurrentHp, 
        hitDice: { ...character.hitDice, current: Math.min(character.hitDice.total, character.hitDice.current + hdRegained) },
    };
    if(character.championAbilities) updatedStats.championAbilities = { ...character.championAbilities, secondWindUsed: false, actionSurgeUsed: false };
    if (character.spellSlots) {
        const restoredSpells: SpellSlots = {};
        for (const lvl in character.spellSlots) restoredSpells[lvl as keyof SpellSlots] = { ...character.spellSlots[lvl as keyof SpellSlots]!, current: character.spellSlots[lvl as keyof SpellSlots]!.max};
        updatedStats.spellSlots = restoredSpells;
    }
    if (character.pactMagicSlots) updatedStats.pactMagicSlots = { ...character.pactMagicSlots, current: character.pactMagicSlots.max };

    localUpdateCharacterStats(updatedStats);
    addMessage(`${character.name} realiza un descanso largo. HP y recursos restaurados. (HP: ${newCurrentHp}/${character.maxHp}, DG: ${updatedStats.hitDice?.current}/${character.hitDice.total})`, 'system');
    if (completionNodeId) setCurrentSceneId(completionNodeId);
  };
  
  const handleSecondWind = () => {
    if (!isPlayerTurn || !playerHasBonusAction || !character.championAbilities || character.championAbilities.secondWindUsed) {
      addMessage(character.championAbilities?.secondWindUsed ? "Ya has usado Aliento de Combate." : "No puedes (no es tu turno, acción bonificada usada, o habilidad no disponible).", "system"); return;
    }
    const healingRoll = rollDie(10); const healingAmount = healingRoll + character.level;
    const newHp = Math.min(character.maxHp, character.currentHp + healingAmount);
    localUpdateCharacterStats({ currentHp: newHp, championAbilities: { ...character.championAbilities!, secondWindUsed: true }});
    setPlayerHasBonusAction(false);
    addMessage(`${character.name} usa Aliento de Combate, recuperando ${healingAmount} HP. (HP: ${newHp})`, "system");
  };

  const handleActionSurge = () => {
     if (!isPlayerTurn || !character.championAbilities || character.championAbilities.actionSurgeUsed) {
      addMessage(character.championAbilities?.actionSurgeUsed ? "Ya usaste Oleada de Acción." : "No puedes (no es tu turno o habilidad no disponible).", "system"); return;
    }
    localUpdateCharacterStats({ championAbilities: { ...character.championAbilities!, actionSurgeUsed: true }});
    setPlayerTookActionThisTurn(false); // Grants another action
    setPlayerUsedActionSurgeThisTurn(true); 
    addMessage(`${character.name} usa Oleada de Acción. ¡Acción adicional!`, "system");
  };
  
  const handleProtectionDeclaration = () => addMessage(isInCombat ? `${character.name} adopta postura protectora. (El DM lo tendrá en cuenta)` : "Solo en combate.", "system");
  const handleOpenSpellbook = () => { setSpellbookContext('casting'); setShowSpellbookModal(true); };

  const handleCastSpell = (spell: Spell, slotType?: 'paladin' | 'pact', slotLevel?: number) => {
    if (!isPlayerTurn && isInCombat && !playerUsedActionSurgeThisTurn) { addMessage("No es tu turno o ya actuaste.", 'system'); return; }

    if (spell.level === 0) { 
      addMessage(`${character.name} lanza ${spell.name}.`, 'system');
      handleGeminiResponse(`${character.name} lanza el truco ${spell.name}. ${spell.description}. Describe el efecto.`);
      if(isPlayerTurn && isInCombat) setPlayerTookActionThisTurn(true);
    } else {
      let slotUsed = false; let actualSlotLevelUsed = slotLevel || spell.level;
      let tempChar = {...character}; // Create a mutable copy
      let tempSpellSlots = tempChar.spellSlots ? JSON.parse(JSON.stringify(tempChar.spellSlots)) : undefined;
      let tempPactMagicSlots = tempChar.pactMagicSlots ? JSON.parse(JSON.stringify(tempChar.pactMagicSlots)) : undefined;

      if (slotType === 'paladin' && tempSpellSlots && slotLevel) {
        const key = `level${slotLevel}` as keyof SpellSlots;
        if (tempSpellSlots[key] && tempSpellSlots[key]!.current > 0) {
          tempSpellSlots[key]!.current--; slotUsed = true;
        }
      } else if (slotType === 'pact' && tempPactMagicSlots && tempPactMagicSlots.current > 0 && tempPactMagicSlots.level >= spell.level) {
        tempPactMagicSlots.current--; slotUsed = true;
        actualSlotLevelUsed = tempPactMagicSlots.level;
      }
      if (slotUsed) {
        localUpdateCharacterStats({ spellSlots: tempSpellSlots, pactMagicSlots: tempPactMagicSlots });
        addMessage(`${character.name} lanza ${spell.name} (N${actualSlotLevelUsed} ${slotType || ''}).`, 'system');
        handleGeminiResponse(`${character.name} lanza ${spell.name}. ${spell.description}. Describe el efecto.`);
        if(isPlayerTurn && isInCombat) setPlayerTookActionThisTurn(true);
      } else addMessage(`Sin espacios de conjuro disponibles para ${spell.name} (Nivel ${spell.level}).`, 'system');
    }
    setShowSpellbookModal(false); 
    setSpellbookContext(null);
  };

  const handleDivineSmite = (slotType: 'paladin' | 'pact', slotLevel: number) => {
    if (!lastAttackResult || !lastAttackResult.isHit || !currentTargetId) return;
    let slotConsumed = false; let actualSmiteLevel = slotLevel; 
    let tempChar = {...character}; // Mutable copy
    let tempSpellSlots = tempChar.spellSlots ? JSON.parse(JSON.stringify(tempChar.spellSlots)) : undefined;
    let tempPactMagicSlots = tempChar.pactMagicSlots ? JSON.parse(JSON.stringify(tempChar.pactMagicSlots)) : undefined;

    if (slotType === 'paladin' && tempSpellSlots) {
        const key = `level${slotLevel}` as keyof SpellSlots;
        if (tempSpellSlots[key] && tempSpellSlots[key]!.current > 0) { tempSpellSlots[key]!.current--; slotConsumed = true; }
    } else if (slotType === 'pact' && tempPactMagicSlots && tempPactMagicSlots.current > 0) {
        actualSmiteLevel = tempPactMagicSlots.level; tempPactMagicSlots!.current--; slotConsumed = true;
    }

    if (slotConsumed) {
        localUpdateCharacterStats({ spellSlots: tempSpellSlots, pactMagicSlots: tempPactMagicSlots });
        const numDamageDice = Math.min(2 + Math.max(0, actualSmiteLevel - 1), 5); 
        const smiteDamageRoll = rollDice(numDamageDice, 8); 
        const targetEnemy = enemies.find(e => e.id === currentTargetId);
        if(targetEnemy) {
            const newEnemyHp = Math.max(0, targetEnemy.currentHp - smiteDamageRoll.total);
            setEnemies(prev => prev.map(e => e.id === targetEnemy.id ? {...e, currentHp: newEnemyHp} : e));
            addMessage(`${character.name} usa Golpe Divino (N${actualSmiteLevel} ${slotType}), +${smiteDamageRoll.total} daño radiante a ${targetEnemy.name}! (HP: ${newEnemyHp}/${targetEnemy.maxHp})`, 'system');
            if (newEnemyHp <= 0) {
                addMessage(`${targetEnemy.name} destruido por el poder divino!`, 'system'); if (targetEnemy.xpValue) addXp(targetEnemy.xpValue);
                 if (enemies.every(e => (e.id === targetEnemy.id ? newEnemyHp <=0 : e.currentHp <=0))) endCombat(true);
            }
        }
    } else addMessage(`Sin espacio de N${slotLevel} ${slotType} para Golpe Divino.`, 'system');
    setShowSpellbookModal(false); setSpellbookContext(null); setLastAttackResult(null); 
  };
  
  const handleTelepathicAwakening = () => handleGeminiResponse(`${character.name} usa Despertar Telepático... Describe con quién y qué comunica.`);
  
  const handleConfirmEnvironmentalSkillCheck = () => {
      if (!showEnvironmentalSkillCheckModal) return;
      const { skill, actionDescription, sceneOption } = showEnvironmentalSkillCheckModal;
      const details = sceneOption.skillCheckDetails!;
      const skillCheck = getSkillCheckResult(character, skill, skillCheckTargetDC, skillCheckHasAdvantage, skillCheckHasDisadvantage);
      addMessage("", 'system', skillCheck);

      let nextNodeId: string | undefined = undefined;
      let dmPrompt: string | undefined = undefined;

      if (skillCheck.isSuccess) {
          if (details.successMessage) addMessage(details.successMessage, 'system');
          if (details.successDMCallback) dmPrompt = details.successDMCallback(character, gameScreenApi);
          else dmPrompt = `${character.name} tuvo éxito en '${actionDescription}' (tirada de ${skill} ${skillCheck.finalRollValue} vs CD ${skillCheck.targetDC}). Describe el resultado positivo.`;
          nextNodeId = details.successNodeId;
      } else { // Failure
          if (details.failureMessage) addMessage(details.failureMessage, 'system');
           if (details.failureDMCallback) dmPrompt = details.failureDMCallback(character, gameScreenApi);
          else dmPrompt = `${character.name} falló en '${actionDescription}' (tirada de ${skill} ${skillCheck.finalRollValue} vs CD ${skillCheck.targetDC}). Describe las consecuencias negativas o la falta de progreso.`;
          nextNodeId = details.failureNodeId;
      }
      
      if(dmPrompt) handleGeminiResponse(dmPrompt);
      if (nextNodeId) setCurrentSceneId(nextNodeId);
      else if (!dmPrompt && !nextNodeId) { // If no specific node and no DM callback, imply the action resolved within the current scene or needs DM generic response
          addMessage("El resultado de tu acción se manifestará...", "system"); // Or similar generic message
      }
      setShowEnvironmentalSkillCheckModal(null);
  };

  const handleConfirmSavingThrow = () => {
    if (!showSavingThrowModal) return;
    const { savingThrowAbility, effectDescription, sceneOption } = showSavingThrowModal;
    // const details = sceneOption.savingThrowDetails!; // Assuming this structure exists on SceneOption
    const savingThrow = getSavingThrowResult(character, savingThrowAbility, savingThrowTargetDC, savingThrowHasAdvantage, savingThrowHasDisadvantage);
    addMessage("", 'system', savingThrow);
    
    // Similar to skill checks, build DM prompt and transition based on success/failure
    let dmPrompt: string;
    // let nextNodeId: string | undefined;

    if (savingThrow.isSuccess) {
        dmPrompt = `${character.name} tiene ÉXITO en su salvación de ${savingThrowAbility.toUpperCase()} contra ${effectDescription} (Tirada: ${savingThrow.finalRollValue} vs CD ${savingThrow.targetDC}). Describe cómo evita o mitiga el efecto.`;
        // nextNodeId = details?.successNodeId;
    } else {
        dmPrompt = `${character.name} FALLA su salvación de ${savingThrowAbility.toUpperCase()} contra ${effectDescription} (Tirada: ${savingThrow.finalRollValue} vs CD ${savingThrow.targetDC}). Describe las consecuencias.`;
        // nextNodeId = details?.failureNodeId;
    }
    handleGeminiResponse(dmPrompt);
    // if (nextNodeId) setCurrentSceneId(nextNodeId);
    setShowSavingThrowModal(null);
  };

  const handleEquipWeapon = (itemName: string) => { setActiveWeapon(itemName); addMessage(`${itemName} equipado.`, 'system'); };
  const handleUseConsumable = (itemName: string) => {
    const itemDetails = ITEMS_DATA[itemName];
    if (!itemDetails || itemDetails.type !== 'potion' || !itemDetails.effects) return addMessage(`No se puede usar ${itemName}.`, 'system');
    let newEquipment = [...character.equipment]; const itemIndex = newEquipment.indexOf(itemName);
    if (itemIndex > -1) {
      newEquipment.splice(itemIndex, 1); let hpHealed = 0;
      itemDetails.effects.forEach(eff => { if (eff.type === 'heal' && eff.amount) { const [num, dieMod] = eff.amount.split('d'); const [die, mod] = dieMod.split('+'); hpHealed = rollDice(parseInt(num), parseInt(die)).total + (parseInt(mod)||0);}});
      const newHp = Math.min(character.maxHp, character.currentHp + hpHealed);
      localUpdateCharacterStats({ equipment: newEquipment, currentHp: newHp });
      addMessage(`${character.name} usa ${itemName}, recupera ${hpHealed} HP. (HP: ${newHp}/${character.maxHp})`, 'system');
    } else addMessage(`No tienes ${itemName}.`, 'system');
  };
  const handleDropItem = (itemName: string) => {
    let newEquipment = [...character.equipment]; const itemIndex = newEquipment.indexOf(itemName);
    if (itemIndex > -1) { const dropped = newEquipment.splice(itemIndex, 1)[0]; if (activeWeapon === dropped) setActiveWeapon(null); localUpdateCharacterStats({ equipment: newEquipment }); addMessage(`Soltaste ${dropped}.`, 'system');}
  };
  const handleOpenShop = (shopId: string) => { if (SHOPKEEPERS_DATA[shopId]) { setCurrentShopkeeper(SHOPKEEPERS_DATA[shopId]); setShowShopModal(true); } else addMessage("Tienda no disponible.", "system"); };
  const handleBuyItem = (itemId: string) => {
    if (!currentShopkeeper) return; const item = ITEMS_DATA[itemId]; if (!item) return;
    const price = Math.ceil(item.value * currentShopkeeper.buyPriceModifier);
    if (character.gold >= price) { localUpdateCharacterStats({ gold: character.gold - price, equipment: [...character.equipment, itemId] }); addMessage(`Compras ${item.name} por ${price} po.`, 'system');}
    else addMessage("Oro insuficiente.", 'system');
  };
  const handleSellItem = (itemName: string, index: number) => {
    if (!currentShopkeeper) return; const item = ITEMS_DATA[itemName]; if (!item) return;
    const price = Math.floor(item.value * currentShopkeeper.sellPriceModifier);
    const newEq = [...character.equipment]; newEq.splice(index, 1);
    if(activeWeapon === itemName) setActiveWeapon(null);
    localUpdateCharacterStats({ gold: character.gold + price, equipment: newEq }); addMessage(`Vendes ${item.name} por ${price} po.`, 'system');
  };

  const canUseChampionAbilities = (character.primaryClass === 'Guerrero' || character.multiclassOption === 'Guerrero') && character.level >= 1 && character.championAbilities;
  const isSpellcaster = character.spellSlots || character.pactMagicSlots;
  const xpForNextLevel = (character.level < XP_THRESHOLDS_PER_LEVEL.length -1) ? XP_THRESHOLDS_PER_LEVEL[character.level + 1] : Infinity;
  
  const displayedSceneOptions = useMemo(() => {
    if (!currentScene || !character) return [];
    return currentScene.options.filter(opt => !opt.requires || opt.requires(character));
  }, [currentScene, character]);

  const handleShortRest = useCallback((completionNodeId?: string) => {
    setShowShortRestModal(true); 
    // The actual logic is in confirmShortRest, triggered by modal button.
    // completionNodeId might need to be stored or passed to confirmShortRest if it varies.
  }, [setShowShortRestModal]);

  const confirmShortRest = useCallback((completionNodeId?: string) => {
    if (hitDiceToSpend <= 0 || hitDiceToSpend > character.hitDice.current) {
        if(addMessageRef.current) addMessageRef.current("Cantidad de Dados de Golpe inválida.", 'system'); 
        setShowShortRestModal(false); 
        return;
    }
    let hpRestored = 0;
    const conModifier = calculateAbilityModifier(character.abilities.con);
    for (let i = 0; i < hitDiceToSpend; i++) hpRestored += Math.max(1, rollDie(character.hitDice.dieType) + conModifier);
    
    const newCurrentHp = Math.min(character.maxHp, character.currentHp + hpRestored);
    const newCurrentHitDice = character.hitDice.current - hitDiceToSpend;
    let updatedStats: Partial<Character> = {
        currentHp: newCurrentHp, hitDice: { ...character.hitDice, current: newCurrentHitDice },
    };
    if(character.championAbilities) updatedStats.championAbilities = { ...character.championAbilities, secondWindUsed: false, actionSurgeUsed: false };
    if (character.pactMagicSlots) updatedStats.pactMagicSlots = { ...character.pactMagicSlots, current: character.pactMagicSlots.max };

    localUpdateCharacterStats(updatedStats);
    if(addMessageRef.current) {
      addMessageRef.current(`${character.name} descansa brevemente, gasta ${hitDiceToSpend} DG y recupera ${hpRestored} HP. (HP: ${newCurrentHp}/${character.maxHp})`, 'system');
      if(character.primaryClass === 'Guerrero' || character.multiclassOption === 'Guerrero') addMessageRef.current("Aliento de Combate y Oleada de Acción recargados.", "system");
      if(character.pactMagicSlots) addMessageRef.current("Espacios de Pacto restaurados.", "system");
    }
    setShowShortRestModal(false); setHitDiceToSpend(1);
    if (completionNodeId) setCurrentSceneId(completionNodeId);
  }, [character, hitDiceToSpend, localUpdateCharacterStats, setHitDiceToSpend, setShowShortRestModal, setCurrentSceneId]);
  
  const handleLongRest = useCallback((completionNodeId?: string) => {
    const newCurrentHp = character.maxHp;
    const hdRegained = Math.max(1, Math.floor(character.hitDice.total / 2));
    let updatedStats: Partial<Character> = {
        currentHp: newCurrentHp, 
        hitDice: { ...character.hitDice, current: Math.min(character.hitDice.total, character.hitDice.current + hdRegained) },
    };
    if(character.championAbilities) updatedStats.championAbilities = { ...character.championAbilities, secondWindUsed: false, actionSurgeUsed: false };
    if (character.spellSlots) {
        const restoredSpells: SpellSlots = {};
        for (const lvl in character.spellSlots) restoredSpells[lvl as keyof SpellSlots] = { ...character.spellSlots[lvl as keyof SpellSlots]!, current: character.spellSlots[lvl as keyof SpellSlots]!.max};
        updatedStats.spellSlots = restoredSpells;
    }
    if (character.pactMagicSlots) updatedStats.pactMagicSlots = { ...character.pactMagicSlots, current: character.pactMagicSlots.max };

    localUpdateCharacterStats(updatedStats);
    if(addMessageRef.current) addMessageRef.current(`${character.name} realiza un descanso largo. HP y recursos restaurados. (HP: ${newCurrentHp}/${character.maxHp}, DG: ${updatedStats.hitDice?.current}/${character.hitDice.total})`, 'system');
    if (completionNodeId) setCurrentSceneId(completionNodeId);
  }, [character, localUpdateCharacterStats, setCurrentSceneId]);

  const handleRest = useCallback((details: SceneRestDetails) => {
    if (details.type === 'short') {
        handleShortRest(details.completionNodeId);
        if(details.durationMessage && addMessageRef.current) addMessageRef.current(details.durationMessage, 'system');
    } else if (details.type === 'long') {
        handleLongRest(details.completionNodeId);
        if(details.durationMessage && addMessageRef.current) addMessageRef.current(details.durationMessage, 'system');
    }
  }, [handleShortRest, handleLongRest]);

  const handleGenericPlayerActionViaInput = useCallback(() => {
    if (userInput.trim() === '' || isDMThinking) return;
    const currentActionText = userInput;
    if (addMessageRef.current) addMessageRef.current(currentActionText, 'user');
    setUserInput('');
    
    if(isPlayerTurn && isInCombat) setPlayerTookActionThisTurn(true);

    const sceneDesc = typeof currentScene?.description === 'function' 
        ? currentScene.description(character, gameScreenApi) 
        : currentScene?.description;

    const promptForDM = 
        `Contexto de Escena: ${currentScene?.title || currentSceneId} - ${sceneDesc}. ` +
        `El jugador, ${character.name} (Nivel ${character.level} ${character.primaryClass}, HP ${character.currentHp}/${character.maxHp}), dice/hace: "${currentActionText}". ` +
        (isInCombat ? `En combate contra ${enemies.filter(e=>e.currentHp > 0).map(e=>e.name).join(', ')}. ` : '') +
        `Describe el resultado o la respuesta del mundo/NPCs. Si es una acción que merece XP, usa [XP_AWARDED:Cantidad]. Si encuentra un objeto, [FOUND_ITEM:NombreExactoDelCatalogo]. Si encuentra oro, [LOOT_GOLD:Cantidad].`;
    handleGeminiResponse(promptForDM);
  }, [userInput, isDMThinking, character, currentScene, currentSceneId, gameScreenApi, handleGeminiResponse, isPlayerTurn, isInCombat, enemies, setUserInput /*setPlayerTookActionThisTurn - not needed as dep if only setting*/]);

  const handleSceneOptionSelect = useCallback(async (option: SceneOption) => {
    const optionText = typeof option.text === 'function' ? option.text(character) : option.text;
    if (addMessageRef.current) addMessageRef.current(`Elegiste: ${optionText}`, 'user');
    
    if (option.onSelect) {
        await option.onSelect(character, gameScreenApi);
    }

    switch (option.actionType) {
        case 'moveToNode':
            if (option.targetNodeId) setCurrentSceneId(option.targetNodeId);
            break;
        case 'skillCheck':
            if (option.skillCheckDetails) {
                setShowEnvironmentalSkillCheckModal({
                    skill: option.skillCheckDetails.skill,
                    ability: SKILL_TO_ABILITY_MAP[option.skillCheckDetails.skill] || 'int',
                    actionDescription: optionText,
                    sceneOption: option 
                });
                setSkillCheckTargetDC(option.skillCheckDetails.dc);
                setSkillCheckHasAdvantage(option.skillCheckDetails.advantage || false);
                setSkillCheckHasDisadvantage(option.skillCheckDetails.disadvantage || false);
            }
            break;
        case 'combat':
            if (option.combatDetails) {
                handleInitiateCombat(option.combatDetails.enemyGroupIds, option.combatDetails.victoryNodeId, option.combatDetails.defeatNodeId, option.combatDetails.combatDescription);
            }
            break;
        case 'openShop':
            if (option.shopId) handleOpenShop(option.shopId);
            break;
        case 'rest':
            if(option.restDetails) handleRest(option.restDetails);
            break;
        default:
            if (option.targetNodeId) {
                setCurrentSceneId(option.targetNodeId);
            } else {
                 const sceneDesc = typeof currentScene?.description === 'function' 
                    ? currentScene.description(character, gameScreenApi) 
                    : currentScene?.description;
                 const promptForDM = `El jugador, ${character.name}, eligió la opción: "${optionText}". En la escena "${currentScene?.title || currentSceneId} - ${sceneDesc}". Describe el resultado.`;
                 handleGeminiResponse(promptForDM);
            }
    }
  }, [character, gameScreenApi, setCurrentSceneId, setShowEnvironmentalSkillCheckModal, setSkillCheckTargetDC, setSkillCheckHasAdvantage, setSkillCheckHasDisadvantage, handleInitiateCombat, handleOpenShop, handleRest, currentScene, currentSceneId, handleGeminiResponse]);


  return (
    <div className="h-[85vh] max-h-[900px] flex flex-col bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
      <header className="p-3 bg-slate-900 border-b border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-yellow-300">{character.name} el {character.primaryClass} {character.multiclassOption ? `/ ${character.multiclassOption}` : ''} (Nivel {character.level})</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="flex items-center" title="Puntos de Golpe"><HeartIcon className="w-4 h-4 mr-1 text-red-400"/> {character.currentHp}/{character.maxHp} HP</span>
                <span className="flex items-center" title="Clase de Armadura"><ShieldCheckIcon className="w-4 h-4 mr-1 text-sky-400"/> {calculateCharacterAc(character.abilities, character.armorProficiencies, character.equipment)} CA</span>
                <span className="flex items-center" title="Dados de Golpe"><CubeIcon className="w-4 h-4 mr-1 text-green-400"/> {character.hitDice.current}/{character.hitDice.total}d{character.hitDice.dieType} DG</span>
                <span className="flex items-center" title="Bono de Competencia"><SparklesIcon className="w-4 h-4 mr-1 text-yellow-400"/> +{getProficiencyBonus(character.level)} Comp.</span>
                <span className="flex items-center" title="Oro"><CircleDollarSignIcon className="w-4 h-4 mr-1 text-yellow-500"/> {character.gold} po</span>
                <span className="flex items-center" title="Puntos de Experiencia"><ArrowUpCircleIcon className="w-4 h-4 mr-1 text-lime-400"/> XP: {character.xp} / {xpForNextLevel !== Infinity ? xpForNextLevel : 'Máx'}</span>
                 {canUseChampionAbilities && character.championAbilities && (<>
                    <span className="flex items-center" title="Aliento de Combate"><WindIcon className={`w-4 h-4 mr-1 ${character.championAbilities.secondWindUsed ? 'text-slate-500' : 'text-emerald-400'}`}/> A.C.: {character.championAbilities.secondWindUsed ? 'Usado' : 'Disp.'}</span>
                    {character.level >=2 && <span className="flex items-center" title="Oleada de Acción"><BoltIcon className={`w-4 h-4 mr-1 ${character.championAbilities.actionSurgeUsed ? 'text-slate-500' : 'text-amber-400'}`}/> O.A.: {character.championAbilities.actionSurgeUsed ? 'Usado' : 'Disp.'}</span>}
                 </>)}
                 {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (<span className="flex items-center" title="Espacios de Conjuro"><WandSparklesIcon className="w-4 h-4 mr-1 text-sky-400"/> Espacios: {Object.entries(character.spellSlots).filter(([, s]) => s && s.max > 0).map(([lvl, s]) => `N${lvl.replace('level','')}: ${s!.current}/${s!.max}`).join('; ') || 'Ninguno'}</span>)}
                 {character.pactMagicSlots && character.pactMagicSlots.max > 0 && (<span className="flex items-center" title="Espacios de Pacto (Brujo)"><SparklesIcon className="w-4 h-4 mr-1 text-purple-400"/> Pacto (B): {character.pactMagicSlots.current}/${character.pactMagicSlots.max} (N{character.pactMagicSlots.level})</span>)}
                 {character.feats && character.feats.length > 0 && (<span className="flex items-center" title="Dotes"><StarIcon className="w-4 h-4 mr-1 text-amber-300"/> Dotes: {character.feats.map(fId => FEATS_DATA[fId]?.name || fId).slice(0,2).join(', ')}{character.feats.length > 2 ? '...' : ''}</span>)}
            </div>
          </div>
          <Button onClick={onExitGame} className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5"><ArrowUturnLeftIcon className="w-4 h-4 mr-1.5" /> Salir</Button>
        </div>
      </header>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto fantasy-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
                msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none'
                : msg.sender === 'system' ? 'bg-yellow-600/20 text-yellow-200 border border-yellow-500/30 rounded-b-none w-full text-sm italic'
                : msg.sender === 'scene' ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-700/50 w-full text-sm'
                : 'bg-slate-700 text-slate-200 rounded-bl-none' }`}
            >
              {msg.sender !== 'system' && msg.sender !== 'scene' && (
                <div className="flex items-center mb-1">
                    {msg.sender === 'dm' ? <Cog6ToothIcon className="w-5 h-5 mr-2 text-yellow-400" /> : <UserCircleIcon className="w-5 h-5 mr-2 text-blue-300" /> }
                    <span className="font-semibold text-sm">{msg.sender === 'user' ? character.name : dmName}</span>
                </div>
              )}
              {msg.sender === 'scene' && currentScene?.title && <h3 className="text-md font-semibold text-indigo-300 mb-1">{currentScene.title}</h3>}
              <p className={`text-sm whitespace-pre-wrap ${msg.sender === 'system' && !msg.attackRollData && !msg.skillCheckData && !msg.savingThrowData ? 'text-center' : ''}`}>
                {msg.text}
              </p>
              {/* TODO: Consider better display for attack/skill/save data */}
              <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {isDMThinking && (!isInCombat || currentParticipant?.participantType !== 'player') && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow bg-slate-700 text-slate-200 rounded-bl-none">
              <div className="flex items-center"> <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" /> <span className="font-semibold text-sm">{dmName} está tejiendo el destino...</span></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* --- SECCIÓN DE OPCIONES DE ESCENA Y COMBATE --- */}
      {!isDMThinking && currentScene && !isInCombat && !combatJustEnded && !showEnvironmentalSkillCheckModal && !showSavingThrowModal && !showASIChoiceModal && !showShopModal && !showInventoryModal && !showShortRestModal && !showSpellbookModal && (
          <div className="p-3 bg-slate-700 border-t border-slate-600 space-y-2">
              {displayedSceneOptions.length > 0 && <h3 className="text-sm font-semibold text-yellow-200 mb-1">Tus Opciones:</h3>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayedSceneOptions.map((opt, index) => (
                    <Button key={`${currentSceneId}-opt-${index}`} onClick={() => handleSceneOptionSelect(opt)} className="w-full justify-start bg-sky-700 hover:bg-sky-600 text-sm text-left !px-3 !py-2">
                        {typeof opt.text === 'function' ? opt.text(character) : opt.text}
                    </Button>
                ))}
              </div>
          </div>
      )}

      {/* --- Modales (Renderizados condicionalmente) --- */}
      {showShortRestModal && ( 
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm border border-slate-600">
                <h3 className="text-lg font-semibold text-yellow-300 mb-4">Descanso Corto</h3>
                <p className="text-sm text-slate-300 mb-2">Dados de Golpe Disponibles: {character.hitDice.current}d{character.hitDice.dieType}</p>
                {character.hitDice.current > 0 ? (
                    <>
                        <label htmlFor="hdSpend" className="block text-sm text-slate-300 mb-1">Gastar Dados de Golpe:</label>
                        <input type="number" id="hdSpend" value={hitDiceToSpend} min="1" max={character.hitDice.current} onChange={e=>setHitDiceToSpend(parseInt(e.target.value))} className="w-full p-2 bg-slate-700 border-slate-600 rounded mb-4"/>
                        <div className="flex justify-end space-x-2">
                            <Button onClick={()=>setShowShortRestModal(false)} className="bg-slate-600 text-sm">Cancelar</Button>
                            <Button onClick={()=> confirmShortRest(currentScene?.options.find(o=>o.actionType==='rest' && o.restDetails?.type==='short')?.restDetails?.completionNodeId)} className="bg-green-600 text-sm">Confirmar</Button>
                        </div>
                    </>
                ) : <p className="text-slate-400">No tienes Dados de Golpe para gastar.</p>}
            </div>
        </div>
      )}
      {showSpellbookModal && ( /* ... Estructura del Modal Libro de Conjuros ... */ <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">...</div>)}
      {showInventoryModal && ( /* ... Estructura del Modal Inventario ... */  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">...</div>)}
      {showShopModal && currentShopkeeper && ( /* ... Estructura del Modal Tienda ... */ <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">...</div>)}
      {showASIChoiceModal && ( /* ... Estructura del Modal ASI/Dote ... */ <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">...</div>)}
      {showEnvironmentalSkillCheckModal && ( 
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-slate-600">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2">Prueba de Habilidad: {showEnvironmentalSkillCheckModal.skill}</h3>
                    <p className="text-sm text-slate-300 mb-4">Intentando: {showEnvironmentalSkillCheckModal.actionDescription}</p>
                    <div className="mb-3"><label htmlFor="skillCheckDC" className="block text-sm font-medium text-slate-300">CD Objetivo:</label><input type="number" id="skillCheckDC" value={skillCheckTargetDC} onChange={e => setSkillCheckTargetDC(parseInt(e.target.value))} className="w-full p-2 bg-slate-700 border-slate-600 rounded mt-1"/></div>
                    <div className="mb-3 flex items-center"><input type="checkbox" id="skillCheckAdv" checked={skillCheckHasAdvantage} onChange={e => setSkillCheckHasAdvantage(e.target.checked)} className="mr-2 h-4 w-4"/><label htmlFor="skillCheckAdv" className="text-sm text-slate-300">Ventaja</label></div>
                    <div className="mb-4 flex items-center"><input type="checkbox" id="skillCheckDisadv" checked={skillCheckHasDisadvantage} onChange={e => setSkillCheckHasDisadvantage(e.target.checked)} className="mr-2 h-4 w-4"/><label htmlFor="skillCheckDisadv" className="text-sm text-slate-300">Desventaja</label></div>
                    <div className="flex justify-end space-x-2">
                        <Button onClick={() => setShowEnvironmentalSkillCheckModal(null)} className="bg-slate-600 hover:bg-slate-500 text-sm">Cancelar</Button>
                        <Button onClick={handleConfirmEnvironmentalSkillCheck} className="bg-green-600 hover:bg-green-700 text-sm">Confirmar Tirada</Button>
                    </div>
                </div>
            </div>
      )}
      {showSavingThrowModal && ( /* ... Estructura del Modal Tirada de Salvación ... */ <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">...</div>)}
      
      {/* --- SECCIÓN DE CONTROLES DE COMBATE --- */}
      {isInCombat && isPlayerTurn && (
          <div className="p-3 bg-slate-700 border-t border-slate-600 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button onClick={handlePlayerAttackTurn} disabled={!currentTargetId || (playerTookActionThisTurn && !playerUsedActionSurgeThisTurn) || isDMThinking} className="bg-red-600 hover:bg-red-700 text-sm"><ShieldExclamationIcon className="w-4 h-4 mr-1"/>Atacar Objetivo</Button>
                  {isSpellcaster && <Button onClick={handleOpenSpellbook} disabled={(playerTookActionThisTurn && !playerUsedActionSurgeThisTurn) || isDMThinking} className="bg-sky-600 hover:bg-sky-700 text-sm"><BookOpenIcon className="w-4 h-4 mr-1"/>Conjuro</Button>}
                  {canUseChampionAbilities && <Button onClick={handleSecondWind} disabled={!playerHasBonusAction || character.championAbilities?.secondWindUsed || isDMThinking} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><WindIcon className="w-4 h-4 mr-1"/>A. Combate</Button>}
                  {canUseChampionAbilities && character.level >= 2 && <Button onClick={handleActionSurge} disabled={character.championAbilities?.actionSurgeUsed || isDMThinking} className="bg-amber-500 hover:bg-amber-600 text-sm"><BoltIcon className="w-4 h-4 mr-1"/>O. Acción</Button>}
                  {character.primaryClass === "Guerrero" && <Button onClick={handleProtectionDeclaration} className="bg-teal-500 hover:bg-teal-600 text-sm"><ShieldCheckIcon className="w-4 h-4 mr-1"/>Protección</Button>}
                   {(character.primaryClass === "Brujo" || character.multiclassOption === "Brujo") && <Button onClick={handleTelepathicAwakening} className="bg-purple-500 hover:bg-purple-600 text-sm"><BrainIcon className="w-4 h-4 mr-1"/>Telepatía</Button>}
                  
                   {/* Generic Action Buttons (Can be contextually shown/hidden by scene options or always available) */}
                  <Button onClick={()=>setShowInventoryModal(true)} className="bg-orange-500 hover:bg-orange-600 text-sm"><BackpackIcon className="w-4 h-4 mr-1"/>Inventario</Button>
                  
                  <Button onClick={handlePassTurn} disabled={(playerTookActionThisTurn && !playerUsedActionSurgeThisTurn) || isDMThinking} className="bg-slate-500 hover:bg-slate-400 text-sm">Pasar Turno</Button>
                  <Button onClick={handleEndPlayerTurn} className="bg-indigo-600 hover:bg-indigo-700 text-sm col-span-full sm:col-span-1"><HandRaisedIcon className="w-4 h-4 mr-1"/>Finalizar Turno</Button>
              </div>
              {enemies.length > 0 && (<select onChange={e => setCurrentTargetId(e.target.value)} value={currentTargetId || ""} className="mt-2 w-full p-2 bg-slate-800 border-slate-600 rounded text-sm" title="Seleccionar Objetivo">
                  <option value="">-- Seleccionar Objetivo --</option>
                  {enemies.filter(e => e.currentHp > 0).map(e => <option key={e.id} value={e.id}>{e.name} (HP: {e.currentHp}/{e.maxHp})</option>)}
              </select>)}
          </div>
       )}
      {isInCombat && !isPlayerTurn && currentParticipant && (
        <div className="p-3 bg-slate-700 border-t border-slate-600 text-center text-sm">
            <p className="text-yellow-300 animate-pulse">Turno de {currentParticipant.name}...</p>
        </div>
      )}

      {/* --- Opciones Post-Combate Genéricas (si no hay nodos específicos de victoria/derrota) --- */}
      {!isInCombat && combatJustEnded && (
          <div className="p-3 bg-slate-700 border-t border-slate-600 space-y-2">
              <h3 className="text-sm font-semibold text-yellow-200 mb-1 text-center">El combate ha terminado. ¿Qué deseas hacer?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Example post-combat scene options */}
                  <Button onClick={() => handlePostCombatAction({text: "Saquear y Buscar en el área", actionType: 'customEvent'})} className="bg-teal-600 hover:bg-teal-700 text-sm"><MagnifyingGlassIcon className="w-4 h-4 mr-1"/>Saquear y Buscar</Button>
                  <Button onClick={() => handlePostCombatAction({text: "Descansar brevemente (si es seguro)", actionType: 'rest', restDetails: {type: 'short'}})} className="bg-lime-600 hover:bg-lime-700 text-sm"><ClockIcon className="w-4 h-4 mr-1"/>Descanso Corto</Button>
                  <Button onClick={() => handlePostCombatAction({text: "Continuar la aventura", actionType: 'moveToNode', targetNodeId: currentSceneId /* Or a default 'cleared' node */})} className="bg-sky-600 hover:bg-sky-700 text-sm"><ArrowRightIcon className="w-4 h-4 mr-1"/>Continuar</Button>
              </div>
          </div>
       )}

      <footer className="p-3 border-t border-slate-700 bg-slate-900 space-y-2">
        {/* Botones de acciones generales (Descansos, Inventario, etc.) que no son opciones de escena Y NO están en combate */}
        {!isInCombat && !combatJustEnded && !currentScene?.options.find(opt => opt.actionType === 'rest' || opt.actionType === 'openShop') && (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2 text-xs">
              {/* General purpose buttons like Rest, Inventory, etc., can be added here or be part of scene options */}
             </div>
        )}
        {/* La entrada de texto libre se mantiene, pero su uso es ahora más situacional */}
        <div className="flex items-center space-x-2">
          <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isDMThinking && handleGenericPlayerActionViaInput()}
            placeholder={isDMThinking ? `${dmName} está pensando...` : (!isInCombat && displayedSceneOptions.length > 0) ? "Elige una opción o describe una acción..." : "¿Alguna otra acción o detalle?"}
            className="flex-grow p-3 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-purple-500"
            disabled={isDMThinking || (isInCombat && isPlayerTurn && playerTookActionThisTurn && !playerUsedActionSurgeThisTurn) || (!isInCombat && displayedSceneOptions.length > 0 && !userInput)}
          />
          <Button onClick={handleGenericPlayerActionViaInput} disabled={isDMThinking || userInput.trim() === ''} className="bg-purple-600 hover:bg-purple-700 text-white p-3">
            {isDMThinking ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default GameScreen;