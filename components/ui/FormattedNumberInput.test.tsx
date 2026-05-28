import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FormattedNumberInput } from './FormattedNumberInput'
import React, { useState } from 'react'

describe('FormattedNumberInput', () => {
  it('formats numbers correctly on initial render', () => {
    const { getByDisplayValue } = render(
      <FormattedNumberInput value="1000000" onChange={() => {}} />
    )
    expect(getByDisplayValue('1 000 000')).toBeDefined()
  })

  it('calls onChange with raw unformatted string', () => {
    let rawValue = ''
    const handleChange = (val: string) => {
      rawValue = val
    }

    const { getByRole } = render(
      <FormattedNumberInput value="" onChange={handleChange} />
    )
    
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: '1 500 000' } })
    
    expect(rawValue).toBe('1500000')
  })

  it('updates formatted value correctly when typed', () => {
    const TestComponent = () => {
      const [val, setVal] = useState('')
      return <FormattedNumberInput value={val} onChange={setVal} />
    }

    const { getByRole } = render(<TestComponent />)
    const input = getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '1000' } })
    expect(input.value).toBe('1 000')
    
    fireEvent.change(input, { target: { value: '1 000 50' } })
    expect(input.value).toBe('100 050')
  })
})
