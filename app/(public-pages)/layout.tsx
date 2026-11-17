import React from 'react';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import LenisScroll from '@/components/lenis-scroll';

export const metadata = {
    title: 'VibeFit | Entrena a tu manera',
    description: 'Entrena con VibeFit y avanza hacia tus objetivos.',
    appleWebApp: {
        title: 'VibeFit',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <LenisScroll />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
