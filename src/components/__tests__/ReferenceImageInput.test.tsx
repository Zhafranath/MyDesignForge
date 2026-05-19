import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReferenceImageInput } from '../ReferenceImageInput';

describe('ReferenceImageInput', () => {
  it('accepts a valid image and shows preview state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(['hello'], 'cat.png', { type: 'image/png' });

    render(<ReferenceImageInput value={null} onChange={onChange} disabled={false} />);

    await user.upload(screen.getByLabelText(/upload gambar referensi/i), file);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'cat.png',
          mimeType: 'image/png',
          dataUrl: expect.stringContaining('data:image/png;base64,'),
        })
      );
    });
  });

  it('removes the selected reference image', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ReferenceImageInput
        value={{ name: 'cat.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,aGVsbG8=' }}
        onChange={onChange}
        disabled={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /hapus gambar referensi/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('rejects unsupported files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();
    const file = new File(['hello'], 'cat.gif', { type: 'image/gif' });

    render(<ReferenceImageInput value={null} onChange={onChange} disabled={false} />);

    await user.upload(screen.getByLabelText(/upload gambar referensi/i), file);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Format gambar harus PNG, JPG, atau WEBP.');
  });
});
