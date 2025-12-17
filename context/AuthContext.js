'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password })
    }

    const signUp = async (email, password) => {
        return await supabase.auth.signUp({ email, password })
    }

    const signUpWithProfile = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) return { data, error };

        if (data?.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: data.user.id, role: 'Ventas' }]);

            if (profileError) {
                console.error('Error creating profile:', profileError);
                // Optionally handle cleanup or improved error reporting here
                return { data, error: profileError };
            }
        }
        return { data, error };
    }

    const signOut = async () => {
        return await supabase.auth.signOut()
    }

    const value = {
        user,
        signIn,
        signUp,
        signUpWithProfile,
        signOut,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
