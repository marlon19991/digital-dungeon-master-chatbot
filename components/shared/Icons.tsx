
import React from 'react';

// Generic Icon Props
interface IconProps {
  className?: string;
}

export const DungeonMasterIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path d="M12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4c.75 0 1.42.22 2 .59V3.06C13.39 3.02 12.7 3 12 3c-2.76 0-5 2.24-5 5s2.24 5 5 5c.35 0 .68-.04 1-.11v-1.8c-.32-.05-.65-.09-1-.09zm6 0c0-1.68-.96-3.12-2.33-3.72.18.55.28 1.13.28 1.72 0 2.21-1.79 4-4 4-.59 0-1.17-.1-1.72-.28C10.88 15.04 12.32 16 14 16c2.21 0 4-1.79 4-4zm-6 4c1.68 0 3.12-.96 3.72-2.33-.55.18-1.13.28-1.72.28-2.21 0-4-1.79-4-4 0-.59.1-1.17.28-1.72C7.96 10.88 7 12.32 7 14c0 2.21 1.79 4 4 4zM12 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

export const ScrollIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm0 2h12v16H6V4zm2 2v2h8V6H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z"/>
    <path d="M5 4v16c0 .55-.45 1-1 1s-1-.45-1-1V4c0-.55.45-1 1-1s1 .45 1 1zm15 0v16c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1s-1 .45-1 1z"/>
  </svg>
);

export const SwordIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.121 2.465l-1.414 1.414L4.293 15.293.757 18.828l4.95 4.95 3.535-3.535L19.657 8.828l1.414-1.414-7.071-7.07zM6.172 20.313l-2.122-2.121 2.829-2.829 2.121 2.122-2.828 2.828zm3.535-3.535l-2.121-2.121 7.07-7.071 2.122 2.121-7.071 7.071zM18 9.242l-2.121-2.121.707-.707L18 7.828l-1.414-1.414L18 4.95l1.414 1.414-1.414 1.414.707.707 1.414-1.414L22.05 8.535l-4.05 4.05-1.414-1.414.707-.707-1.414-1.414z"/>
  </svg>
);

export const OpenBookIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm12 15H6c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1h.5c.28 0 .5.22.5.5v12c0 .28.22.5.5.5h10c.28 0 .5-.22.5-.5V4.5c0-.28.22-.5.5-.5H18c.55 0 1 .45 1 1v15c0 .55-.45 1-1 1z"/>
    <path d="M13 4h5v8l-2.5-1.5L13 12V4z"/>
  </svg>
);

// FIX: Add BookOpenIcon
export const BookOpenIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

export const UserPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5V12m0 0V16.5m0-4.5h3.75m-3.75 0H12.75m4.5-7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.75 19.5v-1.5a2.25 2.25 0 0 1 2.25-2.25h3.75a2.25 2.25 0 0 1 2.25 2.25v1.5m-10.5-9h9.75" />
  </svg>
);

export const UserCheckIcon: React.FC<IconProps> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);


export const ArrowLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

export const FolderOpenIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 1.5 7.5V5.25A2.25 2.25 0 0 1 3.75 3h5.25a2.25 2.25 0 0 1 1.652.724l1.348 1.348a2.25 2.25 0 0 0 1.652.724h3.75a2.25 2.25 0 0 1 2.25 2.25v1.5M3.75 9.75A2.25 2.25 0 0 0 1.5 12v5.25A2.25 2.25 0 0 0 3.75 19.5h16.5A2.25 2.25 0 0 0 22.5 17.25V12A2.25 2.25 0 0 0 20.25 9.75H3.75Z" />
  </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const ArrowUturnLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);

export const PaperAirplaneIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L21 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L12.25 12l2.846.813a4.5 4.5 0 0 0 3.09 3.09L21 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09Z" />
  </svg>
);

export const ArrowPathIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const Cog6ToothIcon: React.FC<IconProps> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93L15.6 7.23c.478.198.826.54.978 1.014L17.52 10c.14.455.017.95-.33 1.276l-.748.562c-.39.293-.59.75-.59 1.208v1.848c0 .458.198.915.59 1.208l.748.562c.347.327.47.82.33 1.276l-.944 1.755c-.152.474-.5.816-.978 1.014l-2.036.844c-.396.166-.71.506-.78.93l-.149.894c-.09.542-.56.94-1.11-.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.402 1.402 0 0 1-.78-.93l-2.036-.844a1.2 1.2 0 0 1-.978-1.014L6.48 16c-.14-.455.017-.95.33-1.276l.748-.562c.39-.293.59-.75.59-1.208v-1.848c0-.458-.198.915-.59-1.208l-.748-.562c.347-.327.47-.82.33-1.276l-.944-1.755c-.152-.474-.5-.816-.978-1.014l-2.036-.844c-.396-.166-.71-.506-.78-.93l-.149-.894c-.09-.542-.56.94-1.11-.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.402 1.402 0 0 1-.78-.93L1.44 9.23A1.2 1.2 0 0 1 .462 8.216L1.406 6.46c.152-.474.5-.816.978-1.014l2.036-.844a1.402 1.402 0 0 1 .78-.93l.149-.894Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
);

