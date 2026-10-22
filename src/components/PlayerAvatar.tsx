import React from 'react';
import { AVATARS } from '../game/quizzes';

interface PlayerAvatarProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarId,
  size = 'md',
  className = '',
}) => {
  const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size];

  const isImageAvatar =
    Boolean(avatar.imageUrl) ||
    ['fox', 'ninja', 'cyberninja', 'dragon', 'owl', 'lightning', 'crown', 'tiger', 'astronaut', 'panda'].includes(avatarId);

  if (isImageAvatar) {
    const src =
      avatar.imageUrl ||
      (avatarId === 'astronaut' || avatarId === 'panda'
        ? '/avatars/panda.jpg'
        : avatarId === 'tiger'
        ? '/avatars/tiger.jpg'
        : avatarId === 'crown'
        ? '/avatars/crown.jpg'
        : avatarId === 'lightning'
        ? '/avatars/lightning.jpg'
        : avatarId === 'owl'
        ? '/avatars/owl.jpg'
        : avatarId === 'dragon'
        ? '/avatars/dragon.jpg'
        : avatarId === 'ninja' || avatarId === 'cyberninja'
        ? '/avatars/cyberninja.jpg'
        : '/avatars/fox.jpg');

    let borderStyle = 'border-amber-500/40 bg-[#180B07] ring-1 ring-amber-500/20';
    if (avatarId === 'ninja' || avatarId === 'cyberninja') {
      borderStyle = 'border-cyan-500/50 bg-[#061426] ring-1 ring-cyan-500/30';
    } else if (avatarId === 'lightning') {
      borderStyle = 'border-sky-400/50 bg-[#08192E] ring-1 ring-blue-400/30';
    } else if (avatarId === 'dragon') {
      borderStyle = 'border-amber-600/50 bg-[#271B11] ring-1 ring-orange-500/30';
    } else if (avatarId === 'owl') {
      borderStyle = 'border-yellow-600/50 bg-[#1D1A16] ring-1 ring-amber-400/30';
    } else if (avatarId === 'crown') {
      borderStyle = 'border-rose-500/50 bg-[#25151A] ring-1 ring-amber-400/30';
    } else if (avatarId === 'tiger') {
      borderStyle = 'border-orange-600/50 bg-[#1E1713] ring-1 ring-amber-500/30';
    } else if (avatarId === 'astronaut' || avatarId === 'panda') {
      borderStyle = 'border-slate-400/50 bg-[#141416] ring-1 ring-slate-300/30';
    }

    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 select-none shadow-md border ${borderStyle} ${sizeClasses} ${className}`}
        title={avatar.name}
      >
        <img
          src={src}
          alt={avatar.name}
          className="w-full h-full object-cover rounded-xl"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl shrink-0 select-none shadow-sm border border-white/15 ${sizeClasses} ${className}`}
      style={{ backgroundColor: avatar.bgHex, color: avatar.accentHex }}
      title={avatar.name}
    >
      <svg viewBox="0 0 36 36" className="w-3/4 h-3/4" fill="none">
        {avatar.svgType === 'fox' && (
          <>
            <path d="M6 8L13 15L18 12L23 15L30 8L28 24L18 30L8 24L6 8Z" fill="currentColor" />
            <circle cx="13.5" cy="19.5" r="2" fill="#0F172A" />
            <circle cx="22.5" cy="19.5" r="2" fill="#0F172A" />
            <polygon points="18,23 15.5,26 20.5,26" fill="#0F172A" />
          </>
        )}
        {avatar.svgType === 'robot' && (
          <>
            <rect x="7" y="10" width="22" height="18" rx="4" fill="currentColor" />
            <line x1="18" y1="4" x2="18" y2="10" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="18" cy="4" r="2.5" fill="#F59E0B" />
            <rect x="11" y="15" width="4" height="4" rx="1" fill="#0F172A" />
            <rect x="21" y="15" width="4" height="4" rx="1" fill="#0F172A" />
            <rect x="12" y="22" width="12" height="2.5" rx="1" fill="#0F172A" />
          </>
        )}
        {avatar.svgType === 'dragon' && (
          <>
            <path d="M8 10L13 6L16 12H20L23 6L28 10L26 26L18 30L10 26L8 10Z" fill="currentColor" />
            <polygon points="13,18 16,16 16,20" fill="#0F172A" />
            <polygon points="23,18 20,16 20,20" fill="#0F172A" />
            <path d="M14 24H22" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {avatar.svgType === 'astronaut' && (
          <>
            <circle cx="18" cy="18" r="11" fill="currentColor" />
            <rect x="11" y="13" width="14" height="8" rx="4" fill="#0F172A" />
            <path d="M13 15.5H17" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {avatar.svgType === 'owl' && (
          <>
            <path d="M9 11C9 8 13 7 18 7C23 7 27 8 27 11V25C27 28 23 30 18 30C13 30 9 28 9 25V11Z" fill="currentColor" />
            <circle cx="14" cy="17" r="3.5" fill="#0F172A" />
            <circle cx="22" cy="17" r="3.5" fill="#0F172A" />
            <circle cx="14" cy="17" r="1.3" fill="#FFFFFF" />
            <circle cx="22" cy="17" r="1.3" fill="#FFFFFF" />
            <polygon points="18,19 16,23 20,23" fill="#F59E0B" />
          </>
        )}
        {avatar.svgType === 'lightning' && (
          <path
            d="M20 5L9 20H17L15 31L27 16H19L20 5Z"
            fill="currentColor"
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
        {avatar.svgType === 'crown' && (
          <>
            <path d="M6 25L8 11L14 17L18 9L22 17L28 11L30 25H6Z" fill="currentColor" />
            <circle cx="18" cy="19" r="2" fill="#DC2626" />
          </>
        )}
        {avatar.svgType === 'tiger' && (
          <>
            <circle cx="18" cy="18" r="11" fill="currentColor" />
            <path d="M10 13L14 15M26 13L22 15" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="14" cy="18" r="2" fill="#0F172A" />
            <circle cx="22" cy="18" r="2" fill="#0F172A" />
            <polygon points="18,21 15.5,24 20.5,24" fill="#0F172A" />
          </>
        )}
      </svg>
    </div>
  );
};

export const KahootShapeIcon: React.FC<{
  shape: 'triangle' | 'diamond' | 'circle' | 'square';
  className?: string;
}> = ({ shape, className = 'w-6 h-6' }) => {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="currentColor" aria-hidden="true">
      {shape === 'triangle' && <polygon points="12,3 22,20 2,20" />}
      {shape === 'diamond' && <polygon points="12,2 22,12 12,22 2,12" />}
      {shape === 'circle' && <circle cx="12" cy="12" r="9.5" />}
      {shape === 'square' && <rect x="3.5" y="3.5" width="17" height="17" rx="2" />}
    </svg>
  );
};
