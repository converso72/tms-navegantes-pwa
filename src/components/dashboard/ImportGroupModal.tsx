import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Sparkles,
  FileJson,
  AlignLeft,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { importCustomDeckGroup, type CustomVerseInput } from '../../db/dexie-db';

interface ImportGroupModalProps {
  onClose: () => void;
  onImported: (deckId: string, count: number) => void;
}

interface PresetPack {
  id: string;
  code: string;
  organization: string;
  title: string;
  subtitle: string;
  accentColor: string;
  verses: CustomVerseInput[];
}

const PRESET_PACKS: PresetPack[] = [
  {
    id: 'SEG',
    code: 'SEG',
    organization: 'Los Navegantes • Oficial',
    title: 'Seguros en Cristo (5 Seguridades)',
    subtitle: 'El paquete introductorio oficial de Los Navegantes sobre las 5 promesas fundamentales del creyente.',
    accentColor: '#8C5A3C',
    verses: [
      {
        topic: 'Seguridad de la Salvación',
        reference: '1 Juan 5:11-12',
        text: 'Y este es el testimonio: que Dios nos ha dado vida eterna; y esta vida está en su Hijo. El que tiene al Hijo, tiene la vida; el que no tiene al Hijo de Dios no tiene la vida.',
      },
      {
        topic: 'Seguridad de la Respuesta a la Oración',
        reference: 'Juan 16:24',
        text: 'Hasta ahora nada habéis pedido en mi nombre; pedid, y recibiréis, para que vuestro gozo sea cumplido.',
      },
      {
        topic: 'Seguridad de la Victoria sobre la Tentación',
        reference: '1 Corintios 10:13',
        text: 'No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios, que no os dejará ser tentados más de lo que podéis resistir, sino que dará también juntamente con la tentación la salida, para que podáis soportar.',
      },
      {
        topic: 'Seguridad del Perdón',
        reference: '1 Juan 1:9',
        text: 'Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad.',
      },
      {
        topic: 'Seguridad de la Dirección Divina',
        reference: 'Proverbios 3:5-6',
        text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.',
      },
    ],
  },
  {
    id: 'DEP',
    code: 'DEP',
    organization: 'Los Navegantes • Discipulado',
    title: 'Diseño para el Discipulado (DEP)',
    subtitle: 'Los versículos clave de la serie DEP de Los Navegantes para el crecimiento espiritual y liderazgo.',
    accentColor: '#74482E',
    verses: [
      {
        topic: 'Crecimiento en Gracia',
        reference: '2 Pedro 3:18',
        text: 'Antes bien, creced en la gracia y el conocimiento de nuestro Señor y Salvador Jesucristo. A él sea gloria ahora y hasta el día de la eternidad. Amén.',
      },
      {
        topic: 'La Palabra Atesorada',
        reference: 'Colosenses 3:16',
        text: 'La palabra de Cristo more en abundancia en vosotros, enseñándoos y exhortándoos unos a otros en toda sabiduría, cantando con gracia en vuestros corazones al Señor con salmos e himnos y cánticos espirituales.',
      },
      {
        topic: 'Andar en el Espíritu',
        reference: 'Gálatas 5:16',
        text: 'Digo, pues: Andad en el Espíritu, y no satisfagáis los deseos de la carne.',
      },
      {
        topic: 'El Fruto del Espíritu',
        reference: 'Gálatas 5:22-23',
        text: 'Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley.',
      },
      {
        topic: 'Siervos Fieles',
        reference: '2 Timoteo 2:2',
        text: 'Lo que has oído de mí ante muchos testigos, esto encarga a hombres fieles que sean idóneos para enseñar también a otros.',
      },
      {
        topic: 'Todo de Corazón para el Señor',
        reference: 'Colosenses 3:23',
        text: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres;',
      },
      {
        topic: 'Pensamientos Cautivos',
        reference: '2 Corintios 10:5',
        text: 'Derribando argumentos y toda altivez que se levanta contra el conocimiento de Dios, y llevando cautivo todo pensamiento a la obediencia a Cristo,',
      },
    ],
  },
  {
    id: 'ATR',
    code: 'ATR',
    organization: 'Los Navegantes • Teología',
    title: 'Los Atributos y la Grandeza de Dios',
    subtitle: 'Pasajes de adoración sobre la soberanía, santidad, sabiduría y fidelidad eterna de Dios.',
    accentColor: '#9C6644',
    verses: [
      {
        topic: 'Conocer a Dios',
        reference: 'Jeremías 9:23-24',
        text: 'Así dijo Jehová: No se alabe el sabio en su sabiduría, ni en su valentía se alabe el valiente, ni el rico se alabe en sus riquezas. Mas alábese en esto el que se hubiere de alabar: en entenderme y conocerme, que yo soy Jehová, que hago misericordia, juicio y justicia en la tierra; porque estas cosas quiero, dice Jehová.',
      },
      {
        topic: 'Dios Eterno e Infatigable',
        reference: 'Isaías 40:28',
        text: '¿No has sabido, no has oído que el Dios eterno es Jehová, el cual creó los confines de la tierra? No desfallece, ni se fatiga con cansancio, y su entendimiento no hay quien lo alcance.',
      },
      {
        topic: 'Omnisciencia de Dios',
        reference: 'Salmos 139:1-2',
        text: 'Oh Jehová, tú me has examinado y conocido. Tú has conocido mi sentarme y mi levantarme; has entendido desde lejos mis pensamientos.',
      },
      {
        topic: 'Supremacía de Cristo',
        reference: 'Colosenses 1:16-17',
        text: 'Porque en él fueron creadas todas las cosas, las que hay en los cielos y las que hay en la tierra, visibles e invisibles; sean tronos, sean dominios, sean principados, sean potestades; todo fue creado por medio de él y para él. Y él es antes de todas las cosas, y todas las cosas en él subsisten;',
      },
      {
        topic: 'Profundidad de su Sabiduría',
        reference: 'Romanos 11:33, 36',
        text: '¡Oh profundidad de las riquezas de la sabiduría y de la ciencia de Dios! ¡Cuán insondables son sus juicios, e inescrutables sus caminos! Porque de él, y por él, y para él, son todas las cosas. A él sea la gloria por los siglos. Amén.',
      },
    ],
  },
  {
    id: 'BAT',
    code: 'BAT',
    organization: 'Truth78 / Desiring God',
    title: 'Fighter Verses (Versículos de Batalla)',
    subtitle: 'Selección famosa para pelear la batalla de la fe contra la ansiedad, el temor y el desánimo.',
    accentColor: '#586F6B',
    verses: [
      {
        topic: 'Jehová va delante de ti',
        reference: 'Deuteronomio 31:8',
        text: 'Y Jehová va delante de ti; él estará contigo, no te dejará, ni te desamparará; no temas ni te intimides.',
      },
      {
        topic: 'Plenitud de Gozo',
        reference: 'Salmos 16:11',
        text: 'Me mostrarás la senda de la vida; en tu presencia hay plenitud de gozo; delicias a tu diestra para siempre.',
      },
      {
        topic: 'La Roca de mi Corazón',
        reference: 'Salmos 73:25-26',
        text: '¿A quién tengo yo en los cielos sino a ti? Y fuera de ti nada deseo en la tierra. Mi carne y mi corazón desfallecen; mas la roca de mi corazón y mi porción es Dios para siempre.',
      },
      {
        topic: 'Nuevas Fuerzas como Águilas',
        reference: 'Isaías 40:31',
        text: 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.',
      },
      {
        topic: 'Gozo en la Prueba',
        reference: 'Habacuc 3:17-18',
        text: 'Aunque la higuera no florezca, ni en las vides haya frutos, aunque falte el producto del olivo, y los labrados no den mantenimiento, y las ovejas sean quitadas de la majada, y no haya vacas en los corrales; con todo, yo me alegraré en Jehová, y me gozaré en el Dios de mi salvación.',
      },
      {
        topic: 'Trono de la Gracia',
        reference: 'Hebreos 4:15-16',
        text: 'Porque no tenemos un sumo sacerdote que no pueda compadecerse de nuestras debilidades, sino uno que fue tentado en todo según nuestra semejanza, pero sin pecado. Acerquémonos, pues, confiadamente al trono de la gracia, para alcanzar misericordia y hallar gracia para el oportuno socorro.',
      },
    ],
  },
  {
    id: 'EVA',
    code: 'EVA',
    organization: 'Evangelismo Personal',
    title: 'El Camino de Romanos (Evangelio)',
    subtitle: 'La secuencia clásica para compartir el mensaje de salvación con claridad y precisión bíblica.',
    accentColor: '#6B705C',
    verses: [
      {
        topic: 'No hay justo',
        reference: 'Romanos 3:10-12',
        text: 'Como está escrito: No hay justo, ni aun uno; no hay quien entienda, no hay quien busque a Dios. Todos se desviaron, a una se hicieron inútiles; no hay quien haga lo bueno, no hay ni siquiera uno.',
      },
      {
        topic: 'El Amor de Dios al Mundo',
        reference: 'Juan 3:16',
        text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
      },
      {
        topic: 'Jesús es el Camino',
        reference: 'Juan 14:6',
        text: 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.',
      },
      {
        topic: 'Confesar con tu Boca',
        reference: 'Romanos 10:9-10',
        text: 'Que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo. Porque con el corazón se cree para justicia, pero con la boca se confiesa para salvación.',
      },
      {
        topic: 'Invocar el Nombre del Señor',
        reference: 'Romanos 10:13',
        text: 'Porque todo aquel que invocare el nombre del Señor, será salvo.',
      },
    ],
  },
  {
    id: 'ARM',
    code: 'ARM',
    organization: 'Firmeza Espiritual',
    title: 'La Armadura de Dios',
    subtitle: 'Pasajes esenciales de Efesios 6 y las epístolas sobre vigilancia, fe y victoria espiritual.',
    accentColor: '#5C5346',
    verses: [
      {
        topic: 'Fortaleceos en el Señor',
        reference: 'Efesios 6:10-11',
        text: 'Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza. Vestíos de toda la armadura de Dios, para que podáis estar firmes contra las asechanzas del diablo.',
      },
      {
        topic: 'Verdad, Justicia y Paz',
        reference: 'Efesios 6:14-15',
        text: 'Estad, pues, firmes, ceñidos vuestros lomos con la verdad, y vestidos con la coraza de justicia, y calzados los pies con el apresto del evangelio de la paz.',
      },
      {
        topic: 'Escudo de Fe y Espada del Espíritu',
        reference: 'Efesios 6:16-17',
        text: 'Sobre todo, tomad el escudo de la fe, con que podáis apagar todos los dardos de fuego del maligno. Y tomad el yelmo de la salvación, y la espada del Espíritu, que es la palabra de Dios;',
      },
      {
        topic: 'Someteos a Dios y Resistid',
        reference: 'Santiago 4:7-8',
        text: 'Someteos, pues, a Dios; resistid al diablo, y huirá de vosotros. Acerquémonos a Dios, y él se acercará a vosotros.',
      },
      {
        topic: 'Palabra Viva y Eficaz',
        reference: 'Hebreos 4:12',
        text: 'Porque la palabra de Dios es viva y eficaz, y más cortante que toda espada de dos filos; y penetra hasta partir el alma y el espíritu, las coyunturas y los tuétanos, y discierne los pensamientos y las intenciones del corazón.',
      },
    ],
  },
  {
    id: 'ROM',
    code: 'ROM',
    organization: 'Estudio Expositivo',
    title: 'Romanos 8: Vida en el Espíritu',
    subtitle: 'Pasajes cumbre sobre la victoria, la adopción y el amor inseparable de Cristo.',
    accentColor: '#7F5539',
    verses: [
      {
        topic: 'Ninguna condenación',
        reference: 'Romanos 8:1',
        text: 'Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, sino conforme al Espíritu.',
      },
      {
        topic: 'Guiados por el Espíritu',
        reference: 'Romanos 8:14',
        text: 'Porque todos los que son guiados por el Espíritu de Dios, éstos son hijos de Dios.',
      },
      {
        topic: 'Propósito eterno',
        reference: 'Romanos 8:28',
        text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
      },
      {
        topic: 'Más que vencedores',
        reference: 'Romanos 8:31',
        text: '¿Qué, pues, diremos a esto? Si Dios es por nosotros, ¿quién contra nosotros?',
      },
      {
        topic: 'Amor inseparable',
        reference: 'Romanos 8:38-39',
        text: 'Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir, ni lo alto, ni lo profundo, ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.',
      },
    ],
  },
  {
    id: 'SAL',
    code: 'SAL',
    organization: 'Devocional Clásico',
    title: 'Salmos de Refugio y Confianza',
    subtitle: 'Oraciones clásicas de consuelo, protección y descanso en Jehová.',
    accentColor: '#586F6B',
    verses: [
      {
        topic: 'El Buen Pastor',
        reference: 'Salmos 23:1-2',
        text: 'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.',
      },
      {
        topic: 'Luz y Salvación',
        reference: 'Salmos 27:1',
        text: 'Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?',
      },
      {
        topic: 'Pronto auxilio',
        reference: 'Salmos 46:1',
        text: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.',
      },
      {
        topic: 'Habitar al abrigo',
        reference: 'Salmos 91:1-2',
        text: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quién confiaré.',
      },
      {
        topic: 'Socorro de los montes',
        reference: 'Salmos 121:1-2',
        text: 'Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová, que hizo los cielos y la tierra.',
      },
    ],
  },
  {
    id: 'SER',
    code: 'SER',
    organization: 'Enseñanzas de Jesús',
    title: 'El Sermón del Monte',
    subtitle: 'Las bienaventuranzas y enseñanzas del Reino de los Cielos (Mateo 5–7).',
    accentColor: '#6B705C',
    verses: [
      {
        topic: 'Pobres en espíritu',
        reference: 'Mateo 5:3',
        text: 'Bienaventurados los pobres en espíritu, porque de ellos es el reino de los cielos.',
      },
      {
        topic: 'Limpios de corazón',
        reference: 'Mateo 5:8',
        text: 'Bienaventurados los de limpio corazón, porque ellos verán a Dios.',
      },
      {
        topic: 'Sal de la tierra',
        reference: 'Mateo 5:13',
        text: 'Vosotros sois la sal de la tierra; pero si la sal se desvaneciere, ¿con qué será salada? No sirve más para nada, sino para ser echada fuera y hollada por los hombres.',
      },
      {
        topic: 'Tesoros en el cielo',
        reference: 'Mateo 6:19-21',
        text: 'No os hagáis tesoros en la tierra, donde la polilla y el orín corrompen, y donde ladrones minan y hurtan; sino haceos tesoros en el cielo, donde ni la polilla ni el orín corrompen, y donde ladrones no minan ni hurtan. Porque donde esté vuestro tesoro, allí estará también vuestro corazón.',
      },
      {
        topic: 'Pedid, buscad, llamad',
        reference: 'Mateo 7:7',
        text: 'Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.',
      },
    ],
  },
];

