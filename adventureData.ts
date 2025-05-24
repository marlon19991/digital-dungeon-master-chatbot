

// FIX: Imported SpellSlots type from ../types
import type { SceneNode, Character, GameScreenApi, SpellSlots } from './types';
import { ITEMS_DATA } from './constants'; // No es necesario PREDEFINED_ENEMY_GROUPS aquí

export const adventureData: Record<string, SceneNode> = {
  "intro": {
    id: "intro",
    title: "El Comienzo de la Aventura",
    description: (character: Character) => 
      `Te encuentras, ${character.name}, en una encrucijada polvorienta. El sol de la tarde tiñe el cielo de naranja y púrpura. Hacia el oeste, un sendero serpentea hacia el Bosque Susurrante, envuelto en sombras ancestrales. Hacia el este, se divisan las luces parpadeantes de la aldea de Arboleda Tranquila y su conocida taberna, "El Grifo Bostezante".`,
    options: [
      { text: "Dirigirse a la aldea y la taberna 'El Grifo Bostezante'.", targetNodeId: "arboleda_tranquila_entrada" },
      { text: "Aventurarse en el Bosque Susurrante.", targetNodeId: "bosque_susurrante_entrada" },
      { 
        text: "Examinar los alrededores en busca de algo inusual.", 
        actionType: 'skillCheck',
        skillCheckDetails: {
          skill: 'Percepción',
          dc: 14,
          successNodeId: "encrucijada_hallazgo",
          failureNodeId: "encrucijada_sin_hallazgo",
          successMessage: "Tu aguda vista detecta algo entre la maleza...",
          failureMessage: "No encuentras nada fuera de lo común, solo el polvo del camino."
        }
      }
    ],
    onEnter: (_character: Character, gameApi: GameScreenApi) => {
      gameApi.addSystemMessage("Tu épica aventura comienza ahora. Elige tu camino.");
    }
  },
  "arboleda_tranquila_entrada": {
    id: "arboleda_tranquila_entrada",
    title: "Aldea de Arboleda Tranquila",
    description: "Llegas a Arboleda Tranquila al anochecer. Las calles están tranquilas, y el aroma a estofado y cerveza proviene de 'El Grifo Bostezante'. Algunos aldeanos te miran con curiosidad.",
    options: [
      { text: "Entrar a la taberna 'El Grifo Bostezante'.", targetNodeId: "taberna_grifo_bostezante" },
      { text: "Visitar la tienda del herrero (Baldar).", actionType: 'openShop', shopId: 'herrero_local' },
      { 
        text: "Buscar un lugar donde pasar la noche.",
        actionType: 'skillCheck',
        skillCheckDetails: {
            skill: 'Supervivencia',
            dc: 10,
            successMessage: "Encuentras un lugar resguardado y relativamente cómodo para descansar al aire libre.",
            failureMessage: "La noche es fría y no encuentras un buen sitio. Será una noche algo incómoda.",
            successNodeId: "descanso_afueras_aldea_exito", 
            failureNodeId: "descanso_afueras_aldea_fallo"
        }
      },
      { text: "Descansar (Largo).", actionType: 'rest', restDetails: { type: 'long', completionNodeId: "arboleda_tranquila_entrada" } },
      { text: "Volver a la encrucijada.", targetNodeId: "intro" },
    ]
  },
  "taberna_grifo_bostezante": {
    id: "taberna_grifo_bostezante",
    title: "El Grifo Bostezante",
    description: (character: Character) => 
        `La taberna está llena de humo y charlas animadas. Un bardo toca una melodía alegre en un rincón. El tabernero, un hombre corpulento llamado Grolsch, te saluda con la cabeza. Hay varios parroquianos: un par de guardias bebiendo, un mercader solitario y un anciano misterioso en una mesa oscura. Tienes ${character.gold} po.`,
    options: [
      { text: "Pedir una bebida y escuchar rumores.", 
        actionType: 'skillCheck',
        skillCheckDetails: {
          skill: 'Persuasión',
          dc: 12,
          successMessage: "El tabernero, engatusado por tu labia, comparte algunos cotilleos interesantes...",
          failureMessage: "El tabernero está ocupado y no suelta prenda. Solo escuchas chismes sin importancia.",
          successDMCallback: (_char, _api) => "El jugador tuvo éxito persuadiendo al tabernero. El tabernero le cuenta sobre [RUMOR_INTERESANTE_1_SOBRE_BOSQUE_O_CUEVA_CERCANA] y quizás sobre [RUMOR_2_SOBRE_PROBLEMA_LOCAL_MENOR].",
          failureDMCallback: (_char, _api) => "El jugador falló en persuadir al tabernero. El DM describe el ambiente y algunos chismes triviales que el jugador escucha."
        } 
      },
      { text: "Acercarse al anciano misterioso.", targetNodeId: "interaccion_anciano_misterioso" },
      { text: "Intentar ganar algo de oro cantando o entreteniendo.", 
        actionType: 'skillCheck',
        skillCheckDetails: {
            skill: 'Interpretación',
            dc: 14,
            successMessage: "Tu actuación es bien recibida!",
            failureMessage: "Tu actuación no impresiona mucho esta noche.",
        },
        onSelect: (char, api) => { 
            // Simulación de resultado de la tirada y efecto para este ejemplo
            const roll = Math.floor(Math.random() * 20) + 1 + 5; // Simular una tirada con un bono decente
            if (roll >= 14) { // 14 es la CD
                const goldEarned = Math.floor(Math.random() * 4) + 1; // 1d4
                api.updateCharacterStats({ gold: char.gold + goldEarned });
                api.addSystemMessage(`¡Has ganado ${goldEarned} piezas de oro por tu actuación!`);
            }
        }
      },
      { text: "Salir de la taberna.", targetNodeId: "arboleda_tranquila_entrada" },
    ],
     onEnter: (_char, api) => {
        api.addSystemMessage("El calor y el bullicio de la taberna te envuelven.");
    }
  },
  "interaccion_anciano_misterioso": {
    id: "interaccion_anciano_misterioso",
    title: "El Anciano Misterioso",
    description: "El anciano te mira con ojos penetrantes. 'Acércate, viajero. Tengo una historia para ti, si tienes el valor de escucharla... y quizás una tarea, si tienes el coraje de aceptarla.'",
    options: [
        { text: "'Escucharé tu historia.'", targetNodeId: "anciano_cuenta_historia" },
        { text: "'No tengo tiempo para historias, anciano.' (Lo ignoras y vuelves al bar)", targetNodeId: "taberna_grifo_bostezante" }
    ]
  },
   "anciano_cuenta_historia": {
    id: "anciano_cuenta_historia",
    title: "La Propuesta del Anciano",
    description: (_character, gameApi) => {
        if (gameApi) {
            gameApi.addSystemMessage("El anciano te cuenta sobre una antigua reliquia perdida en una cueva cercana, custodiada por 'algo' que ha estado aterrorizando a los leñadores. Te ofrece 50 po si recuperas la reliquia y te encargas de la amenaza.");
        }
        return "El anciano detalla la ubicación de la 'Cueva Olvidada' y te advierte de los peligros. 'La gente del pueblo te recompensará si los liberas de este miedo', añade con una sonrisa enigmática.";
    },
    options: [
        { text: "'Acepto la tarea. Iré a la Cueva Olvidada.'", targetNodeId: "camino_cueva_olvidada" },
        { text: "'Es demasiado peligroso para mí. Debo declinar.'", targetNodeId: "taberna_grifo_bostezante" }
    ],
    onEnter: (char, api) => {
        api.updateCharacterStats({ xp: char.xp + 25 }); 
        api.addSystemMessage("Has obtenido información sobre la Cueva Olvidada. ¡Ganas 25 XP!");
    }
  },
  "camino_cueva_olvidada": {
    id: "camino_cueva_olvidada",
    title: "Camino a la Cueva",
    description: "Sigues las indicaciones del anciano y te adentras en el bosque. El camino se vuelve más angosto y oscuro. Escuchas un crujido de ramas cerca...",
    options: [
        { text: "¡Prepararse para el combate!", actionType: 'combat', combatDetails: { enemyGroupIds: ["dos_goblins"], victoryNodeId: "cueva_entrada_despejada", defeatNodeId: "derrota_general"} },
        { text: "Intentar esconderse y observar.", actionType: 'skillCheck', skillCheckDetails: { skill: 'Sigilo', dc: 13, successNodeId: "escondido_exito_goblins", failureNodeId: "emboscada_goblins" }}
    ]
  },
  "escondido_exito_goblins": {
    id: "escondido_exito_goblins",
    title: "Emboscada Evitada",
    description: "Logras ocultarte justo a tiempo. Ves a dos goblins explorando el área. Parecen nerviosos. No te han visto.",
    options: [
        {text: "Esperar a que se vayan y luego ir a la cueva.", targetNodeId: "cueva_entrada_despejada"},
        {text: "Intentar emboscarlos.", actionType: 'combat', combatDetails: { enemyGroupIds: ["dos_goblins"], victoryNodeId: "cueva_entrada_despejada", defeatNodeId: "derrota_general", combatDescription: "El jugador embosca a los goblins, ganando un turno de sorpresa (narrativo)."}}
    ]
  },
  "emboscada_goblins": {
    id: "emboscada_goblins",
    title: "¡Emboscada!",
    description: "Intentas esconderte, pero los goblins te detectan. '¡Intruso!', gritan, y se lanzan al ataque.",
    options: [
        {text: "¡Defenderse!", actionType: 'combat', combatDetails: { enemyGroupIds: ["dos_goblins"], victoryNodeId: "cueva_entrada_despejada", defeatNodeId: "derrota_general"}}
    ]
  },
  "cueva_entrada_despejada": {
    id: "cueva_entrada_despejada",
    title: "Entrada a la Cueva Olvidada",
    description: "El área está despejada. La entrada a una cueva oscura y húmeda se abre ante ti. Un olor nauseabundo emana de su interior.",
    options: [
        {text: "Entrar en la Cueva Olvidada.", targetNodeId: "cueva_interior_1" }, 
        {text: "Volver a Arboleda Tranquila.", targetNodeId: "arboleda_tranquila_entrada"}
    ],
    onEnter: (_char, api) => {
        api.addSystemMessage("Has llegado a la entrada de la Cueva Olvidada.");
    }
  },
  "cueva_interior_1": {
    id: "cueva_interior_1",
    title: "Interior de la Cueva",
    description: "La cueva es fría y resuena con el goteo del agua. Un estrecho pasadizo se adentra en la oscuridad. Ves algunos huesos roídos en el suelo.",
    options: [
        {text: "Avanzar con cautela.", actionType: 'skillCheck', skillCheckDetails: {skill: 'Sigilo', dc: 12, successNodeId: 'cueva_sigilo_exito', failureNodeId: 'cueva_ruido'}},
        {text: "Iluminar una antorcha y avanzar.", targetNodeId: 'cueva_con_antorcha', 
            onSelect: (char, api) => {
                if (char.equipment.includes("Antorcha")) {
                    api.addSystemMessage("Enciendes una antorcha, la luz danza en las paredes.");
                } else {
                    api.addSystemMessage("Buscas una antorcha pero no tienes ninguna.");
                    api.changeScene("cueva_interior_1"); // Permanecer en la escena actual
                }
            }
        },
        {text: "Salir de la cueva.", targetNodeId: "cueva_entrada_despejada"}
    ]
  },
  "bosque_susurrante_entrada": {
    id: "bosque_susurrante_entrada",
    title: "Entrada al Bosque Susurrante",
    description: "El aire se enfría al entrar en el Bosque Susurrante. Los árboles son altos y retorcidos, y apenas dejan pasar la luz del sol. Se escuchan extraños susurros entre las hojas.",
    options: [
      { text: "Seguir el sendero principal.", targetNodeId: "bosque_sendero_principal" },
      { text: "Explorar un sendero lateral apenas visible.",
        actionType: 'skillCheck',
        skillCheckDetails: {
          skill: 'Supervivencia',
          dc: 13,
          successNodeId: "bosque_sendero_secreto",
          failureNodeId: "bosque_perdido_temporalmente",
          successMessage: "Logras seguir el rastro tenue...",
          failureMessage: "El sendero se desvanece y te sientes un poco perdido."
        }
      },
      { text: "Volver a la encrucijada.", targetNodeId: "intro" },
    ]
  },
  "bosque_sendero_principal": {
    id: "bosque_sendero_principal",
    title: "Sendero Principal del Bosque",
    description: "El sendero principal es oscuro y ominoso. De repente, escuchas un gruñido gutural adelante.",
    options: [
        { text: "Investigar el gruñido.", actionType: 'combat', combatDetails: { enemyGroupIds: ["lobo_solitario"], victoryNodeId: "bosque_lobo_derrotado", defeatNodeId: "derrota_general" } },
        { text: "Intentar evitar el peligro sigilosamente.", actionType: 'skillCheck', skillCheckDetails: { skill: 'Sigilo', dc: 12, successNodeId: "bosque_evita_lobo", failureNodeId: "bosque_lobo_te_ve"} },
        { text: "Retroceder y tomar otro camino.", targetNodeId: "bosque_susurrante_entrada"},
    ]
  },
   "bosque_lobo_derrotado": {
    id: "bosque_lobo_derrotado",
    title: "Lobo Derrotado",
    description: "El lobo yace muerto. El camino está despejado por ahora.",
    options: [
        { text: "Continuar por el sendero.", targetNodeId: "bosque_profundo_1" }, // Nodo futuro
        { text: "Registrar el cuerpo del lobo.", 
          onSelect: (char, api) => {
              const hasPelt = Math.random() < 0.8; 
              if (hasPelt && ITEMS_DATA["Piel de Lobo"]) {
                  api.updateCharacterStats({equipment: [...char.equipment, "Piel de Lobo"]});
                  api.addSystemMessage("Encuentras una Piel de Lobo en buen estado.");
              } else {
                  api.addSystemMessage("El lobo no tiene nada de valor.");
              }
          }
          // No targetNodeId, la escena no cambia, solo se da el loot y se vuelve a mostrar opciones.
        },
        { text: "Volver a la entrada del bosque.", targetNodeId: "bosque_susurrante_entrada"},
    ]
  },
  "derrota_general": {
    id: "derrota_general",
    title: "Has Caído...",
    description: (character: Character) => `Tu aventura termina aquí, ${character.name}. La oscuridad te envuelve. Quizás en otra vida, o con otro héroe, el destino sea más amable.`,
    options: [
        {text: "Volver al menú principal (perder personaje actual).", targetNodeId: "RESET_GAME_STATE"}
    ]
  },
  "encrucijada_hallazgo": {
    id: "encrucijada_hallazgo",
    description: "Entre la maleza, encuentras una pequeña bolsa de cuero. Dentro hay 10 piezas de oro y una nota arrugada que dice: 'Nos vemos en el Grifo, trae el paquete.'",
    options: [ { text: "Continuar hacia la aldea.", targetNodeId: "arboleda_tranquila_entrada" }, { text: "Ir al bosque.", targetNodeId: "bosque_susurrante_entrada" } ],
    onEnter: (character, gameApi) => {
      gameApi.updateCharacterStats({ gold: character.gold + 10 });
      gameApi.addSystemMessage("¡Has encontrado 10 piezas de oro!");
    }
  },
  "encrucijada_sin_hallazgo": {
    id: "encrucijada_sin_hallazgo",
    description: "Después de una búsqueda minuciosa, no encuentras nada de interés. El camino te llama.",
    options: [ { text: "Ir a la aldea.", targetNodeId: "arboleda_tranquila_entrada" }, { text: "Ir al bosque.", targetNodeId: "bosque_susurrante_entrada" } ]
  },
   "bosque_sendero_secreto": {
    id: "bosque_sendero_secreto",
    description: "Sigues el sendero oculto hasta un pequeño claro. En el centro, hay un cofre de madera desgastado.",
    options: [
        { text: "Intentar abrir el cofre (Juego de Manos CD 15).", 
          actionType: 'skillCheck',
          skillCheckDetails: {
            skill: 'Juego de Manos',
            dc: 15,
            successNodeId: 'cofre_abierto_exito',
            failureNodeId: 'cofre_fallo_abrir',
            successMessage: '¡La cerradura cede!',
            failureMessage: 'La cerradura es demasiado compleja para tus habilidades.'
          }
        }, 
        { text: "Forzar el cofre (Fuerza CD 17).",
          actionType: 'skillCheck',
          skillCheckDetails: {
            skill: 'Atletismo', // Usamos Atletismo para Fuerza bruta
            dc: 17,
            successNodeId: 'cofre_abierto_exito', // Mismo nodo de éxito
            failureNodeId: 'cofre_fallo_forzar',
            successMessage: 'Con un gran esfuerzo, rompes la cerradura y la madera.',
            failureMessage: 'El cofre es demasiado robusto.'
           }
        },
        { text: "Ignorar el cofre y volver al sendero principal.", targetNodeId: "bosque_sendero_principal" }
    ]
  },
  "cofre_abierto_exito": {
    id: "cofre_abierto_exito",
    description: "Dentro del cofre encuentras una Poción de Curación y 25 piezas de oro.",
    options: [{ text: "Tomar el tesoro y continuar.", targetNodeId: "bosque_sendero_principal"}],
    onEnter: (char, api) => {
      api.updateCharacterStats({
        gold: char.gold + 25,
        equipment: [...char.equipment, "Poción de Curación"]
      });
      api.addSystemMessage("¡Has encontrado una Poción de Curación y 25 po!");
    }
  },
  "cofre_fallo_abrir": {
    id: "cofre_fallo_abrir",
    description: "La cerradura del cofre es demasiado intrincada para tus habilidades. No logras abrirlo.",
    options: [
        { text: "Intentar forzarlo (Fuerza CD 17).", actionType: 'skillCheck', skillCheckDetails: { skill: 'Atletismo', dc: 17, successNodeId: 'cofre_abierto_exito', failureNodeId: 'cofre_fallo_forzar' }},
        { text: "Dejar el cofre.", targetNodeId: "bosque_sendero_principal" }
    ]
  },
  "cofre_fallo_forzar": {
    id: "cofre_fallo_forzar",
    description: "El cofre es demasiado robusto y no cede. Parece que necesitarás la llave o mejores herramientas.",
    options: [
        { text: "Intentar abrirlo con Juego de Manos (CD 15).", actionType: 'skillCheck', skillCheckDetails: { skill: 'Juego de Manos', dc: 15, successNodeId: 'cofre_abierto_exito', failureNodeId: 'cofre_fallo_abrir'}},
        { text: "Dejar el cofre.", targetNodeId: "bosque_sendero_principal" }
    ]
  },
  "bosque_perdido_temporalmente": {
    id: "bosque_perdido_temporalmente",
    description: "El sendero se desvanece y te encuentras un poco desorientado. Tras un rato, logras volver al camino principal cerca de la entrada del bosque.",
    options: [ { text: "Continuar.", targetNodeId: "bosque_susurrante_entrada" }]
  },
   "bosque_evita_lobo": {
    id: "bosque_evita_lobo",
    description: "Te mueves con el sigilo de un fantasma, rodeando la amenaza sin ser detectado. El camino más adelante parece más tranquilo.",
    options: [{text: "Continuar con cautela.", targetNodeId: "bosque_profundo_1"}],
    onEnter: (char, api) => { 
      api.addSystemMessage("¡Has evitado el peligro! Ganas 10 XP."); 
      api.updateCharacterStats({xp: char.xp + 10});
    }
  },
  "bosque_lobo_te_ve": {
    id: "bosque_lobo_te_ve",
    description: "Intentas pasar desapercibido, pero una rama cruje bajo tus pies. El lobo te ha visto y se lanza al ataque!",
    options: [{text: "¡A luchar!", actionType: 'combat', combatDetails: { enemyGroupIds: ["lobo_solitario"], victoryNodeId: "bosque_lobo_derrotado", defeatNodeId: "derrota_general" } }]
  },
   "descanso_afueras_aldea_exito": {
    id: "descanso_afueras_aldea_exito",
    description: "Pasas una noche tranquila y reparadora bajo las estrellas.",
    options: [{ text: "Continuar hacia la taberna.", targetNodeId: "taberna_grifo_bostezante" }, {text: "Explorar la aldea.", targetNodeId: "arboleda_tranquila_entrada"}],
    onEnter: (char, api) => {
        // Simula un descanso largo
        const newCurrentHp = char.maxHp;
        const hdRegained = Math.max(1, Math.floor(char.hitDice.total / 2));
        let updatedStats: Partial<Character> = {
            currentHp: newCurrentHp, 
            hitDice: { ...char.hitDice, current: Math.min(char.hitDice.total, char.hitDice.current + hdRegained) },
        };
        if(char.championAbilities) updatedStats.championAbilities = { ...char.championAbilities, secondWindUsed: false, actionSurgeUsed: false };
        // Restaurar espacios de conjuro
         if (char.spellSlots) {
            const restoredSpells: SpellSlots = {};
            for (const lvl in char.spellSlots) restoredSpells[lvl as keyof SpellSlots] = { ...char.spellSlots[lvl as keyof SpellSlots]!, current: char.spellSlots[lvl as keyof SpellSlots]!.max};
            updatedStats.spellSlots = restoredSpells;
        }
        if (char.pactMagicSlots) updatedStats.pactMagicSlots = { ...char.pactMagicSlots, current: char.pactMagicSlots.max };

        api.updateCharacterStats(updatedStats);
        api.addSystemMessage("Has realizado un descanso largo. Recursos restaurados.");
    }
  },
  "descanso_afueras_aldea_fallo": {
    id: "descanso_afueras_aldea_fallo",
    description: "La noche es incómoda y apenas logras pegar ojo. No te sientes completamente descansado.",
    options: [{ text: "Continuar hacia la taberna.", targetNodeId: "taberna_grifo_bostezante" }, {text: "Explorar la aldea.", targetNodeId: "arboleda_tranquila_entrada"}],
     onEnter: (_char, api) => {
        api.addSystemMessage("No has podido descansar bien. No recuperas todos tus recursos.");
        // Podrías implementar una recuperación parcial o ningún beneficio de descanso largo aquí
    }
  },
  // Placeholder para nodos futuros
  "bosque_profundo_1": {
    id: "bosque_profundo_1",
    description: "Te adentras más en el bosque. El aire es pesado y el silencio es casi total, roto solo por el sonido de tus propios pasos.",
    options: [{text: "Continuar explorando.", targetNodeId: "intro" /* Placeholder */}, {text: "Volver.", targetNodeId: "bosque_susurrante_entrada"}]
  }
};