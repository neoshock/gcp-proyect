// src/app/(auth)/layout.tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { authService } from './services/authService'
import { Menu } from '@headlessui/react'
import { Toaster } from 'sonner'
import { LayoutDashboard, Users, ChevronLeft, ChevronRight } from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Referidos', href: '/dashboard/referidos', icon: Users },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        authService.getUser()
            .then((user) => {
                if (!user) {
                    router.push('/login')
                } else {
                    setUserEmail(user.email ?? null)
                }
            })
            .catch(() => router.push('/login'))
    }, [])

    const handleLogout = async () => {
        try {
            await authService.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Error al cerrar sesión', error)
        }
    }


    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-18'} overflow-hidden bg-white shadow-lg transition-all duration-300 flex flex-col`}>
                {/* Logo + Toggle */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    {sidebarOpen ? (
                        <Image
                            src="/images/logo-secondary.png"
                            alt="Logo"
                            width={200}
                            height={300}
                            className="object-contain"
                        />
                    ) : (
                        <Image
                            src="/images/main_logo.jpeg"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    )}

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
                    >
                        {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <li key={item.name} className="group relative">
                                    <Link
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#800000] text-white' : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        {sidebarOpen ? (
                                            <span className="ml-3">{item.name}</span>
                                        ) : (
                                            <span className="absolute left-full ml-2 whitespace-nowrap bg-black text-white text-xs rounded px-2 py-1 shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {item.name}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-800">
                            {navigation.find(nav => nav.href === pathname)?.name || 'Dashboard'}
                        </h1>

                        {userEmail && (
                            <Menu as="div" className="relative inline-block text-left">
                                <Menu.Button className="flex items-center text-gray-700 hover:text-gray-900 font-medium">
                                    <div className="w-8 h-8 bg-[#800000] rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                                        {userEmail.charAt(0).toUpperCase()}
                                    </div>
                                    {userEmail}
                                </Menu.Button>
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white shadow-lg rounded-md border border-gray-200 z-50">
                                    <div className="py-1">
                                        <Menu.Item>
                                            {({ active }: { active: boolean }) => (
                                                <button
                                                    onClick={handleLogout}
                                                    className={`${active ? 'bg-gray-100' : ''
                                                        } w-full text-left px-4 py-2 text-sm text-gray-700`}
                                                >
                                                    Cerrar sesión
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Menu>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 bg-gray-50">
                    {children}
                    <Toaster position="top-right" toastOptions={{ className: 'z-[9999]' }} />
                </main>
            </div>
        </div>
    )
}