import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterInput } from '../CharacterInput';

describe('CharacterInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses selected generation options when shuffling an idea', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    vi.spyOn(Math, 'random').mockReturnValue(0.26);

    render(
      <CharacterInput
        value=""
        onChange={onChange}
        onGenerate={vi.fn()}
        isGenerating={false}
        generationOptions={{
          characterForm: 'stickman',
          textMode: 'auto',
          theme: 'auto',
          customText: '',
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: /acak ide/i }));

    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('stickman'));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('tulisan otomatis'));
  });

  it('allows generation when an external reference image unlocks the input', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(
      <CharacterInput
        value=""
        onChange={vi.fn()}
        onGenerate={onGenerate}
        isGenerating={false}
        canGenerateOverride
      />
    );

    await user.click(screen.getByRole('button', { name: /generate prompt desain/i }));

    expect(onGenerate).toHaveBeenCalledOnce();
  });
});
