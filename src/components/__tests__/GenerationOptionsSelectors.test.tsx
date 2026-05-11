import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CharacterFormSelector } from '../CharacterFormSelector';
import { ThemeSelector } from '../ThemeSelector';
import { TextOptionsSelector } from '../TextOptionsSelector';

describe('generation option selectors', () => {
  it('lets users choose a manual character form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CharacterFormSelector
        value="auto"
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('radio', { name: /Hewan/i }));

    expect(onChange).toHaveBeenCalledWith('animal');
  });

  it('shows custom text input only for custom text mode', () => {
    const onTextModeChange = vi.fn();
    const onCustomTextChange = vi.fn();

    const { rerender } = render(
      <TextOptionsSelector
        textMode="none"
        customText=""
        onTextModeChange={onTextModeChange}
        onCustomTextChange={onCustomTextChange}
      />
    );

    expect(screen.queryByLabelText('Teks custom')).not.toBeInTheDocument();

    rerender(
      <TextOptionsSelector
        textMode="custom"
        customText="boo!"
        onTextModeChange={onTextModeChange}
        onCustomTextChange={onCustomTextChange}
      />
    );

    const customInput = screen.getByLabelText('Teks custom');
    expect(customInput).toHaveValue('boo!');

    fireEvent.change(customInput, { target: { value: 'sorry' } });

    expect(onCustomTextChange).toHaveBeenCalledWith('sorry');
  });

  it('lets users choose a design theme', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ThemeSelector
        value="auto"
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('radio', { name: /Full acc terkontrol/i }));

    expect(onChange).toHaveBeenCalledWith('controlled-accessories');
  });
});