export const CubeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const MinusCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ShieldExclamationIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const HandRaisedIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.375A17.13 17.13 0 0 1 12 21.75c-2.672 0-5.18-.555-7.577-1.521A17.106 17.106 0 0 1 3 12.25c0-4.995 2.524-9.542 6.305-12.143C10.922.354 12.43.03 14.013 0c1.803.03 3.45.513 4.923 1.387.74.433 1.415.936 2.018 1.484C22.47 3.98 23.13 5.11 23.38 6.25c.21 1.01.13 2.07-.23 3.097a17.237 17.237 0 0 1-1.346 3.323c-.357.68-.767 1.324-1.21 1.936-.21.297-.42.592-.634.882-.07.097-.137.195-.207.293-.295.422-.6.83-.915 1.22-.32.396-.646.782-.98 1.155-.28.313-.56.616-.84.908-.27.283-.53.556-.79.815-.33.33-.66.648-1.01.938Zm0 0A17.074 17.074 0 0 0 12 21.75c-2.672 0-5.18-.555-7.577-1.521M15.042 21.375C14.194 21.136 13.12 21 12 21c-2.672 0-5.18-.555-7.577-1.521" />
  </svg>
);

export const WandSparklesIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-2.054.014L4.75 18.23a.75.75 0 0 0 1.06 1.061l1.716-1.716a3 3 0 0 0 .014-2.054l-1.716-1.716a.75.75 0 1 0-1.06 1.06l1.716 1.716Zm9.47-9.47a3 3 0 0 0-2.054-.014L14.23 8.914a.75.75 0 0 0 1.06-1.06l1.716 1.716a3 3 0 0 0 .014 2.054l-1.716 1.716a.75.75 0 0 0 1.06 1.06l1.716-1.716a3 3 0 0 0-.014-2.054Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-3 3h3m-1.5-6V1.5m0 9V12m0-4.5a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0Zm0 9a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0Z" />
  </svg>
);

export const ArrowsUpDownLeftRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5m-13.5 0L7.5 12m0 0L12 7.5m-4.5 4.5H12m0 0h4.5m4.5 0L16.5 12m0 0L12 16.5m4.5-4.5H12m0 0H7.5" />
  </svg>
);

export const PuzzlePieceIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    {/* <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);


export const BrainIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 5.25c2.399 0 4.584.707 6.25 1.943M15.75 5.25c-2.399 0-4.584.707-6.25 1.943M12 12.75c.69 0 1.338-.08 1.94-.223M12 12.75c-.69 0-1.338-.08-1.94-.223M12 12.75v4.5m0 0c-2.399 0-4.584.707-6.25 1.943m6.25-1.943c2.399 0 4.584.707 6.25 1.943m-10.5-1.943L3.75 9.513m2.75 3.237L3.75 16.25m16.5-6.737L20.25 9.513m-2.75 3.237L20.25 16.25M12 5.25c.69 0 1.338-.08 1.94-.223M12 5.25c-.69 0-1.338-.08-1.94-.223M12 3V2.25m0 19.5V21m-6.75-6.75c0-1.125.283-2.187.776-3.131m11.948 0c.493.944.776 2.006.776 3.131M4.5 12c0-1.638.468-3.176 1.29-4.478m12.42 0C19.032 8.824 19.5 10.362 19.5 12M12 12.75a1.5 1.5 0 0 0-1.5 1.5v.75m1.5-2.25a1.5 1.5 0 0 1 1.5 1.5v.75" />
    </svg>
);

export const WindIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 8.358 4.5 12 4.5Zm0 3.75a3.75 3.75 0 0 0 0 7.5M3 12h1.5m15 0H21m-9-9v1.5m0 15V21" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.162 7.522a5.25 5.25 0 0 1 6.786.313M17.838 16.478a5.25 5.25 0 0 1-6.786-.313" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const LockOpenIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75M10.5 10.5h3M10.5 10.5H3V21h18V10.5h-3.75M10.5 10.5V21" />
  </svg>
);

export const ArrowsPointingOutIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
  </svg>
);

export const ChatBubbleLeftRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.696-3.696C12.056 15.785 11.25 15 10.5 15h-1.99c-.001 0-.002 0-.003 0H7.5c-.884-.284-1.5-1.128-1.5-2.097V9.434c0-1.136.847-2.1 1.98-2.193.34-.027.68-.052 1.02-.072V3.756L10.5 7.452 12 9.75V7.5c.884.284 1.5 1.128 1.5 2.097V12c0 .298-.032.59-.09.875M7.5 15h3M2.25 6H1.5V4.5h.75A2.25 2.25 0 0 1 4.5 6.75v1.5H6V6.75A2.25 2.25 0 0 0 3.75 4.5H2.25Z" />
  </svg>
);

export const ShieldPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75h6m-3-3v6M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

export const BackpackIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-3 0V3.75c0-.621.504-1.125 1.125-1.125h.75c.621 0 1.125.504 1.125 1.125V6M4.5 6h15V18a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3V6Z" />
  </svg>
);

export const CircleDollarSignIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.219 12.768 11 12 11c-.768 0-1.536.219-2.121.659Zm10.879 3.478a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const GlassDrinkIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 4.125a1.125 1.125 0 0 1 1.125-1.125h2.25a1.125 1.125 0 0 1 1.125 1.125V6.375c0 .473-.13.924-.365 1.31L12 10.5l-2.26-2.815A2.25 2.25 0 0 0 9.75 6.375V4.125ZM9.75 10.5H4.5V21h15V10.5h-5.25M9.75 10.5c.001 0 .002 0 .003 0Z" />
  </svg>
);

export const ArrowUpOnSquareIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9A2.25 2.25 0 0 0 18.75 19.5v-9a2.25 2.25 0 0 0-2.25-2.25H15M12 15V4.5m0 0L8.25 8.25M12 4.5l3.75 3.75" />
  </svg>
);

export const ArrowUpCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.82.61l-4.725-2.885a.562.562 0 0 0-.652 0l-4.725 2.885a.562.562 0 0 1-.82-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);
