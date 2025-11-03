// components/EditJokeForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// components/EditCharacterForm.tsx (or similar file)

// ... (keep the 'use client', imports, Joke interface, and EditJokeForm)

// This interface can stay the same
export interface Character {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  prompt_persona: string;
  created_at: string;
  country: string;
  is_active: boolean
}

// ========================================================================
// === REPLACE THE OLD EditCharacterForm FUNCTION WITH THIS NEW VERSION ===
// ========================================================================

export function EditCharacterForm({ character }: { character: Character }) {
  const router = useRouter();

  // Basic character info state
  const [name, setName] = useState(character.name);
  const [avatar, setAvatar] = useState(character.avatar);
  const [bio, setBio] = useState(character.bio);

  // --- NEW: State for structured persona ---
  const [corePersona, setCorePersona] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [examples, setExamples] = useState<{ user: string; model: string }[]>(
    [],
  );

  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- NEW: Parse the prompt_persona string into structured state on component mount ---
  useEffect(() => {
    const personaText = character.prompt_persona || "";

    // 1. Split by major sections
    const parts = personaText.split(/### (Rules|Examples):\s*/);

    // 2. Set Core Persona
    setCorePersona(parts[0]?.trim() || "");

    // 3. Set Rules
    const rulesText = parts[2] || "";
    const parsedRules = rulesText
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter((line) => line.length > 0);
    setRules(parsedRules);

    // 4. Set Examples
    const examplesText = parts[4] || "";
    const exampleBlocks = examplesText
      .split(/User: /)
      .filter((block) => block.trim());
    const parsedExamples = exampleBlocks.map((block) => {
      const lines = block.split("\n");
      const user = lines[0]?.trim() || "";
      // Find the model's response, which starts after the first line.
      // The character name (Gus:, Sir Jomaa:) is the delimiter.
      const modelLineIndex = lines.findIndex((line) => line.includes(":"));
      const model = lines
        .slice(modelLineIndex)
        .join("\n")
        .replace(/^.*?:\s*/, "")
        .trim();

      return { user, model };
    });
    setExamples(parsedExamples);
  }, [character.prompt_persona]);

  // --- Handlers for dynamic rules ---
  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };
  const addRule = () => setRules([...rules, ""]);
  const removeRule = (index: number) =>
    setRules(rules.filter((_, i) => i !== index));

  // --- Handlers for dynamic examples ---
  const handleExampleChange = (
    index: number,
    field: "user" | "model",
    value: string,
  ) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };
  const addExample = () => setExamples([...examples, { user: "", model: "" }]);
  const removeExample = (index: number) =>
    setExamples(examples.filter((_, i) => i !== index));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    // --- NEW: Re-assemble the structured data back into a single string ---
    let assembledPrompt = corePersona;
    assembledPrompt += "\n### Rules:\n";
    assembledPrompt += rules.map((rule) => `- ${rule}`).join("\n");
    assembledPrompt += "\n### Examples:\n";
    // Use the character's first name for the example response, like "Gus:"
    const characterFirstName = character.name.split(" ")[0];
    assembledPrompt += examples
      .map((ex) => `User: ${ex.user}\n${characterFirstName}: ${ex.model}`)
      .join("\n");

    try {
      const res = await fetch(
        `/api/characters?id=${encodeURIComponent(character.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: character.id,
            name,
            avatar,
            bio,
            prompt_persona: assembledPrompt.trim(), // Send the re-assembled string
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update the character.");
      }

      router.push(`/characters/${character.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      {/* Section 1: Basic Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
          Basic Information
        </h2>
        <div>
          <label
            htmlFor="char-name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            id="char-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="char-avatar"
            className="block text-sm font-medium text-gray-700"
          >
            Avatar (emoji)
          </label>
          <input
            id="char-avatar"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="char-bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id="char-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 w-full p-2 border rounded-md shadow-sm"
            required
          />
        </div>
      </div>

      {/* Section 2: AI Prompt Persona */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
          AI Prompt Persona
        </h2>
        {/* Core Persona */}
        <div>
          <label
            htmlFor="core-persona"
            className="block text-sm font-medium text-gray-700"
          >
            1. Core Persona
          </label>
          <p className="text-xs text-gray-500 mb-1">
            The high-level identity statement.
          </p>
          <textarea
            id="core-persona"
            value={corePersona}
            onChange={(e) => setCorePersona(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded-md shadow-sm font-mono text-sm"
          />
        </div>
        {/* Behavioral Rules */}
        <div>
          {/** biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
<label className="block text-sm font-medium text-gray-700">
            2. Behavioral Rules
          </label>
          <p className="text-xs text-gray-500 mb-2">
            A list of strict "do's and don'ts".
          </p>
          <div className="space-y-2">
            {rules.map((rule, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
<div key={index} className="flex items-center gap-2">
                <span className="text-gray-500">-</span>
                <input
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  className="flex-grow p-2 border rounded-md shadow-sm font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="px-2 py-1 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRule}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Add Rule
          </button>
        </div>
        {/* Few-Shot Examples */}
        <div>
          {/** biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
          <label className="block text-sm font-medium text-gray-700">
            3. Few-Shot Examples
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Perfect request/response pairs.
          </p>
          <div className="space-y-4">
            {examples.map((example, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                key={index}
                className="rounded-md border bg-gray-50 p-3 space-y-2"
              >
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-xs font-semibold text-gray-600">
                  EXAMPLE {index + 1}
                </label>
                <textarea
                  placeholder="User request..."
                  value={example.user}
                  onChange={(e) =>
                    handleExampleChange(index, "user", e.target.value)
                  }
                  rows={2}
                  className="w-full p-2 border rounded-md shadow-sm font-mono text-sm"
                />
                <textarea
                  placeholder="Model response..."
                  value={example.model}
                  onChange={(e) =>
                    handleExampleChange(index, "model", e.target.value)
                  }
                  rows={3}
                  className="w-full p-2 border rounded-md shadow-sm font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeExample(index)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove Example
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addExample}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Add Example
          </button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-6 py-2 text-white font-semibold shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </form>
  );
}
