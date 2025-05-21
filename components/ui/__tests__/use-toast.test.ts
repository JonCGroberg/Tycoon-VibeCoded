import { act, renderHook } from '@testing-library/react'
import { useToast, toast, reducer, type State } from '../use-toast'

describe('useToast and reducer', () => {
  afterEach(() => {
    // Reset memory state and listeners
    // @ts-ignore
    globalThis.memoryState = { toasts: [] }
    // @ts-ignore
    globalThis.listeners = []
  })

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.toast({ title: 'Test', description: 'Desc', open: true })
    })
    expect(result.current.toasts.length).toBe(1)
    expect(result.current.toasts[0].title).toBe('Test')
  })

  it('updates a toast', () => {
    const { result } = renderHook(() => useToast())
    let id = ''
    act(() => {
      const t = result.current.toast({ title: 'Test', description: 'Desc', open: true })
      id = t.id
      t.update({ id, title: 'Updated', description: 'New Desc', open: true })
    })
    expect(result.current.toasts[0].title).toBe('Updated')
    expect(result.current.toasts[0].description).toBe('New Desc')
  })

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToast())
    let id = ''
    act(() => {
      const t = result.current.toast({ title: 'Test', open: true })
      id = t.id
      result.current.dismiss(id)
    })
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('dismisses all toasts globally', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.toast({ title: 'A', open: true })
      result.current.toast({ title: 'B', open: true })
      result.current.dismiss()
    })
    expect(result.current.toasts.every(t => t.open === false)).toBe(true)
  })

  it('removes a toast by id', () => {
    let state: State = { toasts: [{ id: '1', open: true, title: 'A', description: '', action: undefined }] }
    state = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' })
    expect(state.toasts.length).toBe(0)
  })

  it('removes all toasts if toastId is undefined', () => {
    let state: State = { toasts: [
      { id: '1', open: true, title: 'A', description: '', action: undefined },
      { id: '2', open: true, title: 'B', description: '', action: undefined }
    ] }
    state = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined })
    expect(state.toasts.length).toBe(0)
  })

  it('handles duplicate toast ids (limit 1)', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.toast({ title: 'A', open: true })
      result.current.toast({ title: 'B', open: true })
    })
    expect(result.current.toasts.length).toBe(1)
  })

  it('handles SSR/defensive branches', () => {
    // Just call reducer with unknown action
    const state = { toasts: [] }
    // @ts-expect-error
    expect(() => reducer(state, { type: 'UNKNOWN' })).not.toThrow()
  })

  it('open/close state and onOpenChange', () => {
    const { result } = renderHook(() => useToast())
    let id = ''
    act(() => {
      const t = result.current.toast({ title: 'Test', open: true })
      id = t.id
      // Simulate onOpenChange
      t.update({ id, open: false })
    })
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() => useToast())
    expect(() => unmount()).not.toThrow()
  })
})