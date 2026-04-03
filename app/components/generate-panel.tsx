'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { GenreSignal } from '@/lib/types';

interface AudienceOption {
  id: string;
  name: string;
  respondent_count: number;
  top_signals: GenreSignal[];
}

interface GeneratePanelProps {
  audiences: AudienceOption[];
  initialAudienceId?: string;
  initialType?: 'concept' | 'persona';
  onClose: () => void;
  onSaved: () => void;
}

type PanelState = 'input' | 'loading' | 'complete' | 'error';

interface GeneratedOutput {
  output_type: string;
  audience_id: string;
  title: string;
  content: Record<string, unknown>;
  rya_score: number | null;
  rya_rationale: string | null;
  channel: string | null;
  genre_signals_used: GenreSignal[];
}

const PHASE_1_PHRASES = [
  'Analyzing your audience...',
  'Mapping genre affinities...',
  'Finding the signal...',
  'Calibrating creative risk...',
  'Grounding the concept...',
  'Stress-testing the brief...',
  'Noodling on angles...',
  'Scoring for radical-yet-acceptable...',
  'Finding the white space...',
  'Cross-referencing the data...',
];

const PHASE_2_PHRASES = [
  'Refining the output...',
  'Tightening the signal...',
  'Cross-checking the data...',
  'Strengthening the grounding...',
  'Recalibrating...',
];

