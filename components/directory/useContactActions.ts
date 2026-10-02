import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContactInfo } from '@/lib/hounaApi';
import { contactLink } from '@/lib/directoryProfile';
import type { ContactAction } from './ProfileKit';

/**
 * A profile's bottom actions: call first, then email, as the main pill and
 * the round button beside it. With no usable contact, falls back to
 * houna.org's contact page so the page never dead-ends.
 */
export function useContactActions(contacts: ContactInfo[]): { primary: ContactAction; secondary?: ContactAction } {
  const { t, language } = useLanguage();
  const common = t.directory.common;

  return useMemo(() => {
    const make = (type: 'phone' | 'email'): ContactAction | null => {
      const c = contacts.find((x) => x.type === type);
      const href = c ? contactLink(c) : null;
      return href ? { kind: type, href, label: type === 'phone' ? common.call : common.sendEmail } : null;
    };
    const phone = make('phone');
    const email = make('email');
    const fallback: ContactAction = {
      kind: 'web',
      href: language === 'ar' ? 'https://houna.org/ar/contact-us' : 'https://houna.org/contact-us',
      label: common.contact,
    };
    const primary = phone ?? email ?? fallback;
    const secondary = phone && email ? email : undefined;
    return { primary, secondary };
  }, [contacts, language, common.call, common.sendEmail, common.contact]);
}
