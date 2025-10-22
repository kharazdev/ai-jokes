'use client';

import React from 'react';
import { GenericPromptForm } from '@/components/GenericPromptForm';
export default function GenericPromptSettingsPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings — Generic AI Prompt</h1>
        <GenericPromptForm />
      </div>
    </main>
  );
}