function RYABar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score <= 3 ? 'bg-green-500' : score <= 6 ? 'bg-yellow-500' : 'bg-red-500';
  const label = score <= 3 ? 'SAFE' : score <= 6 ? 'MODERATE RISK' : 'RADICAL';

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-mono font-medium w-12 text-right">
          {score} / 10
        </span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function GeneratePanel({
  audiences,
  initialAudienceId,
  initialType,
  onClose,
  onSaved,
}: GeneratePanelProps) {
  const router = useRouter();
  const [state, setState] = useState<PanelState>('input');
  const [audienceId, setAudienceId] = useState(initialAudienceId ?? '');
  const [outputType, setOutputType] = useState<'concept' | 'persona'>(
    initialType ?? 'concept'
  );
  const [brandName, setBrandName] = useState('');
  const [brief, setBrief] = useState('');
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Loading phrase rotation
  const [phraseIndex, setPhraseIndex] = useState(
    () => Math.floor(Math.random() * PHASE_1_PHRASES.length)
  );
  const [elapsed, setElapsed] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const phrases = elapsed >= 8000 ? PHASE_2_PHRASES : PHASE_1_PHRASES;
  const currentPhrase = phrases[phraseIndex % phrases.length];

  useEffect(() => {
    if (state !== 'loading') return;

    const elapsedTimer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);

    const phraseTimer = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setPhraseIndex((prev) => prev + 1);
        setFadeIn(true);
      }, 300);
    }, 2500);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(phraseTimer);
    };
  }, [state]);

  const selectedAudience = audiences.find((a) => a.id === audienceId);

  const handleGenerate = useCallback(async () => {
    if (!audienceId) return;

    setState('loading');
    setElapsed(0);
    setPhraseIndex(Math.floor(Math.random() * PHASE_1_PHRASES.length));
    setFadeIn(true);

    try {
      const endpoint =
        outputType === 'concept'
          ? '/api/generate/concept'
          : '/api/generate/persona';

      const payload: Record<string, unknown> = {
        audience_id: audienceId,
        auto_save: false,
      };
      if (outputType === 'concept') {
        if (brandName.trim()) payload.brand_name = brandName.trim();
        if (brief.trim()) payload.brief = brief.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        setState('error');
        return;
      }

      if (!res.ok) {
        setState('error');
        return;
      }

      const data = await res.json();
      setOutput(data);
      setState('complete');
    } catch {
      setState('error');
    }
  }, [audienceId, outputType, brandName, brief]);

  const handleSave = useCallback(async () => {
    if (!output) return;
    setSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(output),
      });

      if (res.ok) {
        onSaved();
        router.refresh();
        onClose();
      } else {
        setSaveError('Failed to save. Please try again.');
      }
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [output, router, onClose, onSaved]);

  const handleRegenerate = useCallback(() => {
    setOutput(null);
    handleGenerate();
  }, [handleGenerate]);

  const handleBackToForm = useCallback(() => {
    setOutput(null);
    setState('input');
  }, []);

  // ── Input state ───────────────────────────────────────────────
  if (state === 'input') {
    return (
      <PanelShell onClose={onClose} title="Generate &#10022;">
        <div className="space-y-5">
          {/* Audience selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Audience
            </label>
            <select
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            >
              <option value="">Select...</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.respondent_count})
                </option>
              ))}
            </select>
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOutputType('concept')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  outputType === 'concept'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                Campaign
              </button>
              <button
                onClick={() => setOutputType('persona')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  outputType === 'persona'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                Persona
              </button>
            </div>
          </div>

          {/* Brand + Brief (campaign only) */}
          {outputType === 'concept' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Brand / Product
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. PepsiCo new hydration drink"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Brief <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Any specific direction or tone..."
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            </>
          )}

          {/* Signal preview */}
          {selectedAudience && selectedAudience.top_signals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Signal
              </label>
              <div className="border border-border rounded-lg p-3 bg-muted/50">
                <p className="text-sm font-medium mb-1">{selectedAudience.name}</p>
                {selectedAudience.top_signals.slice(0, 3).map((s) => (
                  <p key={s.genre_slug} className="text-xs text-muted-foreground">
                    Top: {s.genre_name} ({s.avg_score.toFixed(1)})
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!audienceId}
            className="w-full px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate &#10022;
          </button>
        </div>
      </PanelShell>
    );
  }

  // ── Loading state ─────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <PanelShell title="Generating &#10022;">
        <div className="flex flex-col items-center justify-center py-16">
          {selectedAudience && (
            <div className="text-center mb-6">
              <p className="text-sm font-medium">{selectedAudience.name}</p>
              {outputType === 'concept' && brandName && (
                <p className="text-xs text-muted-foreground mt-0.5">{brandName}</p>
              )}
            </div>
          )}

          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />

          <p
            className={`shine-text text-lg font-bold text-center transition-opacity duration-300 ${
              fadeIn ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {currentPhrase}
          </p>
        </div>
      </PanelShell>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (state === 'error') {
    return (
      <PanelShell title="Generation Failed">
        <div className="flex flex-col items-center justify-center py-16">
          {selectedAudience && (
            <div className="text-center mb-6">
              <p className="text-sm font-medium">{selectedAudience.name}</p>
              {outputType === 'concept' && brandName && (
                <p className="text-xs text-muted-foreground mt-0.5">{brandName}</p>
              )}
            </div>
          )}

          <div className="text-3xl text-red-500 mb-4">&#10007;</div>

          <p className="text-sm text-center text-muted-foreground mb-6">
            Couldn&apos;t ground this one.
            <br />
            Try adjusting your brief.
          </p>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={handleRegenerate}
              className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToForm}
              className="w-full px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              &larr; Back to form
            </button>
          </div>
        </div>
      </PanelShell>
    );
  }

  // ── Complete state ────────────────────────────────────────────
  const content = output?.content as Record<string, unknown> | undefined;

  return (
    <PanelShell onClose={onClose} title="Generated &#10022;">
      <div className="space-y-5">
        {output?.output_type === 'campaign_concept' && content ? (
          <ConceptPreview content={content} />
        ) : content ? (
          <PersonaPreview content={content} />
        ) : null}

        {/* Grounded in */}
        {output?.genre_signals_used && output.genre_signals_used.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Grounded In
            </h3>
            <div className="space-y-1">
              {output.genre_signals_used.map((s) => (
                <div key={s.genre_slug ?? s.genre_name} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">&#9679;</span>
                  <span>{s.genre_name}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {s.avg_score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save to Concepts'}
          </button>
          <button
            onClick={handleRegenerate}
            className="w-full px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Regenerate &#8634;
          </button>
        </div>
      </div>
    </PanelShell>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function PanelShell({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose?: () => void;
}) {
  return (
    <div className="w-80 lg:w-96 border-l border-border bg-background h-full flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <span
          className="text-sm font-semibold"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg"
          >
            &times;
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}

function ConceptPreview({ content }: { content: Record<string, unknown> }) {
  const title = content.title as string;
  const concept = content.concept as string;
  const channel = content.channel as string;
  const ryaScore = content.rya_score as number;
  const ryaRationale = content.rya_rationale as string;

  return (
    <>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-foreground/90">{concept}</p>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Channel
        </h3>
        <p className="text-sm">{channel}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          RYA Score
        </h3>
        <RYABar score={ryaScore} />
        <p className="text-sm text-muted-foreground mt-2 italic leading-relaxed">
          &ldquo;{ryaRationale}&rdquo;
        </p>
      </div>
    </>
  );
}

function PersonaPreview({ content }: { content: Record<string, unknown> }) {
  const name = content.persona_name as string;
  const whoTheyAre = content.who_they_are as string;
  const whatTheyCareAbout = content.what_they_care_about as string[];
  const whatDoesNotResonate = content.what_does_not_resonate as string[];
  const creativeDirection = content.creative_direction as string;

  return (
    <>
      <h2 className="text-lg font-semibold">{name}</h2>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Who They Are
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">{whoTheyAre}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          What They Care About
        </h3>
        <ul className="space-y-1">
          {whatTheyCareAbout?.map((item, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="text-primary shrink-0">&#9679;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          What Does Not Resonate
        </h3>
        <ul className="space-y-1">
          {whatDoesNotResonate?.map((item, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="text-muted-foreground shrink-0">&#9679;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Creative Direction
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">{creativeDirection}</p>
      </div>
    </>
  );
}
