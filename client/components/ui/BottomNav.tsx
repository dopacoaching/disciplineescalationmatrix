'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLogoutMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store';
import { clearUser } from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';
import { useRouter } from 'next/navigation';

export function StaffBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [logout] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    dispatch(baseApi.util.resetApiState());
    router.replace('/login');
  };

  const items = [
    { href: '/dashboard',             label: t('nav.home'),      icon: <HomeIcon /> },
    { href: '/dashboard/my-entries',  label: t('nav.myEntries'), icon: <ListIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-30">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs font-medium transition-colors ${
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              ? 'text-primary'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs font-medium text-gray-400 hover:text-danger transition-colors"
      >
        <LogoutIcon />
        <span>{t('nav.logout')}</span>
      </button>
    </nav>
  );
}

export function AdminBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [logout] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    dispatch(baseApi.util.resetApiState());
    router.replace('/admin/login');
  };

  const items = [
    { href: '/admin/dashboard', label: t('nav.dashboard'), icon: <ChartIcon /> },
    { href: '/admin/students',  label: t('nav.students'),  icon: <UsersIcon /> },
    { href: '/admin/staff',     label: t('nav.staff'),     icon: <PersonIcon /> },
    { href: '/admin/batches',   label: t('nav.batches'),   icon: <FolderIcon /> },
    { href: '/admin/entries',   label: t('nav.entries'),   icon: <ListIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-30">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs font-medium transition-colors ${
            pathname === item.href || pathname.startsWith(item.href + '/')
              ? 'text-primary'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {item.icon}
          <span className="truncate w-full text-center">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs font-medium text-gray-400 hover:text-danger transition-colors"
      >
        <LogoutIcon />
        <span>{t('nav.logout')}</span>
      </button>
    </nav>
  );
}

function HomeIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function ListIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function LogoutIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}
function ChartIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function UsersIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function PersonIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function FolderIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
}
