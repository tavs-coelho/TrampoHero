import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initial toast state is null', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it('showToast sets toast with message and type', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Hello', 'success');
    });
    expect(result.current.toast).toEqual({ msg: 'Hello', type: 'success' });
  });

  it('showToast defaults to "info" type', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Default type');
    });
    expect(result.current.toast).toEqual({ msg: 'Default type', type: 'info' });
  });

  it('clearToast sets toast to null', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Temp', 'error');
    });
    expect(result.current.toast).not.toBeNull();
    act(() => {
      result.current.clearToast();
    });
    expect(result.current.toast).toBeNull();
  });

  it('showToast auto-clears after timeout', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Auto clear', 'success');
    });
    expect(result.current.toast).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(result.current.toast).toBeNull();
  });
});