/**
 * Parsea un bloque de texto libre en versículos individuales.
 */
function parseBulkVersesText(rawText: string, defaultTopic: string): CustomVerseInput[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed: CustomVerseInput[] = [];

  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 3) {
        parsed.push({
          topic: parts[0],
          reference: parts[1],
          text: parts.slice(2).join(' | '),
        });
        continue;
      } else if (parts.length === 2) {
        parsed.push({
          topic: defaultTopic,
          reference: parts[0],
          text: parts[1],
        });
        continue;
      }
    }

    const regexMatch = line.match(
      /^((?:[1-3]\s+)?[A-Za-záéíóúñÁÉÍÓÚÑ]+\s+\d+:\d+(?:-\d+(?:,\s*\d+)?)?)\s*(?:[-–—:]|\s{2,})\s*(.+)$/
    );
    if (regexMatch) {
      parsed.push({
        topic: defaultTopic,
        reference: regexMatch[1].trim(),
        text: regexMatch[2].trim(),
      });
    }
  }

  return parsed;
}

export const ImportGroupModal: React.FC<ImportGroupModalProps> = ({
  onClose,
  onImported,
}) => {
  const [tab, setTab] = useState<'presets' | 'paste' | 'json'>('presets');
  const [code, setCode] = useState('M1');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [accentColor, setAccentColor] = useState('#8C5A3C');
  const [rawText, setRawText] = useState(
    `El Amor de Dios | Juan 3:16 | Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.\nFe y Confianza | Proverbios 3:5-6 | Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.`
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTextGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Por favor, escribe un título para el grupo de versículos.');
      return;
    }

    const parsedVerses = parseBulkVersesText(rawText, title.trim());
    if (parsedVerses.length === 0) {
      setErrorMsg(
        'No se detectaron versículos válidos. Usa el formato: "Tema | Cita | Texto" o "Cita | Texto" (uno por línea).'
      );
      return;
    }

    setIsSaving(true);
    try {
      const result = await importCustomDeckGroup({
        code,
        title,
        subtitle,
        accentColor,
        verses: parsedVerses,
      });
      onImported(result.deckId, result.importedCount);
    } catch {
      setErrorMsg('Ocurrió un error al guardar el grupo en la base de datos local.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPreset = async (pack: PresetPack) => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const result = await importCustomDeckGroup({
        code: pack.code,
        title: pack.title,
        subtitle: pack.subtitle,
        accentColor: pack.accentColor,
        verses: pack.verses,
      });
      onImported(result.deckId, result.importedCount);
    } catch {
      setErrorMsg('Error al cargar el paquete predefinido.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);

      const groupTitle = parsed.title || file.name.replace(/\.json$/i, '');
      const groupCode = parsed.code || parsed.id || 'J1';
      const versesArray: CustomVerseInput[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.verses)
        ? parsed.verses
        : Array.isArray(parsed.cards)
        ? parsed.cards
        : [];

      const validVerses = versesArray.filter((v) => v && v.reference && v.text);

      if (validVerses.length === 0) {
        setErrorMsg(
          'El archivo JSON debe contener una lista de objetos con las propiedades "reference" y "text".'
        );
        return;
      }

      const result = await importCustomDeckGroup({
        code: String(groupCode),
        title: String(groupTitle),
        subtitle: parsed.subtitle,
        accentColor: parsed.accentColor || '#8C5A3C',
        verses: validVerses,
      });
      onImported(result.deckId, result.importedCount);
    } catch {
      setErrorMsg('El archivo seleccionado no tiene un formato JSON válido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-2xl p-5 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C5A3C] dark:text-[#D4A373] block">
              Biblioteca de Planes
            </span>
            <h2 className="text-lg font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
              Cargar Grupos de Versículos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#EFECE6] dark:bg-[#26221E] text-[#6E675F] hover:text-[#2C2825]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas del importador */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#EFECE6] dark:bg-[#26221E] shrink-0">
          {[
            { id: 'presets', label: 'Planes Oficiales', icon: Sparkles },
            { id: 'paste', label: 'Pegar Lista', icon: AlignLeft },
            { id: 'json', label: 'Archivo JSON', icon: FileJson },
          ].map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id as typeof tab);
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#8C5A3C] dark:text-[#D4A373] shadow-sm'
                    : 'text-[#6E675F] dark:text-[#9E958B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-900/10 border border-red-700/30 text-red-800 dark:text-red-300 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Contenedor desplazable */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
          {/* MODO 1: PACKS BÍBLICOS Y PLANES DE LOS NAVEGANTES EN 1 CLIC */}
          {tab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-[#6E675F] dark:text-[#A39A90]">
                Descarga con un toque planes oficiales de <strong>Los Navegantes</strong> y de otros
                ministerios (todos en Reina-Valera 1960):
              </p>
              {PRESET_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-4 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9] dark:border-[#332E2A] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        style={{ backgroundColor: pack.accentColor }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
                      >
                        {pack.code}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#1C1917] text-[#8C5A3C] dark:text-[#D4A373] border border-[#E5DEC9] dark:border-[#332E2A]">
                        {pack.organization}
                      </span>
                      <span className="text-xs font-mono text-[#7D746B] dark:text-[#A39A90]">
                        • {pack.verses.length} vers.
                      </span>
                    </div>
                    <h3 className="text-sm font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                      {pack.title}
                    </h3>
                    <p className="text-xs text-[#6E675F] dark:text-[#9E958B]">{pack.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleLoadPreset(pack)}
                    className="shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#8C5A3C] text-white hover:bg-[#74482E] transition active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Añadir
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* MODO 2: PEGAR LISTA DE VERSÍCULOS */}
          {tab === 'paste' && (
            <form onSubmit={handleSaveTextGroup} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E675F] dark:text-[#A39A90] mb-1">
                    Código Corto
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. M1"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#24201D] border border-[#E2DDD5] dark:border-[#36302B] text-xs font-mono uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-[#6E675F] dark:text-[#A39A90] mb-1">
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Promesas de Fe / Estudio Dominical"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#24201D] border border-[#E2DDD5] dark:border-[#36302B] text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-[#6E675F] dark:text-[#A39A90] mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Breve nota sobre este grupo de versículos..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#24201D] border border-[#E2DDD5] dark:border-[#36302B] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E675F] dark:text-[#A39A90] mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {['#8C5A3C', '#6B705C', '#586F6B', '#7F5539', '#9C6644'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition ${
                          accentColor === c ? 'ring-2 ring-offset-2 ring-[#8C5A3C]' : 'opacity-60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#6E675F] dark:text-[#A39A90]">
                    Pega tus versículos (uno por línea)
                  </label>
                  <span className="text-[10px] font-mono text-[#8C5A3C] dark:text-[#D4A373]">
                    Tema | Cita | Texto
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Juan 3:16 | Porque de tal manera amó Dios al mundo..."
                  className="w-full p-3 rounded-2xl bg-white dark:bg-[#24201D] border border-[#E2DDD5] dark:border-[#36302B] text-xs font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]"
                />
                <p className="text-[11px] text-[#7D746B] dark:text-[#9E958B] mt-1">
                  Acepta <code>Tema | Cita | Texto</code>, <code>Cita | Texto</code> o{' '}
                  <code>Juan 3:16 - Texto</code>. Las palabras clave para los 4 modos se generan
                  solas.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#6E675F] hover:bg-[#EFECE6] dark:hover:bg-[#26221E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#8C5A3C] hover:bg-[#74482E] text-white shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : 'Cargar Grupo'}
                </button>
              </div>
            </form>
          )}

          {/* MODO 3: SUBIR ARCHIVO JSON */}
          {tab === 'json' && (
            <div className="space-y-4 py-2">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#D5CBB8] dark:border-[#3E3832] rounded-2xl cursor-pointer hover:bg-[#F4F0E8]/60 dark:hover:bg-[#24201D] transition text-center">
                <Upload className="w-7 h-7 text-[#8C5A3C] dark:text-[#D4A373] mb-2" />
                <span className="text-xs font-semibold text-[#2C2825] dark:text-[#F3EFEA]">
                  Seleccionar archivo .JSON de tu dispositivo
                </span>
                <span className="text-[11px] text-[#7D746B] dark:text-[#9E958B] mt-1">
                  Importación instantánea 100% offline en IndexedDB
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
              </label>

              <div className="p-3.5 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9] dark:border-[#332E2A] space-y-1.5">
                <p className="text-[11px] font-semibold text-[#5A534C] dark:text-[#C5BDB3]">
                  Ejemplo de estructura JSON admitida:
                </p>
                <pre className="text-[10px] font-mono text-[#6E675F] dark:text-[#A39A90] overflow-x-auto">
{`{
  "code": "FE",
  "title": "Héroes de la Fe",
  "verses": [
    {
      "topic": "Certeza de la fe",
      "reference": "Hebreos 11:1",
      "text": "Es, pues, la fe la certeza de lo que se espera..."
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
