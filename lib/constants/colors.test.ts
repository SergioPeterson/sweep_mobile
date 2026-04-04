import { describe, expect, it } from 'bun:test';
import { colors } from './colors';

describe('mobile colors', () => {
  it('exposes stable required tokens', () => {
    expect(colors.forest700).toBeString();
    expect(colors.foreground).toBeString();
    expect(colors.background).toBeString();
    expect(colors.muted).toBeString();
    expect(colors.error).toBeString();
    expect(colors.border).toBeString();
    expect(colors.white).toBeString();
  });
});
