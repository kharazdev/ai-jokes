// components/GenericPromptForm.tsx

'use client';

import React, { useEffect, useState } from 'react';

// A type for our example structure
interface Example {
  user: string;
  model: string;
}

export function GenericPromptForm() {
  // --- MODIFIED: State management is now structured ---
  const [corePersona, setCorePersona] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  
  // State for component lifecycle (loading, saving, etc.)
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // --- MODIFIED: useEffect now fetches AND parses the prompt string ---
  useEffect(() => {
    let mounted = true;
    async function loadAndParsePrompt() {
      try {
        const res = await fetch('/api/generic-prompt');
        const data = await res.json();
        if (!mounted) return;

        const promptText = data?.prompt ?? '';
        
        // 1. Split by major sections (same logic as character form)
        const parts = promptText.split(/### (Rules|Examples):\s*/);
        
        // 2. Set Core Persona
        setCorePersona(parts[0]?.trim() || '');
        
        // 3. Set Rules
        const rulesText = parts[2] || '';
        const parsedRules = rulesText.split('\n')
          .map((line: string) => line.replace(/^- /, '').trim())
          .filter((line: string) => line.length > 0);
        setRules(parsedRules);
        
        // 4. Set Examples
        const examplesText = parts[4] || '';
        const exampleBlocks = examplesText.split(/User: /).filter((block: string) => block.trim());
        const parsedExamples = exampleBlocks.map((block: string) => {
          const lines = block.split('\n');
          const user = lines[0]?.trim() || '';
          // For a generic prompt, the response starts with "Model:"
          const modelLineIndex = lines.findIndex((line: string) => line.startsWith('Model:'));
          const model = lines.slice(modelLineIndex).join('\n').replace(/^Model:\s*/, '').trim();
          return { user, model };
        });
        setExamples(parsedExamples);

      } catch (err: any) {
        if (mounted) setError(String(err?.message ?? err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAndParsePrompt();
    return () => { mounted = false; };
  }, []);

  // --- NEW: Handlers for dynamic rules and examples (copied from character form) ---
  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };
  const addRule = () => setRules([...rules, '']);
  const removeRule = (index: number) => setRules(rules.filter((_, i) => i !== index));

  const handleExampleChange = (index: number, field: 'user' | 'model', value: string) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };
  const addExample = () => setExamples([...examples, { user: '', model: '' }]);
  const removeExample = (index: number) => setExamples(examples.filter((_, i) => i !== index));

  // --- MODIFIED: handleSave now assembles the string before sending ---
  async function handleSave() {
    setError(null);
    setMessage(null);
    setSaving(true);
    
    // 1. Re-assemble the structured data back into a single string
    let assembledPrompt = corePersona;
    if (rules.length > 0) {
      assembledPrompt += '\n### Rules:\n';
      assembledPrompt += rules.map(rule => `- ${rule}`).join('\n');
    }
    if (examples.length > 0) {
      assembledPrompt += '\n### Examples:\n';
      assembledPrompt += examples.map(ex => `User: ${ex.user}\nModel: ${ex.model}`).join('\n');
    }

    try {
      const res = await fetch('/api/generic-prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // 2. Send the assembled string in the request body
        body: JSON.stringify({ prompt: assembledPrompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      
      setMessage('Generic prompt saved successfully.');
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4 bg-white rounded-lg shadow">Loading generic prompt…</div>;

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Global Prompt Structure</h2>
        <p className="mt-1 text-sm text-gray-600">
          This prompt is prepended to every character's persona. Use it for global instructions, safety rules, or universal tone guidelines.
        </p>
      </div>

      {/* Core Persona */}
      <div className="space-y-2">
        <label htmlFor="core-persona" className="block text-sm font-medium text-gray-700">1. Core Persona (Global Instructions)</label>
        <textarea id="core-persona" value={corePersona} onChange={(e) => setCorePersona(e.target.value)} rows={3} className="w-full p-2 border rounded-md shadow-sm font-mono text-sm" placeholder="e.g., You are a comedian. All your responses must be a joke." />
      </div>

      {/* Behavioral Rules */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">2. Behavioral Rules (Global)</span>
        {rules.map((rule, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
<div key={index} className="flex items-center gap-2">
            <span className="text-gray-500">-</span>
            <input value={rule} onChange={(e) => handleRuleChange(index, e.target.value)} className="flex-grow p-2 border rounded-md shadow-sm font-mono text-sm" placeholder="e.g., Never apologize."/>
            <button type="button" onClick={() => removeRule(index)} className="px-2 py-1 text-red-500 hover:text-red-700" aria-label="Remove rule">&times;</button>
          </div>
        ))}
        <button type="button" onClick={addRule} className="mt-2 text-sm text-blue-600 hover:underline">+ Add Rule</button>
      </div>

      {/* Few-Shot Examples */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">3. Few-Shot Examples (Global)</span>
        <div className="space-y-4">
          {examples.map((example, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
<div key={index} className="rounded-md border bg-gray-50 p-3 space-y-2">
              <span className="text-xs font-semibold text-gray-600">EXAMPLE {index + 1}</span>
              <textarea placeholder="User request..." value={example.user} onChange={(e) => handleExampleChange(index, 'user', e.target.value)} rows={2} className="w-full p-2 border rounded-md shadow-sm font-mono text-sm" />
              <textarea placeholder="Desired model response..." value={example.model} onChange={(e) => handleExampleChange(index, 'model', e.target.value)} rows={3} className="w-full p-2 border rounded-md shadow-sm font-mono text-sm" />
              <button type="button" onClick={() => removeExample(index)} className="text-xs text-red-500 hover:underline">Remove Example</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addExample} className="mt-2 text-sm text-blue-600 hover:underline">+ Add Example</button>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-green-600 px-6 py-2 text-white font-semibold shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Generic Prompt'}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">Error: {error}</p>}
    </div>
  );
}