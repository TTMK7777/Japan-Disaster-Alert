'use client';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const languages = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
  { code: 'easy_ja', name: 'やさしい日本語', flag: '🔰' },
];

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <select
      value={currentLanguage}
      onChange={(e) => onLanguageChange(e.target.value)}
      className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code} className="text-gray-900">
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
