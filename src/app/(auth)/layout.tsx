// src/app/(auth)/layout.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { Menu } from '@headlessui/react'
import { Toaster } from 'sonner';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push('/login')
            } else {
                setUserEmail(data.user.email ?? null)
            }
        })
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="w-full bg-[#800000] py-2 px-4 flex justify-between items-center">
                <Image
                    src="/images/logo-secondary.png"
                    alt="Logo"
                    width={300}
                    height={90}
                    className="h-14 object-contain"
                />
                {userEmail && (
                    <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="text-white font-medium hover:underline">
                            {userEmail}
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-white shadow-lg rounded-md z-50">
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
            </header>

            {/* Contenido del dashboard */}
            <main className="flex-1 p-6">{children}
                <Toaster position="top-right" toastOptions={{ className: 'z-[9999]' }} />
            </main>
        </div>
    )
}
