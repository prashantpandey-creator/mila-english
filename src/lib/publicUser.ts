import { isGuestIdentity } from '@/lib/auth';

export type PublicUserSource = {
  id: number;
  email: string;
  name: string;
  learnerCategory: string;
  nativeLanguage: string;
  level: string | null;
  streakDays: number;
  accountType?: string | null;
  emailVerifiedAt?: Date | string | null;
};

export function publicUser(user: PublicUserSource) {
  const isGuest = isGuestIdentity(user.accountType, user.email);
  return {
    id: user.id,
    // Keep the historical string contract for the native iOS client. Guest
    // addresses are random, non-routable Mila identifiers; browser UI uses the
    // explicit `isGuest` flag and never presents this internal address.
    email: user.email,
    name: user.name,
    learnerCategory: user.learnerCategory,
    nativeLanguage: user.nativeLanguage,
    level: user.level,
    streakDays: user.streakDays,
    accountType: isGuest ? 'guest' as const : 'registered' as const,
    isGuest,
    emailVerified: !isGuest && !!user.emailVerifiedAt,
  };
}
