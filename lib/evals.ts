import type {
  CampaignConcept,
  Persona,
  GenreSignal,
  OutputType,
  EvalResult,
  RunEvalsResult,
} from './types'

export function evalSchemaCompliance(
  output: unknown,
  outputType: OutputType
): EvalResult {
  const errors: string[] = [];

  if (outputType === 'campaign_concept') {
    const o = output as Record<string, unknown>;

    if (!o.title || typeof o.title !== 'string') {
      errors.push('title missing or not a string');
    }

    if (!o.concept || typeof o.concept !== 'string') {
      errors.push('concept missing or not a string')
    }


    if (!o.channel || typeof o.channel !== 'string') {
      errors.push('channel missing or not a string');
    }

    if (!o.rya_rationale || typeof o.rya_rationale !== 'string') {
      errors.push('rya_rationale missing');
    }

    if (
      !Number.isInteger(o.rya_score) ||
      (o.rya_score as number) < 1 ||
      (o.rya_score as number) > 10
    ) {
      errors.push(`rya_score invalid: ${o.rya_score}`);
    }

    if (
      !Array.isArray(o.genre_signals_used) ||
      o.genre_signals_used.length < 2
    ) {
      errors.push('genre_signals_used requires minimum 2 items');
    }

  }

  if (outputType === 'persona') {
    const o = output as Record<string, unknown>;

    if (!o.persona_name || typeof o.persona_name !== 'string') {
      errors.push('persona_name missing');
    }

    if (!o.who_they_are || typeof o.who_they_are !== 'string') {
      errors.push('who_they_are missing');
    }

    if (
      !Array.isArray(o.what_they_care_about) ||
      o.what_they_care_about.length < 2
    ) {
      errors.push('what_they_care_about requires minimum 2 items');
    }

    if (
      !Array.isArray(o.what_does_not_resonate) ||
      o.what_does_not_resonate.length < 1
    ) {
      errors.push('what_does_not_resonate requires minimum 1 item');
    }

    if (!o.creative_direction || typeof o.creative_direction !== 'string') {
      errors.push('creative_direction missing');
    }

    if (
      !Array.isArray(o.genre_signals_used) ||
      o.genre_signals_used.length < 2
    ) {
      errors.push('genre_signals_used requires minimum 2 items');
    }

  }

  return {
    pass: errors.length === 0,
    detail: errors.length === 0 ? 'schema valid' : errors.join('; '),
  }
}

export function evalGroundedness(
  output: CampaignConcept | Persona,
  genreSignals: GenreSignal[]
): EvalResult {
  const narrativeText = [
    (output as CampaignConcept).title ?? '',
    (output as CampaignConcept).concept ?? '',
    (output as CampaignConcept).rya_rationale ?? '',
    (output as Persona).who_they_are ?? '',
    ...((output as Persona).what_they_care_about ?? []),
    ...((output as Persona).what_does_not_resonate ?? []),
    (output as Persona).creative_direction ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const cited = genreSignals.filter((g) =>
    narrativeText.includes(g.genre_name.toLowerCase())
  );

  return {
    pass: cited.length >= 2,
    detail:
      cited.length >= 2
        ? `${cited.length} genres cited in narrative text`
        : `only ${cited.length} genre(s) cited in narrative text -- ` +
          `minimum 2 required. Not found in narrative: ${genreSignals
            .filter((g) => !cited.includes(g))
            .map((g) => g.genre_name)
            .join(', ')}`,
    cited: cited.map((g) => g.genre_name),
  }
}

export function evalRYARange(output: CampaignConcept): EvalResult {
  const score = output.rya_score;
  const pass = Number.isInteger(score) && score >= 1 && score <= 10;

  return {
    pass,
    detail: pass
      ? `rya_score ${score} is valid`
      : `rya_score ${score} is invalid -- must be a whole integer 1-10`,
  }
}

export function runEvals(
  output: CampaignConcept | Persona,
  outputType: OutputType,
  genreSignals: GenreSignal[]
): RunEvalsResult {
  const schema = evalSchemaCompliance(output, outputType)
  if (!schema.pass) {
    return { pass: false, failedEval: 'schema', detail: schema.detail }
  }

  const ground = evalGroundedness(output, genreSignals);

  if (!ground.pass) {
    return { pass: false, failedEval: 'groundedness', detail: ground.detail }
  }

  if (outputType === 'campaign_concept') {
    const rya = evalRYARange(output as CampaignConcept);
    if (!rya.pass) {
      return { pass: false, failedEval: 'rya_range', detail: rya.detail }
    }
  }

  return { pass: true, failedEval: null, detail: 'all evals passed' }
}
