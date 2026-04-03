'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GenreSignal, FilterDefinition } from '@/lib/types';

const IMAGE_LOADING_PHRASES = [
  'Painting pixels...',
  'Bribing the GPU...',
  'Asking DALL-E nicely...',
  'Squinting artistically...',
  'Hallucinating beautifully...',
  'Mixing digital paint...',
  'Consulting the void...',
  'Manifesting vibes...',
  'Dreaming it up...',
  'Summoning the muse...',
  'Rendering feelings...',
  'Doing art things...',
  "Chef's kiss incoming...",
  'Making stuff up...',
  'Absolutely winging it...',
  'Vibes \u2192 pixels...',
  'Cooking something weird...',
  'Sprinkling GPU dust...',
  'Convincing electrons...',
  'Almost definitely working...',
];

interface SavedOutput {
  id: string;
  output_type: string;
  audience_id: string;
  title: string;
  content: Record<string, unknown>;
  rya_score: number | null;
  rya_rationale: string | null;
  channel: string | null;
  genre_signals_used: GenreSignal[];
  card_image_url: string | null;
  card_image_prompt: string | null;
  created_at: string;
}

interface AudienceInfo {
  id: string;
  name: string;
  respondent_ids: number[];
  filter_definition: FilterDefinition;
}

interface OutputDetailProps {
  output: SavedOutput;
  audience: AudienceInfo | null;
}

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
        <span className="text-sm font-mono font-medium">
          {score} / 10
        </span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function OutputDetail({ output, audience }: OutputDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePhraseIndex, setImagePhraseIndex] = useState(
    () => Math.floor(Math.random() * IMAGE_LOADING_PHRASES.length)
  );
  const [imageFadeIn, setImageFadeIn] = useState(true);

  useEffect(() => {
    if (!generatingImage) return;

    const phraseTimer = setInterval(() => {
      setImageFadeIn(false);
      setTimeout(() => {
        setImagePhraseIndex((prev) => prev + 1);
        setImageFadeIn(true);
      }, 300);
    }, 2500);

    return () => clearInterval(phraseTimer);
  }, [generatingImage]);

  const isConcept = output.output_type === 'campaign_concept';
  const content = output.content;

  const handleDelete = useCallback(async () => {
    if (!confirm('Delete this output? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/outputs/${output.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/concepts');
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }, [output.id, router]);

  const handleGenerateCardImage = useCallback(async () => {
    setGeneratingImage(true);
    try {
      const res = await fetch('/api/generate/card-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_id: output.id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setGeneratingImage(false);
    }
  }, [output.id, router]);

  return (
    <div className="flex-1 overflow-auto p-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Link href="/concepts" className="hover:text-foreground transition-colors">
          Concepts
        </Link>
        <span>/</span>
        <span className="text-foreground">{output.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              isConcept
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isConcept ? 'Campaign Concept' : 'Audience Persona'}
          </span>
          {audience && (
            <Link
              href={`/audiences/${audience.id}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {audience.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {generatingImage ? (
            <span
              className={`shine-text text-sm font-bold transition-opacity duration-300 ${
                imageFadeIn ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {IMAGE_LOADING_PHRASES[imagePhraseIndex % IMAGE_LOADING_PHRASES.length]}
            </span>
          ) : (
            <button
              onClick={handleGenerateCardImage}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {output.card_image_url
                ? 'Regenerate Card Image'
                : 'Generate Card Image'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        Generated {new Date(output.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      {/* Card Image */}
      {output.card_image_url && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Card Image
          </h2>
          <div className="border border-border rounded-lg overflow-hidden bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={output.card_image_url}
              alt={`Card image for ${output.title}`}
              className="w-full max-w-md"
            />
            {output.card_image_prompt && (
              <div className="p-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">DALL-E Prompt</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  {output.card_image_prompt}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      {isConcept ? (
        <ConceptContent content={content} output={output} />
      ) : (
        <PersonaContent content={content} audience={audience} />
      )}

      {/* Genre signals used */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Audience Signal Used
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          {output.genre_signals_used.map((s) => (
            <div
              key={s.genre_slug ?? s.genre_name}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs">&#9679;</span>
                <span className="text-sm">{s.genre_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  avg {s.avg_score.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.avg_score <= 2.0 ? '(HIGH)' : s.avg_score <= 3.5 ? '(MED)' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConceptContent({
  content,
  output,
}: {
  content: Record<string, unknown>;
  output: SavedOutput;
}) {
  const title = content.title as string;
  const concept = content.concept as string;
  const channel = content.channel as string;
  const ryaRationale = content.rya_rationale as string;

  return (
    <>
      {/* Concept */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Concept
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          <h3 className="text-lg font-semibold mb-3">{title}</h3>
          <p className="text-sm leading-relaxed">{concept}</p>
        </div>
      </section>

      {/* Channel */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Channel Recommendation
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          <p className="text-sm">{channel}</p>
        </div>
      </section>

      {/* RYA Score */}
      {output.rya_score != null && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            RYA Score
          </h2>
          <div className="border border-border rounded-lg p-5 bg-background">
            <RYABar score={output.rya_score} />
            {ryaRationale && (
              <p className="text-sm text-muted-foreground mt-3 italic leading-relaxed">
                &ldquo;{ryaRationale}&rdquo;
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function PersonaContent({
  content,
  audience,
}: {
  content: Record<string, unknown>;
  audience: AudienceInfo | null;
}) {
  const whoTheyAre = content.who_they_are as string;
  const whatTheyCareAbout = content.what_they_care_about as string[];
  const whatDoesNotResonate = content.what_does_not_resonate as string[];
  const creativeDirection = content.creative_direction as string;

  return (
    <>
      {/* Who They Are */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Who They Are
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          <p className="text-sm leading-relaxed">{whoTheyAre}</p>
        </div>
      </section>

      {/* What They Care About */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          What They Care About
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          <ul className="space-y-2">
            {whatTheyCareAbout?.map((item, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-primary shrink-0">&#9679;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What Does Not Resonate */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          What Does Not Resonate
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          <ul className="space-y-2">
            {whatDoesNotResonate?.map((item, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-muted-foreground shrink-0">&#9679;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Creative Direction */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Creative Direction
        </h2>
        <div className="border border-border rounded-lg p-5 bg-background">
          <p className="text-sm leading-relaxed">{creativeDirection}</p>
        </div>
      </section>

      {/* Based On */}
      {audience && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Based On
          </h2>
          <div className="border border-border rounded-lg p-5 bg-background">
            <p className="text-sm mb-1">
              {audience.respondent_ids.length} respondent{audience.respondent_ids.length !== 1 ? 's' : ''}{' '}
              ({audience.respondent_ids.map((id) => `#${id}`).join(', ')})
            </p>
            {audience.filter_definition.filters.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Segment: interest_level &le;{' '}
                {audience.filter_definition.filters
                  .map((f) => `${f.max_level} on ${f.genre_slug}`)
                  .join(' + ')}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
