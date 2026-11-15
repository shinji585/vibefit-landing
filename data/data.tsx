import React from "react";
import {
    Activity,
    Apple,
    ChartNoAxesCombined,
    CreditCard,
    Dumbbell,
} from "lucide-react";

export interface WhyChooseUsItem {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export const whyChooseUsData: WhyChooseUsItem[] = [
    {
        icon: <Activity className="size-5 text-zinc-600" />,
        title: "Seguimiento diario",
        description: "Registra tu peso, horas de sueño y calorías cada día.",
    },
    {
        icon: <Dumbbell className="size-5 text-zinc-600" />,
        title: "Rutinas personalizadas",
        description: "Tu coach te asigna una rutina activa hecha para ti.",
    },
    {
        icon: <Apple className="size-5 text-zinc-600" />,
        title: "Plan de alimentación",
        description: "Tu nutricionista carga tu plan y lo consultas desde tu perfil.",
    },
    {
        icon: <CreditCard className="size-5 text-zinc-600" />,
        title: "Membresía clara",
        description: "Revisa tu plan, costo, duración y vigencia.",
    },
    {
        icon: <ChartNoAxesCombined className="size-5 text-zinc-600" />,
        title: "Tu evolución",
        description: "Mira tu progreso en reportes dentro de la plataforma.",
    }
];

export interface TestimonialItem {
    name: string;
    location: string;
    text: string;
}

export const testimonialsCol1: TestimonialItem[] = [
    {
        name: "Camila Torres",
        location: "Cartagena",
        text: "Registrar mi peso y mis calorías cada día me ayudó a ver mi progreso real."
    },
    {
        name: "Andrés Mejía",
        location: "Barranquilla",
        text: "Mi coach me asignó una rutina a mi medida y la tengo siempre en mi perfil."
    },
    {
        name: "Laura Pérez",
        location: "Medellín",
        text: "El plan de alimentación quedó en la plataforma, sin papeles ni mensajes sueltos."
    }
];

export const testimonialsCol2: TestimonialItem[] = [
    {
        name: "Daniel Ríos",
        location: "Bogotá",
        text: "Consultar mi membresía y su vigencia desde el celular es muy práctico."
    },
    {
        name: "Valentina Cruz",
        location: "Cali",
        text: "Los reportes de evolución me motivan a no faltar al gimnasio."
    },
    {
        name: "Sebastián Mora",
        location: "Cartagena",
        text: "Todo en un solo lugar: rutina, alimentación y progreso."
    }
];
